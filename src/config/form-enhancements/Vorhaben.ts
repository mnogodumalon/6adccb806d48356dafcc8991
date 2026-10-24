// Auto-generated. Per-entity form-enhancements config for "Vorhaben".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["vorhaben_nummer", "titel"], "cols": "1fr 2fr"}, "kunde", {"row": ["eingangsdatum", "anfragequelle"], "cols": "1fr 1fr"}, {"row": ["aufklaerungsverantwortlicher", "aufklaerungsstatus"], "cols": "1fr 1fr"}, "vertraulichkeit", {"row": ["technischer_hauptverantwortlicher", "prioritaet"], "cols": "1fr 1fr"}, {"row": ["wunschtermin", "zieltermin_intern"], "cols": "1fr 1fr"}, {"row": ["qualitaetsstatus", "freigabestatus"], "cols": "1fr 1fr"}, {"row": ["kundenkontakt", "kundenreferenz"], "cols": "1fr 1fr"}, {"row": ["produkt", "erp_crm_referenz"], "cols": "1fr 1fr"}, "anfragebeschreibung"],
  defaults: {
    'eingangsdatum': { kind: 'today' },
    'aufklaerungsstatus': { kind: 'lookup', key: 'neu', label: 'Neu' },
    'qualitaetsstatus': { kind: 'lookup', key: 'nicht_geprueft', label: 'Nicht geprüft' },
    'prioritaet': { kind: 'lookup', key: 'normal', label: 'Normal' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
