// Auto-generated. Per-entity form-enhancements config for "Erfahrungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "ursprungsvorhaben", "betroffene_entscheidung", {"row": ["pruefstatus", "freigabestatus"], "cols": "1fr 1fr"}, "fachlicher_pruefer", {"row": ["version", "naechster_pruefttermin"], "cols": "1fr 2fr"}, "betroffene_anforderungen", "risiken", "ausgangssituation", "problem", "belege", "ergebnis", "erkenntnis", "gueltigkeitsbedingungen", "grenzen", "massnahme", "zusammenhang_belegt", "technische_loesungen", "alternative_erklaerungen", "wirkungsmessung"],
  defaults: {
    'pruefstatus': { kind: 'lookup', key: 'entwurf', label: 'Entwurf' },
    'freigabestatus': { kind: 'lookup', key: 'entwurf', label: 'Entwurf' },
    'version': { kind: 'literal', value: 1 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
