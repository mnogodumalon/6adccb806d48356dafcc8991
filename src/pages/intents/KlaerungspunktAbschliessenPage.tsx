/**
 * Klärungspunkt abschließen — 4-Schritt-Wizard plus Prüfen.
 * Steps: 1) Offenen Klärungspunkt wählen → 2) Antwort und Antwortquelle erfassen → 3) Fachlichen Prüfer wählen → 4) Status setzen → Prüfen & speichern.
 * Reads: klaerungspunkte, quellen, mitarbeitende. Writes: klaerungspunkte (update).
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
import { useKlaerungspunktAbschliessenFlow } from '@/lib/journey/flows/KlaerungspunktAbschliessen';
import { tx } from '@/i18n';

export default function KlaerungspunktAbschliessenPage() {
  const [step, setStep] = useState(1);
  const flow = useKlaerungspunktAbschliessenFlow({
    steps: { klaerungspunkte: 1, antwortquelle: 2, bestaetigte_antwort: 2, fachlicher_pruefer: 3, status: 4 },
    items: {
      klaerungspunkte: r => ({
        id: r.id,
        title: fieldText(r, 'fragestellung'),
        subtitle: [fieldLookup(r, 'kritikalitaet')?.label, fieldLookup(r, 'status')?.label].filter(Boolean).join(' · '),
      }),
      antwortquelle: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldLookup(r, 'quellentyp')?.label }),
      fachlicher_pruefer: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldText(r, 'abteilung'),
      }),
    },
  });
  const f = flow.forms.klaerungspunkte;
  const target = flow.targets.klaerungspunkte.record;
  const vorschlag = target ? fieldText(target, 'vorgeschlagene_antwort') : '';

  return (
    <IntentWizardShell
      title={tx('Klärungspunkt abschließen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Antwort samt Quelle eintragen und den Klärungspunkt abschließen.'),
        needs: [tx('Die bestätigte Antwort'), tx('Die Quelle der Antwort'), tx('Den fachlichen Prüfer')],
      }}
    >
      <WizardStep label={tx('Klärungspunkt')} description={tx('Welchen Klärungspunkt möchtest du beantworten?')}>
        <EntitySelectStep {...flow.picks.klaerungspunkte.select} {...flow.pick('klaerungspunkte')} />
      </WizardStep>
      <WizardStep label={tx('Antwort')} description={tx('Trage die bestätigte Antwort ein und wähle die Quelle dazu.')} needs={['klaerungspunkte']}>
        <div className="space-y-4">
          {vorschlag && (
            <div className="rounded-2xl border bg-secondary p-3 text-sm">
              <p className="font-medium">{tx('Vorgeschlagene Antwort')}</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{vorschlag}</p>
            </div>
          )}
          <Bound form={f} name="bestaetigte_antwort" rows={4} />
          <EntitySelectStep {...flow.picks.antwortquelle.select} {...flow.pick('antwortquelle')} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Fachlicher Prüfer')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfer')} description={tx('Wer hat die Antwort fachlich geprüft?')} needs={['klaerungspunkte']}>
        <div className="space-y-4">
          <EntitySelectStep {...flow.picks.fachlicher_pruefer.select} {...flow.pick('fachlicher_pruefer')} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() =>
              f.get('fachlicher_pruefer')
                ? flow.validateStep(3)
                : tx('Vor dem Abschluss muss ein fachlicher Prüfer gewählt sein.')
            }
            nextStepLabel={tx('Status')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Status')} description={tx('Setze den Status auf „Geklärt“, wenn die Antwort feststeht.')} needs={['klaerungspunkte']}>
        <div className="space-y-4">
          <Bound form={f} name="status" />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Der Klärungspunkt wird mit Antwort, Quelle und Prüfer aktualisiert.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Entscheidung dokumentieren'), href: '#/intents/entscheidung-dokumentieren' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
