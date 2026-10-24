import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitarbeitende, Vorhaben, Quellen, Anforderungen, Klaerungspunkte, Risiken, Aufgaben, Entscheidungen, Kommunikation, Erfahrungen, Ergebnisdokumente } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
/** Entities this hook can load — the same keys the journey layer uses. */
export type DashboardEntity = 'mitarbeitende' | 'vorhaben' | 'quellen' | 'anforderungen' | 'klaerungspunkte' | 'risiken' | 'aufgaben' | 'entscheidungen' | 'kommunikation' | 'erfahrungen' | 'ergebnisdokumente';

export interface DashboardDataOptions {
  /** Entities this page does NOT need (picked through useRecordSearch instead).
   *  Every flow page mounts this hook on its own route, so without `omit` a
   *  page that searches 3.000 guests server-side would still pull all 3.000
   *  through the side door. */
  omit?: DashboardEntity[];
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  // A string key, not the array: an inline `omit={['gaeste']}` is a new array
  // on every render and would restart the fetch forever.
  const omitKey = (options.omit ?? []).slice().sort().join('|');
  const [mitarbeitende, setMitarbeitende] = useState<Mitarbeitende[]>([]);
  const [vorhaben, setVorhaben] = useState<Vorhaben[]>([]);
  const [quellen, setQuellen] = useState<Quellen[]>([]);
  const [anforderungen, setAnforderungen] = useState<Anforderungen[]>([]);
  const [klaerungspunkte, setKlaerungspunkte] = useState<Klaerungspunkte[]>([]);
  const [risiken, setRisiken] = useState<Risiken[]>([]);
  const [aufgaben, setAufgaben] = useState<Aufgaben[]>([]);
  const [entscheidungen, setEntscheidungen] = useState<Entscheidungen[]>([]);
  const [kommunikation, setKommunikation] = useState<Kommunikation[]>([]);
  const [erfahrungen, setErfahrungen] = useState<Erfahrungen[]>([]);
  const [ergebnisdokumente, setErgebnisdokumente] = useState<Ergebnisdokumente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  /** Lists the signed-in user may not read (403 on the platform). They load as
   *  empty and the rest of the page loads normally — one forbidden list used to
   *  empty the whole dashboard (05.10.2026). Hide a block whose list is here. */
  const [forbidden, setForbidden] = useState<DashboardEntity[]>([]);

  // Every list on its own: a 403 is „not yours“, any other failure is an error.
  const settle = useCallback((settled: PromiseSettledResult<unknown>[]) => {
    const denied: DashboardEntity[] = [];
    let failure: unknown = null;
    // null = this list failed for another reason: its current data stays
    const pick = <T,>(i: number, key: DashboardEntity): T[] | null => {
      const s = settled[i];
      if (s.status === 'fulfilled') return s.value as T[];
      if ((s.reason as { status?: number } | null)?.status === 403) { denied.push(key); return []; }
      failure = failure ?? s.reason;
      return null;
    };
    { const rows = pick<Mitarbeitende>(0, 'mitarbeitende'); if (rows) setMitarbeitende(rows); }
    { const rows = pick<Vorhaben>(1, 'vorhaben'); if (rows) setVorhaben(rows); }
    { const rows = pick<Quellen>(2, 'quellen'); if (rows) setQuellen(rows); }
    { const rows = pick<Anforderungen>(3, 'anforderungen'); if (rows) setAnforderungen(rows); }
    { const rows = pick<Klaerungspunkte>(4, 'klaerungspunkte'); if (rows) setKlaerungspunkte(rows); }
    { const rows = pick<Risiken>(5, 'risiken'); if (rows) setRisiken(rows); }
    { const rows = pick<Aufgaben>(6, 'aufgaben'); if (rows) setAufgaben(rows); }
    { const rows = pick<Entscheidungen>(7, 'entscheidungen'); if (rows) setEntscheidungen(rows); }
    { const rows = pick<Kommunikation>(8, 'kommunikation'); if (rows) setKommunikation(rows); }
    { const rows = pick<Erfahrungen>(9, 'erfahrungen'); if (rows) setErfahrungen(rows); }
    { const rows = pick<Ergebnisdokumente>(10, 'ergebnisdokumente'); if (rows) setErgebnisdokumente(rows); }
    setForbidden(prev => (prev.join('|') === denied.join('|') ? prev : denied));
    return failure;
  }, []);

