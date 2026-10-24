/**
 * VorhabenDialog — pre-generated create/edit dialog for Vorhaben.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * mitarbeitendeList (full hook array — resolves the Mitarbeitende applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * VorhabenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Vorhaben['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<VorhabenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Vorhaben, Mitarbeitende, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Vorhaben';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/Combobox';
import { MitarbeitendeDialog } from '@/components/dialogs/MitarbeitendeDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for VorhabenDialog.defaultValues — see file header. */
export type VorhabenDialogDefaults = Omit<Vorhaben['fields'], 'anfragequelle' | 'aufklaerungsstatus' | 'vertraulichkeit' | 'qualitaetsstatus' | 'freigabestatus' | 'prioritaet'> & {
    anfragequelle?: LookupValue | string;
    aufklaerungsstatus?: LookupValue | string;
    vertraulichkeit?: LookupValue | string;
    qualitaetsstatus?: LookupValue | string;
    freigabestatus?: LookupValue | string;
    prioritaet?: LookupValue | string;
  };

interface VorhabenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Vorhaben['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: VorhabenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  mitarbeitendeList: Mitarbeitende[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  anfragequelle: LOOKUP_OPTIONS['vorhaben']?.['anfragequelle'] ?? [],
  aufklaerungsstatus: LOOKUP_OPTIONS['vorhaben']?.['aufklaerungsstatus'] ?? [],
  vertraulichkeit: LOOKUP_OPTIONS['vorhaben']?.['vertraulichkeit'] ?? [],
  qualitaetsstatus: LOOKUP_OPTIONS['vorhaben']?.['qualitaetsstatus'] ?? [],
  freigabestatus: LOOKUP_OPTIONS['vorhaben']?.['freigabestatus'] ?? [],
  prioritaet: LOOKUP_OPTIONS['vorhaben']?.['prioritaet'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  aufklaerungsverantwortlicher: APP_IDS.MITARBEITENDE,
  technischer_hauptverantwortlicher: APP_IDS.MITARBEITENDE,
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

export function VorhabenDialog({ open, onClose, onSubmit, defaultValues, recordId, mitarbeitendeList, enablePhotoScan = true, enablePhotoLocation = true }: VorhabenDialogProps) {
  const [fields, setFields] = useState<Partial<Vorhaben['fields']>>({});
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
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = ["vorhaben_nummer"];
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['titel', 'anfragebeschreibung', 'kunde', 'eingangsdatum', 'anfragequelle', 'aufklaerungsverantwortlicher', 'aufklaerungsstatus', 'vertraulichkeit'] as const;
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
      'aufklaerungsverantwortlicher': mitarbeitendeList,
      'technischer_hauptverantwortlicher': mitarbeitendeList,
    },
  }), [mitarbeitendeList, mitarbeitendeList, ]);
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
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Vorhaben['fields']>);
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
      const clean = cleanFieldsForApi(merged, 'vorhaben');
      await onSubmit(clean as Vorhaben['fields']);
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
      contextParts.push(`<available-records field="aufklaerungsverantwortlicher" entity="Mitarbeitende">\n${JSON.stringify(mitarbeitendeList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="technischer_hauptverantwortlicher" entity="Mitarbeitende">\n${JSON.stringify(mitarbeitendeList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "vorhaben_nummer": string | null, // Vorhaben-Nummer\n  "titel": string | null, // Titel\n  "anfragebeschreibung": string | null, // Beschreibung der Anfrage\n  "kunde": string | null, // Kunde\n  "eingangsdatum": string | null, // YYYY-MM-DD\n  "anfragequelle": LookupValue | null, // Anfragequelle (select one key: "email" | "telefon" | "portal" | "vertrieb" | "persoenlich" | "sonstige") mapping: email=E-Mail, telefon=Telefon, portal=Portal, vertrieb=Vertrieb, persoenlich=Persönlich, sonstige=Sonstige\n  "aufklaerungsverantwortlicher": string | null, // Display name from Mitarbeitende (see <available-records>)\n  "aufklaerungsstatus": LookupValue | null, // Aufklärungsstatus (select one key: "neu" | "in_triage" | "in_aufklaerung" | "wartet" | "in_pruefung" | "freigabe_ausstehend" | "freigegeben" | "abgeschlossen" | "zurueckgestellt" | "abgebrochen") mapping: neu=Neu, in_triage=In Triage, in_aufklaerung=In Aufklärung, wartet=Wartet auf Beitrag oder Information, in_pruefung=In Prüfung, freigabe_ausstehend=Freigabe ausstehend, freigegeben=Freigegeben, abgeschlossen=Abgeschlossen, zurueckgestellt=Zurückgestellt, abgebrochen=Abgebrochen\n  "vertraulichkeit": LookupValue | null, // Vertraulichkeitsstufe (select one key: "oeffentlich" | "intern" | "vertraulich" | "streng_vertraulich") mapping: oeffentlich=Öffentlich, intern=Intern, vertraulich=Vertraulich, streng_vertraulich=Streng vertraulich\n  "qualitaetsstatus": LookupValue | null, // Qualitätsstatus (select one key: "nicht_geprueft" | "bestanden" | "mit_warnungen" | "fehlgeschlagen") mapping: nicht_geprueft=Nicht geprüft, bestanden=Prüfung bestanden, mit_warnungen=Prüfung mit Warnungen bestanden, fehlgeschlagen=Prüfung fehlgeschlagen\n  "freigabestatus": LookupValue | null, // Freigabestatus (select one key: "nicht_freigabefaehig" | "pruefung_moeglich" | "ausstehend" | "freigegeben") mapping: nicht_freigabefaehig=Nicht freigabefähig, pruefung_moeglich=Freigabeprüfung möglich, ausstehend=Freigabe ausstehend, freigegeben=Freigegeben\n  "kundenkontakt": string | null, // Kundenkontakt\n  "produkt": string | null, // Produkt oder Produktgruppe\n  "kundenreferenz": string | null, // Kundenreferenz\n  "zieltermin_intern": string | null, // YYYY-MM-DD\n  "wunschtermin": string | null, // YYYY-MM-DD\n  "technischer_hauptverantwortlicher": string | null, // Display name from Mitarbeitende (see <available-records>)\n  "prioritaet": LookupValue | null, // Priorität (select one key: "niedrig" | "normal" | "hoch" | "dringend") mapping: niedrig=Niedrig, normal=Normal, hoch=Hoch, dringend=Dringend\n  "erp_crm_referenz": string | null, // Interne ERP- oder CRM-Referenz\n}`;
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
        const applookupKeys = new Set<string>(["aufklaerungsverantwortlicher", "technischer_hauptverantwortlicher"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const aufklaerungsverantwortlicherName = raw['aufklaerungsverantwortlicher'] as string | null;
        if (aufklaerungsverantwortlicherName) {
          const aufklaerungsverantwortlicherMatch = mitarbeitendeList.find(r => matchName(aufklaerungsverantwortlicherName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (aufklaerungsverantwortlicherMatch) merged['aufklaerungsverantwortlicher'] = createRecordUrl(APP_IDS.MITARBEITENDE, aufklaerungsverantwortlicherMatch.record_id);
        }
        const technischer_hauptverantwortlicherName = raw['technischer_hauptverantwortlicher'] as string | null;
        if (technischer_hauptverantwortlicherName) {
          const technischer_hauptverantwortlicherMatch = mitarbeitendeList.find(r => matchName(technischer_hauptverantwortlicherName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (technischer_hauptverantwortlicherMatch) merged['technischer_hauptverantwortlicher'] = createRecordUrl(APP_IDS.MITARBEITENDE, technischer_hauptverantwortlicherMatch.record_id);
        }
        return merged as Partial<Vorhaben['fields']>;
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
    ? t('edit_entity', { entity: appLabel('vorhaben') })
    : t('new_entity', { entity: appLabel('vorhaben') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'vorhaben_nummer': (
      <div key="vorhaben_nummer" className="space-y-1.5">
        <Label htmlFor="vorhaben_nummer">{fieldLabel('vorhaben', 'vorhaben_nummer')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="vorhaben_nummer"
          placeholder="z. B. VH-2026-001"
          value={fields.vorhaben_nummer ?? ''}
          onChange={e => setFields(f => ({ ...f, vorhaben_nummer: e.target.value }))}
          required
        />
        {showErrors && !fields.vorhaben_nummer && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('vorhaben', 'vorhaben_nummer')}</p>
        )}
      </div>
    ),
    'titel': (
      <div key="titel" className="space-y-1.5">
        <Label htmlFor="titel">{fieldLabel('vorhaben', 'titel')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="titel"
          placeholder="z. B. Sonderanfertigung Gehäuse"
          value={fields.titel ?? ''}
          onChange={e => setFields(f => ({ ...f, titel: e.target.value }))}
          required
        />
        {showErrors && !fields.titel && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('vorhaben', 'titel')}</p>
        )}
      </div>
    ),
    'anfragebeschreibung': (
      <div key="anfragebeschreibung" className="space-y-1.5">
        <Label htmlFor="anfragebeschreibung">{fieldLabel('vorhaben', 'anfragebeschreibung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="anfragebeschreibung"
          placeholder="Was wird angefragt?"
          value={fields.anfragebeschreibung ?? ''}
          onChange={e => setFields(f => ({ ...f, anfragebeschreibung: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.anfragebeschreibung && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('vorhaben', 'anfragebeschreibung')}</p>
        )}
      </div>
    ),
    'kunde': (
      <div key="kunde" className="space-y-1.5">
        <Label htmlFor="kunde">{fieldLabel('vorhaben', 'kunde')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="kunde"
          placeholder="z. B. Müller GmbH"
          value={fields.kunde ?? ''}
          onChange={e => setFields(f => ({ ...f, kunde: e.target.value }))}
          required
        />
        {showErrors && !fields.kunde && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('vorhaben', 'kunde')}</p>
        )}
      </div>
    ),
    'eingangsdatum': (
      <div key="eingangsdatum" className="space-y-1.5">
        <Label htmlFor="eingangsdatum">{fieldLabel('vorhaben', 'eingangsdatum')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="eingangsdatum"
          placeholder="Wann ging die Anfrage ein?"
          mode="date"
          value={fields.eingangsdatum ?? null}
          onChange={v => setFields(f => ({ ...f, eingangsdatum: v ?? undefined }))}
          required
        />
        {showErrors && !fields.eingangsdatum && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('vorhaben', 'eingangsdatum')}</p>
        )}
      </div>
    ),
    'anfragequelle': (
      <div key="anfragequelle" className="space-y-1.5">
        <Label htmlFor="anfragequelle">{fieldLabel('vorhaben', 'anfragequelle')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.anfragequelle) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, anfragequelle: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="anfragequelle" className="max-sm:h-11"><SelectValue placeholder="z. B. E-Mail, Telefon" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="email">{lookupLabel('vorhaben', 'anfragequelle', 'email') ?? 'E-Mail'}</SelectItem>
            <SelectItem value="telefon">{lookupLabel('vorhaben', 'anfragequelle', 'telefon') ?? 'Telefon'}</SelectItem>
            <SelectItem value="portal">{lookupLabel('vorhaben', 'anfragequelle', 'portal') ?? 'Portal'}</SelectItem>
            <SelectItem value="vertrieb">{lookupLabel('vorhaben', 'anfragequelle', 'vertrieb') ?? 'Vertrieb'}</SelectItem>
            <SelectItem value="persoenlich">{lookupLabel('vorhaben', 'anfragequelle', 'persoenlich') ?? 'Persönlich'}</SelectItem>
            <SelectItem value="sonstige">{lookupLabel('vorhaben', 'anfragequelle', 'sonstige') ?? 'Sonstige'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.anfragequelle && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('vorhaben', 'anfragequelle')}</p>
        )}
      </div>
    ),
    'aufklaerungsverantwortlicher': (
      <div key="aufklaerungsverantwortlicher" className="space-y-1.5">
        <Label htmlFor="aufklaerungsverantwortlicher">{fieldLabel('vorhaben', 'aufklaerungsverantwortlicher')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="aufklaerungsverantwortlicher"
          placeholder="Wer klärt auf?"
          items={mitarbeitendeListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorname ?? r.record_id),
          }))}
          value={extractRecordId(fields.aufklaerungsverantwortlicher)}
          onChange={id => setFields(f => ({ ...f, aufklaerungsverantwortlicher: id ? createRecordUrl(APP_IDS.MITARBEITENDE, id) : undefined }))}
          onCreateNew={(q) => openCreateMitarbeitende("aufklaerungsverantwortlicher", q)}
          createLabel={t('create_in', { entity: appLabel('mitarbeitende') })}
        />
        {showErrors && !fields.aufklaerungsverantwortlicher && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('vorhaben', 'aufklaerungsverantwortlicher')}</p>
        )}
      </div>
    ),
    'aufklaerungsstatus': (
      <div key="aufklaerungsstatus" className="space-y-1.5">
        <Label htmlFor="aufklaerungsstatus">{fieldLabel('vorhaben', 'aufklaerungsstatus')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.aufklaerungsstatus) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, aufklaerungsstatus: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="aufklaerungsstatus" className="max-sm:h-11"><SelectValue placeholder="z. B. Neu, In Prüfung" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="neu">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'neu') ?? 'Neu'}</SelectItem>
            <SelectItem value="in_triage">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'in_triage') ?? 'In Triage'}</SelectItem>
            <SelectItem value="in_aufklaerung">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'in_aufklaerung') ?? 'In Aufklärung'}</SelectItem>
            <SelectItem value="wartet">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'wartet') ?? 'Wartet auf Beitrag oder Information'}</SelectItem>
            <SelectItem value="in_pruefung">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'in_pruefung') ?? 'In Prüfung'}</SelectItem>
            <SelectItem value="freigabe_ausstehend">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'freigabe_ausstehend') ?? 'Freigabe ausstehend'}</SelectItem>
            <SelectItem value="freigegeben">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'freigegeben') ?? 'Freigegeben'}</SelectItem>
            <SelectItem value="abgeschlossen">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'abgeschlossen') ?? 'Abgeschlossen'}</SelectItem>
            <SelectItem value="zurueckgestellt">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'zurueckgestellt') ?? 'Zurückgestellt'}</SelectItem>
            <SelectItem value="abgebrochen">{lookupLabel('vorhaben', 'aufklaerungsstatus', 'abgebrochen') ?? 'Abgebrochen'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.aufklaerungsstatus && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('vorhaben', 'aufklaerungsstatus')}</p>
        )}
      </div>
    ),
    'vertraulichkeit': (
      <div key="vertraulichkeit" className="space-y-1.5">
        <Label htmlFor="vertraulichkeit">{fieldLabel('vorhaben', 'vertraulichkeit')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.vertraulichkeit) === 'oeffentlich'}
            onClick={() => setFields(f => ({ ...f, vertraulichkeit: (lookupKey(f.vertraulichkeit) === 'oeffentlich' ? undefined : 'oeffentlich') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.vertraulichkeit) === 'oeffentlich'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'vertraulichkeit', 'oeffentlich') ?? 'Öffentlich'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.vertraulichkeit) === 'intern'}
            onClick={() => setFields(f => ({ ...f, vertraulichkeit: (lookupKey(f.vertraulichkeit) === 'intern' ? undefined : 'intern') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.vertraulichkeit) === 'intern'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'vertraulichkeit', 'intern') ?? 'Intern'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.vertraulichkeit) === 'vertraulich'}
            onClick={() => setFields(f => ({ ...f, vertraulichkeit: (lookupKey(f.vertraulichkeit) === 'vertraulich' ? undefined : 'vertraulich') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.vertraulichkeit) === 'vertraulich'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'vertraulichkeit', 'vertraulich') ?? 'Vertraulich'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.vertraulichkeit) === 'streng_vertraulich'}
            onClick={() => setFields(f => ({ ...f, vertraulichkeit: (lookupKey(f.vertraulichkeit) === 'streng_vertraulich' ? undefined : 'streng_vertraulich') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.vertraulichkeit) === 'streng_vertraulich'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'vertraulichkeit', 'streng_vertraulich') ?? 'Streng vertraulich'}
          </button>
        </div>
        {showErrors && !fields.vertraulichkeit && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('vorhaben', 'vertraulichkeit')}</p>
        )}
      </div>
    ),
    'qualitaetsstatus': (
      <div key="qualitaetsstatus" className="space-y-1.5">
        <Label htmlFor="qualitaetsstatus">{fieldLabel('vorhaben', 'qualitaetsstatus')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.qualitaetsstatus) === 'nicht_geprueft'}
            onClick={() => setFields(f => ({ ...f, qualitaetsstatus: (lookupKey(f.qualitaetsstatus) === 'nicht_geprueft' ? undefined : 'nicht_geprueft') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.qualitaetsstatus) === 'nicht_geprueft'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'qualitaetsstatus', 'nicht_geprueft') ?? 'Nicht geprüft'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.qualitaetsstatus) === 'bestanden'}
            onClick={() => setFields(f => ({ ...f, qualitaetsstatus: (lookupKey(f.qualitaetsstatus) === 'bestanden' ? undefined : 'bestanden') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.qualitaetsstatus) === 'bestanden'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'qualitaetsstatus', 'bestanden') ?? 'Prüfung bestanden'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.qualitaetsstatus) === 'mit_warnungen'}
            onClick={() => setFields(f => ({ ...f, qualitaetsstatus: (lookupKey(f.qualitaetsstatus) === 'mit_warnungen' ? undefined : 'mit_warnungen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.qualitaetsstatus) === 'mit_warnungen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'qualitaetsstatus', 'mit_warnungen') ?? 'Prüfung mit Warnungen bestanden'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.qualitaetsstatus) === 'fehlgeschlagen'}
            onClick={() => setFields(f => ({ ...f, qualitaetsstatus: (lookupKey(f.qualitaetsstatus) === 'fehlgeschlagen' ? undefined : 'fehlgeschlagen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.qualitaetsstatus) === 'fehlgeschlagen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'qualitaetsstatus', 'fehlgeschlagen') ?? 'Prüfung fehlgeschlagen'}
          </button>
        </div>
      </div>
    ),
    'freigabestatus': (
      <div key="freigabestatus" className="space-y-1.5">
        <Label htmlFor="freigabestatus">{fieldLabel('vorhaben', 'freigabestatus')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.freigabestatus) === 'nicht_freigabefaehig'}
            onClick={() => setFields(f => ({ ...f, freigabestatus: (lookupKey(f.freigabestatus) === 'nicht_freigabefaehig' ? undefined : 'nicht_freigabefaehig') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.freigabestatus) === 'nicht_freigabefaehig'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'freigabestatus', 'nicht_freigabefaehig') ?? 'Nicht freigabefähig'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.freigabestatus) === 'pruefung_moeglich'}
            onClick={() => setFields(f => ({ ...f, freigabestatus: (lookupKey(f.freigabestatus) === 'pruefung_moeglich' ? undefined : 'pruefung_moeglich') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.freigabestatus) === 'pruefung_moeglich'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'freigabestatus', 'pruefung_moeglich') ?? 'Freigabeprüfung möglich'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.freigabestatus) === 'ausstehend'}
            onClick={() => setFields(f => ({ ...f, freigabestatus: (lookupKey(f.freigabestatus) === 'ausstehend' ? undefined : 'ausstehend') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.freigabestatus) === 'ausstehend'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'freigabestatus', 'ausstehend') ?? 'Freigabe ausstehend'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.freigabestatus) === 'freigegeben'}
            onClick={() => setFields(f => ({ ...f, freigabestatus: (lookupKey(f.freigabestatus) === 'freigegeben' ? undefined : 'freigegeben') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.freigabestatus) === 'freigegeben'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'freigabestatus', 'freigegeben') ?? 'Freigegeben'}
          </button>
        </div>
      </div>
    ),
    'kundenkontakt': (
      <div key="kundenkontakt" className="space-y-1.5">
        <Label htmlFor="kundenkontakt">{fieldLabel('vorhaben', 'kundenkontakt')}</Label>
        <Input
          id="kundenkontakt"
          placeholder="z. B. Anna Schmidt"
          value={fields.kundenkontakt ?? ''}
          onChange={e => setFields(f => ({ ...f, kundenkontakt: e.target.value }))}
        />
      </div>
    ),
    'produkt': (
      <div key="produkt" className="space-y-1.5">
        <Label htmlFor="produkt">{fieldLabel('vorhaben', 'produkt')}</Label>
        <Input
          id="produkt"
          placeholder="z. B. Hydraulikventile"
          value={fields.produkt ?? ''}
          onChange={e => setFields(f => ({ ...f, produkt: e.target.value }))}
        />
      </div>
    ),
    'kundenreferenz': (
      <div key="kundenreferenz" className="space-y-1.5">
        <Label htmlFor="kundenreferenz">{fieldLabel('vorhaben', 'kundenreferenz')}</Label>
        <Input
          id="kundenreferenz"
          placeholder="z. B. Anfrage 4711"
          value={fields.kundenreferenz ?? ''}
          onChange={e => setFields(f => ({ ...f, kundenreferenz: e.target.value }))}
        />
      </div>
    ),
    'zieltermin_intern': (
      <div key="zieltermin_intern" className="space-y-1.5">
        <Label htmlFor="zieltermin_intern">{fieldLabel('vorhaben', 'zieltermin_intern')}</Label>
        <DatePicker
          id="zieltermin_intern"
          placeholder="Bis wann intern fertig?"
          mode="date"
          value={fields.zieltermin_intern ?? null}
          onChange={v => setFields(f => ({ ...f, zieltermin_intern: v ?? undefined }))}
        />
      </div>
    ),
    'wunschtermin': (
      <div key="wunschtermin" className="space-y-1.5">
        <Label htmlFor="wunschtermin">{fieldLabel('vorhaben', 'wunschtermin')}</Label>
        <DatePicker
          id="wunschtermin"
          placeholder="Wann wünscht der Kunde Antwort?"
          mode="date"
          value={fields.wunschtermin ?? null}
          onChange={v => setFields(f => ({ ...f, wunschtermin: v ?? undefined }))}
        />
      </div>
    ),
    'technischer_hauptverantwortlicher': (
      <div key="technischer_hauptverantwortlicher" className="space-y-1.5">
        <Label htmlFor="technischer_hauptverantwortlicher">{fieldLabel('vorhaben', 'technischer_hauptverantwortlicher')}</Label>
        <Combobox
          id="technischer_hauptverantwortlicher"
          placeholder="Wer ist technisch zuständig?"
          items={mitarbeitendeListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorname ?? r.record_id),
          }))}
          value={extractRecordId(fields.technischer_hauptverantwortlicher)}
          onChange={id => setFields(f => ({ ...f, technischer_hauptverantwortlicher: id ? createRecordUrl(APP_IDS.MITARBEITENDE, id) : undefined }))}
          onCreateNew={(q) => openCreateMitarbeitende("technischer_hauptverantwortlicher", q)}
          createLabel={t('create_in', { entity: appLabel('mitarbeitende') })}
        />
      </div>
    ),
    'prioritaet': (
      <div key="prioritaet" className="space-y-1.5">
        <Label htmlFor="prioritaet">{fieldLabel('vorhaben', 'prioritaet')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'niedrig'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'niedrig' ? undefined : 'niedrig') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'niedrig'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'prioritaet', 'niedrig') ?? 'Niedrig'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'normal'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'normal' ? undefined : 'normal') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'normal'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'prioritaet', 'normal') ?? 'Normal'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'hoch'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'hoch' ? undefined : 'hoch') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'hoch'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'prioritaet', 'hoch') ?? 'Hoch'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'dringend'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'dringend' ? undefined : 'dringend') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'dringend'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('vorhaben', 'prioritaet', 'dringend') ?? 'Dringend'}
          </button>
        </div>
      </div>
    ),
    'erp_crm_referenz': (
      <div key="erp_crm_referenz" className="space-y-1.5">
        <Label htmlFor="erp_crm_referenz">{fieldLabel('vorhaben', 'erp_crm_referenz')}</Label>
        <Input
          id="erp_crm_referenz"
          placeholder="z. B. CRM-10234"
          value={fields.erp_crm_referenz ?? ''}
          onChange={e => setFields(f => ({ ...f, erp_crm_referenz: e.target.value }))}
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
  const FIELD_LABELS: Record<string, string> = {"vorhaben_nummer": "Vorhaben-Nummer", "titel": "Titel", "anfragebeschreibung": "Beschreibung der Anfrage", "kunde": "Kunde", "eingangsdatum": "Eingangsdatum", "anfragequelle": "Anfragequelle", "aufklaerungsverantwortlicher": "Aufklärungsverantwortlicher", "aufklaerungsstatus": "Aufklärungsstatus", "vertraulichkeit": "Vertraulichkeitsstufe", "qualitaetsstatus": "Qualitätsstatus", "freigabestatus": "Freigabestatus", "kundenkontakt": "Kundenkontakt", "produkt": "Produkt oder Produktgruppe", "kundenreferenz": "Kundenreferenz", "zieltermin_intern": "Interner Zieltermin", "wunschtermin": "Gewünschter Liefer- oder Antworttermin", "technischer_hauptverantwortlicher": "Technischer Hauptverantwortlicher", "prioritaet": "Priorität", "erp_crm_referenz": "Interne ERP- oder CRM-Referenz"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"aufklaerungsverantwortlicher": {"vorname": "Vorname", "nachname": "Nachname", "email": "E-Mail", "telefon": "Telefon", "abteilung": "Abteilung", "rolle": "Rolle", "aktiv": "Aktiv"}, "technischer_hauptverantwortlicher": {"vorname": "Vorname", "nachname": "Nachname", "email": "E-Mail", "telefon": "Telefon", "abteilung": "Abteilung", "rolle": "Rolle", "aktiv": "Aktiv"}};
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
                      <Label>{fieldLabel('vorhaben', k)}</Label>
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
                <AttachmentsSection appId={APP_IDS.VORHABEN} recordId={recordId} />
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
    </>
  );
}