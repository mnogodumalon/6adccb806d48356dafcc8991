import type { Vorhaben, Mitarbeitende, Quellen, Anforderungen, Klaerungspunkte, Risiken, Aufgaben, Entscheidungen, Kommunikation, Erfahrungen, Ergebnisdokumente } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface VorhabenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Vorhaben;
  /** N:1-Ziel „Mitarbeitende": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeitendeList: Mitarbeitende[];
  /** Klick auf die Mitarbeitende-Relation → overlay.push auf dessen Detail. */
  onOpenMitarbeitende?: (record: Mitarbeitende) => void;
  /** 1:N „Quellen" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  quellenList: Quellen[];
  /** Zeilen-Klick → overlay.push auf das Quellen-Detail (nie der Edit-Dialog). */
  onOpenQuellen: (record: Quellen) => void;
  /** Kontextuelles „+": öffnet den Quellen-Dialog mit diesem Record vorgesetzt. */
  onAddQuellen?: () => void;
  /** 1:N „Anforderungen" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  anforderungenList: Anforderungen[];
  /** Zeilen-Klick → overlay.push auf das Anforderungen-Detail (nie der Edit-Dialog). */
  onOpenAnforderungen: (record: Anforderungen) => void;
  /** Kontextuelles „+": öffnet den Anforderungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnforderungen?: () => void;
  /** 1:N „Klärungspunkte" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  klaerungspunkteList: Klaerungspunkte[];
  /** Zeilen-Klick → overlay.push auf das Klaerungspunkte-Detail (nie der Edit-Dialog). */
  onOpenKlaerungspunkte: (record: Klaerungspunkte) => void;
  /** Kontextuelles „+": öffnet den Klaerungspunkte-Dialog mit diesem Record vorgesetzt. */
  onAddKlaerungspunkte?: () => void;
  /** 1:N „Risiken" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  risikenList: Risiken[];
  /** Zeilen-Klick → overlay.push auf das Risiken-Detail (nie der Edit-Dialog). */
  onOpenRisiken: (record: Risiken) => void;
  /** Kontextuelles „+": öffnet den Risiken-Dialog mit diesem Record vorgesetzt. */
  onAddRisiken?: () => void;
  /** 1:N „Aufgaben" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenList: Aufgaben[];
  /** Zeilen-Klick → overlay.push auf das Aufgaben-Detail (nie der Edit-Dialog). */
  onOpenAufgaben: (record: Aufgaben) => void;
  /** Kontextuelles „+": öffnet den Aufgaben-Dialog mit diesem Record vorgesetzt. */
  onAddAufgaben?: () => void;
  /** 1:N „Entscheidungen" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** 1:N „Kommunikation" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  kommunikationList: Kommunikation[];
  /** Zeilen-Klick → overlay.push auf das Kommunikation-Detail (nie der Edit-Dialog). */
  onOpenKommunikation: (record: Kommunikation) => void;
  /** Kontextuelles „+": öffnet den Kommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddKommunikation?: () => void;
  /** 1:N „Erfahrungen" (ursprungsvorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** 1:N „Ergebnisdokumente" (vorhaben): VOLLE Liste — der Block filtert auf diesen Record. */
  ergebnisdokumenteList: Ergebnisdokumente[];
  /** Zeilen-Klick → overlay.push auf das Ergebnisdokumente-Detail (nie der Edit-Dialog). */
  onOpenErgebnisdokumente: (record: Ergebnisdokumente) => void;
  /** Kontextuelles „+": öffnet den Ergebnisdokumente-Dialog mit diesem Record vorgesetzt. */
  onAddErgebnisdokumente?: () => void;
}

