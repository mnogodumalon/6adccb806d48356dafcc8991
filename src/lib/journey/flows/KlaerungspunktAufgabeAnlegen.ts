/**
 * useKlaerungspunktAufgabeAnlegenFlow — the plumbing of the flow « Klärungspunkt mit Aufgabe anlegen », generated from the plan.
 *
 * Writes `klaerungspunkte`: asks `vorhaben`, `fragestellung`, `anlass`, `kritikalitaet`, `verantwortlicher`, `betroffene_anforderungen`, `betroffene_quellen`, `adressat`, `faelligkeit`; sets `status` itself.
Writes `aufgaben` (only when the person fills it): asks `vorhaben`, `titel`, `zweck`, `aufgabentyp`, `verantwortlicher`, `erwartetes_ergebnis`, `pruefer`; sets `status` itself; links `klaerungspunkt` ← the created `klaerungspunkte`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 9)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *   compute   REQUIRED — the plan says these values are computed in the flow
 *             but leaves the rule to you: `faelligkeit` (derived:from_pick:klaerungspunkte.faelligkeit) *
 *   const flow = useKlaerungspunktAufgabeAnlegenFlow({
 *     steps: { vorhaben: 5, verantwortlicher: 6, betroffene_anforderungen: 3, betroffene_quellen: 4, pruefer: 7, fragestellung: 8, anlass: 8, kritikalitaet: 8, adressat: 8, faelligkeit: 8, titel: 8, zweck: 8, aufgabentyp: 8, erwartetes_ergebnis: 8 },
 *     items: { vorhaben: r => ({ id: r.id, title: fieldText(r, 'vorhaben_nummer') }) },
 *     compute: { faelligkeit: forms => null },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} />
 *     <EntitySelectStep {...flow.picks.verantwortlicher.select} {...flow.pick('verantwortlicher')} />
 *     <EntitySelectStep {...flow.picks.betroffene_anforderungen.select} {...flow.pickMany('betroffene_anforderungen')} />
 *     <EntitySelectStep {...flow.picks.betroffene_quellen.select} {...flow.pickMany('betroffene_quellen')} />
 *     <EntitySelectStep {...flow.picks.aufgaben_vorhaben.select} {...flow.pick('vorhaben')} />
 *     <EntitySelectStep {...flow.picks.aufgaben_verantwortlicher.select} {...flow.pick('verantwortlicher')} />
 *     <EntitySelectStep {...flow.picks.pruefer.select} {...flow.pick('pruefer')} />
 *     <Bound form={flow.forms.klaerungspunkte} name="fragestellung" />
 *     <Bound form={flow.forms.klaerungspunkte} name="anlass" />
 *     <Bound form={flow.forms.klaerungspunkte} name="kritikalitaet" />
 *     <Bound form={flow.forms.klaerungspunkte} name="adressat" />
 *     <Bound form={flow.forms.klaerungspunkte} name="faelligkeit" />
 *     <Bound form={flow.forms.aufgaben} name="titel" />
 *     <Bound form={flow.forms.aufgaben} name="zweck" />
 *     <Bound form={flow.forms.aufgaben} name="aufgabentyp" />
 *     <Bound form={flow.forms.aufgaben} name="erwartetes_ergebnis" />
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
export type KlaerungspunktAufgabeAnlegenFieldKey = 'adressat' | 'anlass' | 'aufgabentyp' | 'betroffene_anforderungen' | 'betroffene_quellen' | 'erwartetes_ergebnis' | 'faelligkeit' | 'fragestellung' | 'kritikalitaet' | 'pruefer' | 'titel' | 'verantwortlicher' | 'vorhaben' | 'zweck';

export interface KlaerungspunktAufgabeAnlegenForms {
  klaerungspunkte: StepForm<'klaerungspunkte'>;
  aufgaben: StepForm<'aufgaben'>;
}

// Alias so the option generics stay readable.
type Key = KlaerungspunktAufgabeAnlegenFieldKey;

export interface KlaerungspunktAufgabeAnlegenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    vorhaben?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    verantwortlicher?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    betroffene_anforderungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    betroffene_quellen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    aufgaben_vorhaben?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    aufgaben_verantwortlicher?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    pruefer?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
  /** The plan computes these in the flow but leaves the rule to the page. */
  compute: {
    faelligkeit: (forms: KlaerungspunktAufgabeAnlegenForms) => unknown;   // derived:from_pick:klaerungspunkte.faelligkeit
  };
}

