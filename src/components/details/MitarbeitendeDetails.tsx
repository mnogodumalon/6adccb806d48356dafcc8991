import type { Mitarbeitende, Vorhaben, Anforderungen, Klaerungspunkte, Risiken, Aufgaben, Entscheidungen, Kommunikation, Erfahrungen, Ergebnisdokumente } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface MitarbeitendeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitarbeitende;
  /** 1:N „Vorhaben" (aufklaerungsverantwortlicher): VOLLE Liste — der Block filtert auf diesen Record. */
  vorhabenAufklaerungsverantwortlicherList: Vorhaben[];
  /** Zeilen-Klick → overlay.push auf das Vorhaben-Detail (nie der Edit-Dialog). */
  onOpenVorhabenAufklaerungsverantwortlicher: (record: Vorhaben) => void;
  /** Kontextuelles „+": öffnet den Vorhaben-Dialog mit diesem Record vorgesetzt. */
  onAddVorhabenAufklaerungsverantwortlicher?: () => void;
  /** 1:N „Vorhaben" (technischer_hauptverantwortlicher): VOLLE Liste — der Block filtert auf diesen Record. */
  vorhabenTechnischerHauptverantwortlicherList: Vorhaben[];
  /** Zeilen-Klick → overlay.push auf das Vorhaben-Detail (nie der Edit-Dialog). */
  onOpenVorhabenTechnischerHauptverantwortlicher: (record: Vorhaben) => void;
  /** Kontextuelles „+": öffnet den Vorhaben-Dialog mit diesem Record vorgesetzt. */
  onAddVorhabenTechnischerHauptverantwortlicher?: () => void;
  /** 1:N „Anforderungen" (pruefer): VOLLE Liste — der Block filtert auf diesen Record. */
  anforderungenPrueferList: Anforderungen[];
  /** Zeilen-Klick → overlay.push auf das Anforderungen-Detail (nie der Edit-Dialog). */
  onOpenAnforderungenPruefer: (record: Anforderungen) => void;
  /** Kontextuelles „+": öffnet den Anforderungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnforderungenPruefer?: () => void;
  /** 1:N „Anforderungen" (bestaetiger): VOLLE Liste — der Block filtert auf diesen Record. */
  anforderungenBestaetigerList: Anforderungen[];
  /** Zeilen-Klick → overlay.push auf das Anforderungen-Detail (nie der Edit-Dialog). */
  onOpenAnforderungenBestaetiger: (record: Anforderungen) => void;
  /** Kontextuelles „+": öffnet den Anforderungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnforderungenBestaetiger?: () => void;
  /** 1:N „Klärungspunkte" (verantwortlicher): VOLLE Liste — der Block filtert auf diesen Record. */
  klaerungspunkteVerantwortlicherList: Klaerungspunkte[];
  /** Zeilen-Klick → overlay.push auf das Klaerungspunkte-Detail (nie der Edit-Dialog). */
  onOpenKlaerungspunkteVerantwortlicher: (record: Klaerungspunkte) => void;
  /** Kontextuelles „+": öffnet den Klaerungspunkte-Dialog mit diesem Record vorgesetzt. */
  onAddKlaerungspunkteVerantwortlicher?: () => void;
  /** 1:N „Klärungspunkte" (fachlicher_pruefer): VOLLE Liste — der Block filtert auf diesen Record. */
  klaerungspunkteFachlicherPrueferList: Klaerungspunkte[];
  /** Zeilen-Klick → overlay.push auf das Klaerungspunkte-Detail (nie der Edit-Dialog). */
  onOpenKlaerungspunkteFachlicherPruefer: (record: Klaerungspunkte) => void;
  /** Kontextuelles „+": öffnet den Klaerungspunkte-Dialog mit diesem Record vorgesetzt. */
  onAddKlaerungspunkteFachlicherPruefer?: () => void;
  /** 1:N „Risiken" (massnahmenverantwortlicher): VOLLE Liste — der Block filtert auf diesen Record. */
  risikenList: Risiken[];
  /** Zeilen-Klick → overlay.push auf das Risiken-Detail (nie der Edit-Dialog). */
  onOpenRisiken: (record: Risiken) => void;
  /** Kontextuelles „+": öffnet den Risiken-Dialog mit diesem Record vorgesetzt. */
  onAddRisiken?: () => void;
  /** 1:N „Aufgaben" (verantwortlicher): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenVerantwortlicherList: Aufgaben[];
  /** Zeilen-Klick → overlay.push auf das Aufgaben-Detail (nie der Edit-Dialog). */
  onOpenAufgabenVerantwortlicher: (record: Aufgaben) => void;
  /** Kontextuelles „+": öffnet den Aufgaben-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabenVerantwortlicher?: () => void;
  /** 1:N „Aufgaben" (unterstuetzende_personen): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenUnterstuetzendePersonenList: Aufgaben[];
  /** Zeilen-Klick → overlay.push auf das Aufgaben-Detail (nie der Edit-Dialog). */
  onOpenAufgabenUnterstuetzendePersonen: (record: Aufgaben) => void;
  /** Kontextuelles „+": öffnet den Aufgaben-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabenUnterstuetzendePersonen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Aufgaben-Datensatz. */
  onPickAufgabenUnterstuetzendePersonen?: () => void;
  /** 1:N „Aufgaben" (pruefer): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenPrueferList: Aufgaben[];
  /** Zeilen-Klick → overlay.push auf das Aufgaben-Detail (nie der Edit-Dialog). */
  onOpenAufgabenPruefer: (record: Aufgaben) => void;
  /** Kontextuelles „+": öffnet den Aufgaben-Dialog mit diesem Record vorgesetzt. */
  onAddAufgabenPruefer?: () => void;
  /** 1:N „Entscheidungen" (entscheider): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** 1:N „Kommunikation" (absender): VOLLE Liste — der Block filtert auf diesen Record. */
  kommunikationAbsenderList: Kommunikation[];
  /** Zeilen-Klick → overlay.push auf das Kommunikation-Detail (nie der Edit-Dialog). */
  onOpenKommunikationAbsender: (record: Kommunikation) => void;
  /** Kontextuelles „+": öffnet den Kommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddKommunikationAbsender?: () => void;
  /** 1:N „Kommunikation" (freigegeben_von): VOLLE Liste — der Block filtert auf diesen Record. */
  kommunikationFreigegebenVonList: Kommunikation[];
  /** Zeilen-Klick → overlay.push auf das Kommunikation-Detail (nie der Edit-Dialog). */
  onOpenKommunikationFreigegebenVon: (record: Kommunikation) => void;
  /** Kontextuelles „+": öffnet den Kommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddKommunikationFreigegebenVon?: () => void;
  /** 1:N „Erfahrungen" (fachlicher_pruefer): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** 1:N „Ergebnisdokumente" (freigeber): VOLLE Liste — der Block filtert auf diesen Record. */
  ergebnisdokumenteList: Ergebnisdokumente[];
  /** Zeilen-Klick → overlay.push auf das Ergebnisdokumente-Detail (nie der Edit-Dialog). */
  onOpenErgebnisdokumente: (record: Ergebnisdokumente) => void;
  /** Kontextuelles „+": öffnet den Ergebnisdokumente-Dialog mit diesem Record vorgesetzt. */
  onAddErgebnisdokumente?: () => void;
}

