/**
 * Occupancy semantics — DECIDED BY THE PLAN when it has a no_overlap check
 * (rendered below, generator-owned), else by the build agent, never by a
 * heuristic. Without a plan the Phase-2 orchestrator writes its decision to
 * `.intents-staging/occupancy.json` (stay pair, booked resource, statuses
 * that do not occupy); the integration step validates it against the app
 * metadata and renders it into the block below. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - mitarbeitende: lookups rolle[aufklaerungsverantwortlicher|fachpruefer|freigeber|mitarbeiter|administrator]
 *   - vorhaben: applookups aufklaerungsverantwortlicher→mitarbeitende, technischer_hauptverantwortlicher→mitarbeitende · lookups anfragequelle[email|telefon|portal|vertrieb|persoenlich|sonstige], aufklaerungsstatus[neu|in_triage|in_aufklaerung|wartet|in_pruefung|freigabe_ausstehend|freigegeben|abgeschlossen|zurueckgestellt|abgebrochen], vertraulichkeit[oeffentlich|intern|vertraulich|streng_vertraulich], qualitaetsstatus[nicht_geprueft|bestanden|mit_warnungen|fehlgeschlagen], freigabestatus[nicht_freigabefaehig|pruefung_moeglich|ausstehend|freigegeben], prioritaet[niedrig|normal|hoch|dringend]
 *   - quellen: applookups vorhaben→vorhaben · lookups quellentyp[dokument|email|gespraechsnotiz|datensatz|sonstiges], vertraulichkeit[oeffentlich|intern|vertraulich|streng_vertraulich], extraktionsstatus[nicht_extrahiert|in_arbeit|extrahiert|fehlgeschlagen], pruefstatus[ungeprueft|geprueft|beanstandet]
 *   - anforderungen: applookups vorhaben→vorhaben, quelle→quellen, pruefer→mitarbeitende, bestaetiger→mitarbeitende · lookups kategorie[funktion|leistung|schnittstellen|mechanik|elektrik|software|materialien|umweltbedingungen|sicherheit|normen|qualitaet|wartung|dokumentation|lieferumfang|termine|wirtschaftlichkeit], anforderungsart[muss|soll|optional|randbedingung|abnahmekriterium], verbindlichkeit[verbindlich|wuenschenswert|unverbindlich], kritikalitaet[niedrig|mittel|hoch|kritisch], status[vorgeschlagen|in_pruefung|rueckfrage|bestaetigt|abgelehnt|ersetzt|nicht_anwendbar]
 *   - klaerungspunkte: applookups vorhaben→vorhaben, verantwortlicher→mitarbeitende, betroffene_anforderungen→anforderungen, betroffene_quellen→quellen, antwortquelle→quellen, fachlicher_pruefer→mitarbeitende · lookups anlass[informationsluecke|widerspruch|offene_frage|fehlender_nachweis|machbarkeit], kritikalitaet[niedrig|mittel|hoch|kritisch], status[offen|in_bearbeitung|rueckfrage_vorbereitet|rueckfrage_versendet|antwort_eingegangen|fachliche_pruefung|geklaert|nicht_relevant]
 *   - risiken: applookups vorhaben→vorhaben, betroffene_anforderungen→anforderungen, massnahmenverantwortlicher→mitarbeitende · lookups wahrscheinlichkeit[selten|moeglich|wahrscheinlich|sehr_wahrscheinlich], auswirkung[gering|mittel|hoch|schwerwiegend], risikoklasse[niedrig|mittel|hoch|kritisch], status[identifiziert|in_bewertung|massnahme_geplant|behandelt|akzeptiert|geschlossen]
 *   - aufgaben: applookups abhaengigkeiten→aufgaben, vorhaben→vorhaben, verantwortlicher→mitarbeitende, anforderung→anforderungen, klaerungspunkt→klaerungspunkte, unterstuetzende_personen→mitarbeitende, pruefer→mitarbeitende · lookups aufgabentyp[klaerung|bewertung|nachweis|rueckfrage|pruefung|sonstiges], status[geplant|bereit|in_bearbeitung|wartet_information|wartet_aufgabe|zur_pruefung|korrektur|erledigt|abgebrochen]
 *   - entscheidungen: applookups beruecksichtigte_erfahrungen→erfahrungen, ersetzte_entscheidung→entscheidungen, vorhaben→vorhaben, entscheider→mitarbeitende · lookups status[empfehlung|getroffen|freigegeben|ersetzt]
 *   - kommunikation: applookups aufgabe→aufgaben, vorhaben→vorhaben, absender→mitarbeitende, klaerungspunkt→klaerungspunkte, anforderung→anforderungen, freigegeben_von→mitarbeitende, quellenreferenz→quellen · lookups kanal[interne_notiz|interne_abstimmung|ki_vorschlag|externe_nachricht], status[entwurf|zur_freigabe|freigegeben|versendet|eingegangen|verworfen]
 *   - erfahrungen: applookups betroffene_entscheidung→entscheidungen, ursprungsvorhaben→vorhaben, fachlicher_pruefer→mitarbeitende, betroffene_anforderungen→anforderungen, risiken→risiken · lookups zusammenhang_belegt[massnahme_durchgefuehrt|ergebnis_beobachtet|zusammenhang_belegt], pruefstatus[entwurf|zur_pruefung|geprueft|erneute_pruefung], freigabestatus[entwurf|zur_pruefung|freigegeben|eingeschraenkt|abgelehnt|veraltet|erneute_pruefung]
 *   - ergebnisdokumente: applookups vorhaben→vorhaben, freigeber→mitarbeitende, vorgaengerversion→ergebnisdokumente · lookups dokumenttyp[anfrageuebersicht|anforderungsuebersicht|klaerungsstand|freigabevorlage|finales_ergebnis], pruefstatus[nicht_geprueft|bestanden|mit_warnungen|fehlgeschlagen], freigabestatus[nicht_freigabefaehig|pruefung_moeglich|ausstehend|freigegeben]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};

/**
 * A record of the KEY entity is TAKEN while a record of `entity` points at it
 * through `field` — a slot with a booking, a seat with a ticket. Generated
 * from the plan's blocking `unique` check on that reference (05.10.2026:
 * the salon's public page offered booked slots again). Pickers on both
 * doors leave taken records out (useRecordSearch); a public page reads only
 * `field` of `entity` — never who booked. Generator-owned: no markers.
 */
export interface TakenRule {
  entity: EntityKey;
  field: string;
}

export const TAKEN_BY: Partial<Record<EntityKey, TakenRule>> = {
};
