/**
 * AufgabenDialog — pre-generated create/edit dialog for Aufgaben.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * aufgabenList (full hook array — resolves the Aufgaben applookup),
 * vorhabenList (full hook array — resolves the Vorhaben applookup),
 * mitarbeitendeList (full hook array — resolves the Mitarbeitende applookup),
 * anforderungenList (full hook array — resolves the Anforderungen applookup),
 * klaerungspunkteList (full hook array — resolves the Klaerungspunkte applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * AufgabenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Aufgaben['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<AufgabenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Aufgaben, Vorhaben, Mitarbeitende, Anforderungen, Klaerungspunkte, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, extractRecordIds, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Aufgaben';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox, MultiCombobox } from '@/components/Combobox';
import { VorhabenDialog } from '@/components/dialogs/VorhabenDialog';
import { MitarbeitendeDialog } from '@/components/dialogs/MitarbeitendeDialog';
import { AnforderungenDialog } from '@/components/dialogs/AnforderungenDialog';
import { KlaerungspunkteDialog } from '@/components/dialogs/KlaerungspunkteDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for AufgabenDialog.defaultValues — see file header. */
export type AufgabenDialogDefaults = Omit<Aufgaben['fields'], 'aufgabentyp' | 'status'> & {
    aufgabentyp?: LookupValue | string;
    status?: LookupValue | string;
  };

