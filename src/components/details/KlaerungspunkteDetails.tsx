import type { Klaerungspunkte, Vorhaben, Mitarbeitende, Anforderungen, Quellen, Aufgaben, Kommunikation } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface KlaerungspunkteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Klaerungspunkte;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Mitarbeitende": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeitendeList: Mitarbeitende[];
  /** Klick auf die Mitarbeitende-Relation → overlay.push auf dessen Detail. */
  onOpenMitarbeitende?: (record: Mitarbeitende) => void;
  /** N:1-Ziel „Anforderungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  anforderungenList: Anforderungen[];
  /** Reserviert — Anforderungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenAnforderungen?: (record: Anforderungen) => void;
  /** N:1-Ziel „Quellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  quellenList: Quellen[];
  /** Klick auf die Quellen-Relation → overlay.push auf dessen Detail. */
  onOpenQuellen?: (record: Quellen) => void;
  /** 1:N „Aufgaben" (klaerungspunkt): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenList: Aufgaben[];
  /** Zeilen-Klick → overlay.push auf das Aufgaben-Detail (nie der Edit-Dialog). */
  onOpenAufgaben: (record: Aufgaben) => void;
  /** Kontextuelles „+": öffnet den Aufgaben-Dialog mit diesem Record vorgesetzt. */
  onAddAufgaben?: () => void;
  /** 1:N „Kommunikation" (klaerungspunkt): VOLLE Liste — der Block filtert auf diesen Record. */
  kommunikationList: Kommunikation[];
  /** Zeilen-Klick → overlay.push auf das Kommunikation-Detail (nie der Edit-Dialog). */
  onOpenKommunikation: (record: Kommunikation) => void;
  /** Kontextuelles „+": öffnet den Kommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddKommunikation?: () => void;
}

export function KlaerungspunkteDetails({
  record,
  vorhabenList,
  onOpenVorhaben,
  mitarbeitendeList,
  onOpenMitarbeitende,
  anforderungenList,
  quellenList,
  onOpenQuellen,
  aufgabenList,
  onOpenAufgaben,
  onAddAufgaben,
  kommunikationList,
  onOpenKommunikation,
  onAddKommunikation,
}: KlaerungspunkteDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const verantwortlicherTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.verantwortlicher));
  const antwortquelleTarget = quellenList.find(r => r.record_id === extractRecordId(record.fields.antwortquelle));
  const fachlicher_prueferTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.fachlicher_pruefer));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('klaerungspunkte', 'fragestellung')} value={record.fields.fragestellung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('klaerungspunkte', 'anlass')} value={record.fields.anlass} format="pill" />
        <RecordField label={fieldLabel('klaerungspunkte', 'kritikalitaet')} value={record.fields.kritikalitaet} format="pill" />
        <RecordField label={fieldLabel('klaerungspunkte', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('klaerungspunkte', 'betroffene_anforderungen')} value={Array.isArray(record.fields.betroffene_anforderungen) ? record.fields.betroffene_anforderungen.map((u: unknown) => anforderungenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('klaerungspunkte', 'betroffene_quellen')} value={Array.isArray(record.fields.betroffene_quellen) ? record.fields.betroffene_quellen.map((u: unknown) => quellenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('klaerungspunkte', 'adressat')} value={record.fields.adressat} format="text" />
        <RecordField label={fieldLabel('klaerungspunkte', 'faelligkeit')} value={record.fields.faelligkeit} format="date" />
        <RecordField label={fieldLabel('klaerungspunkte', 'vorgeschlagene_antwort')} value={record.fields.vorgeschlagene_antwort} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('klaerungspunkte', 'bestaetigte_antwort')} value={record.fields.bestaetigte_antwort} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('klaerungspunkte', 'vorhaben')}
          name={vorhabenTarget?.fields.vorhaben_nummer ?? '—'}
          meta={[vorhabenTarget?.fields.titel, vorhabenTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('klaerungspunkte', 'verantwortlicher')}
          name={verantwortlicherTarget?.fields.vorname ?? '—'}
          meta={[verantwortlicherTarget?.fields.email, verantwortlicherTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={verantwortlicherTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(verantwortlicherTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('klaerungspunkte', 'antwortquelle')}
          name={antwortquelleTarget?.fields.titel ?? '—'}
          meta={[antwortquelleTarget?.fields.externe_referenz, antwortquelleTarget?.fields.urheber].filter(Boolean).join(' · ') || undefined}
          onClick={antwortquelleTarget && onOpenQuellen ? () => onOpenQuellen!(antwortquelleTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('klaerungspunkte', 'fachlicher_pruefer')}
          name={fachlicher_prueferTarget?.fields.vorname ?? '—'}
          meta={[fachlicher_prueferTarget?.fields.email, fachlicher_prueferTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={fachlicher_prueferTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(fachlicher_prueferTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('aufgaben')}
        items={aufgabenList.filter(r => extractRecordId(r.fields.klaerungspunkt) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben'), meta: r.fields.faelligkeit })}
        onOpen={onOpenAufgaben}
        onAdd={onAddAufgaben}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('kommunikation')}
        items={kommunikationList.filter(r => extractRecordId(r.fields.klaerungspunkt) === record.record_id)}
        map={r => ({ name: r.fields.betreff ?? appLabel('kommunikation'), meta: r.fields.zeitpunkt })}
        onOpen={onOpenKommunikation}
        onAdd={onAddKommunikation}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.KLAERUNGSPUNKTE} recordId={record.record_id} readOnly={!perms.canWrite('klaerungspunkte')} />
    </>
  );
}
