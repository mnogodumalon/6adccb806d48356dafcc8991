/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - mitarbeitende: vorname (Vorname), nachname (Nachname), email (E-Mail), rolle (Rolle)
 *   - vorhaben: vorhaben_nummer (Vorhaben-Nummer), titel (Titel), anfragebeschreibung (Beschreibung der Anfrage), kunde (Kunde), eingangsdatum (Eingangsdatum), anfragequelle (Anfragequelle), aufklaerungsverantwortlicher (Aufklärungsverantwortlicher), aufklaerungsstatus (Aufklärungsstatus), vertraulichkeit (Vertraulichkeitsstufe)
 *   - quellen: vorhaben (Vorhaben), titel (Titel), quellentyp (Quellentyp), erfassungszeitpunkt (Eingangs- bzw. Erfassungszeitpunkt), vertraulichkeit (Vertraulichkeitsstufe)
 *   - anforderungen: vorhaben (Vorhaben), titel (Titel), beschreibung (Beschreibung), kategorie (Kategorie), anforderungsart (Anforderungsart), verbindlichkeit (Verbindlichkeit), kritikalitaet (Kritikalität), status (Status)
 *   - klaerungspunkte: vorhaben (Vorhaben), fragestellung (Fragestellung), anlass (Anlass), kritikalitaet (Kritikalität), verantwortlicher (Verantwortlicher), status (Status)
 *   - risiken: vorhaben (Vorhaben), titel (Titel), beschreibung (Beschreibung), wahrscheinlichkeit (Eintrittswahrscheinlichkeit), auswirkung (Auswirkung), risikoklasse (Berechnete Risikoklasse), status (Status)
 *   - aufgaben: vorhaben (Vorhaben), titel (Titel), zweck (Zweck und Beschreibung), aufgabentyp (Aufgabentyp), verantwortlicher (Verantwortlicher), status (Status)
 *   - entscheidungen: vorhaben (Vorhaben), fragestellung (Fragestellung), entscheidung (Entscheidung), begruendung (Begründung), grundlagen (Zugrunde liegende Informationen), entscheider (Entscheider), entscheidungszeitpunkt (Entscheidungszeitpunkt), status (Status)
 *   - kommunikation: vorhaben (Vorhaben), kanal (Kanal), betreff (Betreff), inhalt (Inhalt), absender (Absender), status (Status)
 *   - erfahrungen: titel (Titel), ursprungsvorhaben (Ursprungsvorhaben), ausgangssituation (Ausgangssituation), problem (Beobachtetes Problem oder Ereignis), belege (Belege), ergebnis (Beobachtetes Ergebnis), erkenntnis (Übertragbare Erkenntnis), gueltigkeitsbedingungen (Gültigkeitsbedingungen), grenzen (Grenzen der Übertragbarkeit), pruefstatus (Prüfstatus), freigabestatus (Freigabestatus)
 *   - ergebnisdokumente: vorhaben (Vorhaben), dokumenttyp (Dokumenttyp), version (Version), erstellungszeitpunkt (Erstellungszeitpunkt), datenstand (Referenzierter Datenstand), inhalt (Inhalt), pruefstatus (Prüfstatus), freigabestatus (Freigabestatus)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "mitarbeitende": "vorname" | "nachname" | "email" | "telefon" | "abteilung" | "rolle" | "aktiv";
  "vorhaben": "vorhaben_nummer" | "titel" | "anfragebeschreibung" | "kunde" | "eingangsdatum" | "anfragequelle" | "aufklaerungsverantwortlicher" | "aufklaerungsstatus" | "vertraulichkeit" | "qualitaetsstatus" | "freigabestatus" | "kundenkontakt" | "produkt" | "kundenreferenz" | "zieltermin_intern" | "wunschtermin" | "technischer_hauptverantwortlicher" | "prioritaet" | "erp_crm_referenz";
  "quellen": "vorhaben" | "titel" | "quellentyp" | "externe_referenz" | "erfassungszeitpunkt" | "vertraulichkeit" | "urheber" | "dokumentdatum" | "version" | "extrahierter_inhalt" | "extraktionsstatus" | "pruefstatus" | "inhaltshash";
  "anforderungen": "vorhaben" | "titel" | "beschreibung" | "kategorie" | "anforderungsart" | "verbindlichkeit" | "kritikalitaet" | "status" | "quelle" | "fachliche_grundlage" | "quellenstelle" | "pruefer" | "akzeptanzkriterium" | "nachweisverfahren" | "fachliche_bewertung" | "bestaetiger" | "bestaetigungszeitpunkt" | "version" | "aenderungsgrund";
  "klaerungspunkte": "vorhaben" | "fragestellung" | "anlass" | "kritikalitaet" | "verantwortlicher" | "status" | "betroffene_anforderungen" | "betroffene_quellen" | "adressat" | "faelligkeit" | "vorgeschlagene_antwort" | "bestaetigte_antwort" | "antwortquelle" | "fachlicher_pruefer";
  "risiken": "vorhaben" | "titel" | "beschreibung" | "wahrscheinlichkeit" | "auswirkung" | "risikoklasse" | "status" | "ursache" | "betroffene_anforderungen" | "belege" | "massnahmen" | "massnahmenverantwortlicher" | "faelligkeit" | "restrisiko" | "freigabe_erforderlich";
  "aufgaben": "abhaengigkeiten" | "vorhaben" | "titel" | "zweck" | "aufgabentyp" | "verantwortlicher" | "status" | "anforderung" | "klaerungspunkt" | "unterstuetzende_personen" | "faelligkeit" | "erwartetes_ergebnis" | "akzeptanzkriterien" | "pruefer" | "ergebnisreferenz" | "abschlusszeitpunkt";
  "entscheidungen": "beruecksichtigte_erfahrungen" | "ersetzte_entscheidung" | "vorhaben" | "fragestellung" | "entscheidung" | "begruendung" | "grundlagen" | "entscheider" | "entscheidungszeitpunkt" | "status" | "optionen" | "annahmen" | "risiken_text" | "gueltigkeitsbedingungen" | "freigabe_erforderlich" | "version";
  "kommunikation": "aufgabe" | "vorhaben" | "kanal" | "betreff" | "inhalt" | "absender" | "status" | "empfaenger" | "klaerungspunkt" | "anforderung" | "zeitpunkt" | "bestaetigung" | "freigegeben_von" | "quellenreferenz";
  "erfahrungen": "betroffene_entscheidung" | "titel" | "ursprungsvorhaben" | "ausgangssituation" | "problem" | "belege" | "massnahme" | "ergebnis" | "erkenntnis" | "gueltigkeitsbedingungen" | "grenzen" | "zusammenhang_belegt" | "pruefstatus" | "freigabestatus" | "fachlicher_pruefer" | "betroffene_anforderungen" | "risiken" | "technische_loesungen" | "alternative_erklaerungen" | "wirkungsmessung" | "version" | "naechster_pruefttermin";
  "ergebnisdokumente": "vorhaben" | "dokumenttyp" | "version" | "erstellungszeitpunkt" | "datenstand" | "inhalt" | "pruefstatus" | "freigabestatus" | "freigeber" | "freigabezeitpunkt" | "aenderungszusammenfassung" | "vorgaengerversion";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
