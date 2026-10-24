// Auto-generated. Per-entity form-enhancements config for "Ergebnisdokumente".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["vorhaben", {"row": ["dokumenttyp", "version"], "cols": "2fr 1fr"}, "erstellungszeitpunkt", "datenstand", {"row": ["pruefstatus", "freigabestatus"], "cols": "1fr 1fr"}, {"row": ["freigeber", "freigabezeitpunkt"], "cols": "1fr 1fr"}, "vorgaengerversion", "inhalt", "aenderungszusammenfassung"],
  defaults: {
    'version': { kind: 'literal', value: 1 },
    'erstellungszeitpunkt': { kind: 'today', withTime: true },
    'pruefstatus': { kind: 'lookup', key: 'nicht_geprueft', label: 'Nicht geprüft' },
    'freigabestatus': { kind: 'lookup', key: 'nicht_freigabefaehig', label: 'Nicht freigabefähig' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