const DEFAULT_STEPS: Record<string, number> = {"adressat": 8, "anlass": 8, "aufgabentyp": 8, "betroffene_anforderungen": 3, "betroffene_quellen": 4, "erwartetes_ergebnis": 8, "faelligkeit": 8, "fragestellung": 8, "kritikalitaet": 8, "pruefer": 7, "titel": 8, "verantwortlicher": 6, "vorhaben": 5, "zweck": 8};
export const KLAERUNGSPUNKTAUFGABEANLEGEN_REVIEW_STEP = 9;

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

export function useKlaerungspunktAufgabeAnlegenFlow(options: KlaerungspunktAufgabeAnlegenFlowOptions) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const klaerungspunkte = useStepForm('klaerungspunkte', {
    fields: ["vorhaben", "fragestellung", "anlass", "kritikalitaet", "verantwortlicher", "betroffene_anforderungen", "betroffene_quellen", "adressat", "faelligkeit"],
    steps: only(steps, ["vorhaben", "fragestellung", "anlass", "kritikalitaet", "verantwortlicher", "betroffene_anforderungen", "betroffene_quellen", "adressat", "faelligkeit"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorhaben", "fragestellung", "anlass", "kritikalitaet", "verantwortlicher", "betroffene_anforderungen", "betroffene_quellen", "adressat", "faelligkeit"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorhaben", "fragestellung", "anlass", "kritikalitaet", "verantwortlicher", "betroffene_anforderungen", "betroffene_quellen", "adressat", "faelligkeit"]),
  });
  const aufgaben = useStepForm('aufgaben', {
    fields: ["vorhaben", "titel", "zweck", "aufgabentyp", "verantwortlicher", "erwartetes_ergebnis", "pruefer"],
    steps: only(steps, ["vorhaben", "titel", "zweck", "aufgabentyp", "verantwortlicher", "erwartetes_ergebnis", "pruefer"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorhaben", "titel", "zweck", "aufgabentyp", "verantwortlicher", "erwartetes_ergebnis", "pruefer"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorhaben", "titel", "zweck", "aufgabentyp", "verantwortlicher", "erwartetes_ergebnis", "pruefer"]),
  });
  const forms: KlaerungspunktAufgabeAnlegenForms = { klaerungspunkte, aufgaben };
  const formList: StepForm[] = [klaerungspunkte, aufgaben];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    vorhaben: useRecordSearch(servicePort, 'vorhaben', withPickPolicy('vorhaben', {
      searchFields: ["vorhaben_nummer"] as never,
      toItem: options.items?.vorhaben as never,
    })),
    verantwortlicher: useRecordSearch(servicePort, 'mitarbeitende', withPickPolicy('verantwortlicher', {
      searchFields: ["vorname", "nachname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
      toItem: options.items?.verantwortlicher as never,
    })),
    betroffene_anforderungen: useRecordSearch(servicePort, 'anforderungen', withPickPolicy('betroffene_anforderungen', {
      searchFields: ["titel"] as never,
      toItem: options.items?.betroffene_anforderungen as never,
    })),
    betroffene_quellen: useRecordSearch(servicePort, 'quellen', withPickPolicy('betroffene_quellen', {
      searchFields: ["titel"] as never,
      toItem: options.items?.betroffene_quellen as never,
    })),
    aufgaben_vorhaben: useRecordSearch(servicePort, 'vorhaben', withPickPolicy('aufgaben_vorhaben', {
      searchFields: ["vorhaben_nummer"] as never,
      toItem: options.items?.aufgaben_vorhaben as never,
    })),
    aufgaben_verantwortlicher: useRecordSearch(servicePort, 'mitarbeitende', withPickPolicy('aufgaben_verantwortlicher', {
      searchFields: ["vorname", "nachname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
      toItem: options.items?.aufgaben_verantwortlicher as never,
    })),
    pruefer: useRecordSearch(servicePort, 'mitarbeitende', withPickPolicy('pruefer', {
      searchFields: ["vorname", "nachname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
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
    `#/verwaltung/anwendung?line=intent:klaerungspunkt-aufgabe-anlegen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:klaerungspunkt-aufgabe-anlegen:write:${entity}.${field}`,
  });
  const picks = {
    vorhaben: { ...searches.vorhaben, select: { ...searches.vorhaben.select, create: false as boolean, hint: hintFor('vorhaben', 'vorhaben', null as PickWhere | null) } },
    verantwortlicher: { ...searches.verantwortlicher, select: { ...searches.verantwortlicher.select, create: false as boolean, hint: hintFor('verantwortlicher', 'mitarbeitende', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
    betroffene_anforderungen: { ...searches.betroffene_anforderungen, select: { ...searches.betroffene_anforderungen.select, create: false as boolean, hint: hintFor('betroffene_anforderungen', 'anforderungen', null as PickWhere | null) } },
    betroffene_quellen: { ...searches.betroffene_quellen, select: { ...searches.betroffene_quellen.select, create: false as boolean, hint: hintFor('betroffene_quellen', 'quellen', null as PickWhere | null) } },
    aufgaben_vorhaben: { ...searches.aufgaben_vorhaben, select: { ...searches.aufgaben_vorhaben.select, create: false as boolean, hint: hintFor('aufgaben_vorhaben', 'vorhaben', null as PickWhere | null) } },
    aufgaben_verantwortlicher: { ...searches.aufgaben_verantwortlicher, select: { ...searches.aufgaben_verantwortlicher.select, create: false as boolean, hint: hintFor('aufgaben_verantwortlicher', 'mitarbeitende', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
    pruefer: { ...searches.pruefer, select: { ...searches.pruefer.select, create: false as boolean, hint: hintFor('pruefer', 'mitarbeitende', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
  };

  const aufgabenFilled = hasValues(aufgaben);
  const plan: PlanStep[] = [
    {
      key: 'klaerungspunkte', entity: 'klaerungspunkte', form: klaerungspunkte, primary: true,
      values: (): FormValues => ({
        status: policyFixedValue('klaerungspunkte', 'status') ?? "offen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('klaerungspunkte', 'status', policyFixedValue('klaerungspunkte', 'status') ?? "offen")],
    },
    ...(aufgabenFilled ? [{
      key: 'aufgaben', entity: 'aufgaben', form: aufgaben,      needs: ['klaerungspunkte'],
      link: { klaerungspunkt: 'klaerungspunkte' },

      values: (): FormValues => ({
        status: policyFixedValue('aufgaben', 'status') ?? "bereit",
        faelligkeit: options.compute.faelligkeit(forms),
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('aufgaben', 'status', policyFixedValue('aufgaben', 'status') ?? "bereit")],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'klaerungspunkt-aufgabe-anlegen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: KlaerungspunktAufgabeAnlegenFieldKey) => {
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
  const pickMany = (field: KlaerungspunktAufgabeAnlegenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'klaerungspunkt-aufgabe-anlegen' as const,
    draftKey: 'klaerungspunkt-aufgabe-anlegen' as const,
    entity: 'klaerungspunkte' as const,
    form: klaerungspunkte,
    forms, formList, picks, submit, steps,    reviewStep: KLAERUNGSPUNKTAUFGABEANLEGEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type KlaerungspunktAufgabeAnlegenFlow = ReturnType<typeof useKlaerungspunktAufgabeAnlegenFlow>;
