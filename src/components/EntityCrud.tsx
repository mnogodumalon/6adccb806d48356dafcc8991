/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'mitarbeitende'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.mitarbeitende.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.mitarbeitende.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.mitarbeitende.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.mitarbeitende              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   mitarbeitende: vorname, nachname, email, telefon, abteilung, rolle, aktiv  ·  ← vorhaben (list + contextual +) · ← vorhaben (list + contextual +) · ← anforderungen (list + contextual +) · ← anforderungen (list + contextual +) · ← klaerungspunkte (list + contextual +) · ← klaerungspunkte (list + contextual +) · ← risiken (list + contextual +) · ← aufgaben (list + contextual +) · ← aufgaben (list + contextual + + choose existing) · ← aufgaben (list + contextual +) · ← entscheidungen (list + contextual +) · ← kommunikation (list + contextual +) · ← kommunikation (list + contextual +) · ← erfahrungen (list + contextual +) · ← ergebnisdokumente (list + contextual +)
 *   vorhaben: vorhaben_nummer, titel, anfragebeschreibung, kunde, eingangsdatum, anfragequelle, aufklaerungsverantwortlicher, aufklaerungsstatus, …  ·  → mitarbeitende · ← quellen (list + contextual +) · ← anforderungen (list + contextual +) · ← klaerungspunkte (list + contextual +) · ← risiken (list + contextual +) · ← aufgaben (list + contextual +) · ← entscheidungen (list + contextual +) · ← kommunikation (list + contextual +) · ← erfahrungen (list + contextual +) · ← ergebnisdokumente (list + contextual +)
 *   quellen: vorhaben, titel, quellentyp, datei, externe_referenz, erfassungszeitpunkt, vertraulichkeit, urheber, …  ·  → vorhaben · ← anforderungen (list + contextual +) · ← klaerungspunkte (list + contextual + + choose existing) · ← klaerungspunkte (list + contextual +) · ← kommunikation (list + contextual +)
 *   anforderungen: vorhaben, titel, beschreibung, kategorie, anforderungsart, verbindlichkeit, kritikalitaet, status, …  ·  → vorhaben · → quellen · → mitarbeitende · ← klaerungspunkte (list + contextual + + choose existing) · ← risiken (list + contextual + + choose existing) · ← aufgaben (list + contextual +) · ← kommunikation (list + contextual +) · ← erfahrungen (list + contextual + + choose existing)
 *   klaerungspunkte: vorhaben, fragestellung, anlass, kritikalitaet, verantwortlicher, status, betroffene_anforderungen, betroffene_quellen, …  ·  → vorhaben · → mitarbeitende · → anforderungen · → quellen · ← aufgaben (list + contextual +) · ← kommunikation (list + contextual +)
 *   risiken: vorhaben, titel, beschreibung, wahrscheinlichkeit, auswirkung, risikoklasse, status, ursache, …  ·  → vorhaben · → anforderungen · → mitarbeitende · ← erfahrungen (list + contextual + + choose existing)
 *   aufgaben: abhaengigkeiten, vorhaben, titel, zweck, aufgabentyp, verantwortlicher, status, anforderung, …  ·  → aufgaben · → vorhaben · → mitarbeitende · → anforderungen · → klaerungspunkte · ← kommunikation (list + contextual +)
 *   entscheidungen: beruecksichtigte_erfahrungen, ersetzte_entscheidung, vorhaben, fragestellung, entscheidung, begruendung, grundlagen, entscheider, …  ·  → erfahrungen · → entscheidungen · → vorhaben · → mitarbeitende · ← erfahrungen (list + contextual +)
 *   kommunikation: aufgabe, vorhaben, kanal, betreff, inhalt, absender, status, empfaenger, …  ·  → aufgaben · → vorhaben · → mitarbeitende · → klaerungspunkte · → anforderungen · → quellen
 *   erfahrungen: betroffene_entscheidung, titel, ursprungsvorhaben, ausgangssituation, problem, belege, massnahme, ergebnis, …  ·  → entscheidungen · → vorhaben · → mitarbeitende · → anforderungen · → risiken · ← entscheidungen (list + contextual + + choose existing)
 *   ergebnisdokumente: vorhaben, dokumenttyp, version, erstellungszeitpunkt, datenstand, inhalt, pruefstatus, freigabestatus, …  ·  → vorhaben · → mitarbeitende · → ergebnisdokumente
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Mitarbeitende, Vorhaben, Quellen, Anforderungen, Klaerungspunkte, Risiken, Aufgaben, Entscheidungen, Kommunikation, Erfahrungen, Ergebnisdokumente } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordIds } from '@/services/livingAppsService';
import { enrichVorhaben, enrichQuellen, enrichAnforderungen, enrichKlaerungspunkte, enrichRisiken, enrichAufgaben, enrichEntscheidungen, enrichKommunikation, enrichErfahrungen, enrichErgebnisdokumente } from '@/lib/enrich';
import type { EnrichedVorhaben, EnrichedQuellen, EnrichedAnforderungen, EnrichedKlaerungspunkte, EnrichedRisiken, EnrichedAufgaben, EnrichedEntscheidungen, EnrichedKommunikation, EnrichedErfahrungen, EnrichedErgebnisdokumente } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { MitarbeitendeDialog, type MitarbeitendeDialogDefaults } from '@/components/dialogs/MitarbeitendeDialog';
import { MitarbeitendeDetails } from '@/components/details/MitarbeitendeDetails';
import { VorhabenDialog, type VorhabenDialogDefaults } from '@/components/dialogs/VorhabenDialog';
import { VorhabenDetails } from '@/components/details/VorhabenDetails';
import { QuellenDialog, type QuellenDialogDefaults } from '@/components/dialogs/QuellenDialog';
import { QuellenDetails } from '@/components/details/QuellenDetails';
import { AnforderungenDialog, type AnforderungenDialogDefaults } from '@/components/dialogs/AnforderungenDialog';
import { AnforderungenDetails } from '@/components/details/AnforderungenDetails';
import { KlaerungspunkteDialog, type KlaerungspunkteDialogDefaults } from '@/components/dialogs/KlaerungspunkteDialog';
import { KlaerungspunkteDetails } from '@/components/details/KlaerungspunkteDetails';
import { RisikenDialog, type RisikenDialogDefaults } from '@/components/dialogs/RisikenDialog';
import { RisikenDetails } from '@/components/details/RisikenDetails';
import { AufgabenDialog, type AufgabenDialogDefaults } from '@/components/dialogs/AufgabenDialog';
import { AufgabenDetails } from '@/components/details/AufgabenDetails';
import { EntscheidungenDialog, type EntscheidungenDialogDefaults } from '@/components/dialogs/EntscheidungenDialog';
import { EntscheidungenDetails } from '@/components/details/EntscheidungenDetails';
import { KommunikationDialog, type KommunikationDialogDefaults } from '@/components/dialogs/KommunikationDialog';
import { KommunikationDetails } from '@/components/details/KommunikationDetails';
import { ErfahrungenDialog, type ErfahrungenDialogDefaults } from '@/components/dialogs/ErfahrungenDialog';
import { ErfahrungenDetails } from '@/components/details/ErfahrungenDetails';
import { ErgebnisdokumenteDialog, type ErgebnisdokumenteDialogDefaults } from '@/components/dialogs/ErgebnisdokumenteDialog';
import { ErgebnisdokumenteDetails } from '@/components/details/ErgebnisdokumenteDetails';
import { PickExistingDialog } from '@/components/PickExistingDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'mitarbeitende'; record: Mitarbeitende }
  | { type: 'vorhaben'; record: EnrichedVorhaben }
  | { type: 'quellen'; record: EnrichedQuellen }
  | { type: 'anforderungen'; record: EnrichedAnforderungen }
  | { type: 'klaerungspunkte'; record: EnrichedKlaerungspunkte }
  | { type: 'risiken'; record: EnrichedRisiken }
  | { type: 'aufgaben'; record: EnrichedAufgaben }
  | { type: 'entscheidungen'; record: EnrichedEntscheidungen }
  | { type: 'kommunikation'; record: EnrichedKommunikation }
  | { type: 'erfahrungen'; record: EnrichedErfahrungen }
  | { type: 'ergebnisdokumente'; record: EnrichedErgebnisdokumente };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  mitarbeitende: EntityCrudApi<Mitarbeitende, MitarbeitendeDialogDefaults>;
  vorhaben: EntityCrudApi<Vorhaben, VorhabenDialogDefaults>;
  quellen: EntityCrudApi<Quellen, QuellenDialogDefaults>;
  anforderungen: EntityCrudApi<Anforderungen, AnforderungenDialogDefaults>;
  klaerungspunkte: EntityCrudApi<Klaerungspunkte, KlaerungspunkteDialogDefaults>;
  risiken: EntityCrudApi<Risiken, RisikenDialogDefaults>;
  aufgaben: EntityCrudApi<Aufgaben, AufgabenDialogDefaults>;
  entscheidungen: EntityCrudApi<Entscheidungen, EntscheidungenDialogDefaults>;
  kommunikation: EntityCrudApi<Kommunikation, KommunikationDialogDefaults>;
  erfahrungen: EntityCrudApi<Erfahrungen, ErfahrungenDialogDefaults>;
  ergebnisdokumente: EntityCrudApi<Ergebnisdokumente, ErgebnisdokumenteDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { mitarbeitende: Mitarbeitende[]; vorhaben: EnrichedVorhaben[]; quellen: EnrichedQuellen[]; anforderungen: EnrichedAnforderungen[]; klaerungspunkte: EnrichedKlaerungspunkte[]; risiken: EnrichedRisiken[]; aufgaben: EnrichedAufgaben[]; entscheidungen: EnrichedEntscheidungen[]; kommunikation: EnrichedKommunikation[]; erfahrungen: EnrichedErfahrungen[]; ergebnisdokumente: EnrichedErgebnisdokumente[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [mitarbeitendeDialog, setMitarbeitendeDialog] = useState<{ defaults?: MitarbeitendeDialogDefaults; editing?: Mitarbeitende } | null>(null);
  const [vorhabenDialog, setVorhabenDialog] = useState<{ defaults?: VorhabenDialogDefaults; editing?: Vorhaben } | null>(null);
  const [quellenDialog, setQuellenDialog] = useState<{ defaults?: QuellenDialogDefaults; editing?: Quellen } | null>(null);
  const [anforderungenDialog, setAnforderungenDialog] = useState<{ defaults?: AnforderungenDialogDefaults; editing?: Anforderungen } | null>(null);
  const [klaerungspunkteDialog, setKlaerungspunkteDialog] = useState<{ defaults?: KlaerungspunkteDialogDefaults; editing?: Klaerungspunkte } | null>(null);
  const [risikenDialog, setRisikenDialog] = useState<{ defaults?: RisikenDialogDefaults; editing?: Risiken } | null>(null);
  const [aufgabenDialog, setAufgabenDialog] = useState<{ defaults?: AufgabenDialogDefaults; editing?: Aufgaben } | null>(null);
  const [entscheidungenDialog, setEntscheidungenDialog] = useState<{ defaults?: EntscheidungenDialogDefaults; editing?: Entscheidungen } | null>(null);
  const [kommunikationDialog, setKommunikationDialog] = useState<{ defaults?: KommunikationDialogDefaults; editing?: Kommunikation } | null>(null);
  const [erfahrungenDialog, setErfahrungenDialog] = useState<{ defaults?: ErfahrungenDialogDefaults; editing?: Erfahrungen } | null>(null);
  const [ergebnisdokumenteDialog, setErgebnisdokumenteDialog] = useState<{ defaults?: ErgebnisdokumenteDialogDefaults; editing?: Ergebnisdokumente } | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug aufgaben.unterstuetzende_personen → mitarbeitende: hält die Hub-record_id.
  const [pickMitarbeitendeAufgabenUnterstuetzendePersonen, setPickMitarbeitendeAufgabenUnterstuetzendePersonen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug klaerungspunkte.betroffene_quellen → quellen: hält die Hub-record_id.
  const [pickQuellenKlaerungspunkteBetroffeneQuellen, setPickQuellenKlaerungspunkteBetroffeneQuellen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug klaerungspunkte.betroffene_anforderungen → anforderungen: hält die Hub-record_id.
  const [pickAnforderungenKlaerungspunkte, setPickAnforderungenKlaerungspunkte] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug risiken.betroffene_anforderungen → anforderungen: hält die Hub-record_id.
  const [pickAnforderungenRisiken, setPickAnforderungenRisiken] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug erfahrungen.betroffene_anforderungen → anforderungen: hält die Hub-record_id.
  const [pickAnforderungenErfahrungen, setPickAnforderungenErfahrungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug erfahrungen.risiken → risiken: hält die Hub-record_id.
  const [pickRisikenErfahrungen, setPickRisikenErfahrungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug entscheidungen.beruecksichtigte_erfahrungen → erfahrungen: hält die Hub-record_id.
  const [pickErfahrungenEntscheidungenBeruecksichtigteErfahrungen, setPickErfahrungenEntscheidungenBeruecksichtigteErfahrungen] = useState<string | null>(null);
  const enrichedVorhaben = useMemo(() => enrichVorhaben(data.vorhaben, { mitarbeitendeMap: data.mitarbeitendeMap }), [data.vorhaben, data.mitarbeitendeMap]);
  const enrichedQuellen = useMemo(() => enrichQuellen(data.quellen, { vorhabenMap: data.vorhabenMap }), [data.quellen, data.vorhabenMap]);
  const enrichedAnforderungen = useMemo(() => enrichAnforderungen(data.anforderungen, { vorhabenMap: data.vorhabenMap, quellenMap: data.quellenMap, mitarbeitendeMap: data.mitarbeitendeMap }), [data.anforderungen, data.vorhabenMap, data.quellenMap, data.mitarbeitendeMap]);
  const enrichedKlaerungspunkte = useMemo(() => enrichKlaerungspunkte(data.klaerungspunkte, { vorhabenMap: data.vorhabenMap, mitarbeitendeMap: data.mitarbeitendeMap, anforderungenMap: data.anforderungenMap, quellenMap: data.quellenMap }), [data.klaerungspunkte, data.vorhabenMap, data.mitarbeitendeMap, data.anforderungenMap, data.quellenMap]);
  const enrichedRisiken = useMemo(() => enrichRisiken(data.risiken, { vorhabenMap: data.vorhabenMap, anforderungenMap: data.anforderungenMap, mitarbeitendeMap: data.mitarbeitendeMap }), [data.risiken, data.vorhabenMap, data.anforderungenMap, data.mitarbeitendeMap]);
  const enrichedAufgaben = useMemo(() => enrichAufgaben(data.aufgaben, { aufgabenMap: data.aufgabenMap, vorhabenMap: data.vorhabenMap, mitarbeitendeMap: data.mitarbeitendeMap, anforderungenMap: data.anforderungenMap, klaerungspunkteMap: data.klaerungspunkteMap }), [data.aufgaben, data.aufgabenMap, data.vorhabenMap, data.mitarbeitendeMap, data.anforderungenMap, data.klaerungspunkteMap]);
  const enrichedEntscheidungen = useMemo(() => enrichEntscheidungen(data.entscheidungen, { erfahrungenMap: data.erfahrungenMap, entscheidungenMap: data.entscheidungenMap, vorhabenMap: data.vorhabenMap, mitarbeitendeMap: data.mitarbeitendeMap }), [data.entscheidungen, data.erfahrungenMap, data.entscheidungenMap, data.vorhabenMap, data.mitarbeitendeMap]);
  const enrichedKommunikation = useMemo(() => enrichKommunikation(data.kommunikation, { aufgabenMap: data.aufgabenMap, vorhabenMap: data.vorhabenMap, mitarbeitendeMap: data.mitarbeitendeMap, klaerungspunkteMap: data.klaerungspunkteMap, anforderungenMap: data.anforderungenMap, quellenMap: data.quellenMap }), [data.kommunikation, data.aufgabenMap, data.vorhabenMap, data.mitarbeitendeMap, data.klaerungspunkteMap, data.anforderungenMap, data.quellenMap]);
  const enrichedErfahrungen = useMemo(() => enrichErfahrungen(data.erfahrungen, { entscheidungenMap: data.entscheidungenMap, vorhabenMap: data.vorhabenMap, mitarbeitendeMap: data.mitarbeitendeMap, anforderungenMap: data.anforderungenMap, risikenMap: data.risikenMap }), [data.erfahrungen, data.entscheidungenMap, data.vorhabenMap, data.mitarbeitendeMap, data.anforderungenMap, data.risikenMap]);
  const enrichedErgebnisdokumente = useMemo(() => enrichErgebnisdokumente(data.ergebnisdokumente, { vorhabenMap: data.vorhabenMap, mitarbeitendeMap: data.mitarbeitendeMap, ergebnisdokumenteMap: data.ergebnisdokumenteMap }), [data.ergebnisdokumente, data.vorhabenMap, data.mitarbeitendeMap, data.ergebnisdokumenteMap]);

  function detailMitarbeitende(record: Mitarbeitende, push = false) {
    const item: OverlayItem = { type: 'mitarbeitende', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitarbeitende(fields: Mitarbeitende['fields']) {
    const editing = mitarbeitendeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitarbeitende(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitarbeitendeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitarbeitende')} — ${t('crud_updated')}`, async () => {
        data.setMitarbeitende(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitarbeitendeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitarbeitendeEntry(fields);
      undoToast(`${appLabel('mitarbeitende')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Aufgaben to the Mitarbeitende hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkMitarbeitendeAufgabenUnterstuetzendePersonen(sourceId: string) {
    const hub = pickMitarbeitendeAufgabenUnterstuetzendePersonen;
    const src = data.aufgaben.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.unterstuetzende_personen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.MITARBEITENDE, id));
    data.setAufgaben(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, unterstuetzende_personen: next } } : r)));
    try {
      await LivingAppsService.updateAufgabenEntry(sourceId, { unterstuetzende_personen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('aufgaben')} — ${t('pick_linked')}`, async () => {
      data.setAufgaben(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateAufgabenEntry(sourceId, { unterstuetzende_personen: src.fields.unterstuetzende_personen }); } catch { data.fetchAll(); }
    });
  }

  function detailVorhaben(record: Vorhaben, push = false) {
    const rec = enrichedVorhaben.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'vorhaben', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitVorhaben(fields: Vorhaben['fields']) {
    const editing = vorhabenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setVorhaben(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateVorhabenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('vorhaben')} — ${t('crud_updated')}`, async () => {
        data.setVorhaben(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateVorhabenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createVorhabenEntry(fields);
      undoToast(`${appLabel('vorhaben')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailQuellen(record: Quellen, push = false) {
    const rec = enrichedQuellen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'quellen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitQuellen(fields: Quellen['fields']) {
    const editing = quellenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setQuellen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateQuellenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('quellen')} — ${t('crud_updated')}`, async () => {
        data.setQuellen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateQuellenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createQuellenEntry(fields);
      undoToast(`${appLabel('quellen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Klaerungspunkte to the Quellen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkQuellenKlaerungspunkteBetroffeneQuellen(sourceId: string) {
    const hub = pickQuellenKlaerungspunkteBetroffeneQuellen;
    const src = data.klaerungspunkte.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_quellen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.QUELLEN, id));
    data.setKlaerungspunkte(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_quellen: next } } : r)));
    try {
      await LivingAppsService.updateKlaerungspunkteEntry(sourceId, { betroffene_quellen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('klaerungspunkte')} — ${t('pick_linked')}`, async () => {
      data.setKlaerungspunkte(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateKlaerungspunkteEntry(sourceId, { betroffene_quellen: src.fields.betroffene_quellen }); } catch { data.fetchAll(); }
    });
  }

  function detailAnforderungen(record: Anforderungen, push = false) {
    const rec = enrichedAnforderungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'anforderungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAnforderungen(fields: Anforderungen['fields']) {
    const editing = anforderungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAnforderungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAnforderungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('anforderungen')} — ${t('crud_updated')}`, async () => {
        data.setAnforderungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAnforderungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAnforderungenEntry(fields);
      undoToast(`${appLabel('anforderungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Klaerungspunkte to the Anforderungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkAnforderungenKlaerungspunkte(sourceId: string) {
    const hub = pickAnforderungenKlaerungspunkte;
    const src = data.klaerungspunkte.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_anforderungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.ANFORDERUNGEN, id));
    data.setKlaerungspunkte(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_anforderungen: next } } : r)));
    try {
      await LivingAppsService.updateKlaerungspunkteEntry(sourceId, { betroffene_anforderungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('klaerungspunkte')} — ${t('pick_linked')}`, async () => {
      data.setKlaerungspunkte(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateKlaerungspunkteEntry(sourceId, { betroffene_anforderungen: src.fields.betroffene_anforderungen }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING Risiken to the Anforderungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkAnforderungenRisiken(sourceId: string) {
    const hub = pickAnforderungenRisiken;
    const src = data.risiken.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_anforderungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.ANFORDERUNGEN, id));
    data.setRisiken(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_anforderungen: next } } : r)));
    try {
      await LivingAppsService.updateRisikenEntry(sourceId, { betroffene_anforderungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('risiken')} — ${t('pick_linked')}`, async () => {
      data.setRisiken(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateRisikenEntry(sourceId, { betroffene_anforderungen: src.fields.betroffene_anforderungen }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING Erfahrungen to the Anforderungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkAnforderungenErfahrungen(sourceId: string) {
    const hub = pickAnforderungenErfahrungen;
    const src = data.erfahrungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_anforderungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.ANFORDERUNGEN, id));
    data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_anforderungen: next } } : r)));
    try {
      await LivingAppsService.updateErfahrungenEntry(sourceId, { betroffene_anforderungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('erfahrungen')} — ${t('pick_linked')}`, async () => {
      data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateErfahrungenEntry(sourceId, { betroffene_anforderungen: src.fields.betroffene_anforderungen }); } catch { data.fetchAll(); }
    });
  }

  function detailKlaerungspunkte(record: Klaerungspunkte, push = false) {
    const rec = enrichedKlaerungspunkte.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'klaerungspunkte', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKlaerungspunkte(fields: Klaerungspunkte['fields']) {
    const editing = klaerungspunkteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKlaerungspunkte(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKlaerungspunkteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('klaerungspunkte')} — ${t('crud_updated')}`, async () => {
        data.setKlaerungspunkte(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKlaerungspunkteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKlaerungspunkteEntry(fields);
      undoToast(`${appLabel('klaerungspunkte')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailRisiken(record: Risiken, push = false) {
    const rec = enrichedRisiken.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'risiken', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitRisiken(fields: Risiken['fields']) {
    const editing = risikenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setRisiken(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateRisikenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('risiken')} — ${t('crud_updated')}`, async () => {
        data.setRisiken(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateRisikenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createRisikenEntry(fields);
      undoToast(`${appLabel('risiken')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Erfahrungen to the Risiken hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkRisikenErfahrungen(sourceId: string) {
    const hub = pickRisikenErfahrungen;
    const src = data.erfahrungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.risiken);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.RISIKEN, id));
    data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, risiken: next } } : r)));
    try {
      await LivingAppsService.updateErfahrungenEntry(sourceId, { risiken: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('erfahrungen')} — ${t('pick_linked')}`, async () => {
      data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateErfahrungenEntry(sourceId, { risiken: src.fields.risiken }); } catch { data.fetchAll(); }
    });
  }

  function detailAufgaben(record: Aufgaben, push = false) {
    const rec = enrichedAufgaben.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'aufgaben', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAufgaben(fields: Aufgaben['fields']) {
    const editing = aufgabenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAufgaben(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAufgabenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('aufgaben')} — ${t('crud_updated')}`, async () => {
        data.setAufgaben(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAufgabenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAufgabenEntry(fields);
      undoToast(`${appLabel('aufgaben')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailEntscheidungen(record: Entscheidungen, push = false) {
    const rec = enrichedEntscheidungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'entscheidungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEntscheidungen(fields: Entscheidungen['fields']) {
    const editing = entscheidungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEntscheidungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEntscheidungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_updated')}`, async () => {
        data.setEntscheidungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEntscheidungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEntscheidungenEntry(fields);
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailKommunikation(record: Kommunikation, push = false) {
    const rec = enrichedKommunikation.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'kommunikation', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKommunikation(fields: Kommunikation['fields']) {
    const editing = kommunikationDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKommunikation(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKommunikationEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('kommunikation')} — ${t('crud_updated')}`, async () => {
        data.setKommunikation(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKommunikationEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKommunikationEntry(fields);
      undoToast(`${appLabel('kommunikation')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailErfahrungen(record: Erfahrungen, push = false) {
    const rec = enrichedErfahrungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'erfahrungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitErfahrungen(fields: Erfahrungen['fields']) {
    const editing = erfahrungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setErfahrungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateErfahrungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_updated')}`, async () => {
        data.setErfahrungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateErfahrungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createErfahrungenEntry(fields);
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Entscheidungen to the Erfahrungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkErfahrungenEntscheidungenBeruecksichtigteErfahrungen(sourceId: string) {
    const hub = pickErfahrungenEntscheidungenBeruecksichtigteErfahrungen;
    const src = data.entscheidungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.beruecksichtigte_erfahrungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.ERFAHRUNGEN, id));
    data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, beruecksichtigte_erfahrungen: next } } : r)));
    try {
      await LivingAppsService.updateEntscheidungenEntry(sourceId, { beruecksichtigte_erfahrungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('entscheidungen')} — ${t('pick_linked')}`, async () => {
      data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateEntscheidungenEntry(sourceId, { beruecksichtigte_erfahrungen: src.fields.beruecksichtigte_erfahrungen }); } catch { data.fetchAll(); }
    });
  }

  function detailErgebnisdokumente(record: Ergebnisdokumente, push = false) {
    const rec = enrichedErgebnisdokumente.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'ergebnisdokumente', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitErgebnisdokumente(fields: Ergebnisdokumente['fields']) {
    const editing = ergebnisdokumenteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setErgebnisdokumente(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateErgebnisdokumenteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('ergebnisdokumente')} — ${t('crud_updated')}`, async () => {
        data.setErgebnisdokumente(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateErgebnisdokumenteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createErgebnisdokumenteEntry(fields);
      undoToast(`${appLabel('ergebnisdokumente')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <MitarbeitendeDialog
        open={mitarbeitendeDialog !== null}
        onClose={() => setMitarbeitendeDialog(null)}
        onSubmit={submitMitarbeitende}
        defaultValues={mitarbeitendeDialog?.defaults}
        recordId={mitarbeitendeDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Mitarbeitende']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitarbeitende']}
      />
      <VorhabenDialog
        open={vorhabenDialog !== null}
        onClose={() => setVorhabenDialog(null)}
        onSubmit={submitVorhaben}
        defaultValues={vorhabenDialog?.defaults}
        recordId={vorhabenDialog?.editing?.record_id}
        mitarbeitendeList={data.mitarbeitende}
        enablePhotoScan={AI_PHOTO_SCAN['Vorhaben']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Vorhaben']}
      />
      <QuellenDialog
        open={quellenDialog !== null}
        onClose={() => setQuellenDialog(null)}
        onSubmit={submitQuellen}
        defaultValues={quellenDialog?.defaults}
        recordId={quellenDialog?.editing?.record_id}
        vorhabenList={data.vorhaben}
        enablePhotoScan={AI_PHOTO_SCAN['Quellen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Quellen']}
      />
      <AnforderungenDialog
        open={anforderungenDialog !== null}
        onClose={() => setAnforderungenDialog(null)}
        onSubmit={submitAnforderungen}
        defaultValues={anforderungenDialog?.defaults}
        recordId={anforderungenDialog?.editing?.record_id}
        vorhabenList={data.vorhaben}
        quellenList={data.quellen}
        mitarbeitendeList={data.mitarbeitende}
        enablePhotoScan={AI_PHOTO_SCAN['Anforderungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Anforderungen']}
      />
      <KlaerungspunkteDialog
        open={klaerungspunkteDialog !== null}
        onClose={() => setKlaerungspunkteDialog(null)}
        onSubmit={submitKlaerungspunkte}
        defaultValues={klaerungspunkteDialog?.defaults}
        recordId={klaerungspunkteDialog?.editing?.record_id}
        vorhabenList={data.vorhaben}
        mitarbeitendeList={data.mitarbeitende}
        anforderungenList={data.anforderungen}
        quellenList={data.quellen}
        enablePhotoScan={AI_PHOTO_SCAN['Klaerungspunkte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Klaerungspunkte']}
      />
      <RisikenDialog
        open={risikenDialog !== null}
        onClose={() => setRisikenDialog(null)}
        onSubmit={submitRisiken}
        defaultValues={risikenDialog?.defaults}
        recordId={risikenDialog?.editing?.record_id}
        vorhabenList={data.vorhaben}
        anforderungenList={data.anforderungen}
        mitarbeitendeList={data.mitarbeitende}
        enablePhotoScan={AI_PHOTO_SCAN['Risiken']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Risiken']}
      />
      <AufgabenDialog
        open={aufgabenDialog !== null}
        onClose={() => setAufgabenDialog(null)}
        onSubmit={submitAufgaben}
        defaultValues={aufgabenDialog?.defaults}
        recordId={aufgabenDialog?.editing?.record_id}
        aufgabenList={data.aufgaben}
        vorhabenList={data.vorhaben}
        mitarbeitendeList={data.mitarbeitende}
        anforderungenList={data.anforderungen}
        klaerungspunkteList={data.klaerungspunkte}
        enablePhotoScan={AI_PHOTO_SCAN['Aufgaben']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Aufgaben']}
      />
      <EntscheidungenDialog
        open={entscheidungenDialog !== null}
        onClose={() => setEntscheidungenDialog(null)}
        onSubmit={submitEntscheidungen}
        defaultValues={entscheidungenDialog?.defaults}
        recordId={entscheidungenDialog?.editing?.record_id}
        erfahrungenList={data.erfahrungen}
        entscheidungenList={data.entscheidungen}
        vorhabenList={data.vorhaben}
        mitarbeitendeList={data.mitarbeitende}
        enablePhotoScan={AI_PHOTO_SCAN['Entscheidungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Entscheidungen']}
      />
      <KommunikationDialog
        open={kommunikationDialog !== null}
        onClose={() => setKommunikationDialog(null)}
        onSubmit={submitKommunikation}
        defaultValues={kommunikationDialog?.defaults}
        recordId={kommunikationDialog?.editing?.record_id}
        aufgabenList={data.aufgaben}
        vorhabenList={data.vorhaben}
        mitarbeitendeList={data.mitarbeitende}
        klaerungspunkteList={data.klaerungspunkte}
        anforderungenList={data.anforderungen}
        quellenList={data.quellen}
        enablePhotoScan={AI_PHOTO_SCAN['Kommunikation']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kommunikation']}
      />
      <ErfahrungenDialog
        open={erfahrungenDialog !== null}
        onClose={() => setErfahrungenDialog(null)}
        onSubmit={submitErfahrungen}
        defaultValues={erfahrungenDialog?.defaults}
        recordId={erfahrungenDialog?.editing?.record_id}
        entscheidungenList={data.entscheidungen}
        vorhabenList={data.vorhaben}
        mitarbeitendeList={data.mitarbeitende}
        anforderungenList={data.anforderungen}
        risikenList={data.risiken}
        enablePhotoScan={AI_PHOTO_SCAN['Erfahrungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Erfahrungen']}
      />
      <ErgebnisdokumenteDialog
        open={ergebnisdokumenteDialog !== null}
        onClose={() => setErgebnisdokumenteDialog(null)}
        onSubmit={submitErgebnisdokumente}
        defaultValues={ergebnisdokumenteDialog?.defaults}
        recordId={ergebnisdokumenteDialog?.editing?.record_id}
        vorhabenList={data.vorhaben}
        mitarbeitendeList={data.mitarbeitende}
        ergebnisdokumenteList={data.ergebnisdokumente}
        enablePhotoScan={AI_PHOTO_SCAN['Ergebnisdokumente']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Ergebnisdokumente']}
      />
      <PickExistingDialog
        open={pickMitarbeitendeAufgabenUnterstuetzendePersonen !== null}
        onClose={() => setPickMitarbeitendeAufgabenUnterstuetzendePersonen(null)}
        title={t('pick_title', { title: appLabel('aufgaben') })}
        items={data.aufgaben
          .filter(r => !extractRecordIds(r.fields.unterstuetzende_personen).includes(pickMitarbeitendeAufgabenUnterstuetzendePersonen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('aufgaben')), hint: r.fields.faelligkeit ? String(r.fields.faelligkeit) : undefined }))}
        onPick={linkMitarbeitendeAufgabenUnterstuetzendePersonen}
      />
      <PickExistingDialog
        open={pickQuellenKlaerungspunkteBetroffeneQuellen !== null}
        onClose={() => setPickQuellenKlaerungspunkteBetroffeneQuellen(null)}
        title={t('pick_title', { title: appLabel('klaerungspunkte') })}
        items={data.klaerungspunkte
          .filter(r => !extractRecordIds(r.fields.betroffene_quellen).includes(pickQuellenKlaerungspunkteBetroffeneQuellen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.adressat ?? appLabel('klaerungspunkte')), hint: r.fields.faelligkeit ? String(r.fields.faelligkeit) : undefined }))}
        onPick={linkQuellenKlaerungspunkteBetroffeneQuellen}
      />
      <PickExistingDialog
        open={pickAnforderungenKlaerungspunkte !== null}
        onClose={() => setPickAnforderungenKlaerungspunkte(null)}
        title={t('pick_title', { title: appLabel('klaerungspunkte') })}
        items={data.klaerungspunkte
          .filter(r => !extractRecordIds(r.fields.betroffene_anforderungen).includes(pickAnforderungenKlaerungspunkte ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.adressat ?? appLabel('klaerungspunkte')), hint: r.fields.faelligkeit ? String(r.fields.faelligkeit) : undefined }))}
        onPick={linkAnforderungenKlaerungspunkte}
      />
      <PickExistingDialog
        open={pickAnforderungenRisiken !== null}
        onClose={() => setPickAnforderungenRisiken(null)}
        title={t('pick_title', { title: appLabel('risiken') })}
        items={data.risiken
          .filter(r => !extractRecordIds(r.fields.betroffene_anforderungen).includes(pickAnforderungenRisiken ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('risiken')), hint: r.fields.faelligkeit ? String(r.fields.faelligkeit) : undefined }))}
        onPick={linkAnforderungenRisiken}
      />
      <PickExistingDialog
        open={pickAnforderungenErfahrungen !== null}
        onClose={() => setPickAnforderungenErfahrungen(null)}
        title={t('pick_title', { title: appLabel('erfahrungen') })}
        items={data.erfahrungen
          .filter(r => !extractRecordIds(r.fields.betroffene_anforderungen).includes(pickAnforderungenErfahrungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('erfahrungen')), hint: r.fields.naechster_pruefttermin ? String(r.fields.naechster_pruefttermin) : undefined }))}
        onPick={linkAnforderungenErfahrungen}
      />
      <PickExistingDialog
        open={pickRisikenErfahrungen !== null}
        onClose={() => setPickRisikenErfahrungen(null)}
        title={t('pick_title', { title: appLabel('erfahrungen') })}
        items={data.erfahrungen
          .filter(r => !extractRecordIds(r.fields.risiken).includes(pickRisikenErfahrungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('erfahrungen')), hint: r.fields.naechster_pruefttermin ? String(r.fields.naechster_pruefttermin) : undefined }))}
        onPick={linkRisikenErfahrungen}
      />
      <PickExistingDialog
        open={pickErfahrungenEntscheidungenBeruecksichtigteErfahrungen !== null}
        onClose={() => setPickErfahrungenEntscheidungenBeruecksichtigteErfahrungen(null)}
        title={t('pick_title', { title: appLabel('entscheidungen') })}
        items={data.entscheidungen
          .filter(r => !extractRecordIds(r.fields.beruecksichtigte_erfahrungen).includes(pickErfahrungenEntscheidungenBeruecksichtigteErfahrungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(appLabel('entscheidungen')), hint: r.fields.entscheidungszeitpunkt ? String(r.fields.entscheidungszeitpunkt) : undefined }))}
        onPick={linkErfahrungenEntscheidungenBeruecksichtigteErfahrungen}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'mitarbeitende') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('mitarbeitende')} subtitle={undefined} />
                <MitarbeitendeDetails
                  record={top.record}
                  vorhabenAufklaerungsverantwortlicherList={data.vorhaben}
                  onOpenVorhabenAufklaerungsverantwortlicher={(r) => detailVorhaben(r, true)}
                  onAddVorhabenAufklaerungsverantwortlicher={perms.canWrite('vorhaben') ? () => setVorhabenDialog({ defaults: { aufklaerungsverantwortlicher: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  vorhabenTechnischerHauptverantwortlicherList={data.vorhaben}
                  onOpenVorhabenTechnischerHauptverantwortlicher={(r) => detailVorhaben(r, true)}
                  onAddVorhabenTechnischerHauptverantwortlicher={perms.canWrite('vorhaben') ? () => setVorhabenDialog({ defaults: { technischer_hauptverantwortlicher: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  anforderungenPrueferList={data.anforderungen}
                  onOpenAnforderungenPruefer={(r) => detailAnforderungen(r, true)}
                  onAddAnforderungenPruefer={perms.canWrite('anforderungen') ? () => setAnforderungenDialog({ defaults: { pruefer: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  anforderungenBestaetigerList={data.anforderungen}
                  onOpenAnforderungenBestaetiger={(r) => detailAnforderungen(r, true)}
                  onAddAnforderungenBestaetiger={perms.canWrite('anforderungen') ? () => setAnforderungenDialog({ defaults: { bestaetiger: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  klaerungspunkteVerantwortlicherList={data.klaerungspunkte}
                  onOpenKlaerungspunkteVerantwortlicher={(r) => detailKlaerungspunkte(r, true)}
                  onAddKlaerungspunkteVerantwortlicher={perms.canWrite('klaerungspunkte') ? () => setKlaerungspunkteDialog({ defaults: { verantwortlicher: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  klaerungspunkteFachlicherPrueferList={data.klaerungspunkte}
                  onOpenKlaerungspunkteFachlicherPruefer={(r) => detailKlaerungspunkte(r, true)}
                  onAddKlaerungspunkteFachlicherPruefer={perms.canWrite('klaerungspunkte') ? () => setKlaerungspunkteDialog({ defaults: { fachlicher_pruefer: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  risikenList={data.risiken}
                  onOpenRisiken={(r) => detailRisiken(r, true)}
                  onAddRisiken={perms.canWrite('risiken') ? () => setRisikenDialog({ defaults: { massnahmenverantwortlicher: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  aufgabenVerantwortlicherList={data.aufgaben}
                  onOpenAufgabenVerantwortlicher={(r) => detailAufgaben(r, true)}
                  onAddAufgabenVerantwortlicher={perms.canWrite('aufgaben') ? () => setAufgabenDialog({ defaults: { verantwortlicher: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  aufgabenUnterstuetzendePersonenList={data.aufgaben}
                  onOpenAufgabenUnterstuetzendePersonen={(r) => detailAufgaben(r, true)}
                  onAddAufgabenUnterstuetzendePersonen={perms.canWrite('aufgaben') ? () => setAufgabenDialog({ defaults: { unterstuetzende_personen: [createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id)] } }) : undefined}
                  onPickAufgabenUnterstuetzendePersonen={perms.canWrite('aufgaben') ? () => setPickMitarbeitendeAufgabenUnterstuetzendePersonen(top.record.record_id) : undefined}
                  aufgabenPrueferList={data.aufgaben}
                  onOpenAufgabenPruefer={(r) => detailAufgaben(r, true)}
                  onAddAufgabenPruefer={perms.canWrite('aufgaben') ? () => setAufgabenDialog({ defaults: { pruefer: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { entscheider: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  kommunikationAbsenderList={data.kommunikation}
                  onOpenKommunikationAbsender={(r) => detailKommunikation(r, true)}
                  onAddKommunikationAbsender={perms.canWrite('kommunikation') ? () => setKommunikationDialog({ defaults: { absender: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  kommunikationFreigegebenVonList={data.kommunikation}
                  onOpenKommunikationFreigegebenVon={(r) => detailKommunikation(r, true)}
                  onAddKommunikationFreigegebenVon={perms.canWrite('kommunikation') ? () => setKommunikationDialog({ defaults: { freigegeben_von: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { fachlicher_pruefer: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                  ergebnisdokumenteList={data.ergebnisdokumente}
                  onOpenErgebnisdokumente={(r) => detailErgebnisdokumente(r, true)}
                  onAddErgebnisdokumente={perms.canWrite('ergebnisdokumente') ? () => setErgebnisdokumenteDialog({ defaults: { freigeber: createRecordUrl(APP_IDS.MITARBEITENDE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'vorhaben') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorhaben_nummer ?? appLabel('vorhaben')} subtitle={top.record.fields.eingangsdatum ? formatDate(top.record.fields.eingangsdatum) : undefined} />
                <VorhabenDetails
                  record={top.record}
                  mitarbeitendeList={data.mitarbeitende}
                  onOpenMitarbeitende={(r) => detailMitarbeitende(r, true)}
                  quellenList={data.quellen}
                  onOpenQuellen={(r) => detailQuellen(r, true)}
                  onAddQuellen={perms.canWrite('quellen') ? () => setQuellenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                  onAddAnforderungen={perms.canWrite('anforderungen') ? () => setAnforderungenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  klaerungspunkteList={data.klaerungspunkte}
                  onOpenKlaerungspunkte={(r) => detailKlaerungspunkte(r, true)}
                  onAddKlaerungspunkte={perms.canWrite('klaerungspunkte') ? () => setKlaerungspunkteDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  risikenList={data.risiken}
                  onOpenRisiken={(r) => detailRisiken(r, true)}
                  onAddRisiken={perms.canWrite('risiken') ? () => setRisikenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  aufgabenList={data.aufgaben}
                  onOpenAufgaben={(r) => detailAufgaben(r, true)}
                  onAddAufgaben={perms.canWrite('aufgaben') ? () => setAufgabenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  kommunikationList={data.kommunikation}
                  onOpenKommunikation={(r) => detailKommunikation(r, true)}
                  onAddKommunikation={perms.canWrite('kommunikation') ? () => setKommunikationDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { ursprungsvorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                  ergebnisdokumenteList={data.ergebnisdokumente}
                  onOpenErgebnisdokumente={(r) => detailErgebnisdokumente(r, true)}
                  onAddErgebnisdokumente={perms.canWrite('ergebnisdokumente') ? () => setErgebnisdokumenteDialog({ defaults: { vorhaben: createRecordUrl(APP_IDS.VORHABEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'quellen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('quellen')} subtitle={top.record.fields.erfassungszeitpunkt ? formatDate(top.record.fields.erfassungszeitpunkt) : undefined} />
                <QuellenDetails
                  record={top.record}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                  onAddAnforderungen={perms.canWrite('anforderungen') ? () => setAnforderungenDialog({ defaults: { quelle: createRecordUrl(APP_IDS.QUELLEN, top.record.record_id) } }) : undefined}
                  klaerungspunkteBetroffeneQuellenList={data.klaerungspunkte}
                  onOpenKlaerungspunkteBetroffeneQuellen={(r) => detailKlaerungspunkte(r, true)}
                  onAddKlaerungspunkteBetroffeneQuellen={perms.canWrite('klaerungspunkte') ? () => setKlaerungspunkteDialog({ defaults: { betroffene_quellen: [createRecordUrl(APP_IDS.QUELLEN, top.record.record_id)] } }) : undefined}
                  onPickKlaerungspunkteBetroffeneQuellen={perms.canWrite('klaerungspunkte') ? () => setPickQuellenKlaerungspunkteBetroffeneQuellen(top.record.record_id) : undefined}
                  klaerungspunkteAntwortquelleList={data.klaerungspunkte}
                  onOpenKlaerungspunkteAntwortquelle={(r) => detailKlaerungspunkte(r, true)}
                  onAddKlaerungspunkteAntwortquelle={perms.canWrite('klaerungspunkte') ? () => setKlaerungspunkteDialog({ defaults: { antwortquelle: createRecordUrl(APP_IDS.QUELLEN, top.record.record_id) } }) : undefined}
                  kommunikationList={data.kommunikation}
                  onOpenKommunikation={(r) => detailKommunikation(r, true)}
                  onAddKommunikation={perms.canWrite('kommunikation') ? () => setKommunikationDialog({ defaults: { quellenreferenz: createRecordUrl(APP_IDS.QUELLEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'anforderungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('anforderungen')} subtitle={top.record.fields.bestaetigungszeitpunkt ? formatDate(top.record.fields.bestaetigungszeitpunkt) : undefined} />
                <AnforderungenDetails
                  record={top.record}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  quellenList={data.quellen}
                  onOpenQuellen={(r) => detailQuellen(r, true)}
                  mitarbeitendeList={data.mitarbeitende}
                  onOpenMitarbeitende={(r) => detailMitarbeitende(r, true)}
                  klaerungspunkteList={data.klaerungspunkte}
                  onOpenKlaerungspunkte={(r) => detailKlaerungspunkte(r, true)}
                  onAddKlaerungspunkte={perms.canWrite('klaerungspunkte') ? () => setKlaerungspunkteDialog({ defaults: { betroffene_anforderungen: [createRecordUrl(APP_IDS.ANFORDERUNGEN, top.record.record_id)] } }) : undefined}
                  onPickKlaerungspunkte={perms.canWrite('klaerungspunkte') ? () => setPickAnforderungenKlaerungspunkte(top.record.record_id) : undefined}
                  risikenList={data.risiken}
                  onOpenRisiken={(r) => detailRisiken(r, true)}
                  onAddRisiken={perms.canWrite('risiken') ? () => setRisikenDialog({ defaults: { betroffene_anforderungen: [createRecordUrl(APP_IDS.ANFORDERUNGEN, top.record.record_id)] } }) : undefined}
                  onPickRisiken={perms.canWrite('risiken') ? () => setPickAnforderungenRisiken(top.record.record_id) : undefined}
                  aufgabenList={data.aufgaben}
                  onOpenAufgaben={(r) => detailAufgaben(r, true)}
                  onAddAufgaben={perms.canWrite('aufgaben') ? () => setAufgabenDialog({ defaults: { anforderung: createRecordUrl(APP_IDS.ANFORDERUNGEN, top.record.record_id) } }) : undefined}
                  kommunikationList={data.kommunikation}
                  onOpenKommunikation={(r) => detailKommunikation(r, true)}
                  onAddKommunikation={perms.canWrite('kommunikation') ? () => setKommunikationDialog({ defaults: { anforderung: createRecordUrl(APP_IDS.ANFORDERUNGEN, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { betroffene_anforderungen: [createRecordUrl(APP_IDS.ANFORDERUNGEN, top.record.record_id)] } }) : undefined}
                  onPickErfahrungen={perms.canWrite('erfahrungen') ? () => setPickAnforderungenErfahrungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'klaerungspunkte') {
            return (
              <>
                <RecordHeader title={top.record.fields.adressat ?? appLabel('klaerungspunkte')} subtitle={top.record.fields.faelligkeit ? formatDate(top.record.fields.faelligkeit) : undefined} />
                <KlaerungspunkteDetails
                  record={top.record}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  mitarbeitendeList={data.mitarbeitende}
                  onOpenMitarbeitende={(r) => detailMitarbeitende(r, true)}
                  anforderungenList={data.anforderungen}
                  quellenList={data.quellen}
                  onOpenQuellen={(r) => detailQuellen(r, true)}
                  aufgabenList={data.aufgaben}
                  onOpenAufgaben={(r) => detailAufgaben(r, true)}
                  onAddAufgaben={perms.canWrite('aufgaben') ? () => setAufgabenDialog({ defaults: { klaerungspunkt: createRecordUrl(APP_IDS.KLAERUNGSPUNKTE, top.record.record_id) } }) : undefined}
                  kommunikationList={data.kommunikation}
                  onOpenKommunikation={(r) => detailKommunikation(r, true)}
                  onAddKommunikation={perms.canWrite('kommunikation') ? () => setKommunikationDialog({ defaults: { klaerungspunkt: createRecordUrl(APP_IDS.KLAERUNGSPUNKTE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'risiken') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('risiken')} subtitle={top.record.fields.faelligkeit ? formatDate(top.record.fields.faelligkeit) : undefined} />
                <RisikenDetails
                  record={top.record}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  anforderungenList={data.anforderungen}
                  mitarbeitendeList={data.mitarbeitende}
                  onOpenMitarbeitende={(r) => detailMitarbeitende(r, true)}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { risiken: [createRecordUrl(APP_IDS.RISIKEN, top.record.record_id)] } }) : undefined}
                  onPickErfahrungen={perms.canWrite('erfahrungen') ? () => setPickRisikenErfahrungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'aufgaben') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('aufgaben')} subtitle={top.record.fields.faelligkeit ? formatDate(top.record.fields.faelligkeit) : undefined} />
                <AufgabenDetails
                  record={top.record}
                  aufgabenList={data.aufgaben}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  mitarbeitendeList={data.mitarbeitende}
                  onOpenMitarbeitende={(r) => detailMitarbeitende(r, true)}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                  klaerungspunkteList={data.klaerungspunkte}
                  onOpenKlaerungspunkte={(r) => detailKlaerungspunkte(r, true)}
                  kommunikationList={data.kommunikation}
                  onOpenKommunikation={(r) => detailKommunikation(r, true)}
                  onAddKommunikation={perms.canWrite('kommunikation') ? () => setKommunikationDialog({ defaults: { aufgabe: createRecordUrl(APP_IDS.AUFGABEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'entscheidungen') {
            return (
              <>
                <RecordHeader title={appLabel('entscheidungen')} subtitle={top.record.fields.entscheidungszeitpunkt ? formatDate(top.record.fields.entscheidungszeitpunkt) : undefined} />
                <EntscheidungenDetails
                  record={top.record}
                  erfahrungenList={data.erfahrungen}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  mitarbeitendeList={data.mitarbeitende}
                  onOpenMitarbeitende={(r) => detailMitarbeitende(r, true)}
                  erfahrungenBetroffeneEntscheidungList={data.erfahrungen}
                  onOpenErfahrungenBetroffeneEntscheidung={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungenBetroffeneEntscheidung={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { betroffene_entscheidung: createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'kommunikation') {
            return (
              <>
                <RecordHeader title={top.record.fields.betreff ?? appLabel('kommunikation')} subtitle={top.record.fields.zeitpunkt ? formatDate(top.record.fields.zeitpunkt) : undefined} />
                <KommunikationDetails
                  record={top.record}
                  aufgabenList={data.aufgaben}
                  onOpenAufgaben={(r) => detailAufgaben(r, true)}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  mitarbeitendeList={data.mitarbeitende}
                  onOpenMitarbeitende={(r) => detailMitarbeitende(r, true)}
                  klaerungspunkteList={data.klaerungspunkte}
                  onOpenKlaerungspunkte={(r) => detailKlaerungspunkte(r, true)}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                  quellenList={data.quellen}
                  onOpenQuellen={(r) => detailQuellen(r, true)}
                />
              </>
            );
          }
          if (top.type === 'erfahrungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('erfahrungen')} subtitle={top.record.fields.naechster_pruefttermin ? formatDate(top.record.fields.naechster_pruefttermin) : undefined} />
                <ErfahrungenDetails
                  record={top.record}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  mitarbeitendeList={data.mitarbeitende}
                  onOpenMitarbeitende={(r) => detailMitarbeitende(r, true)}
                  anforderungenList={data.anforderungen}
                  risikenList={data.risiken}
                  entscheidungenBeruecksichtigteErfahrungenList={data.entscheidungen}
                  onOpenEntscheidungenBeruecksichtigteErfahrungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungenBeruecksichtigteErfahrungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { beruecksichtigte_erfahrungen: [createRecordUrl(APP_IDS.ERFAHRUNGEN, top.record.record_id)] } }) : undefined}
                  onPickEntscheidungenBeruecksichtigteErfahrungen={perms.canWrite('entscheidungen') ? () => setPickErfahrungenEntscheidungenBeruecksichtigteErfahrungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'ergebnisdokumente') {
            return (
              <>
                <RecordHeader title={top.record.fields.datenstand ?? appLabel('ergebnisdokumente')} subtitle={top.record.fields.erstellungszeitpunkt ? formatDate(top.record.fields.erstellungszeitpunkt) : undefined} />
                <ErgebnisdokumenteDetails
                  record={top.record}
                  vorhabenList={data.vorhaben}
                  onOpenVorhaben={(r) => detailVorhaben(r, true)}
                  mitarbeitendeList={data.mitarbeitende}
                  onOpenMitarbeitende={(r) => detailMitarbeitende(r, true)}
                  ergebnisdokumenteList={data.ergebnisdokumente}
                  onOpenErgebnisdokumente={(r) => detailErgebnisdokumente(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'mitarbeitende') return perms.canWrite('mitarbeitende');
          if (top.type === 'vorhaben') return perms.canWrite('vorhaben');
          if (top.type === 'quellen') return perms.canWrite('quellen');
          if (top.type === 'anforderungen') return perms.canWrite('anforderungen');
          if (top.type === 'klaerungspunkte') return perms.canWrite('klaerungspunkte');
          if (top.type === 'risiken') return perms.canWrite('risiken');
          if (top.type === 'aufgaben') return perms.canWrite('aufgaben');
          if (top.type === 'entscheidungen') return perms.canWrite('entscheidungen');
          if (top.type === 'kommunikation') return perms.canWrite('kommunikation');
          if (top.type === 'erfahrungen') return perms.canWrite('erfahrungen');
          if (top.type === 'ergebnisdokumente') return perms.canWrite('ergebnisdokumente');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'mitarbeitende') setMitarbeitendeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'vorhaben') setVorhabenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'quellen') setQuellenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'anforderungen') setAnforderungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'klaerungspunkte') setKlaerungspunkteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'risiken') setRisikenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'aufgaben') setAufgabenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'entscheidungen') setEntscheidungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'kommunikation') setKommunikationDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'erfahrungen') setErfahrungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'ergebnisdokumente') setErgebnisdokumenteDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    mitarbeitende: {
      openCreate: (defaults?: MitarbeitendeDialogDefaults) => (perms.canWrite('mitarbeitende') ? setMitarbeitendeDialog({ defaults }) : refuse()),
      openEdit: (record: Mitarbeitende) => (perms.canWrite('mitarbeitende') ? setMitarbeitendeDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Mitarbeitende) => detailMitarbeitende(record, false),
      canWrite: perms.canWrite('mitarbeitende'),
    },
    vorhaben: {
      openCreate: (defaults?: VorhabenDialogDefaults) => (perms.canWrite('vorhaben') ? setVorhabenDialog({ defaults }) : refuse()),
      openEdit: (record: Vorhaben) => (perms.canWrite('vorhaben') ? setVorhabenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Vorhaben) => detailVorhaben(record, false),
      canWrite: perms.canWrite('vorhaben'),
    },
    quellen: {
      openCreate: (defaults?: QuellenDialogDefaults) => (perms.canWrite('quellen') ? setQuellenDialog({ defaults }) : refuse()),
      openEdit: (record: Quellen) => (perms.canWrite('quellen') ? setQuellenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Quellen) => detailQuellen(record, false),
      canWrite: perms.canWrite('quellen'),
    },
    anforderungen: {
      openCreate: (defaults?: AnforderungenDialogDefaults) => (perms.canWrite('anforderungen') ? setAnforderungenDialog({ defaults }) : refuse()),
      openEdit: (record: Anforderungen) => (perms.canWrite('anforderungen') ? setAnforderungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Anforderungen) => detailAnforderungen(record, false),
      canWrite: perms.canWrite('anforderungen'),
    },
    klaerungspunkte: {
      openCreate: (defaults?: KlaerungspunkteDialogDefaults) => (perms.canWrite('klaerungspunkte') ? setKlaerungspunkteDialog({ defaults }) : refuse()),
      openEdit: (record: Klaerungspunkte) => (perms.canWrite('klaerungspunkte') ? setKlaerungspunkteDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Klaerungspunkte) => detailKlaerungspunkte(record, false),
      canWrite: perms.canWrite('klaerungspunkte'),
    },
    risiken: {
      openCreate: (defaults?: RisikenDialogDefaults) => (perms.canWrite('risiken') ? setRisikenDialog({ defaults }) : refuse()),
      openEdit: (record: Risiken) => (perms.canWrite('risiken') ? setRisikenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Risiken) => detailRisiken(record, false),
      canWrite: perms.canWrite('risiken'),
    },
    aufgaben: {
      openCreate: (defaults?: AufgabenDialogDefaults) => (perms.canWrite('aufgaben') ? setAufgabenDialog({ defaults }) : refuse()),
      openEdit: (record: Aufgaben) => (perms.canWrite('aufgaben') ? setAufgabenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Aufgaben) => detailAufgaben(record, false),
      canWrite: perms.canWrite('aufgaben'),
    },
    entscheidungen: {
      openCreate: (defaults?: EntscheidungenDialogDefaults) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ defaults }) : refuse()),
      openEdit: (record: Entscheidungen) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Entscheidungen) => detailEntscheidungen(record, false),
      canWrite: perms.canWrite('entscheidungen'),
    },
    kommunikation: {
      openCreate: (defaults?: KommunikationDialogDefaults) => (perms.canWrite('kommunikation') ? setKommunikationDialog({ defaults }) : refuse()),
      openEdit: (record: Kommunikation) => (perms.canWrite('kommunikation') ? setKommunikationDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Kommunikation) => detailKommunikation(record, false),
      canWrite: perms.canWrite('kommunikation'),
    },
    erfahrungen: {
      openCreate: (defaults?: ErfahrungenDialogDefaults) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ defaults }) : refuse()),
      openEdit: (record: Erfahrungen) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Erfahrungen) => detailErfahrungen(record, false),
      canWrite: perms.canWrite('erfahrungen'),
    },
    ergebnisdokumente: {
      openCreate: (defaults?: ErgebnisdokumenteDialogDefaults) => (perms.canWrite('ergebnisdokumente') ? setErgebnisdokumenteDialog({ defaults }) : refuse()),
      openEdit: (record: Ergebnisdokumente) => (perms.canWrite('ergebnisdokumente') ? setErgebnisdokumenteDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Ergebnisdokumente) => detailErgebnisdokumente(record, false),
      canWrite: perms.canWrite('ergebnisdokumente'),
    },
    enriched: { mitarbeitende: data.mitarbeitende, vorhaben: enrichedVorhaben, quellen: enrichedQuellen, anforderungen: enrichedAnforderungen, klaerungspunkte: enrichedKlaerungspunkte, risiken: enrichedRisiken, aufgaben: enrichedAufgaben, entscheidungen: enrichedEntscheidungen, kommunikation: enrichedKommunikation, erfahrungen: enrichedErfahrungen, ergebnisdokumente: enrichedErgebnisdokumente },
  };
}
