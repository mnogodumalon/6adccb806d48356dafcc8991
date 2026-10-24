// Auto-generated. Per-entity form-enhancements config for "Risiken".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "vorhaben", {"row": ["wahrscheinlichkeit", "auswirkung"], "cols": "1fr 1fr"}, {"row": ["risikoklasse", "status"], "cols": "1fr 1fr"}, "beschreibung", {"row": ["massnahmenverantwortlicher", "faelligkeit"], "cols": "1fr 1fr"}, "betroffene_anforderungen", "freigabe_erforderlich", "ursache", "belege", "massnahmen", "restrisiko"],
  defaults: {
    'status': { kind: 'lookup', key: 'identifiziert', label: 'Identifiziert' },
    'faelligkeit': { kind: 'todayOffset', days: 14 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
