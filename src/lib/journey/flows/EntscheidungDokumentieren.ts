/**
 * useEntscheidungDokumentierenFlow — the plumbing of the flow « Entscheidung dokumentieren », generated from the plan.
 *
 * Writes `entscheidungen`: asks `vorhaben`, `fragestellung`, `entscheidung`, `begruendung`, `grundlagen`, `entscheider`, `beruecksichtigte_erfahrungen`, `ersetzte_entscheidung`, `freigabe_erforderlich`; sets `entscheidungszeitpunkt`, `status`, `version` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 6)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useEntscheidungDokumentierenFlow({
 *     steps: { vorhaben: 1, entscheider: 2, beruecksichtigte_erfahrungen: 3, ersetzte_entscheidung: 4, fragestellung: 5, entscheidung: 5, begruendung: 5, grundlagen: 5, freigabe_erforderlich: 5 },
 *     items: { vorhaben: r => ({ id: r.id, title: fieldText(r, 'vorhaben_nummer') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} />
 *     <EntitySelectStep {...flow.picks.entscheider.select} {...flow.pick('entscheider')} />
 *     <EntitySelectStep {...flow.picks.beruecksichtigte_erfahrungen.select} {...flow.pickMany('beruecksichtigte_erfahrungen')} />
 *     <EntitySelectStep {...flow.picks.ersetzte_entscheidung.select} {...flow.pick('ersetzte_entscheidung')} />
 *     <Bound form={flow.forms.entscheidungen} name="fragestellung" />
 *     <Bound form={flow.forms.entscheidungen} name="entscheidung" />
 *     <Bound form={flow.forms.entscheidungen} name="begruendung" />
 *     <Bound form={flow.forms.entscheidungen} name="grundlagen" />
 *     <Bound form={flow.forms.entscheidungen} name="freigabe_erforderlich" />
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
export type EntscheidungDokumentierenFieldKey = 'begruendung' | 'beruecksichtigte_erfahrungen' | 'entscheider' | 'entscheidung' | 'ersetzte_entscheidung' | 'fragestellung' | 'freigabe_erforderlich' | 'grundlagen' | 'vorhaben';

export interface EntscheidungDokumentierenForms {
  entscheidungen: StepForm<'entscheidungen'>;
}

// Alias so the option generics stay readable.
type Key = EntscheidungDokumentierenFieldKey;

export interface EntscheidungDokumentierenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    vorhaben?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    entscheider?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    beruecksichtigte_erfahrungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    ersetzte_entscheidung?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"begruendung": 5, "beruecksichtigte_erfahrungen": 3, "entscheider": 2, "entscheidung": 5, "ersetzte_entscheidung": 4, "fragestellung": 5, "freigabe_erforderlich": 5, "grundlagen": 5, "vorhaben": 1};
export const ENTSCHEIDUNGDOKUMENTIEREN_REVIEW_STEP = 6;

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

export function useEntscheidungDokumentierenFlow(options: EntscheidungDokumentierenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const entscheidungen = useStepForm('entscheidungen', {
    fields: ["vorhaben", "fragestellung", "entscheidung", "begruendung", "grundlagen", "entscheider", "beruecksichtigte_erfahrungen", "ersetzte_entscheidung", "freigabe_erforderlich"],
    steps: only(steps, ["vorhaben", "fragestellung", "entscheidung", "begruendung", "grundlagen", "entscheider", "beruecksichtigte_erfahrungen", "ersetzte_entscheidung", "freigabe_erforderlich"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorhaben", "fragestellung", "entscheidung", "begruendung", "grundlagen", "entscheider", "beruecksichtigte_erfahrungen", "ersetzte_entscheidung", "freigabe_erforderlich"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorhaben", "fragestellung", "entscheidung", "begruendung", "grundlagen", "entscheider", "beruecksichtigte_erfahrungen", "ersetzte_entscheidung", "freigabe_erforderlich"]),
  });
  const forms: EntscheidungDokumentierenForms = { entscheidungen };
  const formList: StepForm[] = [entscheidungen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    vorhaben: useRecordSearch(servicePort, 'vorhaben', withPickPolicy('vorhaben', {
      searchFields: ["vorhaben_nummer"] as never,
      toItem: options.items?.vorhaben as never,
    })),
    entscheider: useRecordSearch(servicePort, 'mitarbeitende', withPickPolicy('entscheider', {
      searchFields: ["vorname", "nachname"] as never,
      toItem: options.items?.entscheider as never,
    })),
    beruecksichtigte_erfahrungen: useRecordSearch(servicePort, 'erfahrungen', withPickPolicy('beruecksichtigte_erfahrungen', {
      searchFields: ["titel", "erkenntnis"] as never,
      filter: "r.v_freigabestatus in ['freigegeben', 'eingeschraenkt']",
      where: (r: JourneyRecord) => ["freigegeben", "eingeschraenkt"].includes(fieldLookup(r, "freigabestatus")?.key ?? ''),
      toItem: options.items?.beruecksichtigte_erfahrungen as never,
    })),
    ersetzte_entscheidung: useRecordSearch(servicePort, 'entscheidungen', withPickPolicy('ersetzte_entscheidung', {
      searchFields: ["fragestellung"] as never,
      toItem: options.items?.ersetzte_entscheidung as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:entscheidung-dokumentieren:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:entscheidung-dokumentieren:write:${entity}.${field}`,
  });
  const picks = {
    vorhaben: { ...searches.vorhaben, select: { ...searches.vorhaben.select, create: false as boolean, hint: hintFor('vorhaben', 'vorhaben', null as PickWhere | null) } },
    entscheider: { ...searches.entscheider, select: { ...searches.entscheider.select, create: false as boolean, hint: hintFor('entscheider', 'mitarbeitende', null as PickWhere | null) } },
    beruecksichtigte_erfahrungen: { ...searches.beruecksichtigte_erfahrungen, select: { ...searches.beruecksichtigte_erfahrungen.select, create: false as boolean, hint: hintFor('beruecksichtigte_erfahrungen', 'erfahrungen', {"conditions": [{"field": "freigabestatus", "op": "in", "value": ["freigegeben", "eingeschraenkt"]}], "mode": "all"} as PickWhere | null) } },
    ersetzte_entscheidung: { ...searches.ersetzte_entscheidung, select: { ...searches.ersetzte_entscheidung.select, create: false as boolean, hint: hintFor('ersetzte_entscheidung', 'entscheidungen', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'entscheidungen', entity: 'entscheidungen', form: entscheidungen, primary: true,
      values: (): FormValues => ({
        entscheidungszeitpunkt: policyFixedValue('entscheidungen', 'entscheidungszeitpunkt') ?? nowIso(),
        status: policyFixedValue('entscheidungen', 'status') ?? "getroffen",
        version: policyFixedValue('entscheidungen', 'version') ?? 1,
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('entscheidungen', 'status', policyFixedValue('entscheidungen', 'status') ?? "getroffen"), setting('entscheidungen', 'version', policyFixedValue('entscheidungen', 'version') ?? 1)],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'entscheidung-dokumentieren' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: EntscheidungDokumentierenFieldKey) => {
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
  const pickMany = (field: EntscheidungDokumentierenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'entscheidung-dokumentieren' as const,
    draftKey: 'entscheidung-dokumentieren' as const,
    entity: 'entscheidungen' as const,
    form: entscheidungen,
    forms, formList, picks, submit, steps,    reviewStep: ENTSCHEIDUNGDOKUMENTIEREN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type EntscheidungDokumentierenFlow = ReturnType<typeof useEntscheidungDokumentierenFlow>;
