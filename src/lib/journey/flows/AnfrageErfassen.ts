/**
 * useAnfrageErfassenFlow — the plumbing of the flow « Anfrage erfassen », generated from the plan.
 *
 * Writes `vorhaben`: asks `titel`, `anfragebeschreibung`, `kunde`, `anfragequelle`, `aufklaerungsverantwortlicher`, `vertraulichkeit`, `prioritaet`, `wunschtermin`; sets `eingangsdatum`, `aufklaerungsstatus`, `qualitaetsstatus`, `freigabestatus` itself.
Writes `quellen` (only when the person fills it): asks `titel`, `quellentyp`, `datei`; sets `erfassungszeitpunkt`, `pruefstatus`, `extraktionsstatus` itself; links `vorhaben` ← the created `vorhaben`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 3)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *   compute   REQUIRED — the plan says these values are computed in the flow
 *             but leaves the rule to you: `vertraulichkeit` (derived:from_pick:vorhaben.vertraulichkeit) *
 *   const flow = useAnfrageErfassenFlow({
 *     steps: { aufklaerungsverantwortlicher: 1, titel: 2, anfragebeschreibung: 2, kunde: 2, anfragequelle: 2, vertraulichkeit: 2, prioritaet: 2, wunschtermin: 2, quellentyp: 2, datei: 2 },
 *     items: { aufklaerungsverantwortlicher: r => ({ id: r.id, title: fieldText(r, 'vorname') }) },
 *     compute: { vertraulichkeit: forms => null },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.aufklaerungsverantwortlicher.select} {...flow.pick('aufklaerungsverantwortlicher')} />
 *     <Bound form={flow.forms.vorhaben} name="titel" />
 *     <Bound form={flow.forms.vorhaben} name="anfragebeschreibung" />
 *     <Bound form={flow.forms.vorhaben} name="kunde" />
 *     <Bound form={flow.forms.vorhaben} name="anfragequelle" />
 *     <Bound form={flow.forms.vorhaben} name="vertraulichkeit" />
 *     <Bound form={flow.forms.vorhaben} name="prioritaet" />
 *     <Bound form={flow.forms.vorhaben} name="wunschtermin" />
 *     <Bound form={flow.forms.quellen} name="titel" />
 *     <Bound form={flow.forms.quellen} name="quellentyp" />
 *     <Bound form={flow.forms.quellen} name="datei" />
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
export type AnfrageErfassenFieldKey = 'anfragebeschreibung' | 'anfragequelle' | 'aufklaerungsverantwortlicher' | 'datei' | 'kunde' | 'prioritaet' | 'quellentyp' | 'titel' | 'vertraulichkeit' | 'wunschtermin';

export interface AnfrageErfassenForms {
  vorhaben: StepForm<'vorhaben'>;
  quellen: StepForm<'quellen'>;
}

// Alias so the option generics stay readable.
type Key = AnfrageErfassenFieldKey;

export interface AnfrageErfassenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    aufklaerungsverantwortlicher?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
  /** The plan computes these in the flow but leaves the rule to the page. */
  compute: {
    vertraulichkeit: (forms: AnfrageErfassenForms) => unknown;   // derived:from_pick:vorhaben.vertraulichkeit
  };
}

const DEFAULT_STEPS: Record<string, number> = {"anfragebeschreibung": 2, "anfragequelle": 2, "aufklaerungsverantwortlicher": 1, "datei": 2, "kunde": 2, "prioritaet": 2, "quellentyp": 2, "titel": 2, "vertraulichkeit": 2, "wunschtermin": 2};
export const ANFRAGEERFASSEN_REVIEW_STEP = 3;

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

