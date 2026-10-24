/**
 * Anforderung bestätigen — 4-Schritt-Wizard.
 * Steps: 1) Anforderung mit Quelle ansehen → 2) Fachliche Bewertung eintragen → 3) Bestätigen oder Rückfrage markieren → 4) Prüfen & speichern.
 * Reads: anforderungen (titel, beschreibung, kritikalitaet, quelle, quellenstelle, status), mitarbeitende. Writes: anforderungen (update, via useAnforderungBestaetigenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldRef } from '@/lib/journey';
import { useAnforderungBestaetigenFlow } from '@/lib/journey/flows/AnforderungBestaetigen';
import { tx } from '@/i18n';

export default function AnforderungBestaetigenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnforderungBestaetigenFlow({
    steps: { anforderungen: 1, fachliche_bewertung: 2, bestaetiger: 3, status: 3, aenderungsgrund: 3 },
    items: {
      anforderungen: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: ctx.ref('quelle') ?? tx('Ohne Quelle'),
        status: fieldLookup(r, 'status') ?? undefined,
      }),
      bestaetiger: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldText(r, 'abteilung'),
      }),
    },
  });

  const anfId = flow.pick('anforderungen').selectedId as string | undefined;
  const rec = anfId ? flow.picks.anforderungen.recordOf(anfId) : undefined;

  const checkStep1 = () => {
    if (!anfId || !rec) return flow.validateStep(1);
    if (!fieldRef(rec, 'quelle')) return tx('Die Anforderung hat keinen Quellenbezug.');
    return flow.validateStep(1);
  };

  return (
    <IntentWizardShell
      title={tx('Anforderung bestätigen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Anforderung prüfen, bewerten und bestätigen oder zurückfragen.'),
        needs: [tx('Die Anforderung mit Quelle'), tx('Deine fachliche Bewertung')],
      }}
    >
      <WizardStep label={tx('Anforderung')} description={tx('Wähle die Anforderung und sieh dir ihre Quelle an.')}>
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.anforderungen.select}
            {...flow.pick('anforderungen')}
            searchPlaceholder={tx('Titel suchen …')}
          />
          {rec && (
            <div className="rounded-2xl border bg-card p-4 space-y-2 overflow-hidden">
              <h3 className="font-semibold">{fieldText(rec, 'titel')}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{fieldText(rec, 'beschreibung')}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">{tx('Kritikalität')}</dt>
                  <dd>{fieldLookup(rec, 'kritikalitaet')?.label ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{tx('Status')}</dt>
                  <dd>{fieldLookup(rec, 'status')?.label ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{tx('Quelle')}</dt>
                  <dd>{flow.picks.anforderungen.refLabel(rec, 'quelle') ?? tx('Keine Quelle')}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{tx('Quellenstelle')}</dt>
                  <dd>{fieldText(rec, 'quellenstelle') || '—'}</dd>
                </div>
              </dl>
            </div>
          )}
          <StepNav onNext={checkStep1} nextStepLabel={tx('Bewertung')} hideBack />
        </div>
      </WizardStep>

      <WizardStep label={tx('Bewertung')} description={tx('Halte deine fachliche Einschätzung fest.')} needs={['anforderungen']}>
        <div className="space-y-4">
          <Bound form={flow.forms.anforderungen} name="fachliche_bewertung" rows={5} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Entscheidung')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Entscheidung')} description={tx('Bestätige die Anforderung oder markiere eine Rückfrage.')} needs={['anforderungen']}>
        <div className="space-y-4">
          <Bound form={flow.forms.anforderungen} name="status" />
          <EntitySelectStep
            {...flow.picks.bestaetiger.select}
            {...flow.pick('bestaetiger')}
            searchPlaceholder={tx('Name suchen …')}
          />
          <Bound form={flow.forms.anforderungen} name="aenderungsgrund" rows={3} />
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
            whatHappensNext={tx('Der Zeitpunkt der Bestätigung wird automatisch festgehalten.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Klärungspunkt mit Aufgabe anlegen'), href: '#/intents/klaerungspunkt-aufgabe-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
