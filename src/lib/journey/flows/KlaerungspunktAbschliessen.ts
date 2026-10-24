/**
 * useKlaerungspunktAbschliessenFlow — the plumbing of the flow « Klärungspunkt beantworten und klären », generated from the plan.
 *
 * Changes `klaerungspunkte`: the record to change is picked (`flow.pick('klaerungspunkte')`), the form is prefilled with its values; asks `bestaetigte_antwort`, `antwortquelle`, `fachlicher_pruefer`, `status`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 5)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useKlaerungspunktAbschliessenFlow({
 *     steps: { klaerungspunkte: 1, antwortquelle: 2, fachlicher_pruefer: 3, bestaetigte_antwort: 4, status: 4 },
 *     items: { antwortquelle: r => ({ id: r.id, title: fieldText(r, 'titel') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.antwortquelle.select} {...flow.pick('antwortquelle')} />
 *     <EntitySelectStep {...flow.picks.fachlicher_pruefer.select} {...flow.pick('fachlicher_pruefer')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.klaerungspunkte.select} {...flow.pick('klaerungspunkte')} />
 *     <Bound form={flow.forms.klaerungspunkte} name="bestaetigte_antwort" />
 *     <Bound form={flow.forms.klaerungspunkte} name="status" />
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
export type KlaerungspunktAbschliessenFieldKey = 'antwortquelle' | 'bestaetigte_antwort' | 'fachlicher_pruefer' | 'klaerungspunkte' | 'status';

export interface KlaerungspunktAbschliessenForms {
  klaerungspunkte: StepForm<'klaerungspunkte'>;
}

// Alias so the option generics stay readable.
type Key = KlaerungspunktAbschliessenFieldKey;

export interface KlaerungspunktAbschliessenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    antwortquelle?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    fachlicher_pruefer?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    klaerungspunkte?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"antwortquelle": 2, "bestaetigte_antwort": 4, "fachlicher_pruefer": 3, "klaerungspunkte": 1, "status": 4};
export const KLAERUNGSPUNKTABSCHLIESSEN_REVIEW_STEP = 5;

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

export function useKlaerungspunktAbschliessenFlow(options: KlaerungspunktAbschliessenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [klaerungspunkteTargetId, setKlaerungspunkteTargetId] = useState<string | null>(null);
  const klaerungspunkte = useStepForm('klaerungspunkte', {
    fields: ["bestaetigte_antwort", "antwortquelle", "fachlicher_pruefer", "status"],
    steps: only(steps, ["bestaetigte_antwort", "antwortquelle", "fachlicher_pruefer", "status"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["bestaetigte_antwort", "antwortquelle", "fachlicher_pruefer", "status"]),
    messages: only(options.messages as Record<string, string> | undefined, ["bestaetigte_antwort", "antwortquelle", "fachlicher_pruefer", "status"]),
  });
  const forms: KlaerungspunktAbschliessenForms = { klaerungspunkte };
  const formList: StepForm[] = [klaerungspunkte];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    antwortquelle: useRecordSearch(servicePort, 'quellen', withPickPolicy('antwortquelle', {
      searchFields: ["titel"] as never,
      toItem: options.items?.antwortquelle as never,
    })),
    fachlicher_pruefer: useRecordSearch(servicePort, 'mitarbeitende', withPickPolicy('fachlicher_pruefer', {
      searchFields: ["vorname", "nachname"] as never,
      toItem: options.items?.fachlicher_pruefer as never,
    })),
    klaerungspunkte: useRecordSearch(servicePort, 'klaerungspunkte', withPickPolicy('klaerungspunkte', {
      searchFields: ["fragestellung", "vorgeschlagene_antwort"] as never,
      filter: "r.v_status not in ['geklaert', 'nicht_relevant']",
      where: (r: JourneyRecord) => !["geklaert", "nicht_relevant"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.klaerungspunkte as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:klaerungspunkt-abschliessen:read:${entity}`);
  const picks = {
    antwortquelle: { ...searches.antwortquelle, select: { ...searches.antwortquelle.select, create: false as boolean, hint: hintFor('antwortquelle', 'quellen', null as PickWhere | null) } },
    fachlicher_pruefer: { ...searches.fachlicher_pruefer, select: { ...searches.fachlicher_pruefer.select, create: false as boolean, hint: hintFor('fachlicher_pruefer', 'mitarbeitende', null as PickWhere | null) } },
    klaerungspunkte: { ...searches.klaerungspunkte, select: { ...searches.klaerungspunkte.select, create: false as boolean, hint: hintFor('klaerungspunkte', 'klaerungspunkte', {"conditions": [{"field": "status", "op": "not_in", "value": ["geklaert", "nicht_relevant"]}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'klaerungspunkte', entity: 'klaerungspunkte', form: klaerungspunkte, primary: true,
      updates: () => klaerungspunkteTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => klaerungspunkteTargetId
        ? { key: 'target:klaerungspunkte', label: entityLabel('klaerungspunkte'), value: picks.klaerungspunkte.labelOf(klaerungspunkteTargetId) ?? klaerungspunkteTargetId, step: steps.klaerungspunkte }
        : undefined,    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'klaerungspunkt-abschliessen' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    klaerungspunkte: {
      selectedId: klaerungspunkteTargetId,
      onSelect: (id: string) => {
        setKlaerungspunkteTargetId(id);
        const rec = picks.klaerungspunkte.recordOf(id);
        if (rec) klaerungspunkte.reset({ bestaetigte_antwort: fieldText(rec, "bestaetigte_antwort"), antwortquelle: fieldRef(rec, "antwortquelle"), fachlicher_pruefer: fieldRef(rec, "fachlicher_pruefer"), status: fieldLookup(rec, "status")?.key, });
      },
      get record(): JourneyRecord | undefined { return klaerungspunkteTargetId ? picks.klaerungspunkte.recordOf(klaerungspunkteTargetId) : undefined; },
    },
  };
  // Opened for one record — `#/intents/klaerungspunkt-abschliessen?record=<id>`, the dashboard's
  // flowActionFor(): that record is the one to change. Loaded, taken into the
  // pick and selected — when this flow may change it at all (the pick's rule).
  const [linkedId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record'));
  useEffect(() => {
    if (!linkedId) return;
    let on = true;
    void servicePort.get('klaerungspunkte', linkedId).then(rec => {
      if (!on || !rec || !((r: JourneyRecord) => !["geklaert", "nicht_relevant"].includes(fieldLookup(r, "status")?.key ?? ''))(rec)) return;
      picks.klaerungspunkte.adopt(rec);
      targets.klaerungspunkte.onSelect(rec.id);
    }).catch(() => undefined);
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, [linkedId]);
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: KlaerungspunktAbschliessenFieldKey) => {
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
  const pickMany = (field: KlaerungspunktAbschliessenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setKlaerungspunkteTargetId(null); };

  return {
    slug: 'klaerungspunkt-abschliessen' as const,
    draftKey: 'klaerungspunkt-abschliessen' as const,
    entity: 'klaerungspunkte' as const,
    form: klaerungspunkte,
    forms, formList, picks, submit, steps, targets,    reviewStep: KLAERUNGSPUNKTABSCHLIESSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type KlaerungspunktAbschliessenFlow = ReturnType<typeof useKlaerungspunktAbschliessenFlow>;
