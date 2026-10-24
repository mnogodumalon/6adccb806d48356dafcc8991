/**
 * Klärungspunkt mit Aufgabe anlegen — 4-Schritt-Wizard.
 * Steps: 1) Vorhaben und betroffene Anforderungen/Quellen wählen → 2) Fragestellung, Anlass, Kritikalität
 *        → 3) Verantwortlichen und Frist festlegen → 4) Aufgabe dazu anlegen → Prüfen & anlegen.
 * Reads: vorhaben, anforderungen, quellen, mitarbeitende. Writes: klaerungspunkte, aufgaben (via useKlaerungspunktAufgabeAnlegenFlow).
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
import type { JourneyRecord } from '@/lib/journey';
import { useKlaerungspunktAufgabeAnlegenFlow } from '@/lib/journey/flows/KlaerungspunktAufgabeAnlegen';
import { tx } from '@/i18n';

export default function KlaerungspunktAufgabeAnlegenPage() {
  const [step, setStep] = useState(1);

  const person = (m: JourneyRecord) => ({
    id: m.id,
    title: `${fieldText(m, 'vorname')} ${fieldText(m, 'nachname')}`.trim(),
    subtitle: fieldLookup(m, 'rolle')?.label ?? '',
  });

  const flow = useKlaerungspunktAufgabeAnlegenFlow({
    steps: {
      vorhaben: 1, betroffene_anforderungen: 1, betroffene_quellen: 1,
      fragestellung: 2, anlass: 2, kritikalitaet: 2,
      verantwortlicher: 3, adressat: 3, faelligkeit: 3,
      titel: 4, zweck: 4, aufgabentyp: 4, erwartetes_ergebnis: 4, pruefer: 4,
    },
    items: {
      vorhaben: v => ({ id: v.id, title: fieldText(v, 'vorhaben_nummer'), subtitle: fieldText(v, 'titel') }),
      verantwortlicher: person,
      pruefer: person,
      betroffene_anforderungen: a => ({
        id: a.id,
        title: fieldText(a, 'titel'),
        subtitle: [fieldLookup(a, 'status')?.label, fieldLookup(a, 'kritikalitaet')?.label].filter(Boolean).join(' · '),
      }),
      betroffene_quellen: q => ({ id: q.id, title: fieldText(q, 'titel') }),
    },
    // Die Aufgabe ist fällig, wenn der Klärungspunkt fällig ist.
    compute: { faelligkeit: f => f.klaerungspunkte.get('faelligkeit') },
  });

  const kp = flow.forms.klaerungspunkte;
  const auf = flow.forms.aufgaben;

  // Vorhaben und Verantwortlicher gelten für Klärungspunkt UND Aufgabe — einmal wählen, in beide Formulare schreiben.
  const pickVorhaben = flow.pick('vorhaben');
  const pickVerantwortlicher = flow.pick('verantwortlicher');

  return (
    <IntentWizardShell
      title={tx('Klärungspunkt mit Aufgabe anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Halte eine offene Frage fest und vergib direkt die Aufgabe, sie zu klären.'),
        needs: [tx('Vorhaben'), tx('Fragestellung'), tx('Verantwortliche Person')],
      }}
    >
      <WizardStep label={tx('Vorhaben')} description={tx('Wähle das Vorhaben und die Anforderungen oder Quellen, um die es geht.')}>
        <div className="space-y-6">
          <Field form={kp} name="vorhaben">
            <EntitySelectStep
              {...flow.picks.vorhaben.select}
              selectedId={pickVorhaben.selectedId}
              onSelect={id => {
                pickVorhaben.onSelect(id);
                auf.set('vorhaben', id, flow.picks.vorhaben.labelOf(id));
              }}
            />
          </Field>
          <Field form={kp} name="betroffene_anforderungen">
            <EntitySelectStep {...flow.picks.betroffene_anforderungen.select} {...flow.pickMany('betroffene_anforderungen')} />
          </Field>
          <Field form={kp} name="betroffene_quellen">
            <EntitySelectStep {...flow.picks.betroffene_quellen.select} {...flow.pickMany('betroffene_quellen')} />
          </Field>
          <StepNav onNext={() => flow.validateStep(1)} nextStepLabel={tx('Fragestellung')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Fragestellung')} description={tx('Was ist unklar und wie kritisch ist es?')} needs={['vorhaben']}>
        <div className="space-y-4">
          <Bound form={kp} name="fragestellung" rows={4} />
          <Bound form={kp} name="anlass" />
          <Bound form={kp} name="kritikalitaet" />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Verantwortlicher')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Verantwortlicher')} description={tx('Wer klärt die Frage, bei wem fragst du nach und bis wann?')} needs={['vorhaben']}>
        <div className="space-y-6">
          <Field form={kp} name="verantwortlicher">
            <EntitySelectStep
              {...flow.picks.verantwortlicher.select}
              selectedId={pickVerantwortlicher.selectedId}
              onSelect={id => {
                pickVerantwortlicher.onSelect(id);
                auf.set('verantwortlicher', id, flow.picks.verantwortlicher.labelOf(id));
              }}
              avatar="initials"
            />
          </Field>
          <Bound form={kp} name="adressat" />
          <Bound form={kp} name="faelligkeit" />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Aufgabe')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Aufgabe')} description={tx('Beschreibe die Aufgabe, die zur Klärung vergeben wird.')} needs={['vorhaben', 'verantwortlicher']}>
        <div className="space-y-4">
          <Bound form={auf} name="titel" />
          <Bound form={auf} name="zweck" rows={3} />
          <Bound form={auf} name="aufgabentyp" />
          <Bound form={auf} name="erwartetes_ergebnis" rows={3} />
          <Field form={auf} name="pruefer">
            <EntitySelectStep {...flow.picks.pruefer.select} {...flow.pick('pruefer')} avatar="initials" />
          </Field>
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Der Klärungspunkt wird offen angelegt und die Aufgabe bereit zur Bearbeitung mit der Frist des Klärungspunkts.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Klärungspunkt beantworten und klären'), href: '#/intents/klaerungspunkt-abschliessen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Sobald eine Antwort vorliegt, kannst du den Klärungspunkt abschließen.')}
        />
      )}
    </IntentWizardShell>
  );
}
