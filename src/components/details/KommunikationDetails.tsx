import type { Kommunikation, Aufgaben, Vorhaben, Mitarbeitende, Klaerungspunkte, Anforderungen, Quellen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface KommunikationDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Kommunikation;
  /** N:1-Ziel „Aufgaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  aufgabenList: Aufgaben[];
  /** Klick auf die Aufgaben-Relation → overlay.push auf dessen Detail. */
  onOpenAufgaben?: (record: Aufgaben) => void;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Mitarbeitende": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeitendeList: Mitarbeitende[];
  /** Klick auf die Mitarbeitende-Relation → overlay.push auf dessen Detail. */
  onOpenMitarbeitende?: (record: Mitarbeitende) => void;
  /** N:1-Ziel „Klaerungspunkte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  klaerungspunkteList: Klaerungspunkte[];
  /** Klick auf die Klaerungspunkte-Relation → overlay.push auf dessen Detail. */
  onOpenKlaerungspunkte?: (record: Klaerungspunkte) => void;
  /** N:1-Ziel „Anforderungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  anforderungenList: Anforderungen[];
  /** Klick auf die Anforderungen-Relation → overlay.push auf dessen Detail. */
  onOpenAnforderungen?: (record: Anforderungen) => void;
  /** N:1-Ziel „Quellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  quellenList: Quellen[];
  /** Klick auf die Quellen-Relation → overlay.push auf dessen Detail. */
  onOpenQuellen?: (record: Quellen) => void;
}

export function KommunikationDetails({
  record,
  aufgabenList,
  onOpenAufgaben,
  vorhabenList,
  onOpenVorhaben,
  mitarbeitendeList,
  onOpenMitarbeitende,
  klaerungspunkteList,
  onOpenKlaerungspunkte,
  anforderungenList,
  onOpenAnforderungen,
  quellenList,
  onOpenQuellen,
}: KommunikationDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const aufgabeTarget = aufgabenList.find(r => r.record_id === extractRecordId(record.fields.aufgabe));
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const absenderTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.absender));
  const klaerungspunktTarget = klaerungspunkteList.find(r => r.record_id === extractRecordId(record.fields.klaerungspunkt));
  const anforderungTarget = anforderungenList.find(r => r.record_id === extractRecordId(record.fields.anforderung));
  const freigegeben_vonTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.freigegeben_von));
  const quellenreferenzTarget = quellenList.find(r => r.record_id === extractRecordId(record.fields.quellenreferenz));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('kommunikation', 'kanal')} value={record.fields.kanal} format="pill" />
        <RecordField label={fieldLabel('kommunikation', 'betreff')} value={record.fields.betreff} format="text" />
        <RecordField label={fieldLabel('kommunikation', 'inhalt')} value={record.fields.inhalt} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('kommunikation', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('kommunikation', 'empfaenger')} value={record.fields.empfaenger} format="text" />
        <RecordField label={fieldLabel('kommunikation', 'zeitpunkt')} value={record.fields.zeitpunkt} format="datetime" />
        <RecordField label={fieldLabel('kommunikation', 'bestaetigung')} value={record.fields.bestaetigung} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('kommunikation', 'aufgabe')}
          name={aufgabeTarget?.fields.titel ?? '—'}
          meta={[aufgabeTarget?.fields.ergebnisreferenz].filter(Boolean).join(' · ') || undefined}
          onClick={aufgabeTarget && onOpenAufgaben ? () => onOpenAufgaben!(aufgabeTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('kommunikation', 'vorhaben')}
          name={vorhabenTarget?.fields.vorhaben_nummer ?? '—'}
          meta={[vorhabenTarget?.fields.titel, vorhabenTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('kommunikation', 'absender')}
          name={absenderTarget?.fields.vorname ?? '—'}
          meta={[absenderTarget?.fields.email, absenderTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={absenderTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(absenderTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('kommunikation', 'klaerungspunkt')}
          name={klaerungspunktTarget?.fields.fragestellung ?? '—'}
          meta={[klaerungspunktTarget?.fields.adressat].filter(Boolean).join(' · ') || undefined}
          onClick={klaerungspunktTarget && onOpenKlaerungspunkte ? () => onOpenKlaerungspunkte!(klaerungspunktTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('kommunikation', 'anforderung')}
          name={anforderungTarget?.fields.titel ?? '—'}
          meta={[anforderungTarget?.fields.quellenstelle].filter(Boolean).join(' · ') || undefined}
          onClick={anforderungTarget && onOpenAnforderungen ? () => onOpenAnforderungen!(anforderungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('kommunikation', 'freigegeben_von')}
          name={freigegeben_vonTarget?.fields.vorname ?? '—'}
          meta={[freigegeben_vonTarget?.fields.email, freigegeben_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={freigegeben_vonTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(freigegeben_vonTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('kommunikation', 'quellenreferenz')}
          name={quellenreferenzTarget?.fields.titel ?? '—'}
          meta={[quellenreferenzTarget?.fields.externe_referenz, quellenreferenzTarget?.fields.urheber].filter(Boolean).join(' · ') || undefined}
          onClick={quellenreferenzTarget && onOpenQuellen ? () => onOpenQuellen!(quellenreferenzTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.KOMMUNIKATION} recordId={record.record_id} readOnly={!perms.canWrite('kommunikation')} />
    </>
  );
}
