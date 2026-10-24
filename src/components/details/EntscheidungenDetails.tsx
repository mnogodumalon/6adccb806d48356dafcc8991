import type { Entscheidungen, Erfahrungen, Vorhaben, Mitarbeitende } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface EntscheidungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Entscheidungen;
  /** N:1-Ziel „Erfahrungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  erfahrungenList: Erfahrungen[];
  /** Reserviert — Erfahrungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenErfahrungen?: (record: Erfahrungen) => void;
  /** N:1-Ziel „Entscheidungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  entscheidungenList: Entscheidungen[];
  /** Klick auf die Entscheidungen-Relation → overlay.push auf dessen Detail. */
  onOpenEntscheidungen?: (record: Entscheidungen) => void;
  /** N:1-Ziel „Vorhaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorhabenList: Vorhaben[];
  /** Klick auf die Vorhaben-Relation → overlay.push auf dessen Detail. */
  onOpenVorhaben?: (record: Vorhaben) => void;
  /** N:1-Ziel „Mitarbeitende": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeitendeList: Mitarbeitende[];
  /** Klick auf die Mitarbeitende-Relation → overlay.push auf dessen Detail. */
  onOpenMitarbeitende?: (record: Mitarbeitende) => void;
  /** 1:N „Erfahrungen" (betroffene_entscheidung): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenBetroffeneEntscheidungList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungenBetroffeneEntscheidung: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungenBetroffeneEntscheidung?: () => void;
}

export function EntscheidungenDetails({
  record,
  erfahrungenList,
  entscheidungenList,
  onOpenEntscheidungen,
  vorhabenList,
  onOpenVorhaben,
  mitarbeitendeList,
  onOpenMitarbeitende,
  erfahrungenBetroffeneEntscheidungList,
  onOpenErfahrungenBetroffeneEntscheidung,
  onAddErfahrungenBetroffeneEntscheidung,
}: EntscheidungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const ersetzte_entscheidungTarget = entscheidungenList.find(r => r.record_id === extractRecordId(record.fields.ersetzte_entscheidung));
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const entscheiderTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.entscheider));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('entscheidungen', 'beruecksichtigte_erfahrungen')} value={Array.isArray(record.fields.beruecksichtigte_erfahrungen) ? record.fields.beruecksichtigte_erfahrungen.map((u: unknown) => erfahrungenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('entscheidungen', 'fragestellung')} value={record.fields.fragestellung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'entscheidung')} value={record.fields.entscheidung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'begruendung')} value={record.fields.begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'grundlagen')} value={record.fields.grundlagen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'entscheidungszeitpunkt')} value={record.fields.entscheidungszeitpunkt} format="datetime" />
        <RecordField label={fieldLabel('entscheidungen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('entscheidungen', 'optionen')} value={record.fields.optionen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'annahmen')} value={record.fields.annahmen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'risiken_text')} value={record.fields.risiken_text} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'gueltigkeitsbedingungen')} value={record.fields.gueltigkeitsbedingungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'freigabe_erforderlich')} value={record.fields.freigabe_erforderlich} format="bool" />
        <RecordField label={fieldLabel('entscheidungen', 'version')} value={record.fields.version} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('entscheidungen', 'ersetzte_entscheidung')}
          name={ersetzte_entscheidungTarget?.fields.fragestellung ?? '—'}
          meta={undefined}
          onClick={ersetzte_entscheidungTarget && onOpenEntscheidungen ? () => onOpenEntscheidungen!(ersetzte_entscheidungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'vorhaben')}
          name={vorhabenTarget?.fields.vorhaben_nummer ?? '—'}
          meta={[vorhabenTarget?.fields.titel, vorhabenTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'entscheider')}
          name={entscheiderTarget?.fields.vorname ?? '—'}
          meta={[entscheiderTarget?.fields.email, entscheiderTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={entscheiderTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(entscheiderTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('erfahrungen')} · ${fieldLabel('erfahrungen', 'betroffene_entscheidung')}`}
        items={erfahrungenBetroffeneEntscheidungList.filter(r => extractRecordId(r.fields.betroffene_entscheidung) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: r.fields.naechster_pruefttermin })}
        onOpen={onOpenErfahrungenBetroffeneEntscheidung}
        onAdd={onAddErfahrungenBetroffeneEntscheidung}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ENTSCHEIDUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('entscheidungen')} />
    </>
  );
}
