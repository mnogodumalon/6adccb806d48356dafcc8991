/**
 * The INTERNAL door of the journey port — authenticated, via LivingAppsService.
 * GENERATED: one lister and one creator per entity. Do not edit.
 *
 *   import { servicePort } from '@/services/journeyPort';
 *
 * Intent pages hand this to `useJourneySubmit` and to shared step blocks. It
 * exposes only list · create · ref — the public subset — so a step written
 * against it also runs on a public page. Undo, edit and delete stay on the
 * page itself (LivingAppsService), never inside a shared step.
 */
import { LivingAppsService, createRecordUrl, type RecordQuery } from '@/services/livingAppsService';
import { toWirePayload, type InternalJourneyPort, type JourneyRecord } from '@/lib/journey/port';
import { buildSearchFilter, byIdFilter, combineFilters } from '@/lib/journey/search';
import type { EntityKey } from '@/lib/journey/rules';

type RawRecord = { record_id: string; fields: Record<string, unknown>; createdat?: string | null };
type RawMutation = { record_id: string; fields?: Record<string, unknown>; created_at?: string | null };

const listers: Record<EntityKey, () => Promise<RawRecord[]>> = {
  'mitarbeitende': () => LivingAppsService.getMitarbeitende() as Promise<RawRecord[]>,
  'vorhaben': () => LivingAppsService.getVorhaben() as Promise<RawRecord[]>,
  'quellen': () => LivingAppsService.getQuellen() as Promise<RawRecord[]>,
  'anforderungen': () => LivingAppsService.getAnforderungen() as Promise<RawRecord[]>,
  'klaerungspunkte': () => LivingAppsService.getKlaerungspunkte() as Promise<RawRecord[]>,
  'risiken': () => LivingAppsService.getRisiken() as Promise<RawRecord[]>,
  'aufgaben': () => LivingAppsService.getAufgaben() as Promise<RawRecord[]>,
  'entscheidungen': () => LivingAppsService.getEntscheidungen() as Promise<RawRecord[]>,
  'kommunikation': () => LivingAppsService.getKommunikation() as Promise<RawRecord[]>,
  'erfahrungen': () => LivingAppsService.getErfahrungen() as Promise<RawRecord[]>,
  'ergebnisdokumente': () => LivingAppsService.getErgebnisdokumente() as Promise<RawRecord[]>,
};

/** The query/count half — the REST parameters the plain listers never send. */
const queriers: Record<EntityKey, (q: RecordQuery) => Promise<RawRecord[]>> = {
  'mitarbeitende': q => LivingAppsService.queryMitarbeitende(q) as Promise<RawRecord[]>,
  'vorhaben': q => LivingAppsService.queryVorhaben(q) as Promise<RawRecord[]>,
  'quellen': q => LivingAppsService.queryQuellen(q) as Promise<RawRecord[]>,
  'anforderungen': q => LivingAppsService.queryAnforderungen(q) as Promise<RawRecord[]>,
  'klaerungspunkte': q => LivingAppsService.queryKlaerungspunkte(q) as Promise<RawRecord[]>,
  'risiken': q => LivingAppsService.queryRisiken(q) as Promise<RawRecord[]>,
  'aufgaben': q => LivingAppsService.queryAufgaben(q) as Promise<RawRecord[]>,
  'entscheidungen': q => LivingAppsService.queryEntscheidungen(q) as Promise<RawRecord[]>,
  'kommunikation': q => LivingAppsService.queryKommunikation(q) as Promise<RawRecord[]>,
  'erfahrungen': q => LivingAppsService.queryErfahrungen(q) as Promise<RawRecord[]>,
  'ergebnisdokumente': q => LivingAppsService.queryErgebnisdokumente(q) as Promise<RawRecord[]>,
};

const counters: Record<EntityKey, (filter?: string, signal?: AbortSignal) => Promise<number>> = {
  'mitarbeitende': (filter, signal) => LivingAppsService.countMitarbeitende(filter, signal),
  'vorhaben': (filter, signal) => LivingAppsService.countVorhaben(filter, signal),
  'quellen': (filter, signal) => LivingAppsService.countQuellen(filter, signal),
  'anforderungen': (filter, signal) => LivingAppsService.countAnforderungen(filter, signal),
  'klaerungspunkte': (filter, signal) => LivingAppsService.countKlaerungspunkte(filter, signal),
  'risiken': (filter, signal) => LivingAppsService.countRisiken(filter, signal),
  'aufgaben': (filter, signal) => LivingAppsService.countAufgaben(filter, signal),
  'entscheidungen': (filter, signal) => LivingAppsService.countEntscheidungen(filter, signal),
  'kommunikation': (filter, signal) => LivingAppsService.countKommunikation(filter, signal),
  'erfahrungen': (filter, signal) => LivingAppsService.countErfahrungen(filter, signal),
  'ergebnisdokumente': (filter, signal) => LivingAppsService.countErgebnisdokumente(filter, signal),
};

