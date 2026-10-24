import type { Erfahrungen, Entscheidungen, Vorhaben, Mitarbeitende, Anforderungen, Risiken } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface ErfahrungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Erfahrungen;
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
  /** N:1-Ziel „Anforderungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  anforderungenList: Anforderungen[];
  /** Reserviert — Anforderungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenAnforderungen?: (record: Anforderungen) => void;
  /** N:1-Ziel „Risiken": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  risikenList: Risiken[];
  /** Reserviert — Risiken ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenRisiken?: (record: Risiken) => void;
  /** 1:N „Entscheidungen" (beruecksichtigte_erfahrungen): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenBeruecksichtigteErfahrungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungenBeruecksichtigteErfahrungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungenBeruecksichtigteErfahrungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Entscheidungen-Datensatz. */
  onPickEntscheidungenBeruecksichtigteErfahrungen?: () => void;
}

export function ErfahrungenDetails({
  record,
  entscheidungenList,
  onOpenEntscheidungen,
  vorhabenList,
  onOpenVorhaben,
  mitarbeitendeList,
  onOpenMitarbeitende,
  anforderungenList,
  risikenList,
  entscheidungenBeruecksichtigteErfahrungenList,
  onOpenEntscheidungenBeruecksichtigteErfahrungen,
  onAddEntscheidungenBeruecksichtigteErfahrungen,
  onPickEntscheidungenBeruecksichtigteErfahrungen,
}: ErfahrungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const betroffene_entscheidungTarget = entscheidungenList.find(r => r.record_id === extractRecordId(record.fields.betroffene_entscheidung));
  const ursprungsvorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.ursprungsvorhaben));
  const fachlicher_prueferTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.fachlicher_pruefer));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('erfahrungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'ausgangssituation')} value={record.fields.ausgangssituation} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'problem')} value={record.fields.problem} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'belege')} value={record.fields.belege} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'massnahme')} value={record.fields.massnahme} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'ergebnis')} value={record.fields.ergebnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'erkenntnis')} value={record.fields.erkenntnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'gueltigkeitsbedingungen')} value={record.fields.gueltigkeitsbedingungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'grenzen')} value={record.fields.grenzen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'zusammenhang_belegt')} value={record.fields.zusammenhang_belegt} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'pruefstatus')} value={record.fields.pruefstatus} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'freigabestatus')} value={record.fields.freigabestatus} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'betroffene_anforderungen')} value={Array.isArray(record.fields.betroffene_anforderungen) ? record.fields.betroffene_anforderungen.map((u: unknown) => anforderungenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'risiken')} value={Array.isArray(record.fields.risiken) ? record.fields.risiken.map((u: unknown) => risikenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'technische_loesungen')} value={record.fields.technische_loesungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'alternative_erklaerungen')} value={record.fields.alternative_erklaerungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'wirkungsmessung')} value={record.fields.wirkungsmessung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'version')} value={record.fields.version} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'naechster_pruefttermin')} value={record.fields.naechster_pruefttermin} format="date" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('erfahrungen', 'betroffene_entscheidung')}
          name={betroffene_entscheidungTarget?.fields.fragestellung ?? '—'}
          meta={undefined}
          onClick={betroffene_entscheidungTarget && onOpenEntscheidungen ? () => onOpenEntscheidungen!(betroffene_entscheidungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'ursprungsvorhaben')}
          name={ursprungsvorhabenTarget?.fields.vorhaben_nummer ?? '—'}
          meta={[ursprungsvorhabenTarget?.fields.titel, ursprungsvorhabenTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={ursprungsvorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(ursprungsvorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'fachlicher_pruefer')}
          name={fachlicher_prueferTarget?.fields.vorname ?? '—'}
          meta={[fachlicher_prueferTarget?.fields.email, fachlicher_prueferTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={fachlicher_prueferTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(fachlicher_prueferTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('entscheidungen')} · ${fieldLabel('entscheidungen', 'beruecksichtigte_erfahrungen')}`}
        items={entscheidungenBeruecksichtigteErfahrungenList.filter(r => Array.isArray(r.fields.beruecksichtigte_erfahrungen) && r.fields.beruecksichtigte_erfahrungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.entscheidungszeitpunkt })}
        onOpen={onOpenEntscheidungenBeruecksichtigteErfahrungen}
        onAdd={onAddEntscheidungenBeruecksichtigteErfahrungen}
        onPick={onPickEntscheidungenBeruecksichtigteErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ERFAHRUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('erfahrungen')} />
    </>
  );
}
