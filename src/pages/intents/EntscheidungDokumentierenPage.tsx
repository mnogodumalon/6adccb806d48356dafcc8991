/**
 * Entscheidung dokumentieren — 3-Schritt-Wizard.
 * Steps: 1) Vorhaben und Fragestellung wählen → 2) Entscheidung, Begründung und Grundlagen erfassen
 *        → 3) Erfahrungen und ersetzte Entscheidung verknüpfen → Prüfen & anlegen.
 * Reads: vorhaben, mitarbeitende, erfahrungen, entscheidungen. Writes: entscheidungen (status getroffen, version 1, Zeitpunkt jetzt).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useEntscheidungDokumentierenFlow } from '@/lib/journey/flows/EntscheidungDokumentieren';
import { tx } from '@/i18n';

export default function EntscheidungDokumentierenPage() {
  const [step, setStep] = useState(1);
  const flow = useEntscheidungDokumentierenFlow({
    steps: {
      vorhaben: 1, fragestellung: 1,
      entscheider: 2, entscheidung: 2, begruendung: 2, grundlagen: 2, freigabe_erforderlich: 2,
      beruecksichtigte_erfahrungen: 3, ersetzte_entscheidung: 3,
    },
    items: {
      vorhaben: r => ({ id: r.id, title: fieldText(r, 'vorhaben_nummer'), subtitle: fieldText(r, 'titel') }),
      entscheider: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldText(r, 'abteilung'),
      }),
      beruecksichtigte_erfahrungen: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldText(r, 'erkenntnis'),
        status: fieldLookup(r, 'freigabestatus') ?? undefined,
      }),
      ersetzte_entscheidung: r => ({
        id: r.id,
        title: fieldText(r, 'fragestellung'),
        subtitle: fieldLookup(r, 'status')?.label,
      }),
    },
  });
  const f = flow.forms.entscheidungen;

  return (
    <IntentWizardShell
      title={tx('Entscheidung dokumentieren')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Halte eine Entscheidung mit Begründung und Grundlagen nachvollziehbar fest.'),
        needs: [tx('Vorhaben'), tx('Entscheider'), tx('Begründung und Grundlagen')],
      }}
    >
      <WizardStep label={tx('Vorhaben')} description={tx('Wähle das Vorhaben und formuliere die Fragestellung.')}>
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.vorhaben.select}
            {...flow.pick('vorhaben')}
            searchPlaceholder={tx('Nummer oder Titel …')}
          />
          <Bound form={f} name="fragestellung" rows={3} />
          <StepNav onNext={() => flow.validateStep(1)} nextStepLabel={tx('Entscheidung erfassen')} />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Entscheidung')}
        description={tx('Halte fest, was entschieden wurde, warum und worauf es beruht.')}
        needs={['vorhaben']}
      >
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.entscheider.select}
            {...flow.pick('entscheider')}
            avatar="initials"
            searchPlaceholder={tx('Name der Person …')}
          />
          <Bound form={f} name="entscheidung" rows={3} />
          <Bound form={f} name="begruendung" rows={3} />
          <Bound form={f} name="grundlagen" rows={3} />
          <Bound form={f} name="freigabe_erforderlich" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Verknüpfungen')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Verknüpfungen')}
        description={tx('Verknüpfe berücksichtigte Erfahrungen und eine ersetzte Entscheidung — beides ist optional.')}
        needs={['entscheidung']}
      >
        <div className="space-y-6">
          <Field form={f} name="beruecksichtigte_erfahrungen">
            <EntitySelectStep
              {...flow.picks.beruecksichtigte_erfahrungen.select}
              {...flow.pickMany('beruecksichtigte_erfahrungen')}
              searchPlaceholder={tx('Erfahrung suchen …')}
            />
          </Field>
          <Field form={f} name="ersetzte_entscheidung">
            <EntitySelectStep
              {...flow.picks.ersetzte_entscheidung.select}
              {...flow.pick('ersetzte_entscheidung')}
              searchPlaceholder={tx('Frühere Entscheidung suchen …')}
            />
          </Field>
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'status', label: tx('Status'), value: tx('Getroffen') }]}
            whatHappensNext={tx('Die Entscheidung wird mit Zeitpunkt und Version 1 gespeichert.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Die Entscheidung ist jetzt dem Vorhaben zugeordnet und nachvollziehbar dokumentiert.')}
          next={[
            { label: tx('Klärungspunkt mit Aufgabe anlegen'), href: '#/intents/klaerungspunkt-aufgabe-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