export function MitarbeitendeDetails({
  record,
  vorhabenAufklaerungsverantwortlicherList,
  onOpenVorhabenAufklaerungsverantwortlicher,
  onAddVorhabenAufklaerungsverantwortlicher,
  vorhabenTechnischerHauptverantwortlicherList,
  onOpenVorhabenTechnischerHauptverantwortlicher,
  onAddVorhabenTechnischerHauptverantwortlicher,
  anforderungenPrueferList,
  onOpenAnforderungenPruefer,
  onAddAnforderungenPruefer,
  anforderungenBestaetigerList,
  onOpenAnforderungenBestaetiger,
  onAddAnforderungenBestaetiger,
  klaerungspunkteVerantwortlicherList,
  onOpenKlaerungspunkteVerantwortlicher,
  onAddKlaerungspunkteVerantwortlicher,
  klaerungspunkteFachlicherPrueferList,
  onOpenKlaerungspunkteFachlicherPruefer,
  onAddKlaerungspunkteFachlicherPruefer,
  risikenList,
  onOpenRisiken,
  onAddRisiken,
  aufgabenVerantwortlicherList,
  onOpenAufgabenVerantwortlicher,
  onAddAufgabenVerantwortlicher,
  aufgabenUnterstuetzendePersonenList,
  onOpenAufgabenUnterstuetzendePersonen,
  onAddAufgabenUnterstuetzendePersonen,
  onPickAufgabenUnterstuetzendePersonen,
  aufgabenPrueferList,
  onOpenAufgabenPruefer,
  onAddAufgabenPruefer,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  kommunikationAbsenderList,
  onOpenKommunikationAbsender,
  onAddKommunikationAbsender,
  kommunikationFreigegebenVonList,
  onOpenKommunikationFreigegebenVon,
  onAddKommunikationFreigegebenVon,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  ergebnisdokumenteList,
  onOpenErgebnisdokumente,
  onAddErgebnisdokumente,
}: MitarbeitendeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitarbeitende', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('mitarbeitende', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('mitarbeitende', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('mitarbeitende', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('mitarbeitende', 'abteilung')} value={record.fields.abteilung} format="text" />
        <RecordField label={fieldLabel('mitarbeitende', 'rolle')} value={record.fields.rolle} format="pill" />
        <RecordField label={fieldLabel('mitarbeitende', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('vorhaben')} · ${fieldLabel('vorhaben', 'aufklaerungsverantwortlicher')}`}
        items={vorhabenAufklaerungsverantwortlicherList.filter(r => extractRecordId(r.fields.aufklaerungsverantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.vorhaben_nummer ?? appLabel('vorhaben'), meta: r.fields.eingangsdatum })}
        onOpen={onOpenVorhabenAufklaerungsverantwortlicher}
        onAdd={onAddVorhabenAufklaerungsverantwortlicher}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('vorhaben')} · ${fieldLabel('vorhaben', 'technischer_hauptverantwortlicher')}`}
        items={vorhabenTechnischerHauptverantwortlicherList.filter(r => extractRecordId(r.fields.technischer_hauptverantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.vorhaben_nummer ?? appLabel('vorhaben'), meta: r.fields.eingangsdatum })}
        onOpen={onOpenVorhabenTechnischerHauptverantwortlicher}
        onAdd={onAddVorhabenTechnischerHauptverantwortlicher}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('anforderungen')} · ${fieldLabel('anforderungen', 'pruefer')}`}
        items={anforderungenPrueferList.filter(r => extractRecordId(r.fields.pruefer) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('anforderungen'), meta: r.fields.bestaetigungszeitpunkt })}
        onOpen={onOpenAnforderungenPruefer}
        onAdd={onAddAnforderungenPruefer}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('anforderungen')} · ${fieldLabel('anforderungen', 'bestaetiger')}`}
        items={anforderungenBestaetigerList.filter(r => extractRecordId(r.fields.bestaetiger) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('anforderungen'), meta: r.fields.bestaetigungszeitpunkt })}
        onOpen={onOpenAnforderungenBestaetiger}
        onAdd={onAddAnforderungenBestaetiger}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('klaerungspunkte')} · ${fieldLabel('klaerungspunkte', 'verantwortlicher')}`}
        items={klaerungspunkteVerantwortlicherList.filter(r => extractRecordId(r.fields.verantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.adressat ?? appLabel('klaerungspunkte'), meta: r.fields.faelligkeit })}
        onOpen={onOpenKlaerungspunkteVerantwortlicher}
        onAdd={onAddKlaerungspunkteVerantwortlicher}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('klaerungspunkte')} · ${fieldLabel('klaerungspunkte', 'fachlicher_pruefer')}`}
        items={klaerungspunkteFachlicherPrueferList.filter(r => extractRecordId(r.fields.fachlicher_pruefer) === record.record_id)}
        map={r => ({ name: r.fields.adressat ?? appLabel('klaerungspunkte'), meta: r.fields.faelligkeit })}
        onOpen={onOpenKlaerungspunkteFachlicherPruefer}
        onAdd={onAddKlaerungspunkteFachlicherPruefer}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('risiken')}
        items={risikenList.filter(r => extractRecordId(r.fields.massnahmenverantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('risiken'), meta: r.fields.faelligkeit })}
        onOpen={onOpenRisiken}
        onAdd={onAddRisiken}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgaben')} · ${fieldLabel('aufgaben', 'verantwortlicher')}`}
        items={aufgabenVerantwortlicherList.filter(r => extractRecordId(r.fields.verantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben'), meta: r.fields.faelligkeit })}
        onOpen={onOpenAufgabenVerantwortlicher}
        onAdd={onAddAufgabenVerantwortlicher}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgaben')} · ${fieldLabel('aufgaben', 'unterstuetzende_personen')}`}
        items={aufgabenUnterstuetzendePersonenList.filter(r => Array.isArray(r.fields.unterstuetzende_personen) && r.fields.unterstuetzende_personen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben'), meta: r.fields.faelligkeit })}
        onOpen={onOpenAufgabenUnterstuetzendePersonen}
        onAdd={onAddAufgabenUnterstuetzendePersonen}
        onPick={onPickAufgabenUnterstuetzendePersonen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('aufgaben')} · ${fieldLabel('aufgaben', 'pruefer')}`}
        items={aufgabenPrueferList.filter(r => extractRecordId(r.fields.pruefer) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben'), meta: r.fields.faelligkeit })}
        onOpen={onOpenAufgabenPruefer}
        onAdd={onAddAufgabenPruefer}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.entscheider) === record.record_id)}
        map={r => ({ name: appLabel('entscheidungen'), meta: r.fields.entscheidungszeitpunkt })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('kommunikation')} · ${fieldLabel('kommunikation', 'absender')}`}
        items={kommunikationAbsenderList.filter(r => extractRecordId(r.fields.absender) === record.record_id)}
        map={r => ({ name: r.fields.betreff ?? appLabel('kommunikation'), meta: r.fields.zeitpunkt })}
        onOpen={onOpenKommunikationAbsender}
        onAdd={onAddKommunikationAbsender}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('kommunikation')} · ${fieldLabel('kommunikation', 'freigegeben_von')}`}
        items={kommunikationFreigegebenVonList.filter(r => extractRecordId(r.fields.freigegeben_von) === record.record_id)}
        map={r => ({ name: r.fields.betreff ?? appLabel('kommunikation'), meta: r.fields.zeitpunkt })}
        onOpen={onOpenKommunikationFreigegebenVon}
        onAdd={onAddKommunikationFreigegebenVon}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.fachlicher_pruefer) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: r.fields.naechster_pruefttermin })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('ergebnisdokumente')}
        items={ergebnisdokumenteList.filter(r => extractRecordId(r.fields.freigeber) === record.record_id)}
        map={r => ({ name: r.fields.datenstand ?? appLabel('ergebnisdokumente'), meta: r.fields.erstellungszeitpunkt })}
        onOpen={onOpenErgebnisdokumente}
        onAdd={onAddErgebnisdokumente}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MITARBEITENDE} recordId={record.record_id} readOnly={!perms.canWrite('mitarbeitende')} />
    </>
  );
}
