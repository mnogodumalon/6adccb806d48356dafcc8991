import type { Anforderungen, Aufgaben, Entscheidungen, Erfahrungen, Ergebnisdokumente, Klaerungspunkte, Kommunikation, Quellen, Risiken, Vorhaben } from './app';

export type EnrichedVorhaben = Vorhaben & {
  aufklaerungsverantwortlicherName: string;
  technischer_hauptverantwortlicherName: string;
};

export type EnrichedQuellen = Quellen & {
  vorhabenName: string;
};

export type EnrichedAnforderungen = Anforderungen & {
  vorhabenName: string;
  quelleName: string;
  prueferName: string;
  bestaetigerName: string;
};

export type EnrichedKlaerungspunkte = Klaerungspunkte & {
  vorhabenName: string;
  verantwortlicherName: string;
  betroffene_anforderungenName: string;
  betroffene_quellenName: string;
  antwortquelleName: string;
  fachlicher_prueferName: string;
};

export type EnrichedRisiken = Risiken & {
  vorhabenName: string;
  betroffene_anforderungenName: string;
  massnahmenverantwortlicherName: string;
};

export type EnrichedAufgaben = Aufgaben & {
  abhaengigkeitenName: string;
  vorhabenName: string;
  verantwortlicherName: string;
  anforderungName: string;
  klaerungspunktName: string;
  unterstuetzende_personenName: string;
  prueferName: string;
};

export type EnrichedEntscheidungen = Entscheidungen & {
  beruecksichtigte_erfahrungenName: string;
  ersetzte_entscheidungName: string;
  vorhabenName: string;
  entscheiderName: string;
};

export type EnrichedKommunikation = Kommunikation & {
  aufgabeName: string;
  vorhabenName: string;
  absenderName: string;
  klaerungspunktName: string;
  anforderungName: string;
  freigegeben_vonName: string;
  quellenreferenzName: string;
};

export type EnrichedErfahrungen = Erfahrungen & {
  betroffene_entscheidungName: string;
  ursprungsvorhabenName: string;
  fachlicher_prueferName: string;
  betroffene_anforderungenName: string;
  risikenName: string;
};

export type EnrichedErgebnisdokumente = Ergebnisdokumente & {
  vorhabenName: string;
  freigeberName: string;
  vorgaengerversionName: string;
};