interface AufgabenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Aufgaben['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: AufgabenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  aufgabenList: Aufgaben[];
  vorhabenList: Vorhaben[];
  mitarbeitendeList: Mitarbeitende[];
  anforderungenList: Anforderungen[];
  klaerungspunkteList: Klaerungspunkte[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  aufgabentyp: LOOKUP_OPTIONS['aufgaben']?.['aufgabentyp'] ?? [],
  status: LOOKUP_OPTIONS['aufgaben']?.['status'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  abhaengigkeiten: APP_IDS.AUFGABEN,
  vorhaben: APP_IDS.VORHABEN,
  verantwortlicher: APP_IDS.MITARBEITENDE,
  anforderung: APP_IDS.ANFORDERUNGEN,
  klaerungspunkt: APP_IDS.KLAERUNGSPUNKTE,
  unterstuetzende_personen: APP_IDS.MITARBEITENDE,
  pruefer: APP_IDS.MITARBEITENDE,
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  for (const [k, appId] of Object.entries(NORMALIZE_APPLOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string' && v !== '' && !v.startsWith('http')) out[k] = createRecordUrl(appId, v);
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' && x !== '' && !x.startsWith('http') ? createRecordUrl(appId, x) : x));
  }
  return out;
}

export function AufgabenDialog({ open, onClose, onSubmit, defaultValues, recordId, aufgabenList, vorhabenList, mitarbeitendeList, anforderungenList, klaerungspunkteList, enablePhotoScan = true, enablePhotoLocation = true }: AufgabenDialogProps) {
  const [fields, setFields] = useState<Partial<Aufgaben['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  // Inline-Create state for "Vorhaben" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraVorhaben` list, and select it in
  // the originating Combobox via the captured `createVorhabenField`.
  const [createVorhabenOpen, setCreateVorhabenOpen] = useState(false);
  const [createVorhabenInitial, setCreateVorhabenInitial] = useState('');
  const [createVorhabenField, setCreateVorhabenField] = useState<string>('');
  const [extraVorhaben, setExtraVorhaben] = useState< Vorhaben[]>([]);
  const vorhabenListAll = useMemo(
    () => [...vorhabenList, ...extraVorhaben],
    [vorhabenList, extraVorhaben],
  );
  function openCreateVorhaben(fieldKey: string, q: string) {
    setCreateVorhabenField(fieldKey);
    setCreateVorhabenInitial(q);
    setCreateVorhabenOpen(true);
  }
  // Inline-Create state for "Mitarbeitende" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraMitarbeitende` list, and select it in
  // the originating Combobox via the captured `createMitarbeitendeField`.
  const [createMitarbeitendeOpen, setCreateMitarbeitendeOpen] = useState(false);
  const [createMitarbeitendeInitial, setCreateMitarbeitendeInitial] = useState('');
  const [createMitarbeitendeField, setCreateMitarbeitendeField] = useState<string>('');
  const [extraMitarbeitende, setExtraMitarbeitende] = useState< Mitarbeitende[]>([]);
  const mitarbeitendeListAll = useMemo(
    () => [...mitarbeitendeList, ...extraMitarbeitende],
    [mitarbeitendeList, extraMitarbeitende],
  );
  function openCreateMitarbeitende(fieldKey: string, q: string) {
    setCreateMitarbeitendeField(fieldKey);
    setCreateMitarbeitendeInitial(q);
    setCreateMitarbeitendeOpen(true);
  }
  // Inline-Create state for "Anforderungen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraAnforderungen` list, and select it in
  // the originating Combobox via the captured `createAnforderungenField`.
  const [createAnforderungenOpen, setCreateAnforderungenOpen] = useState(false);
  const [createAnforderungenInitial, setCreateAnforderungenInitial] = useState('');
  const [createAnforderungenField, setCreateAnforderungenField] = useState<string>('');
  const [extraAnforderungen, setExtraAnforderungen] = useState< Anforderungen[]>([]);
  const anforderungenListAll = useMemo(
    () => [...anforderungenList, ...extraAnforderungen],
    [anforderungenList, extraAnforderungen],
  );
  function openCreateAnforderungen(fieldKey: string, q: string) {
    setCreateAnforderungenField(fieldKey);
    setCreateAnforderungenInitial(q);
    setCreateAnforderungenOpen(true);
  }
  // Inline-Create state for "Klaerungspunkte" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraKlaerungspunkte` list, and select it in
  // the originating Combobox via the captured `createKlaerungspunkteField`.
  const [createKlaerungspunkteOpen, setCreateKlaerungspunkteOpen] = useState(false);
  const [createKlaerungspunkteInitial, setCreateKlaerungspunkteInitial] = useState('');
  const [createKlaerungspunkteField, setCreateKlaerungspunkteField] = useState<string>('');
  const [extraKlaerungspunkte, setExtraKlaerungspunkte] = useState< Klaerungspunkte[]>([]);
  const klaerungspunkteListAll = useMemo(
    () => [...klaerungspunkteList, ...extraKlaerungspunkte],
    [klaerungspunkteList, extraKlaerungspunkte],
  );
  function openCreateKlaerungspunkte(fieldKey: string, q: string) {
    setCreateKlaerungspunkteField(fieldKey);
    setCreateKlaerungspunkteInitial(q);
    setCreateKlaerungspunkteOpen(true);
  }
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = [];
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['vorhaben', 'titel', 'zweck', 'aufgabentyp', 'verantwortlicher', 'status'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
      'abhaengigkeiten': aufgabenList,
      'vorhaben': vorhabenList,
      'verantwortlicher': mitarbeitendeList,
      'anforderung': anforderungenList,
      'klaerungspunkt': klaerungspunkteList,
      'unterstuetzende_personen': mitarbeitendeList,
      'pruefer': mitarbeitendeList,
    },
  }), [aufgabenList, vorhabenList, mitarbeitendeList, anforderungenList, klaerungspunkteList, mitarbeitendeList, mitarbeitendeList, ]);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Aufgaben['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'aufgaben');
      await onSubmit(clean as Aufgaben['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="abhaengigkeiten" entity="Aufgaben">\n${JSON.stringify(aufgabenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="vorhaben" entity="Vorhaben">\n${JSON.stringify(vorhabenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="verantwortlicher" entity="Mitarbeitende">\n${JSON.stringify(mitarbeitendeList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="anforderung" entity="Anforderungen">\n${JSON.stringify(anforderungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="klaerungspunkt" entity="Klärungspunkte">\n${JSON.stringify(klaerungspunkteList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="unterstuetzende_personen" entity="Mitarbeitende">\n${JSON.stringify(mitarbeitendeList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="pruefer" entity="Mitarbeitende">\n${JSON.stringify(mitarbeitendeList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "abhaengigkeiten": string[] | null, // Display names from Aufgaben, one per referenced record (see <available-records>)\n  "vorhaben": string | null, // Display name from Vorhaben (see <available-records>)\n  "titel": string | null, // Titel\n  "zweck": string | null, // Zweck und Beschreibung\n  "aufgabentyp": LookupValue | null, // Aufgabentyp (select one key: "klaerung" | "bewertung" | "nachweis" | "rueckfrage" | "pruefung" | "sonstiges") mapping: klaerung=Klärung, bewertung=Technische Bewertung, nachweis=Nachweis, rueckfrage=Rückfrage, pruefung=Prüfung, sonstiges=Sonstiges\n  "verantwortlicher": string | null, // Display name from Mitarbeitende (see <available-records>)\n  "status": LookupValue | null, // Status (select one key: "geplant" | "bereit" | "in_bearbeitung" | "wartet_information" | "wartet_aufgabe" | "zur_pruefung" | "korrektur" | "erledigt" | "abgebrochen") mapping: geplant=Geplant, bereit=Bereit, in_bearbeitung=In Bearbeitung, wartet_information=Wartet auf Information, wartet_aufgabe=Wartet auf andere Aufgabe, zur_pruefung=Zur Prüfung, korrektur=Korrektur erforderlich, erledigt=Erledigt, abgebrochen=Abgebrochen\n  "anforderung": string | null, // Display name from Anforderungen (see <available-records>)\n  "klaerungspunkt": string | null, // Display name from Klärungspunkte (see <available-records>)\n  "unterstuetzende_personen": string[] | null, // Display names from Mitarbeitende, one per referenced record (see <available-records>)\n  "faelligkeit": string | null, // YYYY-MM-DD\n  "erwartetes_ergebnis": string | null, // Erwartetes Ergebnis\n  "akzeptanzkriterien": string | null, // Akzeptanzkriterien\n  "pruefer": string | null, // Display name from Mitarbeitende (see <available-records>)\n  "ergebnisreferenz": string | null, // Ergebnisreferenz\n  "abschlusszeitpunkt": string | null, // YYYY-MM-DDTHH:MM\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["abhaengigkeiten", "vorhaben", "verantwortlicher", "anforderung", "klaerungspunkt", "unterstuetzende_personen", "pruefer"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const abhaengigkeitenNames = raw['abhaengigkeiten'];
        if (Array.isArray(abhaengigkeitenNames) && abhaengigkeitenNames.length > 0) {
          const abhaengigkeitenUrls = (abhaengigkeitenNames as unknown[])
            .map(n => aufgabenList.find(r => matchName(String(n), [String(r.fields.titel ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.AUFGABEN, r.record_id));
          if (abhaengigkeitenUrls.length > 0) merged['abhaengigkeiten'] = abhaengigkeitenUrls;
        }
        const vorhabenName = raw['vorhaben'] as string | null;
        if (vorhabenName) {
          const vorhabenMatch = vorhabenList.find(r => matchName(vorhabenName!, [String(r.fields.vorhaben_nummer ?? '')]));
          if (vorhabenMatch) merged['vorhaben'] = createRecordUrl(APP_IDS.VORHABEN, vorhabenMatch.record_id);
        }
        const verantwortlicherName = raw['verantwortlicher'] as string | null;
        if (verantwortlicherName) {
          const verantwortlicherMatch = mitarbeitendeList.find(r => matchName(verantwortlicherName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (verantwortlicherMatch) merged['verantwortlicher'] = createRecordUrl(APP_IDS.MITARBEITENDE, verantwortlicherMatch.record_id);
        }
        const anforderungName = raw['anforderung'] as string | null;
        if (anforderungName) {
          const anforderungMatch = anforderungenList.find(r => matchName(anforderungName!, [String(r.fields.titel ?? '')]));
          if (anforderungMatch) merged['anforderung'] = createRecordUrl(APP_IDS.ANFORDERUNGEN, anforderungMatch.record_id);
        }
        const klaerungspunktName = raw['klaerungspunkt'] as string | null;
        if (klaerungspunktName) {
          const klaerungspunktMatch = klaerungspunkteList.find(r => matchName(klaerungspunktName!, [String(r.fields.fragestellung ?? '')]));
          if (klaerungspunktMatch) merged['klaerungspunkt'] = createRecordUrl(APP_IDS.KLAERUNGSPUNKTE, klaerungspunktMatch.record_id);
        }
        const unterstuetzende_personenNames = raw['unterstuetzende_personen'];
        if (Array.isArray(unterstuetzende_personenNames) && unterstuetzende_personenNames.length > 0) {
          const unterstuetzende_personenUrls = (unterstuetzende_personenNames as unknown[])
            .map(n => mitarbeitendeList.find(r => matchName(String(n), [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.MITARBEITENDE, r.record_id));
          if (unterstuetzende_personenUrls.length > 0) merged['unterstuetzende_personen'] = unterstuetzende_personenUrls;
        }
        const prueferName = raw['pruefer'] as string | null;
        if (prueferName) {
          const prueferMatch = mitarbeitendeList.find(r => matchName(prueferName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (prueferMatch) merged['pruefer'] = createRecordUrl(APP_IDS.MITARBEITENDE, prueferMatch.record_id);
        }
        return merged as Partial<Aufgaben['fields']>;
      });
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues
    ? t('edit_entity', { entity: appLabel('aufgaben') })
    : t('new_entity', { entity: appLabel('aufgaben') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'abhaengigkeiten': (
      <div key="abhaengigkeiten" className="space-y-1.5">
        <Label htmlFor="abhaengigkeiten">{fieldLabel('aufgaben', 'abhaengigkeiten')}</Label>
        <MultiCombobox
          id="abhaengigkeiten"
          placeholder="Welche Aufgaben müssen vorher fertig sein?"
          items={aufgabenList.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          values={extractRecordIds(fields.abhaengigkeiten)}
          onChange={ids => setFields(f => ({ ...f, abhaengigkeiten: ids.length ? ids.map(id => createRecordUrl(APP_IDS.AUFGABEN, id)) as any : undefined }))}
        />
      </div>
    ),
    'vorhaben': (
      <div key="vorhaben" className="space-y-1.5">
        <Label htmlFor="vorhaben">{fieldLabel('aufgaben', 'vorhaben')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="vorhaben"
          placeholder="Welches Vorhaben?"
          items={vorhabenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorhaben_nummer ?? r.record_id),
          }))}
          value={extractRecordId(fields.vorhaben)}
          onChange={id => setFields(f => ({ ...f, vorhaben: id ? createRecordUrl(APP_IDS.VORHABEN, id) : undefined }))}
          onCreateNew={(q) => openCreateVorhaben("vorhaben", q)}
          createLabel={t('create_in', { entity: appLabel('vorhaben') })}
        />
        {showErrors && !fields.vorhaben && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgaben', 'vorhaben')}</p>
        )}
      </div>
    ),
    'titel': (
      <div key="titel" className="space-y-1.5">
        <Label htmlFor="titel">{fieldLabel('aufgaben', 'titel')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="titel"
          placeholder="z. B. Statik der Halle prüfen"
          value={fields.titel ?? ''}
          onChange={e => setFields(f => ({ ...f, titel: e.target.value }))}
          required
        />
        {showErrors && !fields.titel && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgaben', 'titel')}</p>
        )}
      </div>
    ),
    'zweck': (
      <div key="zweck" className="space-y-1.5">
        <Label htmlFor="zweck">{fieldLabel('aufgaben', 'zweck')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="zweck"
          placeholder="Worum geht es und warum?"
          value={fields.zweck ?? ''}
          onChange={e => setFields(f => ({ ...f, zweck: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.zweck && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgaben', 'zweck')}</p>
        )}
      </div>
    ),
    'aufgabentyp': (
      <div key="aufgabentyp" className="space-y-1.5">
        <Label htmlFor="aufgabentyp">{fieldLabel('aufgaben', 'aufgabentyp')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.aufgabentyp) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, aufgabentyp: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="aufgabentyp" className="max-sm:h-11"><SelectValue placeholder="z. B. Klärung, Prüfung" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="klaerung">{lookupLabel('aufgaben', 'aufgabentyp', 'klaerung') ?? 'Klärung'}</SelectItem>
            <SelectItem value="bewertung">{lookupLabel('aufgaben', 'aufgabentyp', 'bewertung') ?? 'Technische Bewertung'}</SelectItem>
            <SelectItem value="nachweis">{lookupLabel('aufgaben', 'aufgabentyp', 'nachweis') ?? 'Nachweis'}</SelectItem>
            <SelectItem value="rueckfrage">{lookupLabel('aufgaben', 'aufgabentyp', 'rueckfrage') ?? 'Rückfrage'}</SelectItem>
            <SelectItem value="pruefung">{lookupLabel('aufgaben', 'aufgabentyp', 'pruefung') ?? 'Prüfung'}</SelectItem>
            <SelectItem value="sonstiges">{lookupLabel('aufgaben', 'aufgabentyp', 'sonstiges') ?? 'Sonstiges'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.aufgabentyp && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgaben', 'aufgabentyp')}</p>
        )}
      </div>
    ),
    'verantwortlicher': (
      <div key="verantwortlicher" className="space-y-1.5">
        <Label htmlFor="verantwortlicher">{fieldLabel('aufgaben', 'verantwortlicher')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="verantwortlicher"
          placeholder="Wer ist verantwortlich?"
          items={mitarbeitendeListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorname ?? r.record_id),
          }))}
          value={extractRecordId(fields.verantwortlicher)}
          onChange={id => setFields(f => ({ ...f, verantwortlicher: id ? createRecordUrl(APP_IDS.MITARBEITENDE, id) : undefined }))}
          onCreateNew={(q) => openCreateMitarbeitende("verantwortlicher", q)}
          createLabel={t('create_in', { entity: appLabel('mitarbeitende') })}
        />
        {showErrors && !fields.verantwortlicher && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgaben', 'verantwortlicher')}</p>
        )}
      </div>
    ),
    'status': (
      <div key="status" className="space-y-1.5">
        <Label htmlFor="status">{fieldLabel('aufgaben', 'status')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.status) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, status: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="status" className="max-sm:h-11"><SelectValue placeholder="z. B. Geplant, Bereit" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="geplant">{lookupLabel('aufgaben', 'status', 'geplant') ?? 'Geplant'}</SelectItem>
            <SelectItem value="bereit">{lookupLabel('aufgaben', 'status', 'bereit') ?? 'Bereit'}</SelectItem>
            <SelectItem value="in_bearbeitung">{lookupLabel('aufgaben', 'status', 'in_bearbeitung') ?? 'In Bearbeitung'}</SelectItem>
            <SelectItem value="wartet_information">{lookupLabel('aufgaben', 'status', 'wartet_information') ?? 'Wartet auf Information'}</SelectItem>
            <SelectItem value="wartet_aufgabe">{lookupLabel('aufgaben', 'status', 'wartet_aufgabe') ?? 'Wartet auf andere Aufgabe'}</SelectItem>
            <SelectItem value="zur_pruefung">{lookupLabel('aufgaben', 'status', 'zur_pruefung') ?? 'Zur Prüfung'}</SelectItem>
            <SelectItem value="korrektur">{lookupLabel('aufgaben', 'status', 'korrektur') ?? 'Korrektur erforderlich'}</SelectItem>
            <SelectItem value="erledigt">{lookupLabel('aufgaben', 'status', 'erledigt') ?? 'Erledigt'}</SelectItem>
            <SelectItem value="abgebrochen">{lookupLabel('aufgaben', 'status', 'abgebrochen') ?? 'Abgebrochen'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.status && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('aufgaben', 'status')}</p>
        )}
      </div>
    ),
    'anforderung': (
      <div key="anforderung" className="space-y-1.5">
        <Label htmlFor="anforderung">{fieldLabel('aufgaben', 'anforderung')}</Label>
        <Combobox
          id="anforderung"
          placeholder="Welche Anforderung?"
          items={anforderungenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          value={extractRecordId(fields.anforderung)}
          onChange={id => setFields(f => ({ ...f, anforderung: id ? createRecordUrl(APP_IDS.ANFORDERUNGEN, id) : undefined }))}
          onCreateNew={(q) => openCreateAnforderungen("anforderung", q)}
          createLabel={t('create_in', { entity: appLabel('anforderungen') })}
        />
      </div>
    ),
    'klaerungspunkt': (
      <div key="klaerungspunkt" className="space-y-1.5">
        <Label htmlFor="klaerungspunkt">{fieldLabel('aufgaben', 'klaerungspunkt')}</Label>
        <Combobox
          id="klaerungspunkt"
          placeholder="Welcher Klärungspunkt?"
          items={klaerungspunkteListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.fragestellung ?? r.record_id),
          }))}
          value={extractRecordId(fields.klaerungspunkt)}
          onChange={id => setFields(f => ({ ...f, klaerungspunkt: id ? createRecordUrl(APP_IDS.KLAERUNGSPUNKTE, id) : undefined }))}
          onCreateNew={(q) => openCreateKlaerungspunkte("klaerungspunkt", q)}
          createLabel={t('create_in', { entity: appLabel('klaerungspunkte') })}
        />
      </div>
    ),
    'unterstuetzende_personen': (
      <div key="unterstuetzende_personen" className="space-y-1.5">
        <Label htmlFor="unterstuetzende_personen">{fieldLabel('aufgaben', 'unterstuetzende_personen')}</Label>
        <MultiCombobox
          id="unterstuetzende_personen"
          placeholder="Wer unterstützt?"
          items={mitarbeitendeListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorname ?? r.record_id),
          }))}
          values={extractRecordIds(fields.unterstuetzende_personen)}
          onChange={ids => setFields(f => ({ ...f, unterstuetzende_personen: ids.length ? ids.map(id => createRecordUrl(APP_IDS.MITARBEITENDE, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateMitarbeitende("unterstuetzende_personen", q)}
          createLabel={t('create_in', { entity: appLabel('mitarbeitende') })}
        />
      </div>
    ),
    'faelligkeit': (
      <div key="faelligkeit" className="space-y-1.5">
        <Label htmlFor="faelligkeit">{fieldLabel('aufgaben', 'faelligkeit')}</Label>
        <DatePicker
          id="faelligkeit"
          placeholder="Bis wann ist die Aufgabe fällig?"
          mode="date"
          value={fields.faelligkeit ?? null}
          onChange={v => setFields(f => ({ ...f, faelligkeit: v ?? undefined }))}
        />
      </div>
    ),
    'erwartetes_ergebnis': (
      <div key="erwartetes_ergebnis" className="space-y-1.5">
        <Label htmlFor="erwartetes_ergebnis">{fieldLabel('aufgaben', 'erwartetes_ergebnis')}</Label>
        <Textarea
          id="erwartetes_ergebnis"
          placeholder="Was soll am Ende vorliegen?"
          value={fields.erwartetes_ergebnis ?? ''}
          onChange={e => setFields(f => ({ ...f, erwartetes_ergebnis: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'akzeptanzkriterien': (
      <div key="akzeptanzkriterien" className="space-y-1.5">
        <Label htmlFor="akzeptanzkriterien">{fieldLabel('aufgaben', 'akzeptanzkriterien')}</Label>
        <Textarea
          id="akzeptanzkriterien"
          placeholder="Ein Kriterium pro Zeile"
          value={fields.akzeptanzkriterien ?? ''}
          onChange={e => setFields(f => ({ ...f, akzeptanzkriterien: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'pruefer': (
      <div key="pruefer" className="space-y-1.5">
        <Label htmlFor="pruefer">{fieldLabel('aufgaben', 'pruefer')}</Label>
        <Combobox
          id="pruefer"
          placeholder="Wer prüft das Ergebnis?"
          items={mitarbeitendeListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorname ?? r.record_id),
          }))}
          value={extractRecordId(fields.pruefer)}
          onChange={id => setFields(f => ({ ...f, pruefer: id ? createRecordUrl(APP_IDS.MITARBEITENDE, id) : undefined }))}
          onCreateNew={(q) => openCreateMitarbeitende("pruefer", q)}
          createLabel={t('create_in', { entity: appLabel('mitarbeitende') })}
        />
      </div>
    ),
    'ergebnisreferenz': (
      <div key="ergebnisreferenz" className="space-y-1.5">
        <Label htmlFor="ergebnisreferenz">{fieldLabel('aufgaben', 'ergebnisreferenz')}</Label>
        <Input
          id="ergebnisreferenz"
          placeholder="z. B. DOC-2026-014"
          value={fields.ergebnisreferenz ?? ''}
          onChange={e => setFields(f => ({ ...f, ergebnisreferenz: e.target.value }))}
        />
      </div>
    ),
    'abschlusszeitpunkt': (
      <div key="abschlusszeitpunkt" className="space-y-1.5">
        <Label htmlFor="abschlusszeitpunkt">{fieldLabel('aufgaben', 'abschlusszeitpunkt')}</Label>
        <DatePicker
          id="abschlusszeitpunkt"
          placeholder="Wann wurde sie abgeschlossen?"
          mode="datetime"
          value={fields.abschlusszeitpunkt ?? null}
          onChange={v => setFields(f => ({ ...f, abschlusszeitpunkt: v ?? undefined }))}
        />
      </div>
    ),
  };
  const orderedFields = applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"abhaengigkeiten": "Abhängigkeiten", "vorhaben": "Vorhaben", "titel": "Titel", "zweck": "Zweck und Beschreibung", "aufgabentyp": "Aufgabentyp", "verantwortlicher": "Verantwortlicher", "status": "Status", "anforderung": "Zugehörige Anforderung", "klaerungspunkt": "Zugehöriger Klärungspunkt", "unterstuetzende_personen": "Unterstützende Personen", "faelligkeit": "Fälligkeit", "erwartetes_ergebnis": "Erwartetes Ergebnis", "akzeptanzkriterien": "Akzeptanzkriterien", "pruefer": "Prüfer", "ergebnisreferenz": "Ergebnisreferenz", "abschlusszeitpunkt": "Abschlusszeitpunkt"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"abhaengigkeiten": {"abhaengigkeiten": "Abhängigkeiten", "vorhaben": "Vorhaben", "titel": "Titel", "zweck": "Zweck und Beschreibung", "aufgabentyp": "Aufgabentyp", "verantwortlicher": "Verantwortlicher", "status": "Status", "anforderung": "Zugehörige Anforderung", "klaerungspunkt": "Zugehöriger Klärungspunkt", "unterstuetzende_personen": "Unterstützende Personen", "faelligkeit": "Fälligkeit", "erwartetes_ergebnis": "Erwartetes Ergebnis", "akzeptanzkriterien": "Akzeptanzkriterien", "pruefer": "Prüfer", "ergebnisreferenz": "Ergebnisreferenz", "abschlusszeitpunkt": "Abschlusszeitpunkt"}, "vorhaben": {"vorhaben_nummer": "Vorhaben-Nummer", "titel": "Titel", "anfragebeschreibung": "Beschreibung der Anfrage", "kunde": "Kunde", "eingangsdatum": "Eingangsdatum", "anfragequelle": "Anfragequelle", "aufklaerungsverantwortlicher": "Aufklärungsverantwortlicher", "aufklaerungsstatus": "Aufklärungsstatus", "vertraulichkeit": "Vertraulichkeitsstufe", "qualitaetsstatus": "Qualitätsstatus", "freigabestatus": "Freigabestatus", "kundenkontakt": "Kundenkontakt", "produkt": "Produkt oder Produktgruppe", "kundenreferenz": "Kundenreferenz", "zieltermin_intern": "Interner Zieltermin", "wunschtermin": "Gewünschter Liefer- oder Antworttermin", "technischer_hauptverantwortlicher": "Technischer Hauptverantwortlicher", "prioritaet": "Priorität", "erp_crm_referenz": "Interne ERP- oder CRM-Referenz"}, "verantwortlicher": {"vorname": "Vorname", "nachname": "Nachname", "email": "E-Mail", "telefon": "Telefon", "abteilung": "Abteilung", "rolle": "Rolle", "aktiv": "Aktiv"}, "anforderung": {"vorhaben": "Vorhaben", "titel": "Titel", "beschreibung": "Beschreibung", "kategorie": "Kategorie", "anforderungsart": "Anforderungsart", "verbindlichkeit": "Verbindlichkeit", "kritikalitaet": "Kritikalität", "status": "Status", "quelle": "Quelle", "fachliche_grundlage": "Dokumentierte fachliche Grundlage", "quellenstelle": "Quellenstelle", "pruefer": "Verantwortlicher Prüfer", "akzeptanzkriterium": "Akzeptanzkriterium", "nachweisverfahren": "Nachweisverfahren", "fachliche_bewertung": "Fachliche Bewertung", "bestaetiger": "Bestätiger", "bestaetigungszeitpunkt": "Bestätigungszeitpunkt", "version": "Version", "aenderungsgrund": "Änderungsgrund"}, "klaerungspunkt": {"vorhaben": "Vorhaben", "fragestellung": "Fragestellung", "anlass": "Anlass", "kritikalitaet": "Kritikalität", "verantwortlicher": "Verantwortlicher", "status": "Status", "betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_quellen": "Betroffene Quellen", "adressat": "Adressat", "faelligkeit": "Fälligkeit", "vorgeschlagene_antwort": "Vorgeschlagene Antwort", "bestaetigte_antwort": "Bestätigte Antwort", "antwortquelle": "Antwortquelle", "fachlicher_pruefer": "Fachlicher Prüfer"}, "unterstuetzende_personen": {"vorname": "Vorname", "nachname": "Nachname", "email": "E-Mail", "telefon": "Telefon", "abteilung": "Abteilung", "rolle": "Rolle", "aktiv": "Aktiv"}, "pruefer": {"vorname": "Vorname", "nachname": "Nachname", "email": "E-Mail", "telefon": "Telefon", "abteilung": "Abteilung", "rolle": "Rolle", "aktiv": "Aktiv"}};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                // A field the plan gives to a TOOL. On CREATE it is not shown
                // at all — the value does not exist yet and typing one only
                // gets overwritten. On EDIT it stays a normal input with a
                // note: when a tool could not compose its value (a missing
                // ingredient), this is the only place to repair the record.
                if (SYSTEM_ASSIGNED.includes(k) && !recordId) {
                  return (
                    <div key={k} className="space-y-1.5 min-w-0">
                      <Label>{fieldLabel('aufgaben', k)}</Label>
                      <p className="text-sm text-muted-foreground">{t('assigned_by_system')}</p>
                    </div>
                  );
                }
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {SYSTEM_ASSIGNED.includes(k) && (
                      <p className="text-xs text-muted-foreground">{t('assigned_by_system')}</p>
                    )}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.AUFGABEN} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {createVorhabenOpen && (
      <VorhabenDialog
        open={createVorhabenOpen}
        onClose={() => setCreateVorhabenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createVorhabenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Vorhaben;
            setExtraVorhaben(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.VORHABEN, result.id);
            setFields(prev => ({ ...prev, [createVorhabenField]: url } as any));
          }
          setCreateVorhabenOpen(false);
        }}
        defaultValues={createVorhabenInitial
          ? ({ vorhaben_nummer: createVorhabenInitial } as any)
          : undefined}
        mitarbeitendeList={mitarbeitendeList}
      />
    )}
    {createMitarbeitendeOpen && (
      <MitarbeitendeDialog
        open={createMitarbeitendeOpen}
        onClose={() => setCreateMitarbeitendeOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createMitarbeitendeEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Mitarbeitende;
            setExtraMitarbeitende(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.MITARBEITENDE, result.id);
            setFields(prev => ({ ...prev, [createMitarbeitendeField]: url } as any));
          }
          setCreateMitarbeitendeOpen(false);
        }}
        defaultValues={createMitarbeitendeInitial
          ? ({ vorname: createMitarbeitendeInitial } as any)
          : undefined}
      />
    )}
    {createAnforderungenOpen && (
      <AnforderungenDialog
        open={createAnforderungenOpen}
        onClose={() => setCreateAnforderungenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createAnforderungenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Anforderungen;
            setExtraAnforderungen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.ANFORDERUNGEN, result.id);
            setFields(prev => ({ ...prev, [createAnforderungenField]: url } as any));
          }
          setCreateAnforderungenOpen(false);
        }}
        defaultValues={createAnforderungenInitial
          ? ({ titel: createAnforderungenInitial } as any)
          : undefined}
        vorhabenList={vorhabenList}
        quellenList={[]}
        mitarbeitendeList={mitarbeitendeList}
      />
    )}
    {createKlaerungspunkteOpen && (
      <KlaerungspunkteDialog
        open={createKlaerungspunkteOpen}
        onClose={() => setCreateKlaerungspunkteOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createKlaerungspunkteEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Klaerungspunkte;
            setExtraKlaerungspunkte(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.KLAERUNGSPUNKTE, result.id);
            setFields(prev => ({ ...prev, [createKlaerungspunkteField]: url } as any));
          }
          setCreateKlaerungspunkteOpen(false);
        }}
        defaultValues={createKlaerungspunkteInitial
          ? ({ fragestellung: createKlaerungspunkteInitial } as any)
          : undefined}
        vorhabenList={vorhabenList}
        mitarbeitendeList={mitarbeitendeList}
        anforderungenList={anforderungenList}
        quellenList={[]}
      />
    )}
    </>
  );
}