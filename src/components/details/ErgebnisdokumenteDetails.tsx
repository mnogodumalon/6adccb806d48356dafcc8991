import type { Ergebnisdokumente, Vorhaben, Mitarbeitende } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { usePermissions } from '@/lib/permissions';

export interface ErgebnisdokumenteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Ergebnisdokumente;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Mitarbeitende": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeitendeList: Mitarbeitende[];
  /** Klick auf die Mitarbeitende-Relation → overlay.push auf dessen Detail. */
  onOpenMitarbeitende?: (record: Mitarbeitende) => void;
  /** N:1-Ziel „Ergebnisdokumente": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  ergebnisdokumenteList: Ergebnisdokumente[];
  /** Klick auf die Ergebnisdokumente-Relation → overlay.push auf dessen Detail. */
  onOpenErgebnisdokumente?: (record: Ergebnisdokumente) => void;
}

export function ErgebnisdokumenteDetails({
  record,
  vorhabenList,
  onOpenVorhaben,
  mitarbeitendeList,
  onOpenMitarbeitende,
  ergebnisdokumenteList,
  onOpenErgebnisdokumente,
}: ErgebnisdokumenteDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const freigeberTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.freigeber));
  const vorgaengerversionTarget = ergebnisdokumenteList.find(r => r.record_id === extractRecordId(record.fields.vorgaengerversion));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('ergebnisdokumente', 'dokumenttyp')} value={record.fields.dokumenttyp} format="pill" />
        <RecordField label={fieldLabel('ergebnisdokumente', 'version')} value={record.fields.version} format="text" />
        <RecordField label={fieldLabel('ergebnisdokumente', 'erstellungszeitpunkt')} value={record.fields.erstellungszeitpunkt} format="datetime" />
        <RecordField label={fieldLabel('ergebnisdokumente', 'datenstand')} value={record.fields.datenstand} format="text" />
        <RecordField label={fieldLabel('ergebnisdokumente', 'inhalt')} value={record.fields.inhalt} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('ergebnisdokumente', 'pruefstatus')} value={record.fields.pruefstatus} format="pill" />
        <RecordField label={fieldLabel('ergebnisdokumente', 'freigabestatus')} value={record.fields.freigabestatus} format="pill" />
        <RecordField label={fieldLabel('ergebnisdokumente', 'pdf_datei')} className="md:col-span-2">
          {record.fields.pdf_datei ? (
            <MediaThumbnail src={record.fields.pdf_datei as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('ergebnisdokumente', 'freigabezeitpunkt')} value={record.fields.freigabezeitpunkt} format="datetime" />
        <RecordField label={fieldLabel('ergebnisdokumente', 'aenderungszusammenfassung')} value={record.fields.aenderungszusammenfassung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('ergebnisdokumente', 'vorhaben')}
          name={vorhabenTarget?.fields.vorhaben_nummer ?? '—'}
          meta={[vorhabenTarget?.fields.titel, vorhabenTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('ergebnisdokumente', 'freigeber')}
          name={freigeberTarget?.fields.vorname ?? '—'}
          meta={[freigeberTarget?.fields.email, freigeberTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={freigeberTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(freigeberTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('ergebnisdokumente', 'vorgaengerversion')}
          name={vorgaengerversionTarget?.fields.datenstand ?? '—'}
          meta={undefined}
          onClick={vorgaengerversionTarget && onOpenErgebnisdokumente ? () => onOpenErgebnisdokumente!(vorgaengerversionTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ERGEBNISDOKUMENTE} recordId={record.record_id} readOnly={!perms.canWrite('ergebnisdokumente')} />
    </>
  );
}
