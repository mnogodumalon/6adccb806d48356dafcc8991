/**
 * useAnforderungBestaetigenFlow — the plumbing of the flow « Anforderung prüfen und bestätigen », generated from the plan.
 *
 * Changes `anforderungen`: the record to change is picked (`flow.pick('anforderungen')`), the form is prefilled with its values; asks `fachliche_bewertung`, `status`, `bestaetiger`, `aenderungsgrund`; sets `bestaetigungszeitpunkt` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 4)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useAnforderungBestaetigenFlow({
 *     steps: { anforderungen: 1, bestaetiger: 2, fachliche_bewertung: 3, status: 3, aenderungsgrund: 3 },
 *     items: { bestaetiger: r => ({ id: r.id, title: fieldText(r, 'vorname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.bestaetiger.select} {...flow.pick('bestaetiger')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.anforderungen.select} {...flow.pick('anforderungen')} />
 *     <Bound form={flow.forms.anforderungen} name="fachliche_bewertung" />
 *     <Bound form={flow.forms.anforderungen} name="status" />
 *     <Bound form={flow.forms.anforderungen} name="aenderungsgrund" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import { useEffect, useState } from 'react';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';
export type AnforderungBestaetigenFieldKey = 'aenderungsgrund' | 'anforderungen' | 'bestaetiger' | 'fachliche_bewertung' | 'status';

export interface AnforderungBestaetigenForms {
  anforderungen: StepForm<'anforderungen'>;
}

// Alias so the option generics stay readable.
type Key = AnforderungBestaetigenFieldKey;

export interface AnforderungBestaetigenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    bestaetiger?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    anforderungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"aenderungsgrund": 3, "anforderungen": 1, "bestaetiger": 2, "fachliche_bewertung": 3, "status": 3};
export const ANFORDERUNGBESTAETIGEN_REVIEW_STEP = 4;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useAnforderungBestaetigenFlow(options: AnforderungBestaetigenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [anforderungenTargetId, setAnforderungenTargetId] = useState<string | null>(null);
  const anforderungen = useStepForm('anforderungen', {
    fields: ["fachliche_bewertung", "status", "bestaetiger", "aenderungsgrund"],
    steps: only(steps, ["fachliche_bewertung", "status", "bestaetiger", "aenderungsgrund"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["fachliche_bewertung", "status", "bestaetiger", "aenderungsgrund"]),
    messages: only(options.messages as Record<string, string> | undefined, ["fachliche_bewertung", "status", "bestaetiger", "aenderungsgrund"]),
  });
  const forms: AnforderungBestaetigenForms = { anforderungen };
  const formList: StepForm[] = [anforderungen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    bestaetiger: useRecordSearch(servicePort, 'mitarbeitende', withPickPolicy('bestaetiger', {
      searchFields: ["vorname", "nachname"] as never,
      toItem: options.items?.bestaetiger as never,
    })),
    anforderungen: useRecordSearch(servicePort, 'anforderungen', withPickPolicy('anforderungen', {
      searchFields: ["titel", "beschreibung", "quellenstelle"] as never,
      filter: "r.v_status in ['vorgeschlagen', 'in_pruefung', 'rueckfrage']",
      where: (r: JourneyRecord) => ["vorgeschlagen", "in_pruefung", "rueckfrage"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.anforderungen as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:anforderung-bestaetigen:read:${entity}`);
  const picks = {
    bestaetiger: { ...searches.bestaetiger, select: { ...searches.bestaetiger.select, create: false as boolean, hint: hintFor('bestaetiger', 'mitarbeitende', null as PickWhere | null) } },
    anforderungen: { ...searches.anforderungen, select: { ...searches.anforderungen.select, create: false as boolean, hint: hintFor('anforderungen', 'anforderungen', {"conditions": [{"field": "status", "op": "in", "value": ["vorgeschlagen", "in_pruefung", "rueckfrage"]}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'anforderungen', entity: 'anforderungen', form: anforderungen, primary: true,
      updates: () => anforderungenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => anforderungenTargetId
        ? { key: 'target:anforderungen', label: entityLabel('anforderungen'), value: picks.anforderungen.labelOf(anforderungenTargetId) ?? anforderungenTargetId, step: steps.anforderungen }
        : undefined,
      values: (): FormValues => ({
        bestaetigungszeitpunkt: policyFixedValue('anforderungen', 'bestaetigungszeitpunkt') ?? nowIso(),
      }),
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'anforderung-bestaetigen' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    anforderungen: {
      selectedId: anforderungenTargetId,
      onSelect: (id: string) => {
        setAnforderungenTargetId(id);
        const rec = picks.anforderungen.recordOf(id);
        if (rec) anforderungen.reset({ fachliche_bewertung: fieldText(rec, "fachliche_bewertung"), status: fieldLookup(rec, "status")?.key, bestaetiger: fieldRef(rec, "bestaetiger"), aenderungsgrund: fieldText(rec, "aenderungsgrund"), });
      },
      get record(): JourneyRecord | undefined { return anforderungenTargetId ? picks.anforderungen.recordOf(anforderungenTargetId) : undefined; },
    },
  };
  // Opened for one record — `#/intents/anforderung-bestaetigen?record=<id>`, the dashboard's
  // flowActionFor(): that record is the one to change. Loaded, taken into the
  // pick and selected — when this flow may change it at all (the pick's rule).
  const [linkedId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record'));
  useEffect(() => {
    if (!linkedId) return;
    let on = true;
    void servicePort.get('anforderungen', linkedId).then(rec => {
      if (!on || !rec || !((r: JourneyRecord) => ["vorgeschlagen", "in_pruefung", "rueckfrage"].includes(fieldLookup(r, "status")?.key ?? ''))(rec)) return;
      picks.anforderungen.adopt(rec);
      targets.anforderungen.onSelect(rec.id);
    }).catch(() => undefined);
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, [linkedId]);
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: AnforderungBestaetigenFieldKey) => {
    if (field in targets) {
      const t = targets[field as keyof typeof targets];
      return { selectedId: t.selectedId, onSelect: t.onSelect };
    }
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: AnforderungBestaetigenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setAnforderungenTargetId(null); };

  return {
    slug: 'anforderung-bestaetigen' as const,
    draftKey: 'anforderung-bestaetigen' as const,
    entity: 'anforderungen' as const,
    form: anforderungen,
    forms, formList, picks, submit, steps, targets,    reviewStep: ANFORDERUNGBESTAETIGEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type AnforderungBestaetigenFlow = ReturnType<typeof useAnforderungBestaetigenFlow>;
