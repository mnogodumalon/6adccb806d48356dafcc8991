/**
 * intents.ts — registry of intent workflow pages (Phase 2).
 *
 * The intents orchestrator REGISTERS every page it creates here; the sidebar
 * section (IntentsNav) renders automatically from this list — no Layout edit
 * needed. Keep `path` identical to the route added in App.tsx's
 * `<custom:routes>` block.
 *
 * ONLY write inside the marker blocks — everything outside is scaffold and is
 * overwritten on the next /build/update.
 *
 *   <custom:intent-imports>
 *   import { IconCalendarPlus } from '@tabler/icons-react';
 *   </custom:intent-imports>
 *   …
 *   <custom:intents>
 *   { path: '/intents/neue-buchung', label: { de: 'Neue Buchung', en: 'New booking' }, icon: IconCalendarPlus, description: { de: 'Buchung in 3 Schritten anlegen', en: 'Create a booking in 3 steps' } },
 *   </custom:intents>
 */
import type { ComponentType } from 'react';

// <custom:intent-imports>
import { IconFilePlus, IconListCheck, IconCircleCheck, IconHelpHexagon, IconChecklist, IconGavel } from '@tabler/icons-react';
// </custom:intent-imports>

export interface IntentLink {
  /** Route path as wired in App.tsx (HashRouter), e.g. '/intents/neue-buchung'. */
  path: string;
  /**
   * Short sidebar label (1–3 words). Preferred: both UI languages
   * ({ de, en } — the runtime switcher picks the active one; cs stays
   * readable for legacy entries). A plain string stays valid and renders as-is.
   */
  label: string | { de?: string; en?: string; cs?: string };
  /** Tabler icon COMPONENT reference (not rendered JSX), e.g. IconCalendarPlus. */
  icon?: ComponentType<{ size?: number | string; className?: string; stroke?: number | string }>;
  /**
   * One-line purpose. Same shape as `label`: prefer both UI languages so a
   * language switch reaches it; a plain string stays valid.
   */
  description?: string | { de?: string; en?: string; cs?: string };
}

export const INTENTS: IntentLink[] = [
  // <custom:intents>
  { path: '/intents/anfrage-erfassen', label: { de: 'Anfrage erfassen', en: 'Capture request' }, icon: IconFilePlus, description: 'Legt ein Vorhaben mit der ursprünglichen Anfrage an und ordnet die erste Quelle zu.' },
  { path: '/intents/anforderung-erfassen', label: { de: 'Anforderung erfassen', en: 'Record requirement' }, icon: IconListCheck, description: 'Erfasst eine Anforderung mit Quellenbezug und Prüfer zu einem Vorhaben.' },
  { path: '/intents/anforderung-bestaetigen', label: { de: 'Anforderung prüfen und bestätigen', en: 'Review and confirm requirement' }, icon: IconCircleCheck, description: 'Der Prüfer bewertet eine Anforderung und bestätigt sie oder fordert eine Rückfrage an.' },
  { path: '/intents/klaerungspunkt-aufgabe-anlegen', label: { de: 'Klärungspunkt mit Aufgabe anlegen', en: 'Create clarification with task' }, icon: IconHelpHexagon, description: 'Erfasst einen Klärungspunkt zu betroffenen Anforderungen und vergibt dazu direkt eine Aufgabe.' },
  { path: '/intents/klaerungspunkt-abschliessen', label: { de: 'Klärungspunkt beantworten und klären', en: 'Answer and resolve clarification' }, icon: IconChecklist, description: 'Trägt die Antwort samt Quelle ein und schließt den Klärungspunkt nach fachlicher Prüfung ab.' },
  { path: '/intents/entscheidung-dokumentieren', label: { de: 'Entscheidung dokumentieren', en: 'Document decision' }, icon: IconGavel, description: 'Hält eine fachliche Entscheidung mit Begründung, Grundlagen und berücksichtigten Erfahrungen fest.' },
  // </custom:intents>
];

/**
 * True only in the Phase-1 deploy bundle (the service flips it): the sidebar
 * then shows ghost rows ("werden erstellt…") until Phase 2 registers the real
 * pages and sets this back to false. Lives OUTSIDE the custom markers on
 * purpose — a scaffold update resets it to false (self-healing if Phase 2
 * never ran).
 */
export const INTENTS_PENDING = false;

/**
 * When the Phase-1 bundle was deployed (ISO, set by the service together with
 * INTENTS_PENDING). The sidebar stops showing the ghost row PENDING_MAX_MINUTES
 * later on its own: a Phase 2 that ended red (or never ran) used to leave a
 * pulsing "werden erstellt …" in every deployed Phase-1 bundle forever — no
 * code path redeploys Phase 1 without the flag (live 03.09.2026).
 */
export const INTENTS_PENDING_SINCE: string | null = '2026-10-24T15:18:15+00:00';
export const PENDING_MAX_MINUTES = 30;
