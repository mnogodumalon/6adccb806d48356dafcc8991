import type { Aufgaben, Vorhaben, Mitarbeitende, Anforderungen, Klaerungspunkte, Kommunikation } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface AufgabenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Aufgaben;
  /** N:1-Ziel „Aufgaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  aufgabenList: Aufgaben[];
  /** Reserviert — Aufgaben ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenAufgaben?: (record: Aufgaben) => void;
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
  /** Klick auf die Anforderungen-Relation → overlay.push auf dessen Detail. */
  onOpenAnforderungen?: (record: Anforderungen) => void;
  /** N:1-Ziel „Klaerungspunkte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  klaerungspunkteList: Klaerungspunkte[];
  /** Klick auf die Klaerungspunkte-Relation → overlay.push auf dessen Detail. */
  onOpenKlaerungspunkte?: (record: Klaerungspunkte) => void;
  /** 1:N „Kommunikation" (aufgabe): VOLLE Liste — der Block filtert auf diesen Record. */
  kommunikationList: Kommunikation[];
  /** Zeilen-Klick → overlay.push auf das Kommunikation-Detail (nie der Edit-Dialog). */
  onOpenKommunikation: (record: Kommunikation) => void;
  /** Kontextuelles „+": öffnet den Kommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddKommunikation?: () => void;
}

export function AufgabenDetails({
  record,
  aufgabenList,
  vorhabenList,
  onOpenVorhaben,
  mitarbeitendeList,
  onOpenMitarbeitende,
  anforderungenList,
  onOpenAnforderungen,
  klaerungspunkteList,
  onOpenKlaerungspunkte,
  kommunikationList,
  onOpenKommunikation,
  onAddKommunikation,
}: AufgabenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorhabenTarget = vorhabenList.find(r => r.record_id === extractRecordId(record.fields.vorhaben));
  const verantwortlicherTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.verantwortlicher));
  const anforderungTarget = anforderungenList.find(r => r.record_id === extractRecordId(record.fields.anforderung));
  const klaerungspunktTarget = klaerungspunkteList.find(r => r.record_id === extractRecordId(record.fields.klaerungspunkt));
  const prueferTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.pruefer));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('aufgaben', 'abhaengigkeiten')} value={Array.isArray(record.fields.abhaengigkeiten) ? record.fields.abhaengigkeiten.map((u: unknown) => aufgabenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('aufgaben', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('aufgaben', 'zweck')} value={record.fields.zweck} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgaben', 'aufgabentyp')} value={record.fields.aufgabentyp} format="pill" />
        <RecordField label={fieldLabel('aufgaben', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('aufgaben', 'unterstuetzende_personen')} value={Array.isArray(record.fields.unterstuetzende_personen) ? record.fields.unterstuetzende_personen.map((u: unknown) => mitarbeitendeList.find(t => t.record_id === extractRecordId(u))?.fields.vorname ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('aufgaben', 'faelligkeit')} value={record.fields.faelligkeit} format="date" />
        <RecordField label={fieldLabel('aufgaben', 'erwartetes_ergebnis')} value={record.fields.erwartetes_ergebnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgaben', 'akzeptanzkriterien')} value={record.fields.akzeptanzkriterien} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgaben', 'ergebnisreferenz')} value={record.fields.ergebnisreferenz} format="text" />
        <RecordField label={fieldLabel('aufgaben', 'abschlusszeitpunkt')} value={record.fields.abschlusszeitpunkt} format="datetime" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('aufgaben', 'vorhaben')}
          name={vorhabenTarget?.fields.vorhaben_nummer ?? '—'}
          meta={[vorhabenTarget?.fields.titel, vorhabenTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorhabenTarget && onOpenVorhaben ? () => onOpenVorhaben!(vorhabenTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgaben', 'verantwortlicher')}
          name={verantwortlicherTarget?.fields.vorname ?? '—'}
          meta={[verantwortlicherTarget?.fields.email, verantwortlicherTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={verantwortlicherTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(verantwortlicherTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgaben', 'anforderung')}
          name={anforderungTarget?.fields.titel ?? '—'}
          meta={[anforderungTarget?.fields.quellenstelle].filter(Boolean).join(' · ') || undefined}
          onClick={anforderungTarget && onOpenAnforderungen ? () => onOpenAnforderungen!(anforderungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgaben', 'klaerungspunkt')}
          name={klaerungspunktTarget?.fields.fragestellung ?? '—'}
          meta={[klaerungspunktTarget?.fields.adressat].filter(Boolean).join(' · ') || undefined}
          onClick={klaerungspunktTarget && onOpenKlaerungspunkte ? () => onOpenKlaerungspunkte!(klaerungspunktTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgaben', 'pruefer')}
          name={prueferTarget?.fields.vorname ?? '—'}
          meta={[prueferTarget?.fields.email, prueferTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={prueferTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(prueferTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('kommunikation')}
        items={kommunikationList.filter(r => extractRecordId(r.fields.aufgabe) === record.record_id)}
        map={r => ({ name: r.fields.betreff ?? appLabel('kommunikation'), meta: r.fields.zeitpunkt })}
        onOpen={onOpenKommunikation}
        onAdd={onAddKommunikation}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.AUFGABEN} recordId={record.record_id} readOnly={!perms.canWrite('aufgaben')} />
    </>
  );
}
