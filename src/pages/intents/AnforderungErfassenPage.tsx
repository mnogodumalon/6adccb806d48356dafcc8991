/**
 * Anforderung erfassen — 4-Schritt-Wizard + Prüfen.
 * Steps: 1) Vorhaben wählen → 2) Quelle und Quellenstelle angeben → 3) Kategorie, Art und Kritikalität festlegen
 *        → 4) Prüfer wählen → 5) Prüfen & anlegen.
 * Reads: vorhaben, quellen, mitarbeitende. Writes: anforderungen (via useAnforderungErfassenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useAnforderungErfassenFlow } from '@/lib/journey/flows/AnforderungErfassen';
import { tx } from '@/i18n';

export default function AnforderungErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnforderungErfassenFlow({
    steps: {
      vorhaben: 1,
      quelle: 2, quellenstelle: 2, fachliche_grundlage: 2,
      titel: 3, beschreibung: 3, kategorie: 3, anforderungsart: 3, verbindlichkeit: 3, kritikalitaet: 3, akzeptanzkriterium: 3,
      pruefer: 4,
    },
    items: {
      vorhaben: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: `${fieldText(r, 'vorhaben_nummer')} · ${fieldText(r, 'kunde')}` }),
      quelle: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldLookup(r, 'quellentyp')?.label }),
      pruefer: r => ({ id: r.id, title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(), subtitle: fieldText(r, 'abteilung') }),
    },
  });
  const f = flow.forms.anforderungen;

  return (
    <IntentWizardShell
      title={tx('Anforderung erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Anforderung mit Quelle und Prüfer zu einem Vorhaben festhalten.'),
        needs: [tx('Vorhaben'), tx('Titel und Beschreibung'), tx('Quelle und Prüfer')],
      }}
    >
      <WizardStep label={tx('Vorhaben')} description={tx('Zu welchem Vorhaben gehört die Anforderung?')}>
        <EntitySelectStep {...flow.picks.vorhaben.select} {...flow.pick('vorhaben')} searchPlaceholder={tx('Nummer, Titel oder Kunde …')} />
      </WizardStep>

      <WizardStep label={tx('Quelle')} description={tx('Woher stammt die Anforderung, und an welcher Stelle steht sie?')} needs={['vorhaben']}>
        <div className="space-y-4">
          <EntitySelectStep {...flow.picks.quelle.select} {...flow.pick('quelle')} searchPlaceholder={tx('Quelle suchen …')} />
          <Bound form={f} name="quellenstelle" />
          <Bound form={f} name="fachliche_grundlage" rows={3} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Einordnung')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Einordnung')} description={tx('Beschreibe die Anforderung und lege Kategorie, Art und Kritikalität fest.')}>
        <div className="space-y-4">
          <Bound form={f} name="titel" />
          <Bound form={f} name="beschreibung" rows={4} />
          <Bound form={f} name="kategorie" />
          <Bound form={f} name="anforderungsart" />
          <Bound form={f} name="verbindlichkeit" />
          <Bound form={f} name="kritikalitaet" />
          <Bound form={f} name="akzeptanzkriterium" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Prüfer')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfer')} description={tx('Wer prüft die Anforderung fachlich?')}>
        <EntitySelectStep {...flow.picks.pruefer.select} {...flow.pick('pruefer')} searchPlaceholder={tx('Name suchen …')} />
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'status', label: tx('Status'), value: tx('Vorgeschlagen') },
              { key: 'version', label: tx('Version'), value: '1' },
            ]}
            whatHappensNext={tx('Die Anforderung startet als Vorschlag und kann danach geprüft und bestätigt werden.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Klärungspunkt anlegen'), href: '#/intents/klaerungspunkt-aufgabe-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Offene Fragen zur Anforderung hältst du als Klärungspunkt mit Aufgabe fest.')}
        />
      )}
    </IntentWizardShell>
  );
}
