// Auto-generated. Per-entity form-enhancements config for "Anforderungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "vorhaben", {"row": ["kategorie", "anforderungsart"], "cols": "1fr 1fr"}, {"row": ["verbindlichkeit", "kritikalitaet"], "cols": "1fr 1fr"}, "status", "beschreibung", {"row": ["quelle", "quellenstelle"], "cols": "1fr 1fr"}, {"row": ["pruefer", "bestaetiger"], "cols": "1fr 1fr"}, {"row": ["bestaetigungszeitpunkt", "version"], "cols": "2fr 1fr"}, "fachliche_grundlage", "akzeptanzkriterium", "nachweisverfahren", "fachliche_bewertung", "aenderungsgrund"],
  defaults: {
    'status': { kind: 'lookup', key: 'vorgeschlagen', label: 'Vorgeschlagen' },
    'version': { kind: 'literal', value: 1 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