const creators: Record<EntityKey, (fields: Record<string, unknown>) => Promise<RawMutation>> = {
  'mitarbeitende': fields => LivingAppsService.createMitarbeitendeEntry(fields as never),
  'vorhaben': fields => LivingAppsService.createVorhabenEntry(fields as never),
  'quellen': fields => LivingAppsService.createQuellenEntry(fields as never),
  'anforderungen': fields => LivingAppsService.createAnforderungenEntry(fields as never),
  'klaerungspunkte': fields => LivingAppsService.createKlaerungspunkteEntry(fields as never),
  'risiken': fields => LivingAppsService.createRisikenEntry(fields as never),
  'aufgaben': fields => LivingAppsService.createAufgabenEntry(fields as never),
  'entscheidungen': fields => LivingAppsService.createEntscheidungenEntry(fields as never),
  'kommunikation': fields => LivingAppsService.createKommunikationEntry(fields as never),
  'erfahrungen': fields => LivingAppsService.createErfahrungenEntry(fields as never),
  'ergebnisdokumente': fields => LivingAppsService.createErgebnisdokumenteEntry(fields as never),
};

const updaters: Record<EntityKey, (id: string, fields: Record<string, unknown>) => Promise<RawMutation>> = {
  'mitarbeitende': (id, fields) => LivingAppsService.updateMitarbeitendeEntry(id, fields as never),
  'vorhaben': (id, fields) => LivingAppsService.updateVorhabenEntry(id, fields as never),
  'quellen': (id, fields) => LivingAppsService.updateQuellenEntry(id, fields as never),
  'anforderungen': (id, fields) => LivingAppsService.updateAnforderungenEntry(id, fields as never),
  'klaerungspunkte': (id, fields) => LivingAppsService.updateKlaerungspunkteEntry(id, fields as never),
  'risiken': (id, fields) => LivingAppsService.updateRisikenEntry(id, fields as never),
  'aufgaben': (id, fields) => LivingAppsService.updateAufgabenEntry(id, fields as never),
  'entscheidungen': (id, fields) => LivingAppsService.updateEntscheidungenEntry(id, fields as never),
  'kommunikation': (id, fields) => LivingAppsService.updateKommunikationEntry(id, fields as never),
  'erfahrungen': (id, fields) => LivingAppsService.updateErfahrungenEntry(id, fields as never),
  'ergebnisdokumente': (id, fields) => LivingAppsService.updateErgebnisdokumenteEntry(id, fields as never),
};

function toJourneyRecord(r: RawRecord): JourneyRecord {
  return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.createdat ?? null };
}

export const servicePort: InternalJourneyPort = {
  door: 'internal',
  async list(entity, opts) {
    // Only a bare list(entity) (or an empty options object) takes the historic
    // load-everything path. ANY explicit option — `limit` included — goes to the
    // server: useRecordSearch's first page of a big entity must not pull the
    // whole table (live 2026-09-02: all 263 employees travelled for a limit-50
    // first page because `limit` alone did not count as a query).
    const usesQuery = !!opts && (opts.search !== undefined || opts.offset !== undefined
      || opts.orderby !== undefined || opts.fields !== undefined || opts.signal !== undefined
      || opts.limit !== undefined || opts.filter !== undefined);
    if (!usesQuery) {
      const rows = await listers[entity]();
      const limited = opts?.limit ? rows.slice(0, opts.limit) : rows;
      return limited.map(toJourneyRecord);
    }
    const filter = combineFilters(opts.filter, opts.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    const rows = await queriers[entity]({
      filter, orderby: opts.orderby, limit: opts.limit, offset: opts.offset, fields: opts.fields, signal: opts.signal,
    });
    return rows.map(toJourneyRecord);
  },
  async count(entity, opts) {
    const filter = combineFilters(opts?.filter, opts?.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    return counters[entity](filter, opts?.signal);
  },
  async get(entity, id) {
    // One query on the server, not the whole table: `r.id` is the vSQL name
    // of the record id (a live page wrote `r.record_id` and got a 400).
    const rows = await queriers[entity]({ filter: byIdFilter(id), limit: 1 });
    return rows[0] ? toJourneyRecord(rows[0]) : null;
  },
  async create(entity, values) {
    const r = await creators[entity](toWirePayload(entity, values, servicePort));
    return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.created_at ?? null };
  },
  // The same payload rules as create — plain ids in, references shaped here.
  async update(entity, id, values) {
    const r = await updaters[entity](id, toWirePayload(entity, values, servicePort));
    return { id: r.record_id || id, fields: r.fields ?? {}, createdAt: r.created_at ?? null };
  },
  ref: (appId, recordId) => createRecordUrl(appId, recordId),
};
