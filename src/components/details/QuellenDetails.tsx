import type { Quellen, Vorhaben, Anforderungen, Klaerungspunkte, Kommunikation } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface QuellenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Quellen;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** 1:N „Anforderungen" (quelle): VOLLE Liste — der Block filtert auf diesen Record. */
  anforderungenList: Anforderungen[];
  /** Zeilen-Klick → overlay.push auf das Anforderungen-Detail (nie der Edit-Dialog). */
  onOpenAnforderungen: (record: Anforderungen) => void;
  /** Kontextuelles „+": öffnet den Anforderungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnforderungen?: () => void;
  /** 1:N „Klärungspunkte" (betroffene_quellen): VOLLE Liste — der Block filtert auf diesen Record. */
  klaerungspunkteBetroffeneQuellenList: Klaerungspunkte[];
  /** Zeilen-Klick → overlay.push auf das Klaerungspunkte-Detail (nie der Edit-Dialog). */
  onOpenKlaerungspunkteBetroffeneQuellen: (record: Klaerungspunkte) => void;
  /** Kontextuelles „+": öffnet den Klaerungspunkte-Dialog mit diesem Record vorgesetzt. */
  onAddKlaerungspunkteBetroffeneQuellen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Klaerungspunkte-Datensatz. */
  onPickKlaerungspunkteBetroffeneQuellen?: () => void;
  /** 1:N „Klärungspunkte" (antwortquelle): VOLLE Liste — der Block filtert auf diesen Record. */
  klaerungspunkteAntwortquelleList: Klaerungspunkte[];
  /** Zeilen-Klick → overlay.push auf das Klaerungspunkte-Detail (nie der Edit-Dialog). */
  onOpenKlaerungspunkteAntwortquelle: (record: Klaerungspunkte) => void;
  /** Kontextuelles „+": öffnet den Klaerungspunkte-Dialog mit diesem Record vorgesetzt. */
  onAddKlaerungspunkteAntwortquelle?: () => void;
  /** 1:N „Kommunikation" (quellenreferenz): VOLLE Liste — der Block filtert auf diesen Record. */
  kommunikationList: Kommunikation[];
  /** Zeilen-Klick → overlay.push auf das Kommunikation-Detail (nie der Edit-Dialog). */
  onOpenKommunikation: (record: Kommunikation) => void;
  /** Kontextuelles „+": öffnet den Kommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddKommunikation?: () => void;
}

export function QuellenDetails({
  record,
  vorhabenList,
  onOpenVorhaben,
  anforderungenList,
  onOpenAnforderungen,
  onAddAnforderungen,
  klaerungspunkteBetroffeneQuellenList,
  onOpenKlaerungspunkteBetroffeneQuellen,
  onAddKlaerungspunkteBetroffeneQuellen,
  onPickKlaerungspunkteBetroffeneQuellen,
  klaerungspunkteAntwortquelleList,
  onOpenKlaerungspunkteAntwortquelle,
  onAddKlaerungspunkteAntwortquelle,
  kommunikationList,
  onOpenKommunikation,
  onAddKommunikation,
}: QuellenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('quellen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('quellen', 'quellentyp')} value={record.fields.quellentyp} format="pill" />
        <RecordField label={fieldLabel('quellen', 'datei')} className="md:col-span-2">
          {record.fields.datei ? (
            <MediaThumbnail src={record.fields.datei as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('quellen', 'externe_referenz')} value={record.fields.externe_referenz} format="text" />
        <RecordField label={fieldLabel('quellen', 'erfassungszeitpunkt')} value={record.fields.erfassungszeitpunkt} format="datetime" />
        <RecordField label={fieldLabel('quellen', 'vertraulichkeit')} value={record.fields.vertraulichkeit} format="pill" />
        <RecordField label={fieldLabel('quellen', 'urheber')} value={record.fields.urheber} format="text" />
        <RecordField label={fieldLabel('quellen', 'dokumentdatum')} value={record.fields.dokumentdatum} format="date" />
        <RecordField label={fieldLabel('quellen', 'version')} value={record.fields.version} format="text" />
        <RecordField label={fieldLabel('quellen', 'extrahierter_inhalt')} value={record.fields.extrahierter_inhalt} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('quellen', 'extraktionsstatus')} value={record.fields.extraktionsstatus} format="pill" />
        <RecordField label={fieldLabel('quellen', 'pruefstatus')} value={record.fields.pruefstatus} format="pill" />
        <RecordField label={fieldLabel('quellen', 'inhaltshash')} value={record.fields.inhaltshash} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('quellen', 'vorhaben')}
          name={vorhabenTarget?.fields.vorhaben_nummer ?? '—'}
          meta={[vorhabenTarget?.fields.titel, vorhabenTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('anforderungen')}
        items={anforderungenList.filter(r => extractRecordId(r.fields.quelle) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('anforderungen'), meta: r.fields.bestaetigungszeitpunkt })}
        onOpen={onOpenAnforderungen}
        onAdd={onAddAnforderungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('klaerungspunkte')} · ${fieldLabel('klaerungspunkte', 'betroffene_quellen')}`}
        items={klaerungspunkteBetroffeneQuellenList.filter(r => Array.isArray(r.fields.betroffene_quellen) && r.fields.betroffene_quellen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.adressat ?? appLabel('klaerungspunkte'), meta: r.fields.faelligkeit })}
        onOpen={onOpenKlaerungspunkteBetroffeneQuellen}
        onAdd={onAddKlaerungspunkteBetroffeneQuellen}
        onPick={onPickKlaerungspunkteBetroffeneQuellen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('klaerungspunkte')} · ${fieldLabel('klaerungspunkte', 'antwortquelle')}`}
        items={klaerungspunkteAntwortquelleList.filter(r => extractRecordId(r.fields.antwortquelle) === record.record_id)}
        map={r => ({ name: r.fields.adressat ?? appLabel('klaerungspunkte'), meta: r.fields.faelligkeit })}
        onOpen={onOpenKlaerungspunkteAntwortquelle}
        onAdd={onAddKlaerungspunkteAntwortquelle}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('kommunikation')}
        items={kommunikationList.filter(r => extractRecordId(r.fields.quellenreferenz) === record.record_id)}
        map={r => ({ name: r.fields.betreff ?? appLabel('kommunikation'), meta: r.fields.zeitpunkt })}
        onOpen={onOpenKommunikation}
        onAdd={onAddKommunikation}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.QUELLEN} recordId={record.record_id} readOnly={!perms.canWrite('quellen')} />
    </>
  );
}
