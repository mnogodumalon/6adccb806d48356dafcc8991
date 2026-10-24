/**
 * Anfrage erfassen — 4-Schritt-Wizard.
 * Steps: 1) Anfragedaten und Kunde → 2) Aufklärungsverantwortlichen wählen → 3) Erste Quelle erfassen → 4) Prüfen & anlegen.
 * Reads: mitarbeitende. Writes: vorhaben, quellen (via useAnfrageErfassenFlow).
 * Composes: IntentWizardShell, Bound, EntitySelectStep, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, todayIso } from '@/lib/journey';
import { useAnfrageErfassenFlow } from '@/lib/journey/flows/AnfrageErfassen';
import { tx } from '@/i18n';

export default function AnfrageErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnfrageErfassenFlow({
    steps: {
      titel: 1, anfragebeschreibung: 1, kunde: 1, anfragequelle: 1, vertraulichkeit: 1, prioritaet: 1, wunschtermin: 1,
      aufklaerungsverantwortlicher: 2,
      quellentyp: 3, datei: 3,
    },
    items: {
      aufklaerungsverantwortlicher: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldLookup(r, 'rolle')?.label ?? undefined,
      }),
    },
    compute: {
      vertraulichkeit: forms => forms.vorhaben.get('vertraulichkeit'),
    },
  });

  return (
    <IntentWizardShell
      title={tx('Anfrage erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine neue Kundenanfrage als Vorhaben anlegen und die erste Quelle zuordnen.'),
        needs: [tx('Titel und Beschreibung der Anfrage'), tx('Name des Kunden'), tx('Ein Original-Dokument (optional)')],
      }}
    >
      <WizardStep label={tx('Anfrage')} description={tx('Worum geht es und von wem kommt die Anfrage?')}>
        <div className="space-y-4">
          <Bound form={flow.forms.vorhaben} name="titel" />
          <Bound form={flow.forms.vorhaben} name="anfragebeschreibung" rows={4} />
          <Bound form={flow.forms.vorhaben} name="kunde" />
          <Bound form={flow.forms.vorhaben} name="anfragequelle" />
          <Bound form={flow.forms.vorhaben} name="vertraulichkeit" />
          <Bound form={flow.forms.vorhaben} name="prioritaet" allowClear />
          <Bound form={flow.forms.vorhaben} name="wunschtermin" />
          <StepNav
            hideBack
            onNext={() => flow.validateStep(1)}
            nextStepLabel={tx('Verantwortlichen wählen')}
          />
        </div>
      </WizardStep>
      <WizardStep
        label={tx('Verantwortlicher')}
        heading={tx('Aufklärungsverantwortlichen wählen')}
        description={tx('Wer klärt diese Anfrage auf?')}
      >
        <EntitySelectStep
          {...flow.picks.aufklaerungsverantwortlicher.select}
          {...flow.pick('aufklaerungsverantwortlicher')}
          searchPlaceholder={tx('Name suchen …')}
          avatar="initials"
        />
      </WizardStep>
      <WizardStep
        label={tx('Erste Quelle')}
        description={tx('Optional: Mail, Dokument oder Notiz zur Anfrage hinterlegen.')}
      >
        <div className="space-y-4">
          <Bound form={flow.forms.quellen} name="titel" />
          <Bound form={flow.forms.quellen} name="quellentyp" />
          <Bound form={flow.forms.quellen} name="datei" />
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
            items={[
              { key: 'eingangsdatum', label: tx('Eingangsdatum'), value: todayIso() },
              { key: 'aufklaerungsstatus', label: tx('Aufklärungsstatus'), value: tx('Neu') },
            ]}
            whatHappensNext={tx('Das Vorhaben wird angelegt, die Vorhaben-Nummer vergibt das System.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          whatHappensNext={tx('Als Nächstes kannst du die ersten Anforderungen zum Vorhaben erfassen.')}
          next={[
            { label: tx('Anforderung erfassen'), href: '#/intents/anforderung-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
