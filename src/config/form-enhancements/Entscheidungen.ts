// Auto-generated. Per-entity form-enhancements config for "Entscheidungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["vorhaben", "fragestellung", "entscheidung", {"row": ["entscheider", "entscheidungszeitpunkt"], "cols": "1fr 1fr"}, {"row": ["status", "version"], "cols": "2fr 1fr"}, "begruendung", "grundlagen", "ersetzte_entscheidung", "beruecksichtigte_erfahrungen", "freigabe_erforderlich", "optionen", "annahmen", "risiken_text", "gueltigkeitsbedingungen"],
  defaults: {
    'entscheidungszeitpunkt': { kind: 'today', withTime: true },
    'status': { kind: 'lookup', key: 'empfehlung', label: 'Empfehlung' },
    'version': { kind: 'literal', value: 1 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
