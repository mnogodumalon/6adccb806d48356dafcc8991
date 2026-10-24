import type { EnrichedAnforderungen, EnrichedAufgaben, EnrichedEntscheidungen, EnrichedErfahrungen, EnrichedErgebnisdokumente, EnrichedKlaerungspunkte, EnrichedKommunikation, EnrichedQuellen, EnrichedRisiken, EnrichedVorhaben } from '@/types/enriched';
import type { Anforderungen, Aufgaben, Entscheidungen, Erfahrungen, Ergebnisdokumente, Klaerungspunkte, Kommunikation, Mitarbeitende, Quellen, Risiken, Vorhaben } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface VorhabenMaps {
  mitarbeitendeMap: Map<string, Mitarbeitende>;
}

export function enrichVorhaben(
  vorhaben: Vorhaben[],
  maps: VorhabenMaps
): EnrichedVorhaben[] {
  return vorhaben.map(r => ({
    ...r,
    aufklaerungsverantwortlicherName: resolveDisplay(r.fields.aufklaerungsverantwortlicher, maps.mitarbeitendeMap, 'vorname', 'nachname'),
    technischer_hauptverantwortlicherName: resolveDisplay(r.fields.technischer_hauptverantwortlicher, maps.mitarbeitendeMap, 'vorname', 'nachname'),
  }));
}

interface QuellenMaps {
  vorhabenMap: Map<string, Vorhaben>;
}

export function enrichQuellen(
  quellen: Quellen[],
  maps: QuellenMaps
): EnrichedQuellen[] {
  return quellen.map(r => ({
    ...r,
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'vorhaben_nummer'),
  }));
}

interface AnforderungenMaps {
  vorhabenMap: Map<string, Vorhaben>;
  quellenMap: Map<string, Quellen>;
  mitarbeitendeMap: Map<string, Mitarbeitende>;
}

export function enrichAnforderungen(
  anforderungen: Anforderungen[],
  maps: AnforderungenMaps
): EnrichedAnforderungen[] {
  return anforderungen.map(r => ({
    ...r,
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'vorhaben_nummer'),
    quelleName: resolveDisplay(r.fields.quelle, maps.quellenMap, 'titel'),
    prueferName: resolveDisplay(r.fields.pruefer, maps.mitarbeitendeMap, 'vorname', 'nachname'),
    bestaetigerName: resolveDisplay(r.fields.bestaetiger, maps.mitarbeitendeMap, 'vorname', 'nachname'),
  }));
}

interface KlaerungspunkteMaps {
  vorhabenMap: Map<string, Vorhaben>;
  mitarbeitendeMap: Map<string, Mitarbeitende>;
  anforderungenMap: Map<string, Anforderungen>;
  quellenMap: Map<string, Quellen>;
}

export function enrichKlaerungspunkte(
  klaerungspunkte: Klaerungspunkte[],
  maps: KlaerungspunkteMaps
): EnrichedKlaerungspunkte[] {
  return klaerungspunkte.map(r => ({
    ...r,
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'vorhaben_nummer'),
    verantwortlicherName: resolveDisplay(r.fields.verantwortlicher, maps.mitarbeitendeMap, 'vorname', 'nachname'),
    betroffene_anforderungenName: resolveDisplay(r.fields.betroffene_anforderungen, maps.anforderungenMap, 'titel'),
    betroffene_quellenName: resolveDisplay(r.fields.betroffene_quellen, maps.quellenMap, 'titel'),
    antwortquelleName: resolveDisplay(r.fields.antwortquelle, maps.quellenMap, 'titel'),
    fachlicher_prueferName: resolveDisplay(r.fields.fachlicher_pruefer, maps.mitarbeitendeMap, 'vorname', 'nachname'),
  }));
}

interface RisikenMaps {
  vorhabenMap: Map<string, Vorhaben>;
  anforderungenMap: Map<string, Anforderungen>;
  mitarbeitendeMap: Map<string, Mitarbeitende>;
}

export function enrichRisiken(
  risiken: Risiken[],
  maps: RisikenMaps
): EnrichedRisiken[] {
  return risiken.map(r => ({
    ...r,
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'vorhaben_nummer'),
    betroffene_anforderungenName: resolveDisplay(r.fields.betroffene_anforderungen, maps.anforderungenMap, 'titel'),
    massnahmenverantwortlicherName: resolveDisplay(r.fields.massnahmenverantwortlicher, maps.mitarbeitendeMap, 'vorname', 'nachname'),
  }));
}

interface AufgabenMaps {
  aufgabenMap: Map<string, Aufgaben>;
  vorhabenMap: Map<string, Vorhaben>;
  mitarbeitendeMap: Map<string, Mitarbeitende>;
  anforderungenMap: Map<string, Anforderungen>;
  klaerungspunkteMap: Map<string, Klaerungspunkte>;
}

