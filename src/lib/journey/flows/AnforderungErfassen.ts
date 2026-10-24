/**
 * useAnforderungErfassenFlow — the plumbing of the flow « Anforderung erfassen », generated from the plan.
 *
 * Writes `anforderungen`: asks `vorhaben`, `titel`, `beschreibung`, `kategorie`, `anforderungsart`, `verbindlichkeit`, `kritikalitaet`, `quelle`, `quellenstelle`, `fachliche_grundlage`, `pruefer`, `akzeptanzkriterium`; sets `status`, `version` itself.
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
 *   const flow = useAnforderungErfassenFlow({
 *     steps: { vorhaben: 1, quelle: 2, pruefer: 3, titel: 4, beschreibung: 4, kategorie: 4, anforderungsart: 4, verbindlichkeit: 4, kritikalitaet: 4, quellenstelle: 4, fachliche_grundlage: 4, akzeptanzkriterium: 4 },
 *     items: { vorhaben: r => ({ id: r.id, title: fieldText(r, 'vorhaben_nummer') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} />
 *     <EntitySelectStep {...flow.picks.quelle.select} {...flow.pick('quelle')} />
 *     <EntitySelectStep {...flow.picks.pruefer.select} {...flow.pick('pruefer')} />
 *     <Bound form={flow.forms.anforderungen} name="titel" />
 *     <Bound form={flow.forms.anforderungen} name="beschreibung" />
 *     <Bound form={flow.forms.anforderungen} name="kategorie" />
 *     <Bound form={flow.forms.anforderungen} name="anforderungsart" />
 *     <Bound form={flow.forms.anforderungen} name="verbindlichkeit" />
 *     <Bound form={flow.forms.anforderungen} name="kritikalitaet" />
 *     <Bound form={flow.forms.anforderungen} name="quellenstelle" />
 *     <Bound form={flow.forms.anforderungen} name="fachliche_grundlage" />
 *     <Bound form={flow.forms.anforderungen} name="akzeptanzkriterium" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type AnforderungErfassenFieldKey = 'akzeptanzkriterium' | 'anforderungsart' | 'beschreibung' | 'fachliche_grundlage' | 'kategorie' | 'kritikalitaet' | 'pruefer' | 'quelle' | 'quellenstelle' | 'titel' | 'verbindlichkeit' | 'vorhaben';

export interface AnforderungErfassenForms {
  anforderungen: StepForm<'anforderungen'>;
}

// Alias so the option generics stay readable.
type Key = AnforderungErfassenFieldKey;

export interface AnforderungErfassenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    vorhaben?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    quelle?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    pruefer?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"akzeptanzkriterium": 4, "anforderungsart": 4, "beschreibung": 4, "fachliche_grundlage": 4, "kategorie": 4, "kritikalitaet": 4, "pruefer": 3, "quelle": 2, "quellenstelle": 4, "titel": 4, "verbindlichkeit": 4, "vorhaben": 1};
export const ANFORDERUNGERFASSEN_REVIEW_STEP = 5;

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

export function useAnforderungErfassenFlow(options: AnforderungErfassenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const anforderungen = useStepForm('anforderungen', {
    fields: ["vorhaben", "titel", "beschreibung", "kategorie", "anforderungsart", "verbindlichkeit", "kritikalitaet", "quelle", "quellenstelle", "fachliche_grundlage", "pruefer", "akzeptanzkriterium"],
    steps: only(steps, ["vorhaben", "titel", "beschreibung", "kategorie", "anforderungsart", "verbindlichkeit", "kritikalitaet", "quelle", "quellenstelle", "fachliche_grundlage", "pruefer", "akzeptanzkriterium"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorhaben", "titel", "beschreibung", "kategorie", "anforderungsart", "verbindlichkeit", "kritikalitaet", "quelle", "quellenstelle", "fachliche_grundlage", "pruefer", "akzeptanzkriterium"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorhaben", "titel", "beschreibung", "kategorie", "anforderungsart", "verbindlichkeit", "kritikalitaet", "quelle", "quellenstelle", "fachliche_grundlage", "pruefer", "akzeptanzkriterium"]),
  });
  const forms: AnforderungErfassenForms = { anforderungen };
  const formList: StepForm[] = [anforderungen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    vorhaben: useRecordSearch(servicePort, 'vorhaben', withPickPolicy('vorhaben', {
      searchFields: ["vorhaben_nummer", "titel", "kunde"] as never,
      filter: "r.v_aufklaerungsstatus not in ['abgeschlossen', 'abgebrochen']",
      where: (r: JourneyRecord) => !["abgeschlossen", "abgebrochen"].includes(fieldLookup(r, "aufklaerungsstatus")?.key ?? ''),
      toItem: options.items?.vorhaben as never,
    })),
    quelle: useRecordSearch(servicePort, 'quellen', withPickPolicy('quelle', {
      searchFields: ["titel"] as never,
      toItem: options.items?.quelle as never,
    })),
    pruefer: useRecordSearch(servicePort, 'mitarbeitende', withPickPolicy('pruefer', {
      searchFields: ["vorname", "nachname"] as never,
      toItem: options.items?.pruefer as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:anforderung-erfassen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:anforderung-erfassen:write:${entity}.${field}`,
  });
  const picks = {
    vorhaben: { ...searches.vorhaben, select: { ...searches.vorhaben.select, create: false as boolean, hint: hintFor('vorhaben', 'vorhaben', {"conditions": [{"field": "aufklaerungsstatus", "op": "not_in", "value": ["abgeschlossen", "abgebrochen"]}], "mode": "all"} as PickWhere | null) } },
    quelle: { ...searches.quelle, select: { ...searches.quelle.select, create: false as boolean, hint: hintFor('quelle', 'quellen', null as PickWhere | null) } },
    pruefer: { ...searches.pruefer, select: { ...searches.pruefer.select, create: false as boolean, hint: hintFor('pruefer', 'mitarbeitende', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'anforderungen', entity: 'anforderungen', form: anforderungen, primary: true,
      values: (): FormValues => ({
        status: policyFixedValue('anforderungen', 'status') ?? "vorgeschlagen",
        version: policyFixedValue('anforderungen', 'version') ?? 1,
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('anforderungen', 'status', policyFixedValue('anforderungen', 'status') ?? "vorgeschlagen"), setting('anforderungen', 'version', policyFixedValue('anforderungen', 'version') ?? 1)],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'anforderung-erfassen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: AnforderungErfassenFieldKey) => {
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
  const pickMany = (field: AnforderungErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'anforderung-erfassen' as const,
    draftKey: 'anforderung-erfassen' as const,
    entity: 'anforderungen' as const,
    form: anforderungen,
    forms, formList, picks, submit, steps,    reviewStep: ANFORDERUNGERFASSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type AnforderungErfassenFlow = ReturnType<typeof useAnforderungErfassenFlow>;
