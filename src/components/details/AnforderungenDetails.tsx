import type { Anforderungen, Vorhaben, Quellen, Mitarbeitende, Klaerungspunkte, Risiken, Aufgaben, Kommunikation, Erfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface AnforderungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Anforderungen;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Quellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  quellenList: Quellen[];
  /** Klick auf die Quellen-Relation → overlay.push auf dessen Detail. */
  onOpenQuellen?: (record: Quellen) => void;
  /** N:1-Ziel „Mitarbeitende": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeitendeList: Mitarbeitende[];
  /** Klick auf die Mitarbeitende-Relation → overlay.push auf dessen Detail. */
  onOpenMitarbeitende?: (record: Mitarbeitende) => void;
  /** 1:N „Klärungspunkte" (betroffene_anforderungen): VOLLE Liste — der Block filtert auf diesen Record. */
  klaerungspunkteList: Klaerungspunkte[];
  /** Zeilen-Klick → overlay.push auf das Klaerungspunkte-Detail (nie der Edit-Dialog). */
  onOpenKlaerungspunkte: (record: Klaerungspunkte) => void;
  /** Kontextuelles „+": öffnet den Klaerungspunkte-Dialog mit diesem Record vorgesetzt. */
  onAddKlaerungspunkte?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Klaerungspunkte-Datensatz. */
  onPickKlaerungspunkte?: () => void;
  /** 1:N „Risiken" (betroffene_anforderungen): VOLLE Liste — der Block filtert auf diesen Record. */
  risikenList: Risiken[];
  /** Zeilen-Klick → overlay.push auf das Risiken-Detail (nie der Edit-Dialog). */
  onOpenRisiken: (record: Risiken) => void;
  /** Kontextuelles „+": öffnet den Risiken-Dialog mit diesem Record vorgesetzt. */
  onAddRisiken?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Risiken-Datensatz. */
  onPickRisiken?: () => void;
  /** 1:N „Aufgaben" (anforderung): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenList: Aufgaben[];
  /** Zeilen-Klick → overlay.push auf das Aufgaben-Detail (nie der Edit-Dialog). */
  onOpenAufgaben: (record: Aufgaben) => void;
  /** Kontextuelles „+": öffnet den Aufgaben-Dialog mit diesem Record vorgesetzt. */
  onAddAufgaben?: () => void;
  /** 1:N „Kommunikation" (anforderung): VOLLE Liste — der Block filtert auf diesen Record. */
  kommunikationList: Kommunikation[];
  /** Zeilen-Klick → overlay.push auf das Kommunikation-Detail (nie der Edit-Dialog). */
  onOpenKommunikation: (record: Kommunikation) => void;
  /** Kontextuelles „+": öffnet den Kommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddKommunikation?: () => void;
  /** 1:N „Erfahrungen" (betroffene_anforderungen): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Erfahrungen-Datensatz. */
  onPickErfahrungen?: () => void;
}

export function AnforderungenDetails({
  record,
  vorhabenList,
  onOpenVorhaben,
  quellenList,
  onOpenQuellen,
  mitarbeitendeList,
  onOpenMitarbeitende,
  klaerungspunkteList,
  onOpenKlaerungspunkte,
  onAddKlaerungspunkte,
  onPickKlaerungspunkte,
  risikenList,
  onOpenRisiken,
  onAddRisiken,
  onPickRisiken,
  aufgabenList,
  onOpenAufgaben,
  onAddAufgaben,
  kommunikationList,
  onOpenKommunikation,
  onAddKommunikation,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  onPickErfahrungen,
}: AnforderungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const quelleTarget = quellenList.find(r => r.record_id === extractRecordId(record.fields.quelle));
  const prueferTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.pruefer));
  const bestaetigerTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.bestaetiger));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('anforderungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('anforderungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('anforderungen', 'kategorie')} value={record.fields.kategorie} format="text" />
        <RecordField label={fieldLabel('anforderungen', 'anforderungsart')} value={record.fields.anforderungsart} format="pill" />
        <RecordField label={fieldLabel('anforderungen', 'verbindlichkeit')} value={record.fields.verbindlichkeit} format="pill" />
        <RecordField label={fieldLabel('anforderungen', 'kritikalitaet')} value={record.fields.kritikalitaet} format="pill" />
        <RecordField label={fieldLabel('anforderungen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('anforderungen', 'fachliche_grundlage')} value={record.fields.fachliche_grundlage} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('anforderungen', 'quellenstelle')} value={record.fields.quellenstelle} format="text" />
        <RecordField label={fieldLabel('anforderungen', 'akzeptanzkriterium')} value={record.fields.akzeptanzkriterium} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('anforderungen', 'nachweisverfahren')} value={record.fields.nachweisverfahren} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('anforderungen', 'fachliche_bewertung')} value={record.fields.fachliche_bewertung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('anforderungen', 'bestaetigungszeitpunkt')} value={record.fields.bestaetigungszeitpunkt} format="datetime" />
        <RecordField label={fieldLabel('anforderungen', 'version')} value={record.fields.version} format="text" />
        <RecordField label={fieldLabel('anforderungen', 'aenderungsgrund')} value={record.fields.aenderungsgrund} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('anforderungen', 'vorhaben')}
          name={vorhabenTarget?.fields.vorhaben_nummer ?? '—'}
          meta={[vorhabenTarget?.fields.titel, vorhabenTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('anforderungen', 'quelle')}
          name={quelleTarget?.fields.titel ?? '—'}
          meta={[quelleTarget?.fields.externe_referenz, quelleTarget?.fields.urheber].filter(Boolean).join(' · ') || undefined}
          onClick={quelleTarget && onOpenQuellen ? () => onOpenQuellen!(quelleTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('anforderungen', 'pruefer')}
          name={prueferTarget?.fields.vorname ?? '—'}
          meta={[prueferTarget?.fields.email, prueferTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={prueferTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(prueferTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('anforderungen', 'bestaetiger')}
          name={bestaetigerTarget?.fields.vorname ?? '—'}
          meta={[bestaetigerTarget?.fields.email, bestaetigerTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={bestaetigerTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(bestaetigerTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('klaerungspunkte')}
        items={klaerungspunkteList.filter(r => Array.isArray(r.fields.betroffene_anforderungen) && r.fields.betroffene_anforderungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.adressat ?? appLabel('klaerungspunkte'), meta: r.fields.faelligkeit })}
        onOpen={onOpenKlaerungspunkte}
        onAdd={onAddKlaerungspunkte}
        onPick={onPickKlaerungspunkte}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('risiken')}
        items={risikenList.filter(r => Array.isArray(r.fields.betroffene_anforderungen) && r.fields.betroffene_anforderungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('risiken'), meta: r.fields.faelligkeit })}
        onOpen={onOpenRisiken}
        onAdd={onAddRisiken}
        onPick={onPickRisiken}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('aufgaben')}
        items={aufgabenList.filter(r => extractRecordId(r.fields.anforderung) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben'), meta: r.fields.faelligkeit })}
        onOpen={onOpenAufgaben}
        onAdd={onAddAufgaben}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('kommunikation')}
        items={kommunikationList.filter(r => extractRecordId(r.fields.anforderung) === record.record_id)}
        map={r => ({ name: r.fields.betreff ?? appLabel('kommunikation'), meta: r.fields.zeitpunkt })}
        onOpen={onOpenKommunikation}
        onAdd={onAddKommunikation}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => Array.isArray(r.fields.betroffene_anforderungen) && r.fields.betroffene_anforderungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: r.fields.naechster_pruefttermin })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        onPick={onPickErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ANFORDERUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('anforderungen')} />
    </>
  );
}