export function enrichAufgaben(
  aufgaben: Aufgaben[],
  maps: AufgabenMaps
): EnrichedAufgaben[] {
  return aufgaben.map(r => ({
    ...r,
    abhaengigkeitenName: resolveDisplay(r.fields.abhaengigkeiten, maps.aufgabenMap, 'titel'),
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'vorhaben_nummer'),
    verantwortlicherName: resolveDisplay(r.fields.verantwortlicher, maps.mitarbeitendeMap, 'vorname', 'nachname'),
    anforderungName: resolveDisplay(r.fields.anforderung, maps.anforderungenMap, 'titel'),
    klaerungspunktName: resolveDisplay(r.fields.klaerungspunkt, maps.klaerungspunkteMap, 'fragestellung'),
    unterstuetzende_personenName: resolveDisplay(r.fields.unterstuetzende_personen, maps.mitarbeitendeMap, 'vorname', 'nachname'),
    prueferName: resolveDisplay(r.fields.pruefer, maps.mitarbeitendeMap, 'vorname', 'nachname'),
  }));
}

interface EntscheidungenMaps {
  erfahrungenMap: Map<string, Erfahrungen>;
  entscheidungenMap: Map<string, Entscheidungen>;
  vorhabenMap: Map<string, Vorhaben>;
  mitarbeitendeMap: Map<string, Mitarbeitende>;
}

export function enrichEntscheidungen(
  entscheidungen: Entscheidungen[],
  maps: EntscheidungenMaps
): EnrichedEntscheidungen[] {
  return entscheidungen.map(r => ({
    ...r,
    beruecksichtigte_erfahrungenName: resolveDisplay(r.fields.beruecksichtigte_erfahrungen, maps.erfahrungenMap, 'titel'),
    ersetzte_entscheidungName: resolveDisplay(r.fields.ersetzte_entscheidung, maps.entscheidungenMap, 'fragestellung'),
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'vorhaben_nummer'),
    entscheiderName: resolveDisplay(r.fields.entscheider, maps.mitarbeitendeMap, 'vorname', 'nachname'),
  }));
}

interface KommunikationMaps {
  aufgabenMap: Map<string, Aufgaben>;
  vorhabenMap: Map<string, Vorhaben>;
  mitarbeitendeMap: Map<string, Mitarbeitende>;
  klaerungspunkteMap: Map<string, Klaerungspunkte>;
  anforderungenMap: Map<string, Anforderungen>;
  quellenMap: Map<string, Quellen>;
}

export function enrichKommunikation(
  kommunikation: Kommunikation[],
  maps: KommunikationMaps
): EnrichedKommunikation[] {
  return kommunikation.map(r => ({
    ...r,
    aufgabeName: resolveDisplay(r.fields.aufgabe, maps.aufgabenMap, 'titel'),
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'vorhaben_nummer'),
    absenderName: resolveDisplay(r.fields.absender, maps.mitarbeitendeMap, 'vorname', 'nachname'),
    klaerungspunktName: resolveDisplay(r.fields.klaerungspunkt, maps.klaerungspunkteMap, 'fragestellung'),
    anforderungName: resolveDisplay(r.fields.anforderung, maps.anforderungenMap, 'titel'),
    freigegeben_vonName: resolveDisplay(r.fields.freigegeben_von, maps.mitarbeitendeMap, 'vorname', 'nachname'),
    quellenreferenzName: resolveDisplay(r.fields.quellenreferenz, maps.quellenMap, 'titel'),
  }));
}

interface ErfahrungenMaps {
  entscheidungenMap: Map<string, Entscheidungen>;
  vorhabenMap: Map<string, Vorhaben>;
  mitarbeitendeMap: Map<string, Mitarbeitende>;
  anforderungenMap: Map<string, Anforderungen>;
  risikenMap: Map<string, Risiken>;
}

export function enrichErfahrungen(
  erfahrungen: Erfahrungen[],
  maps: ErfahrungenMaps
): EnrichedErfahrungen[] {
  return erfahrungen.map(r => ({
    ...r,
    betroffene_entscheidungName: resolveDisplay(r.fields.betroffene_entscheidung, maps.entscheidungenMap, 'fragestellung'),
    ursprungsvorhabenName: resolveDisplay(r.fields.ursprungsvorhaben, maps.vorhabenMap, 'vorhaben_nummer'),
    fachlicher_prueferName: resolveDisplay(r.fields.fachlicher_pruefer, maps.mitarbeitendeMap, 'vorname', 'nachname'),
    betroffene_anforderungenName: resolveDisplay(r.fields.betroffene_anforderungen, maps.anforderungenMap, 'titel'),
    risikenName: resolveDisplay(r.fields.risiken, maps.risikenMap, 'titel'),
  }));
}

interface ErgebnisdokumenteMaps {
  vorhabenMap: Map<string, Vorhaben>;
  mitarbeitendeMap: Map<string, Mitarbeitende>;
  ergebnisdokumenteMap: Map<string, Ergebnisdokumente>;
}

export function enrichErgebnisdokumente(
  ergebnisdokumente: Ergebnisdokumente[],
  maps: ErgebnisdokumenteMaps
): EnrichedErgebnisdokumente[] {
  return ergebnisdokumente.map(r => ({
    ...r,
    vorhabenName: resolveDisplay(r.fields.vorhaben, maps.vorhabenMap, 'vorhaben_nummer'),
    freigeberName: resolveDisplay(r.fields.freigeber, maps.mitarbeitendeMap, 'vorname', 'nachname'),
    vorgaengerversionName: resolveDisplay(r.fields.vorgaengerversion, maps.ergebnisdokumenteMap, 'datenstand'),
  }));
}
