import type { Risiken, Vorhaben, Anforderungen, Mitarbeitende, Erfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface RisikenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Risiken;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Anforderungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  anforderungenList: Anforderungen[];
  /** Reserviert — Anforderungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenAnforderungen?: (record: Anforderungen) => void;
  /** N:1-Ziel „Mitarbeitende": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeitendeList: Mitarbeitende[];
  /** Klick auf die Mitarbeitende-Relation → overlay.push auf dessen Detail. */
  onOpenMitarbeitende?: (record: Mitarbeitende) => void;
  /** 1:N „Erfahrungen" (risiken): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Erfahrungen-Datensatz. */
  onPickErfahrungen?: () => void;
}

export function RisikenDetails({
  record,
  vorhabenList,
  onOpenVorhaben,
  anforderungenList,
  mitarbeitendeList,
  onOpenMitarbeitende,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  onPickErfahrungen,
}: RisikenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const massnahmenverantwortlicherTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.massnahmenverantwortlicher));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('risiken', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('risiken', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('risiken', 'wahrscheinlichkeit')} value={record.fields.wahrscheinlichkeit} format="pill" />
        <RecordField label={fieldLabel('risiken', 'auswirkung')} value={record.fields.auswirkung} format="pill" />
        <RecordField label={fieldLabel('risiken', 'risikoklasse')} value={record.fields.risikoklasse} format="pill" />
        <RecordField label={fieldLabel('risiken', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('risiken', 'ursache')} value={record.fields.ursache} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('risiken', 'betroffene_anforderungen')} value={Array.isArray(record.fields.betroffene_anforderungen) ? record.fields.betroffene_anforderungen.map((u: unknown) => anforderungenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('risiken', 'belege')} value={record.fields.belege} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('risiken', 'massnahmen')} value={record.fields.massnahmen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('risiken', 'faelligkeit')} value={record.fields.faelligkeit} format="date" />
        <RecordField label={fieldLabel('risiken', 'restrisiko')} value={record.fields.restrisiko} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('risiken', 'freigabe_erforderlich')} value={record.fields.freigabe_erforderlich} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('risiken', 'vorhaben')}
          name={vorhabenTarget?.fields.vorhaben_nummer ?? '—'}
          meta={[vorhabenTarget?.fields.titel, vorhabenTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('risiken', 'massnahmenverantwortlicher')}
          name={massnahmenverantwortlicherTarget?.fields.vorname ?? '—'}
          meta={[massnahmenverantwortlicherTarget?.fields.email, massnahmenverantwortlicherTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={massnahmenverantwortlicherTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(massnahmenverantwortlicherTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => Array.isArray(r.fields.risiken) && r.fields.risiken.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: r.fields.naechster_pruefttermin })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        onPick={onPickErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.RISIKEN} recordId={record.record_id} readOnly={!perms.canWrite('risiken')} />
    </>
  );
}