export function useAnfrageErfassenFlow(options: AnfrageErfassenFlowOptions) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const vorhaben = useStepForm('vorhaben', {
    fields: ["titel", "anfragebeschreibung", "kunde", "anfragequelle", "aufklaerungsverantwortlicher", "vertraulichkeit", "prioritaet", "wunschtermin"],
    steps: only(steps, ["titel", "anfragebeschreibung", "kunde", "anfragequelle", "aufklaerungsverantwortlicher", "vertraulichkeit", "prioritaet", "wunschtermin"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["titel", "anfragebeschreibung", "kunde", "anfragequelle", "aufklaerungsverantwortlicher", "vertraulichkeit", "prioritaet", "wunschtermin"]),
    messages: only(options.messages as Record<string, string> | undefined, ["titel", "anfragebeschreibung", "kunde", "anfragequelle", "aufklaerungsverantwortlicher", "vertraulichkeit", "prioritaet", "wunschtermin"]),
  });
  const quellen = useStepForm('quellen', {
    fields: ["titel", "quellentyp", "datei"],
    steps: only(steps, ["titel", "quellentyp", "datei"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["titel", "quellentyp", "datei"]),
    messages: only(options.messages as Record<string, string> | undefined, ["titel", "quellentyp", "datei"]),
  });
  const forms: AnfrageErfassenForms = { vorhaben, quellen };
  const formList: StepForm[] = [vorhaben, quellen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    aufklaerungsverantwortlicher: useRecordSearch(servicePort, 'mitarbeitende', withPickPolicy('aufklaerungsverantwortlicher', {
      searchFields: ["vorname", "nachname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
      toItem: options.items?.aufklaerungsverantwortlicher as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:anfrage-erfassen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:anfrage-erfassen:write:${entity}.${field}`,
  });
  const picks = {
    aufklaerungsverantwortlicher: { ...searches.aufklaerungsverantwortlicher, select: { ...searches.aufklaerungsverantwortlicher.select, create: false as boolean, hint: hintFor('aufklaerungsverantwortlicher', 'mitarbeitende', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
  };

  const quellenFilled = hasValues(quellen);
  const plan: PlanStep[] = [
    {
      key: 'vorhaben', entity: 'vorhaben', form: vorhaben, primary: true,
      values: (): FormValues => ({
        eingangsdatum: policyFixedValue('vorhaben', 'eingangsdatum') ?? todayIso(),
        aufklaerungsstatus: policyFixedValue('vorhaben', 'aufklaerungsstatus') ?? "neu",
        qualitaetsstatus: policyFixedValue('vorhaben', 'qualitaetsstatus') ?? "nicht_geprueft",
        freigabestatus: policyFixedValue('vorhaben', 'freigabestatus') ?? "nicht_freigabefaehig",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('vorhaben', 'aufklaerungsstatus', policyFixedValue('vorhaben', 'aufklaerungsstatus') ?? "neu"), setting('vorhaben', 'qualitaetsstatus', policyFixedValue('vorhaben', 'qualitaetsstatus') ?? "nicht_geprueft"), setting('vorhaben', 'freigabestatus', policyFixedValue('vorhaben', 'freigabestatus') ?? "nicht_freigabefaehig")],

      // the planner's assumptions that first act here — shown once with „Passt“ / „ändern“
      notices: () => [{"assumed": "einfache laufende Nummer", "id": "vorhaben-nummer-format", "question": "Wie soll die Vorhaben-Nummer aufgebaut sein?"}],
    },
    ...(quellenFilled ? [{
      key: 'quellen', entity: 'quellen', form: quellen,      needs: ['vorhaben'],
      link: { vorhaben: 'vorhaben' },

      values: (): FormValues => ({
        erfassungszeitpunkt: policyFixedValue('quellen', 'erfassungszeitpunkt') ?? nowIso(),
        pruefstatus: policyFixedValue('quellen', 'pruefstatus') ?? "ungeprueft",
        extraktionsstatus: policyFixedValue('quellen', 'extraktionsstatus') ?? "nicht_extrahiert",
        vertraulichkeit: options.compute.vertraulichkeit(forms),
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('quellen', 'pruefstatus', policyFixedValue('quellen', 'pruefstatus') ?? "ungeprueft"), setting('quellen', 'extraktionsstatus', policyFixedValue('quellen', 'extraktionsstatus') ?? "nicht_extrahiert")],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'anfrage-erfassen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: AnfrageErfassenFieldKey) => {
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
  const pickMany = (field: AnfrageErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'anfrage-erfassen' as const,
    draftKey: 'anfrage-erfassen' as const,
    entity: 'vorhaben' as const,
    form: vorhaben,
    forms, formList, picks, submit, steps,    reviewStep: ANFRAGEERFASSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type AnfrageErfassenFlow = ReturnType<typeof useAnfrageErfassenFlow>;
