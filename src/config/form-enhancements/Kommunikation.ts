// Auto-generated. Per-entity form-enhancements config for "Kommunikation".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["betreff", "vorhaben", {"row": ["kanal", "status"], "cols": "1fr 1fr"}, "absender", "empfaenger", "zeitpunkt", "aufgabe", "klaerungspunkt", "anforderung", "quellenreferenz", "freigegeben_von", "bestaetigung", "inhalt"],
  defaults: {
    'status': { kind: 'lookup', key: 'entwurf', label: 'Entwurf' },
    'zeitpunkt': { kind: 'today', withTime: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