  const fetchAll = useCallback(async () => {
    setError(null);
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    try {
      const failure = settle(await Promise.allSettled([
        omit.has('mitarbeitende') ? Promise.resolve([] as Mitarbeitende[]) : LivingAppsService.getMitarbeitende(),
        omit.has('vorhaben') ? Promise.resolve([] as Vorhaben[]) : LivingAppsService.getVorhaben(),
        omit.has('quellen') ? Promise.resolve([] as Quellen[]) : LivingAppsService.getQuellen(),
        omit.has('anforderungen') ? Promise.resolve([] as Anforderungen[]) : LivingAppsService.getAnforderungen(),
        omit.has('klaerungspunkte') ? Promise.resolve([] as Klaerungspunkte[]) : LivingAppsService.getKlaerungspunkte(),
        omit.has('risiken') ? Promise.resolve([] as Risiken[]) : LivingAppsService.getRisiken(),
        omit.has('aufgaben') ? Promise.resolve([] as Aufgaben[]) : LivingAppsService.getAufgaben(),
        omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
        omit.has('kommunikation') ? Promise.resolve([] as Kommunikation[]) : LivingAppsService.getKommunikation(),
        omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
        omit.has('ergebnisdokumente') ? Promise.resolve([] as Ergebnisdokumente[]) : LivingAppsService.getErgebnisdokumente(),
      ]));
      if (failure) throw failure;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, [omitKey, settle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    async function silentRefresh() {
      try {
        // a failed list keeps its stale data out of the way: settle() only
        // replaces what loaded or was refused
        settle(await Promise.allSettled([
          omit.has('mitarbeitende') ? Promise.resolve([] as Mitarbeitende[]) : LivingAppsService.getMitarbeitende(),
          omit.has('vorhaben') ? Promise.resolve([] as Vorhaben[]) : LivingAppsService.getVorhaben(),
          omit.has('quellen') ? Promise.resolve([] as Quellen[]) : LivingAppsService.getQuellen(),
          omit.has('anforderungen') ? Promise.resolve([] as Anforderungen[]) : LivingAppsService.getAnforderungen(),
          omit.has('klaerungspunkte') ? Promise.resolve([] as Klaerungspunkte[]) : LivingAppsService.getKlaerungspunkte(),
          omit.has('risiken') ? Promise.resolve([] as Risiken[]) : LivingAppsService.getRisiken(),
          omit.has('aufgaben') ? Promise.resolve([] as Aufgaben[]) : LivingAppsService.getAufgaben(),
          omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
          omit.has('kommunikation') ? Promise.resolve([] as Kommunikation[]) : LivingAppsService.getKommunikation(),
          omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
          omit.has('ergebnisdokumente') ? Promise.resolve([] as Ergebnisdokumente[]) : LivingAppsService.getErgebnisdokumente(),
        ]));
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    return () => window.removeEventListener('assistant:data-changed', handleRefresh);
  }, [omitKey, settle]);

  const mitarbeitendeMap = useMemo(() => {
    const m = new Map<string, Mitarbeitende>();
    mitarbeitende.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitarbeitende]);

  const vorhabenMap = useMemo(() => {
    const m = new Map<string, Vorhaben>();
    vorhaben.forEach(r => m.set(r.record_id, r));
    return m;
  }, [vorhaben]);

  const quellenMap = useMemo(() => {
    const m = new Map<string, Quellen>();
    quellen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [quellen]);

  const anforderungenMap = useMemo(() => {
    const m = new Map<string, Anforderungen>();
    anforderungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [anforderungen]);

  const klaerungspunkteMap = useMemo(() => {
    const m = new Map<string, Klaerungspunkte>();
    klaerungspunkte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [klaerungspunkte]);

  const risikenMap = useMemo(() => {
    const m = new Map<string, Risiken>();
    risiken.forEach(r => m.set(r.record_id, r));
    return m;
  }, [risiken]);

  const aufgabenMap = useMemo(() => {
    const m = new Map<string, Aufgaben>();
    aufgaben.forEach(r => m.set(r.record_id, r));
    return m;
  }, [aufgaben]);

  const entscheidungenMap = useMemo(() => {
    const m = new Map<string, Entscheidungen>();
    entscheidungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [entscheidungen]);

  const erfahrungenMap = useMemo(() => {
    const m = new Map<string, Erfahrungen>();
    erfahrungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [erfahrungen]);

  const ergebnisdokumenteMap = useMemo(() => {
    const m = new Map<string, Ergebnisdokumente>();
    ergebnisdokumente.forEach(r => m.set(r.record_id, r));
    return m;
  }, [ergebnisdokumente]);

  return { mitarbeitende, setMitarbeitende, vorhaben, setVorhaben, quellen, setQuellen, anforderungen, setAnforderungen, klaerungspunkte, setKlaerungspunkte, risiken, setRisiken, aufgaben, setAufgaben, entscheidungen, setEntscheidungen, kommunikation, setKommunikation, erfahrungen, setErfahrungen, ergebnisdokumente, setErgebnisdokumente, loading, error, fetchAll, forbidden, mitarbeitendeMap, vorhabenMap, quellenMap, anforderungenMap, klaerungspunkteMap, risikenMap, aufgabenMap, entscheidungenMap, erfahrungenMap, ergebnisdokumenteMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;