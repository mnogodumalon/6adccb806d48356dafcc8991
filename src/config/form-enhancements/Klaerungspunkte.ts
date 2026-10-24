// Auto-generated. Per-entity form-enhancements config for "Klärungspunkte".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["vorhaben", "fragestellung", {"row": ["anlass", "kritikalitaet"], "cols": "1fr 1fr"}, {"row": ["verantwortlicher", "status"], "cols": "1fr 1fr"}, {"row": ["adressat", "faelligkeit"], "cols": "1fr 1fr"}, "betroffene_anforderungen", "betroffene_quellen", {"row": ["antwortquelle", "fachlicher_pruefer"], "cols": "1fr 1fr"}, "vorgeschlagene_antwort", "bestaetigte_antwort"],
  defaults: {
    'status': { kind: 'lookup', key: 'offen', label: 'Offen' },
    'faelligkeit': { kind: 'todayOffset', days: 14 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