export function VorhabenDetails({
  record,
  mitarbeitendeList,
  onOpenMitarbeitende,
  quellenList,
  onOpenQuellen,
  onAddQuellen,
  anforderungenList,
  onOpenAnforderungen,
  onAddAnforderungen,
  klaerungspunkteList,
  onOpenKlaerungspunkte,
  onAddKlaerungspunkte,
  risikenList,
  onOpenRisiken,
  onAddRisiken,
  aufgabenList,
  onOpenAufgaben,
  onAddAufgaben,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  kommunikationList,
  onOpenKommunikation,
  onAddKommunikation,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  ergebnisdokumenteList,
  onOpenErgebnisdokumente,
  onAddErgebnisdokumente,
}: VorhabenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const aufklaerungsverantwortlicherTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.aufklaerungsverantwortlicher));
  const technischer_hauptverantwortlicherTarget = mitarbeitendeList.find(r => r.record_id === extractRecordId(record.fields.technischer_hauptverantwortlicher));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('vorhaben', 'vorhaben_nummer')} value={record.fields.vorhaben_nummer} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'anfragebeschreibung')} value={record.fields.anfragebeschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorhaben', 'kunde')} value={record.fields.kunde} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'eingangsdatum')} value={record.fields.eingangsdatum} format="date" />
        <RecordField label={fieldLabel('vorhaben', 'anfragequelle')} value={record.fields.anfragequelle} format="pill" />
        <RecordField label={fieldLabel('vorhaben', 'aufklaerungsstatus')} value={record.fields.aufklaerungsstatus} format="pill" />
        <RecordField label={fieldLabel('vorhaben', 'vertraulichkeit')} value={record.fields.vertraulichkeit} format="pill" />
        <RecordField label={fieldLabel('vorhaben', 'qualitaetsstatus')} value={record.fields.qualitaetsstatus} format="pill" />
        <RecordField label={fieldLabel('vorhaben', 'freigabestatus')} value={record.fields.freigabestatus} format="pill" />
        <RecordField label={fieldLabel('vorhaben', 'kundenkontakt')} value={record.fields.kundenkontakt} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'produkt')} value={record.fields.produkt} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'kundenreferenz')} value={record.fields.kundenreferenz} format="text" />
        <RecordField label={fieldLabel('vorhaben', 'zieltermin_intern')} value={record.fields.zieltermin_intern} format="date" />
        <RecordField label={fieldLabel('vorhaben', 'wunschtermin')} value={record.fields.wunschtermin} format="date" />
        <RecordField label={fieldLabel('vorhaben', 'prioritaet')} value={record.fields.prioritaet} format="pill" />
        <RecordField label={fieldLabel('vorhaben', 'erp_crm_referenz')} value={record.fields.erp_crm_referenz} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('vorhaben', 'aufklaerungsverantwortlicher')}
          name={aufklaerungsverantwortlicherTarget?.fields.vorname ?? '—'}
          meta={[aufklaerungsverantwortlicherTarget?.fields.email, aufklaerungsverantwortlicherTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={aufklaerungsverantwortlicherTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(aufklaerungsverantwortlicherTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('vorhaben', 'technischer_hauptverantwortlicher')}
          name={technischer_hauptverantwortlicherTarget?.fields.vorname ?? '—'}
          meta={[technischer_hauptverantwortlicherTarget?.fields.email, technischer_hauptverantwortlicherTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={technischer_hauptverantwortlicherTarget && onOpenMitarbeitende ? () => onOpenMitarbeitende!(technischer_hauptverantwortlicherTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('quellen')}
        items={quellenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('quellen'), meta: r.fields.erfassungszeitpunkt })}
        onOpen={onOpenQuellen}
        onAdd={onAddQuellen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('anforderungen')}
        items={anforderungenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('anforderungen'), meta: r.fields.bestaetigungszeitpunkt })}
        onOpen={onOpenAnforderungen}
        onAdd={onAddAnforderungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('klaerungspunkte')}
        items={klaerungspunkteList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.adressat ?? appLabel('klaerungspunkte'), meta: r.fields.faelligkeit })}
        onOpen={onOpenKlaerungspunkte}
        onAdd={onAddKlaerungspunkte}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('risiken')}
        items={risikenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('risiken'), meta: r.fields.faelligkeit })}
        onOpen={onOpenRisiken}
        onAdd={onAddRisiken}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('aufgaben')}
        items={aufgabenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben'), meta: r.fields.faelligkeit })}
        onOpen={onOpenAufgaben}
        onAdd={onAddAufgaben}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.entscheidungszeitpunkt })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('kommunikation')}
        items={kommunikationList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.betreff ?? appLabel('kommunikation'), meta: r.fields.zeitpunkt })}
        onOpen={onOpenKommunikation}
        onAdd={onAddKommunikation}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.ursprungsvorhaben) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: r.fields.naechster_pruefttermin })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('ergebnisdokumente')}
        items={ergebnisdokumenteList.filter(r => extractRecordId(r.fields.vorhaben) === record.record_id)}
        map={r => ({ name: r.fields.datenstand ?? appLabel('ergebnisdokumente'), meta: r.fields.erstellungszeitpunkt })}
        onOpen={onOpenErgebnisdokumente}
        onAdd={onAddErgebnisdokumente}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.VORHABEN} recordId={record.record_id} readOnly={!perms.canWrite('vorhaben')} />
    </>
  );
}
