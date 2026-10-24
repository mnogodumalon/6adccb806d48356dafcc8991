// Auto-generated. Per-entity form-enhancements config for "Quellen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "vorhaben", {"row": ["quellentyp", "vertraulichkeit"], "cols": "1fr 1fr"}, {"row": ["erfassungszeitpunkt", "dokumentdatum"], "cols": "1fr 1fr"}, "externe_referenz", {"row": ["urheber", "version"], "cols": "2fr 1fr"}, {"row": ["extraktionsstatus", "pruefstatus"], "cols": "1fr 1fr"}, "inhaltshash", "extrahierter_inhalt"],
  defaults: {
    'erfassungszeitpunkt': { kind: 'today', withTime: true },
    'extraktionsstatus': { kind: 'lookup', key: 'nicht_extrahiert', label: 'Nicht extrahiert' },
    'pruefstatus': { kind: 'lookup', key: 'ungeprueft', label: 'Ungeprüft' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
