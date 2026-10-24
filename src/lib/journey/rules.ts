/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'mitarbeitende' | 'vorhaben' | 'quellen' | 'anforderungen' | 'klaerungspunkte' | 'risiken' | 'aufgaben' | 'entscheidungen' | 'kommunikation' | 'erfahrungen' | 'ergebnisdokumente';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "mitarbeitende": "vorname" | "nachname" | "email" | "telefon" | "abteilung";
  "vorhaben": "vorhaben_nummer" | "titel" | "anfragebeschreibung" | "kunde" | "kundenkontakt" | "produkt" | "kundenreferenz" | "erp_crm_referenz";
  "quellen": "titel" | "externe_referenz" | "urheber" | "version" | "extrahierter_inhalt" | "inhaltshash";
  "anforderungen": "titel" | "beschreibung" | "fachliche_grundlage" | "quellenstelle" | "akzeptanzkriterium" | "nachweisverfahren" | "fachliche_bewertung" | "aenderungsgrund";
  "klaerungspunkte": "fragestellung" | "adressat" | "vorgeschlagene_antwort" | "bestaetigte_antwort";
  "risiken": "titel" | "beschreibung" | "ursache" | "belege" | "massnahmen" | "restrisiko";
  "aufgaben": "titel" | "zweck" | "erwartetes_ergebnis" | "akzeptanzkriterien" | "ergebnisreferenz";
  "entscheidungen": "fragestellung" | "entscheidung" | "begruendung" | "grundlagen" | "optionen" | "annahmen" | "risiken_text" | "gueltigkeitsbedingungen";
  "kommunikation": "betreff" | "inhalt" | "empfaenger";
  "erfahrungen": "titel" | "ausgangssituation" | "problem" | "belege" | "massnahme" | "ergebnis" | "erkenntnis" | "gueltigkeitsbedingungen" | "grenzen" | "technische_loesungen" | "alternative_erklaerungen" | "wirkungsmessung";
  "ergebnisdokumente": "datenstand" | "inhalt" | "aenderungszusammenfassung";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "mitarbeitende": never;
  "vorhaben": "aufklaerungsverantwortlicher" | "technischer_hauptverantwortlicher";
  "quellen": "vorhaben";
  "anforderungen": "vorhaben" | "quelle" | "pruefer" | "bestaetiger";
  "klaerungspunkte": "vorhaben" | "verantwortlicher" | "betroffene_anforderungen" | "betroffene_quellen" | "antwortquelle" | "fachlicher_pruefer";
  "risiken": "vorhaben" | "betroffene_anforderungen" | "massnahmenverantwortlicher";
  "aufgaben": "abhaengigkeiten" | "vorhaben" | "verantwortlicher" | "anforderung" | "klaerungspunkt" | "unterstuetzende_personen" | "pruefer";
  "entscheidungen": "beruecksichtigte_erfahrungen" | "ersetzte_entscheidung" | "vorhaben" | "entscheider";
  "kommunikation": "aufgabe" | "vorhaben" | "absender" | "klaerungspunkt" | "anforderung" | "freigegeben_von" | "quellenreferenz";
  "erfahrungen": "betroffene_entscheidung" | "ursprungsvorhaben" | "fachlicher_pruefer" | "betroffene_anforderungen" | "risiken";
  "ergebnisdokumente": "vorhaben" | "freigeber" | "vorgaengerversion";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it as a value. `file` is false: a file is UPLOADED
   *  (`form.file(key)` → FileField; the chosen file travels in the create as a data URL). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "mitarbeitende": {
    "key": "mitarbeitende",
    "appId": "6adccb2d518aead15b3938ca",
    "label": "Mitarbeitende",
    "pascal": "Mitarbeitende",
    "single": "MitarbeitendeEntry"
  },
  "vorhaben": {
    "key": "vorhaben",
    "appId": "6adccb337ceff3eec927d51d",
    "label": "Vorhaben",
    "pascal": "Vorhaben",
    "single": "VorhabenEntry"
  },
  "quellen": {
    "key": "quellen",
    "appId": "6adccb34eda35634931398e3",
    "label": "Quellen",
    "pascal": "Quellen",
    "single": "QuellenEntry"
  },
  "anforderungen": {
    "key": "anforderungen",
    "appId": "6adccb35511e589e32e678a8",
    "label": "Anforderungen",
    "pascal": "Anforderungen",
    "single": "AnforderungenEntry"
  },
  "klaerungspunkte": {
    "key": "klaerungspunkte",
    "appId": "6adccb377fa20e855914fa79",
    "label": "Klärungspunkte",
    "pascal": "Klaerungspunkte",
    "single": "KlaerungspunkteEntry"
  },
  "risiken": {
    "key": "risiken",
    "appId": "6adccb381e4fb4fe6b36b8c5",
    "label": "Risiken",
    "pascal": "Risiken",
    "single": "RisikenEntry"
  },
  "aufgaben": {
    "key": "aufgaben",
    "appId": "6adccb396d199d5f960fccf2",
    "label": "Aufgaben",
    "pascal": "Aufgaben",
    "single": "AufgabenEntry"
  },
  "entscheidungen": {
    "key": "entscheidungen",
    "appId": "6adccb3af5d3ceb03274e853",
    "label": "Entscheidungen",
    "pascal": "Entscheidungen",
    "single": "EntscheidungenEntry"
  },
  "kommunikation": {
    "key": "kommunikation",
    "appId": "6adccb3bbd4a5ebd71b2f859",
    "label": "Kommunikation",
    "pascal": "Kommunikation",
    "single": "KommunikationEntry"
  },
  "erfahrungen": {
    "key": "erfahrungen",
    "appId": "6adccb3c5d4b66bb46ddf893",
    "label": "Erfahrungen",
    "pascal": "Erfahrungen",
    "single": "ErfahrungenEntry"
  },
  "ergebnisdokumente": {
    "key": "ergebnisdokumente",
    "appId": "6adccb3db545fbfd7f92b801",
    "label": "Ergebnisdokumente",
    "pascal": "Ergebnisdokumente",
    "single": "ErgebnisdokumenteEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "mitarbeitende": {
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": true,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "abteilung": {
      "key": "abteilung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Abteilung",
      "writable": true,
      "maxLength": 4000
    },
    "rolle": {
      "key": "rolle",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Rolle",
      "writable": true,
      "options": [
        "aufklaerungsverantwortlicher",
        "fachpruefer",
        "freigeber",
        "mitarbeiter",
        "administrator"
      ]
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "vorhaben": {
    "vorhaben_nummer": {
      "key": "vorhaben_nummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorhaben-Nummer",
      "writable": true,
      "maxLength": 4000
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "anfragebeschreibung": {
      "key": "anfragebeschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beschreibung der Anfrage",
      "writable": true
    },
    "kunde": {
      "key": "kunde",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Kunde",
      "writable": true,
      "maxLength": 4000
    },
    "eingangsdatum": {
      "key": "eingangsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Eingangsdatum",
      "writable": true
    },
    "anfragequelle": {
      "key": "anfragequelle",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Anfragequelle",
      "writable": true,
      "options": [
        "email",
        "telefon",
        "portal",
        "vertrieb",
        "persoenlich",
        "sonstige"
      ]
    },
    "aufklaerungsverantwortlicher": {
      "key": "aufklaerungsverantwortlicher",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Aufklärungsverantwortlicher",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "aufklaerungsstatus": {
      "key": "aufklaerungsstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Aufklärungsstatus",
      "writable": true,
      "options": [
        "neu",
        "in_triage",
        "in_aufklaerung",
        "wartet",
        "in_pruefung",
        "freigabe_ausstehend",
        "freigegeben",
        "abgeschlossen",
        "zurueckgestellt",
        "abgebrochen"
      ]
    },
    "vertraulichkeit": {
      "key": "vertraulichkeit",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Vertraulichkeitsstufe",
      "writable": true,
      "options": [
        "oeffentlich",
        "intern",
        "vertraulich",
        "streng_vertraulich"
      ]
    },
    "qualitaetsstatus": {
      "key": "qualitaetsstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Qualitätsstatus",
      "writable": true,
      "options": [
        "nicht_geprueft",
        "bestanden",
        "mit_warnungen",
        "fehlgeschlagen"
      ]
    },
    "freigabestatus": {
      "key": "freigabestatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Freigabestatus",
      "writable": true,
      "options": [
        "nicht_freigabefaehig",
        "pruefung_moeglich",
        "ausstehend",
        "freigegeben"
      ]
    },
    "kundenkontakt": {
      "key": "kundenkontakt",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Kundenkontakt",
      "writable": true,
      "maxLength": 4000
    },
    "produkt": {
      "key": "produkt",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Produkt oder Produktgruppe",
      "writable": true,
      "maxLength": 4000
    },
    "kundenreferenz": {
      "key": "kundenreferenz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Kundenreferenz",
      "writable": true,
      "maxLength": 4000
    },
    "zieltermin_intern": {
      "key": "zieltermin_intern",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Interner Zieltermin",
      "writable": true
    },
    "wunschtermin": {
      "key": "wunschtermin",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gewünschter Liefer- oder Antworttermin",
      "writable": true
    },
    "technischer_hauptverantwortlicher": {
      "key": "technischer_hauptverantwortlicher",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Technischer Hauptverantwortlicher",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "prioritaet": {
      "key": "prioritaet",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Priorität",
      "writable": true,
      "options": [
        "niedrig",
        "normal",
        "hoch",
        "dringend"
      ]
    },
    "erp_crm_referenz": {
      "key": "erp_crm_referenz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Interne ERP- oder CRM-Referenz",
      "writable": true,
      "maxLength": 4000
    }
  },
  "quellen": {
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6adccb337ceff3eec927d51d",
      "targetEntity": "vorhaben"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "quellentyp": {
      "key": "quellentyp",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Quellentyp",
      "writable": true,
      "options": [
        "dokument",
        "email",
        "gespraechsnotiz",
        "datensatz",
        "sonstiges"
      ]
    },
    "datei": {
      "key": "datei",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Originaldatei",
      "writable": false
    },
    "externe_referenz": {
      "key": "externe_referenz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Eindeutige externe Referenz",
      "writable": true,
      "maxLength": 4000
    },
    "erfassungszeitpunkt": {
      "key": "erfassungszeitpunkt",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Eingangs- bzw. Erfassungszeitpunkt",
      "writable": true
    },
    "vertraulichkeit": {
      "key": "vertraulichkeit",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Vertraulichkeitsstufe",
      "writable": true,
      "options": [
        "oeffentlich",
        "intern",
        "vertraulich",
        "streng_vertraulich"
      ]
    },
    "urheber": {
      "key": "urheber",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Urheber oder Absender",
      "writable": true,
      "maxLength": 4000
    },
    "dokumentdatum": {
      "key": "dokumentdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Dokumentdatum",
      "writable": true
    },
    "version": {
      "key": "version",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Version",
      "writable": true,
      "maxLength": 4000
    },
    "extrahierter_inhalt": {
      "key": "extrahierter_inhalt",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Extrahierter Inhalt",
      "writable": true
    },
    "extraktionsstatus": {
      "key": "extraktionsstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Extraktionsstatus",
      "writable": true,
      "options": [
        "nicht_extrahiert",
        "in_arbeit",
        "extrahiert",
        "fehlgeschlagen"
      ]
    },
    "pruefstatus": {
      "key": "pruefstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Prüfstatus",
      "writable": true,
      "options": [
        "ungeprueft",
        "geprueft",
        "beanstandet"
      ]
    },
    "inhaltshash": {
      "key": "inhaltshash",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Inhaltshash",
      "writable": true,
      "maxLength": 4000
    }
  },
  "anforderungen": {
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6adccb337ceff3eec927d51d",
      "targetEntity": "vorhaben"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beschreibung",
      "writable": true
    },
    "kategorie": {
      "key": "kategorie",
      "fulltype": "lookup/choice",
      "kind": "lookup",
      "required": true,
      "label": "Kategorie",
      "writable": true,
      "options": [
        "funktion",
        "leistung",
        "schnittstellen",
        "mechanik",
        "elektrik",
        "software",
        "materialien",
        "umweltbedingungen",
        "sicherheit",
        "normen",
        "qualitaet",
        "wartung",
        "dokumentation",
        "lieferumfang",
        "termine",
        "wirtschaftlichkeit"
      ]
    },
    "anforderungsart": {
      "key": "anforderungsart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Anforderungsart",
      "writable": true,
      "options": [
        "muss",
        "soll",
        "optional",
        "randbedingung",
        "abnahmekriterium"
      ]
    },
    "verbindlichkeit": {
      "key": "verbindlichkeit",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Verbindlichkeit",
      "writable": true,
      "options": [
        "verbindlich",
        "wuenschenswert",
        "unverbindlich"
      ]
    },
    "kritikalitaet": {
      "key": "kritikalitaet",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Kritikalität",
      "writable": true,
      "options": [
        "niedrig",
        "mittel",
        "hoch",
        "kritisch"
      ]
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "vorgeschlagen",
        "in_pruefung",
        "rueckfrage",
        "bestaetigt",
        "abgelehnt",
        "ersetzt",
        "nicht_anwendbar"
      ]
    },
    "quelle": {
      "key": "quelle",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Quelle",
      "writable": true,
      "targetAppId": "6adccb34eda35634931398e3",
      "targetEntity": "quellen"
    },
    "fachliche_grundlage": {
      "key": "fachliche_grundlage",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Dokumentierte fachliche Grundlage",
      "writable": true
    },
    "quellenstelle": {
      "key": "quellenstelle",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Quellenstelle",
      "writable": true,
      "maxLength": 4000
    },
    "pruefer": {
      "key": "pruefer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Verantwortlicher Prüfer",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "akzeptanzkriterium": {
      "key": "akzeptanzkriterium",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Akzeptanzkriterium",
      "writable": true
    },
    "nachweisverfahren": {
      "key": "nachweisverfahren",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Nachweisverfahren",
      "writable": true
    },
    "fachliche_bewertung": {
      "key": "fachliche_bewertung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Fachliche Bewertung",
      "writable": true
    },
    "bestaetiger": {
      "key": "bestaetiger",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Bestätiger",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "bestaetigungszeitpunkt": {
      "key": "bestaetigungszeitpunkt",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Bestätigungszeitpunkt",
      "writable": true
    },
    "version": {
      "key": "version",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Version",
      "writable": true
    },
    "aenderungsgrund": {
      "key": "aenderungsgrund",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Änderungsgrund",
      "writable": true
    }
  },
  "klaerungspunkte": {
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6adccb337ceff3eec927d51d",
      "targetEntity": "vorhaben"
    },
    "fragestellung": {
      "key": "fragestellung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Fragestellung",
      "writable": true
    },
    "anlass": {
      "key": "anlass",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Anlass",
      "writable": true,
      "options": [
        "informationsluecke",
        "widerspruch",
        "offene_frage",
        "fehlender_nachweis",
        "machbarkeit"
      ]
    },
    "kritikalitaet": {
      "key": "kritikalitaet",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Kritikalität",
      "writable": true,
      "options": [
        "niedrig",
        "mittel",
        "hoch",
        "kritisch"
      ]
    },
    "verantwortlicher": {
      "key": "verantwortlicher",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Verantwortlicher",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "offen",
        "in_bearbeitung",
        "rueckfrage_vorbereitet",
        "rueckfrage_versendet",
        "antwort_eingegangen",
        "fachliche_pruefung",
        "geklaert",
        "nicht_relevant"
      ]
    },
    "betroffene_anforderungen": {
      "key": "betroffene_anforderungen",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Betroffene Anforderungen",
      "writable": true,
      "targetAppId": "6adccb35511e589e32e678a8",
      "targetEntity": "anforderungen"
    },
    "betroffene_quellen": {
      "key": "betroffene_quellen",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Betroffene Quellen",
      "writable": true,
      "targetAppId": "6adccb34eda35634931398e3",
      "targetEntity": "quellen"
    },
    "adressat": {
      "key": "adressat",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Adressat",
      "writable": true,
      "maxLength": 4000
    },
    "faelligkeit": {
      "key": "faelligkeit",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Fälligkeit",
      "writable": true
    },
    "vorgeschlagene_antwort": {
      "key": "vorgeschlagene_antwort",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Vorgeschlagene Antwort",
      "writable": true
    },
    "bestaetigte_antwort": {
      "key": "bestaetigte_antwort",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bestätigte Antwort",
      "writable": true
    },
    "antwortquelle": {
      "key": "antwortquelle",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Antwortquelle",
      "writable": true,
      "targetAppId": "6adccb34eda35634931398e3",
      "targetEntity": "quellen"
    },
    "fachlicher_pruefer": {
      "key": "fachlicher_pruefer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Fachlicher Prüfer",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    }
  },
  "risiken": {
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6adccb337ceff3eec927d51d",
      "targetEntity": "vorhaben"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beschreibung",
      "writable": true
    },
    "wahrscheinlichkeit": {
      "key": "wahrscheinlichkeit",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Eintrittswahrscheinlichkeit",
      "writable": true,
      "options": [
        "selten",
        "moeglich",
        "wahrscheinlich",
        "sehr_wahrscheinlich"
      ]
    },
    "auswirkung": {
      "key": "auswirkung",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Auswirkung",
      "writable": true,
      "options": [
        "gering",
        "mittel",
        "hoch",
        "schwerwiegend"
      ]
    },
    "risikoklasse": {
      "key": "risikoklasse",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Berechnete Risikoklasse",
      "writable": true,
      "options": [
        "niedrig",
        "mittel",
        "hoch",
        "kritisch"
      ]
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "identifiziert",
        "in_bewertung",
        "massnahme_geplant",
        "behandelt",
        "akzeptiert",
        "geschlossen"
      ]
    },
    "ursache": {
      "key": "ursache",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Ursache",
      "writable": true
    },
    "betroffene_anforderungen": {
      "key": "betroffene_anforderungen",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Betroffene Anforderungen",
      "writable": true,
      "targetAppId": "6adccb35511e589e32e678a8",
      "targetEntity": "anforderungen"
    },
    "belege": {
      "key": "belege",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Belege",
      "writable": true
    },
    "massnahmen": {
      "key": "massnahmen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Maßnahmen",
      "writable": true
    },
    "massnahmenverantwortlicher": {
      "key": "massnahmenverantwortlicher",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Maßnahmenverantwortlicher",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "faelligkeit": {
      "key": "faelligkeit",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Fälligkeit",
      "writable": true
    },
    "restrisiko": {
      "key": "restrisiko",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Restrisiko",
      "writable": true
    },
    "freigabe_erforderlich": {
      "key": "freigabe_erforderlich",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Freigabe erforderlich",
      "writable": true
    }
  },
  "aufgaben": {
    "abhaengigkeiten": {
      "key": "abhaengigkeiten",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Abhängigkeiten",
      "writable": true,
      "targetAppId": "6adccb396d199d5f960fccf2",
      "targetEntity": "aufgaben"
    },
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6adccb337ceff3eec927d51d",
      "targetEntity": "vorhaben"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "zweck": {
      "key": "zweck",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Zweck und Beschreibung",
      "writable": true
    },
    "aufgabentyp": {
      "key": "aufgabentyp",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Aufgabentyp",
      "writable": true,
      "options": [
        "klaerung",
        "bewertung",
        "nachweis",
        "rueckfrage",
        "pruefung",
        "sonstiges"
      ]
    },
    "verantwortlicher": {
      "key": "verantwortlicher",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Verantwortlicher",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "geplant",
        "bereit",
        "in_bearbeitung",
        "wartet_information",
        "wartet_aufgabe",
        "zur_pruefung",
        "korrektur",
        "erledigt",
        "abgebrochen"
      ]
    },
    "anforderung": {
      "key": "anforderung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zugehörige Anforderung",
      "writable": true,
      "targetAppId": "6adccb35511e589e32e678a8",
      "targetEntity": "anforderungen"
    },
    "klaerungspunkt": {
      "key": "klaerungspunkt",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zugehöriger Klärungspunkt",
      "writable": true,
      "targetAppId": "6adccb377fa20e855914fa79",
      "targetEntity": "klaerungspunkte"
    },
    "unterstuetzende_personen": {
      "key": "unterstuetzende_personen",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Unterstützende Personen",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "faelligkeit": {
      "key": "faelligkeit",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Fälligkeit",
      "writable": true
    },
    "erwartetes_ergebnis": {
      "key": "erwartetes_ergebnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Erwartetes Ergebnis",
      "writable": true
    },
    "akzeptanzkriterien": {
      "key": "akzeptanzkriterien",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Akzeptanzkriterien",
      "writable": true
    },
    "pruefer": {
      "key": "pruefer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Prüfer",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "ergebnisreferenz": {
      "key": "ergebnisreferenz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ergebnisreferenz",
      "writable": true,
      "maxLength": 4000
    },
    "abschlusszeitpunkt": {
      "key": "abschlusszeitpunkt",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Abschlusszeitpunkt",
      "writable": true
    }
  },
  "entscheidungen": {
    "beruecksichtigte_erfahrungen": {
      "key": "beruecksichtigte_erfahrungen",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Berücksichtigte Erfahrungen",
      "writable": true,
      "targetAppId": "6adccb3c5d4b66bb46ddf893",
      "targetEntity": "erfahrungen"
    },
    "ersetzte_entscheidung": {
      "key": "ersetzte_entscheidung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Ersetzte Entscheidung",
      "writable": true,
      "targetAppId": "6adccb3af5d3ceb03274e853",
      "targetEntity": "entscheidungen"
    },
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6adccb337ceff3eec927d51d",
      "targetEntity": "vorhaben"
    },
    "fragestellung": {
      "key": "fragestellung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Fragestellung",
      "writable": true
    },
    "entscheidung": {
      "key": "entscheidung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Entscheidung",
      "writable": true
    },
    "begruendung": {
      "key": "begruendung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Begründung",
      "writable": true
    },
    "grundlagen": {
      "key": "grundlagen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Zugrunde liegende Informationen",
      "writable": true
    },
    "entscheider": {
      "key": "entscheider",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Entscheider",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "entscheidungszeitpunkt": {
      "key": "entscheidungszeitpunkt",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Entscheidungszeitpunkt",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "empfehlung",
        "getroffen",
        "freigegeben",
        "ersetzt"
      ]
    },
    "optionen": {
      "key": "optionen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Optionen",
      "writable": true
    },
    "annahmen": {
      "key": "annahmen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Annahmen",
      "writable": true
    },
    "risiken_text": {
      "key": "risiken_text",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Risiken",
      "writable": true
    },
    "gueltigkeitsbedingungen": {
      "key": "gueltigkeitsbedingungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Gültigkeitsbedingungen",
      "writable": true
    },
    "freigabe_erforderlich": {
      "key": "freigabe_erforderlich",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Freigabe erforderlich",
      "writable": true
    },
    "version": {
      "key": "version",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Version",
      "writable": true
    }
  },
  "kommunikation": {
    "aufgabe": {
      "key": "aufgabe",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zugehörige Aufgabe",
      "writable": true,
      "targetAppId": "6adccb396d199d5f960fccf2",
      "targetEntity": "aufgaben"
    },
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6adccb337ceff3eec927d51d",
      "targetEntity": "vorhaben"
    },
    "kanal": {
      "key": "kanal",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Kanal",
      "writable": true,
      "options": [
        "interne_notiz",
        "interne_abstimmung",
        "ki_vorschlag",
        "externe_nachricht"
      ]
    },
    "betreff": {
      "key": "betreff",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Betreff",
      "writable": true,
      "maxLength": 4000
    },
    "inhalt": {
      "key": "inhalt",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Inhalt",
      "writable": true
    },
    "absender": {
      "key": "absender",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Absender",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "entwurf",
        "zur_freigabe",
        "freigegeben",
        "versendet",
        "eingegangen",
        "verworfen"
      ]
    },
    "empfaenger": {
      "key": "empfaenger",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Empfänger",
      "writable": true,
      "maxLength": 4000
    },
    "klaerungspunkt": {
      "key": "klaerungspunkt",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zugehöriger Klärungspunkt",
      "writable": true,
      "targetAppId": "6adccb377fa20e855914fa79",
      "targetEntity": "klaerungspunkte"
    },
    "anforderung": {
      "key": "anforderung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zugehörige Anforderung",
      "writable": true,
      "targetAppId": "6adccb35511e589e32e678a8",
      "targetEntity": "anforderungen"
    },
    "zeitpunkt": {
      "key": "zeitpunkt",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Versand- bzw. Eingangszeitpunkt",
      "writable": true
    },
    "bestaetigung": {
      "key": "bestaetigung",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Empfang bestätigt",
      "writable": true
    },
    "freigegeben_von": {
      "key": "freigegeben_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Freigegeben von",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "quellenreferenz": {
      "key": "quellenreferenz",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Quellenreferenz",
      "writable": true,
      "targetAppId": "6adccb34eda35634931398e3",
      "targetEntity": "quellen"
    }
  },
  "erfahrungen": {
    "betroffene_entscheidung": {
      "key": "betroffene_entscheidung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Betroffene Entscheidung",
      "writable": true,
      "targetAppId": "6adccb3af5d3ceb03274e853",
      "targetEntity": "entscheidungen"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "ursprungsvorhaben": {
      "key": "ursprungsvorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Ursprungsvorhaben",
      "writable": true,
      "targetAppId": "6adccb337ceff3eec927d51d",
      "targetEntity": "vorhaben"
    },
    "ausgangssituation": {
      "key": "ausgangssituation",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Ausgangssituation",
      "writable": true
    },
    "problem": {
      "key": "problem",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beobachtetes Problem oder Ereignis",
      "writable": true
    },
    "belege": {
      "key": "belege",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Belege",
      "writable": true
    },
    "massnahme": {
      "key": "massnahme",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Durchgeführte Maßnahme",
      "writable": true
    },
    "ergebnis": {
      "key": "ergebnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beobachtetes Ergebnis",
      "writable": true
    },
    "erkenntnis": {
      "key": "erkenntnis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Übertragbare Erkenntnis",
      "writable": true
    },
    "gueltigkeitsbedingungen": {
      "key": "gueltigkeitsbedingungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Gültigkeitsbedingungen",
      "writable": true
    },
    "grenzen": {
      "key": "grenzen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Grenzen der Übertragbarkeit",
      "writable": true
    },
    "zusammenhang_belegt": {
      "key": "zusammenhang_belegt",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Zusammenhang zwischen Maßnahme und Ergebnis",
      "writable": true,
      "options": [
        "massnahme_durchgefuehrt",
        "ergebnis_beobachtet",
        "zusammenhang_belegt"
      ]
    },
    "pruefstatus": {
      "key": "pruefstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Prüfstatus",
      "writable": true,
      "options": [
        "entwurf",
        "zur_pruefung",
        "geprueft",
        "erneute_pruefung"
      ]
    },
    "freigabestatus": {
      "key": "freigabestatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Freigabestatus",
      "writable": true,
      "options": [
        "entwurf",
        "zur_pruefung",
        "freigegeben",
        "eingeschraenkt",
        "abgelehnt",
        "veraltet",
        "erneute_pruefung"
      ]
    },
    "fachlicher_pruefer": {
      "key": "fachlicher_pruefer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Fachlicher Prüfer",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "betroffene_anforderungen": {
      "key": "betroffene_anforderungen",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Betroffene Anforderungen",
      "writable": true,
      "targetAppId": "6adccb35511e589e32e678a8",
      "targetEntity": "anforderungen"
    },
    "risiken": {
      "key": "risiken",
      "fulltype": "multipleapplookup/select",
      "kind": "multirecord",
      "required": false,
      "label": "Risiken",
      "writable": true,
      "targetAppId": "6adccb381e4fb4fe6b36b8c5",
      "targetEntity": "risiken"
    },
    "technische_loesungen": {
      "key": "technische_loesungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Technische Lösungen",
      "writable": true
    },
    "alternative_erklaerungen": {
      "key": "alternative_erklaerungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Alternative Erklärungen",
      "writable": true
    },
    "wirkungsmessung": {
      "key": "wirkungsmessung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Wirkungsmessung",
      "writable": true
    },
    "version": {
      "key": "version",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Version",
      "writable": true
    },
    "naechster_pruefttermin": {
      "key": "naechster_pruefttermin",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Nächster Prüftermin",
      "writable": true
    }
  },
  "ergebnisdokumente": {
    "vorhaben": {
      "key": "vorhaben",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorhaben",
      "writable": true,
      "targetAppId": "6adccb337ceff3eec927d51d",
      "targetEntity": "vorhaben"
    },
    "dokumenttyp": {
      "key": "dokumenttyp",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Dokumenttyp",
      "writable": true,
      "options": [
        "anfrageuebersicht",
        "anforderungsuebersicht",
        "klaerungsstand",
        "freigabevorlage",
        "finales_ergebnis"
      ]
    },
    "version": {
      "key": "version",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Version",
      "writable": true
    },
    "erstellungszeitpunkt": {
      "key": "erstellungszeitpunkt",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Erstellungszeitpunkt",
      "writable": true
    },
    "datenstand": {
      "key": "datenstand",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Referenzierter Datenstand",
      "writable": true,
      "maxLength": 4000
    },
    "inhalt": {
      "key": "inhalt",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Inhalt",
      "writable": true
    },
    "pruefstatus": {
      "key": "pruefstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Prüfstatus",
      "writable": true,
      "options": [
        "nicht_geprueft",
        "bestanden",
        "mit_warnungen",
        "fehlgeschlagen"
      ]
    },
    "freigabestatus": {
      "key": "freigabestatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Freigabestatus",
      "writable": true,
      "options": [
        "nicht_freigabefaehig",
        "pruefung_moeglich",
        "ausstehend",
        "freigegeben"
      ]
    },
    "pdf_datei": {
      "key": "pdf_datei",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "PDF-Datei",
      "writable": false
    },
    "freigeber": {
      "key": "freigeber",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Freigeber",
      "writable": true,
      "targetAppId": "6adccb2d518aead15b3938ca",
      "targetEntity": "mitarbeitende"
    },
    "freigabezeitpunkt": {
      "key": "freigabezeitpunkt",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Freigabezeitpunkt",
      "writable": true
    },
    "aenderungszusammenfassung": {
      "key": "aenderungszusammenfassung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Änderungszusammenfassung",
      "writable": true
    },
    "vorgaengerversion": {
      "key": "vorgaengerversion",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Vorgängerversion",
      "writable": true,
      "targetAppId": "6adccb3db545fbfd7f92b801",
      "targetEntity": "ergebnisdokumente"
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "mitarbeitende": [
    {
      "kind": "choice",
      "field": "rolle",
      "count": 5
    }
  ],
  "vorhaben": [
    {
      "kind": "choice",
      "field": "anfragequelle",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "vertraulichkeit",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "qualitaetsstatus",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "freigabestatus",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "prioritaet",
      "count": 4
    },
    {
      "kind": "record",
      "field": "aufklaerungsverantwortlicher",
      "targetEntity": "mitarbeitende"
    },
    {
      "kind": "record",
      "field": "technischer_hauptverantwortlicher",
      "targetEntity": "mitarbeitende"
    }
  ],
  "quellen": [
    {
      "kind": "choice",
      "field": "quellentyp",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "vertraulichkeit",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "extraktionsstatus",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "pruefstatus",
      "count": 3
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    }
  ],
  "anforderungen": [
    {
      "kind": "choice",
      "field": "anforderungsart",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "verbindlichkeit",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "kritikalitaet",
      "count": 4
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "quelle",
      "targetEntity": "quellen"
    },
    {
      "kind": "record",
      "field": "pruefer",
      "targetEntity": "mitarbeitende"
    },
    {
      "kind": "record",
      "field": "bestaetiger",
      "targetEntity": "mitarbeitende"
    }
  ],
  "klaerungspunkte": [
    {
      "kind": "choice",
      "field": "anlass",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "kritikalitaet",
      "count": 4
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "verantwortlicher",
      "targetEntity": "mitarbeitende"
    },
    {
      "kind": "record",
      "field": "betroffene_anforderungen",
      "targetEntity": "anforderungen"
    },
    {
      "kind": "record",
      "field": "betroffene_quellen",
      "targetEntity": "quellen"
    },
    {
      "kind": "record",
      "field": "antwortquelle",
      "targetEntity": "quellen"
    },
    {
      "kind": "record",
      "field": "fachlicher_pruefer",
      "targetEntity": "mitarbeitende"
    }
  ],
  "risiken": [
    {
      "kind": "choice",
      "field": "wahrscheinlichkeit",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "auswirkung",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "risikoklasse",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 6
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "betroffene_anforderungen",
      "targetEntity": "anforderungen"
    },
    {
      "kind": "record",
      "field": "massnahmenverantwortlicher",
      "targetEntity": "mitarbeitende"
    }
  ],
  "aufgaben": [
    {
      "kind": "choice",
      "field": "aufgabentyp",
      "count": 6
    },
    {
      "kind": "record",
      "field": "abhaengigkeiten",
      "targetEntity": "aufgaben"
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "verantwortlicher",
      "targetEntity": "mitarbeitende"
    },
    {
      "kind": "record",
      "field": "anforderung",
      "targetEntity": "anforderungen"
    },
    {
      "kind": "record",
      "field": "klaerungspunkt",
      "targetEntity": "klaerungspunkte"
    },
    {
      "kind": "record",
      "field": "unterstuetzende_personen",
      "targetEntity": "mitarbeitende"
    },
    {
      "kind": "record",
      "field": "pruefer",
      "targetEntity": "mitarbeitende"
    }
  ],
  "entscheidungen": [
    {
      "kind": "choice",
      "field": "status",
      "count": 4
    },
    {
      "kind": "record",
      "field": "beruecksichtigte_erfahrungen",
      "targetEntity": "erfahrungen"
    },
    {
      "kind": "record",
      "field": "ersetzte_entscheidung",
      "targetEntity": "entscheidungen"
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "entscheider",
      "targetEntity": "mitarbeitende"
    }
  ],
  "kommunikation": [
    {
      "kind": "choice",
      "field": "kanal",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 6
    },
    {
      "kind": "record",
      "field": "aufgabe",
      "targetEntity": "aufgaben"
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "absender",
      "targetEntity": "mitarbeitende"
    },
    {
      "kind": "record",
      "field": "klaerungspunkt",
      "targetEntity": "klaerungspunkte"
    },
    {
      "kind": "record",
      "field": "anforderung",
      "targetEntity": "anforderungen"
    },
    {
      "kind": "record",
      "field": "freigegeben_von",
      "targetEntity": "mitarbeitende"
    },
    {
      "kind": "record",
      "field": "quellenreferenz",
      "targetEntity": "quellen"
    }
  ],
  "erfahrungen": [
    {
      "kind": "choice",
      "field": "zusammenhang_belegt",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "pruefstatus",
      "count": 4
    },
    {
      "kind": "record",
      "field": "betroffene_entscheidung",
      "targetEntity": "entscheidungen"
    },
    {
      "kind": "record",
      "field": "ursprungsvorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "fachlicher_pruefer",
      "targetEntity": "mitarbeitende"
    },
    {
      "kind": "record",
      "field": "betroffene_anforderungen",
      "targetEntity": "anforderungen"
    },
    {
      "kind": "record",
      "field": "risiken",
      "targetEntity": "risiken"
    }
  ],
  "ergebnisdokumente": [
    {
      "kind": "choice",
      "field": "dokumenttyp",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "pruefstatus",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "freigabestatus",
      "count": 4
    },
    {
      "kind": "record",
      "field": "vorhaben",
      "targetEntity": "vorhaben"
    },
    {
      "kind": "record",
      "field": "freigeber",
      "targetEntity": "mitarbeitende"
    },
    {
      "kind": "record",
      "field": "vorgaengerversion",
      "targetEntity": "ergebnisdokumente"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "mitarbeitende": [
    "vorname",
    "nachname"
  ],
  "vorhaben": [
    "vorhaben_nummer"
  ],
  "quellen": [
    "titel"
  ],
  "anforderungen": [
    "titel"
  ],
  "klaerungspunkte": [
    "fragestellung"
  ],
  "risiken": [
    "titel"
  ],
  "aufgaben": [
    "titel"
  ],
  "entscheidungen": [
    "fragestellung"
  ],
  "kommunikation": [
    "betreff"
  ],
  "erfahrungen": [
    "titel"
  ],
  "ergebnisdokumente": [
    "datenstand"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
