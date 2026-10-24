#!/usr/bin/env node
/**
 * check-lookup-keys.mjs — build gate against INVENTED lookup keys.
 *
 * Real incident: an intent UI shipped `zahlungsstatus: 'offen'` — semantically
 * plausible, but the schema's keys were bezahlt|ausstehend|gemahnt, so every
 * wizard write 400'd in production. This gate embeds the schema's valid keys
 * and scans the agent-written sources for literal assignments to known lookup
 * fields. Runs in Step 3 / before `npm run build`; exit 1 on any unknown
 * literal — read the valid keys from LOOKUP_OPTIONS, never invent one.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// field name -> union of valid keys across ALL entities (a literal valid in
// any entity passes — avoids false positives on shared field names).
const VALID_KEYS = {
  "anforderungsart": [
    "abnahmekriterium",
    "muss",
    "optional",
    "randbedingung",
    "soll"
  ],
  "anfragequelle": [
    "email",
    "persoenlich",
    "portal",
    "sonstige",
    "telefon",
    "vertrieb"
  ],
  "anlass": [
    "fehlender_nachweis",
    "informationsluecke",
    "machbarkeit",
    "offene_frage",
    "widerspruch"
  ],
  "aufgabentyp": [
    "bewertung",
    "klaerung",
    "nachweis",
    "pruefung",
    "rueckfrage",
    "sonstiges"
  ],
  "aufklaerungsstatus": [
    "abgebrochen",
    "abgeschlossen",
    "freigabe_ausstehend",
    "freigegeben",
    "in_aufklaerung",
    "in_pruefung",
    "in_triage",
    "neu",
    "wartet",
    "zurueckgestellt"
  ],
  "auswirkung": [
    "gering",
    "hoch",
    "mittel",
    "schwerwiegend"
  ],
  "dokumenttyp": [
    "anforderungsuebersicht",
    "anfrageuebersicht",
    "finales_ergebnis",
    "freigabevorlage",
    "klaerungsstand"
  ],
  "extraktionsstatus": [
    "extrahiert",
    "fehlgeschlagen",
    "in_arbeit",
    "nicht_extrahiert"
  ],
  "freigabestatus": [
    "abgelehnt",
    "ausstehend",
    "eingeschraenkt",
    "entwurf",
    "erneute_pruefung",
    "freigegeben",
    "nicht_freigabefaehig",
    "pruefung_moeglich",
    "veraltet",
    "zur_pruefung"
  ],
  "kanal": [
    "externe_nachricht",
    "interne_abstimmung",
    "interne_notiz",
    "ki_vorschlag"
  ],
  "kritikalitaet": [
    "hoch",
    "kritisch",
    "mittel",
    "niedrig"
  ],
  "prioritaet": [
    "dringend",
    "hoch",
    "niedrig",
    "normal"
  ],
  "pruefstatus": [
    "beanstandet",
    "bestanden",
    "entwurf",
    "erneute_pruefung",
    "fehlgeschlagen",
    "geprueft",
    "mit_warnungen",
    "nicht_geprueft",
    "ungeprueft",
    "zur_pruefung"
  ],
  "qualitaetsstatus": [
    "bestanden",
    "fehlgeschlagen",
    "mit_warnungen",
    "nicht_geprueft"
  ],
  "quellentyp": [
    "datensatz",
    "dokument",
    "email",
    "gespraechsnotiz",
    "sonstiges"
  ],
  "risikoklasse": [
    "hoch",
    "kritisch",
    "mittel",
    "niedrig"
  ],
  "rolle": [
    "administrator",
    "aufklaerungsverantwortlicher",
    "fachpruefer",
    "freigeber",
    "mitarbeiter"
  ],
  "status": [
    "abgebrochen",
    "abgelehnt",
    "akzeptiert",
    "antwort_eingegangen",
    "behandelt",
    "bereit",
    "bestaetigt",
    "eingegangen",
    "empfehlung",
    "entwurf",
    "erledigt",
    "ersetzt",
    "fachliche_pruefung",
    "freigegeben",
    "geklaert",
    "geplant",
    "geschlossen",
    "getroffen",
    "identifiziert",
    "in_bearbeitung",
    "in_bewertung",
    "in_pruefung",
    "korrektur",
    "massnahme_geplant",
    "nicht_anwendbar",
    "nicht_relevant",
    "offen",
    "rueckfrage",
    "rueckfrage_versendet",
    "rueckfrage_vorbereitet",
    "versendet",
    "verworfen",
    "vorgeschlagen",
    "wartet_aufgabe",
    "wartet_information",
    "zur_freigabe",
    "zur_pruefung"
  ],
  "verbindlichkeit": [
    "unverbindlich",
    "verbindlich",
    "wuenschenswert"
  ],
  "vertraulichkeit": [
    "intern",
    "oeffentlich",
    "streng_vertraulich",
    "vertraulich"
  ],
  "wahrscheinlichkeit": [
    "moeglich",
    "sehr_wahrscheinlich",
    "selten",
    "wahrscheinlich"
  ],
  "zusammenhang_belegt": [
    "ergebnis_beobachtet",
    "massnahme_durchgefuehrt",
    "zusammenhang_belegt"
  ]
};

const ROOTS = ['src/pages', 'src/components'];
// .example.tsx targets a fixed demo schema; src/components/ui are shadcn
// primitives — neither carries Living-Apps writes.
const SKIP = /\.example\.tsx$|[\\/]ui[\\/]/;

function walk(dir, out = []) {
  let entries = [];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}

// Comments must be INVISIBLE to this gate. A live build went red on the
// EXAMPLE inside SatelliteSection's own JSDoc (`overlay.push({ typ: 'mangel',
// … })` — a doc example from another app, in a file the agent must not edit),
// and the repair agent could only get past it by mangling that comment; the
// next build regenerates the file and the dance starts over. Layout-preserving
// and string-aware: comment characters become spaces, newlines stay, so line
// numbers still match the raw file — and a URL inside a string literal
// ('https://…') is not mistaken for a line comment.
function stripCommentsKeepLayout(s) {
  let out = '';
  let i = 0, inStr = null, esc = false;
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === inStr) inStr = null;
      out += c; i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; i++; continue; }
    if (c === '/' && n === '/') {
      while (i < s.length && s[i] !== '\n') { out += ' '; i++; }
      continue;
    }
    if (c === '/' && n === '*') {
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) { out += s[i] === '\n' ? '\n' : ' '; i++; }
      if (i < s.length) { out += '  '; i += 2; }
      continue;
    }
    out += c; i++;
  }
  return out;
}

const errors = [];
const files = ROOTS.flatMap(r => walk(r)).filter(f => !SKIP.test(f));
for (const file of files) {
  const lines = stripCommentsKeepLayout(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    for (const [field, keys] of Object.entries(VALID_KEYS)) {
      // property-assignment syntax only: `field: 'literal'` / `field: "literal"`
      const re = new RegExp(`[{,\\s]${field}\\s*:\\s*(['"])([^'"]*)\\1`, 'g');
      let m;
      while ((m = re.exec(line)) !== null) {
        const val = m[2];
        // An EMPTY literal is "nothing selected yet", never an invented key —
        // `const INITIAL = { <lookupfield>: '' }` is the natural seed of an
        // unselected radio group on a public form. Reporting it sent a repair
        // agent through three attempts (union type → cast → renaming the whole
        // field, plus every read site) for a value that was already correct.
        if (val === '') continue;
        if (!keys.includes(val)) {
          errors.push(
            `${file}:${i + 1}: '${val}' is not a valid key for '${field}' — valid: ${keys.join(' | ')}. ` +
            `(Local UI property sharing the name? Rename it.)`
          );
        }
      }
    }
  });
}

if (errors.length) {
  for (const e of errors) console.error(`ERROR: ${e}`);
  console.error(`\n${errors.length} invalid lookup-key literal(s) — keys come from LOOKUP_OPTIONS, never invent one.`);
  process.exit(1);
}
console.log(`check-lookup-keys: OK (${files.length} files scanned)`);
