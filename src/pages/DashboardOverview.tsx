import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconChecklist, IconFileCheck, IconAlertCircle } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
// @ts-ignore — opens the flow that owns a change
import { flowActionFor } from '@/config/plan';
import { extractRecordId } from '@/services/livingAppsService';
import { formatDate, lookupKey } from '@/lib/formatters';
import { useClock, gruss, namen } from '@/lib/polish';
import { tx, appLabel, dateFnsLocale } from '@/i18n';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { Button } from '@/components/ui/button';

type Filter = 'all' | 'klaer' | 'risk' | 'muss' | 'freigabe';

const PRIO_RANK: Record<string, number> = { dringend: 0, hoch: 1, normal: 2, niedrig: 3 };
const INACTIVE = ['abgeschlossen', 'abgebrochen', 'zurueckgestellt'];

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { mitarbeitende } = data;
  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'anforderungen' && lookupKey(top.record.fields.status) !== 'bestaetigt') {
        const go = flowActionFor('anforderungen', 'status', top.record.record_id, 'bestaetigt');
        return go ? { label: tx('Anforderung bestätigen'), onClick: go } : undefined;
      }
      if (top.type === 'klaerungspunkte' && lookupKey(top.record.fields.status) !== 'geklaert') {
        const go = flowActionFor('klaerungspunkte', 'status', top.record.record_id, 'geklaert');
        return go ? { label: tx('Klärungspunkt abschließen'), onClick: go } : undefined;
      }
      return undefined;
    },
  });
  const enrichedVorhaben = crud.enriched.vorhaben;
  const enrichedAnforderungen = crud.enriched.anforderungen;
  const enrichedKlaerungspunkte = crud.enriched.klaerungspunkte;
  const enrichedRisiken = crud.enriched.risiken;
  const enrichedAufgaben = crud.enriched.aufgaben;
  const enrichedErgebnisdokumente = crud.enriched.ergebnisdokumente;

  const clock = useClock();
  const today = format(clock, 'yyyy-MM-dd');
  const [filter, setFilter] = useState<Filter>('all');
  const [person, setPerson] = useState<string>('all');

  const d = useMemo(() => {
    const day = (s?: string) => (s ? s.slice(0, 10) : '');
    const rid = (u?: string) => extractRecordId(u) ?? '';

    const klaer = enrichedKlaerungspunkte.filter(k =>
      lookupKey(k.fields.kritikalitaet) === 'kritisch' &&
      !['geklaert', 'nicht_relevant'].includes(lookupKey(k.fields.status) ?? ''));
    const risk = enrichedRisiken.filter(r =>
      lookupKey(r.fields.risikoklasse) === 'kritisch' &&
      !['behandelt', 'akzeptiert', 'geschlossen'].includes(lookupKey(r.fields.status) ?? ''));
    const muss = enrichedAnforderungen.filter(a =>
      lookupKey(a.fields.anforderungsart) === 'muss' &&
      lookupKey(a.fields.kritikalitaet) === 'kritisch' &&
      !['bestaetigt', 'abgelehnt', 'ersetzt', 'nicht_anwendbar'].includes(lookupKey(a.fields.status) ?? ''));
    const freigabe = enrichedErgebnisdokumente.filter(e => lookupKey(e.fields.freigabestatus) === 'ausstehend');
    const openTasks = enrichedAufgaben.filter(a => !['erledigt', 'abgebrochen'].includes(lookupKey(a.fields.status) ?? ''));
    const overdue = openTasks.filter(a => day(a.fields.faelligkeit) && day(a.fields.faelligkeit) < today);

    const count = (list: { fields: { vorhaben?: string } }[]) => {
      const m = new Map<string, number>();
      list.forEach(x => { const id = rid(x.fields.vorhaben); if (id) m.set(id, (m.get(id) ?? 0) + 1); });
      return m;
    };
    const perV = { klaer: count(klaer), risk: count(risk), muss: count(muss), freigabe: count(freigabe), overdue: count(overdue) };

    const active = enrichedVorhaben
      .filter(v => !INACTIVE.includes(lookupKey(v.fields.aufklaerungsstatus) ?? ''))
      .sort((a, b) => {
        const pa = PRIO_RANK[lookupKey(a.fields.prioritaet) ?? 'normal'] ?? 2;
        const pb = PRIO_RANK[lookupKey(b.fields.prioritaet) ?? 'normal'] ?? 2;
        if (pa !== pb) return pa - pb;
        const za = day(a.fields.zieltermin_intern) || '9999';
        const zb = day(b.fields.zieltermin_intern) || '9999';
        return za.localeCompare(zb);
      });
    return { klaer, risk, muss, freigabe, openTasks, overdue, perV, active, day };
  }, [enrichedVorhaben, enrichedAnforderungen, enrichedKlaerungspunkte, enrichedRisiken, enrichedAufgaben, enrichedErgebnisdokumente, today]);

  const personName = (m: { fields: { vorname?: string; nachname?: string } }) =>
    `${m.fields.vorname ?? ''} ${m.fields.nachname ?? ''}`.trim();

  const shown = d.active.filter(v => {
    if (filter === 'all') return true;
    return (d.perV[filter].get(v.record_id) ?? 0) > 0;
  });

  const toggle = (f: Filter) => setFilter(cur => (cur === f ? 'all' : f));
  const vName = (id?: string) => enrichedVorhaben.find(v => v.record_id === extractRecordId(id) )?.fields.titel ?? '';

  const myTasks = d.openTasks
    .filter(a => person === 'all' || extractRecordId(a.fields.verantwortlicher) === person)
    .sort((a, b) => (d.day(a.fields.faelligkeit) || '9999').localeCompare(d.day(b.fields.faelligkeit) || '9999'));

  // Context line — names things in every branch
  const titles = (xs: string[]) => xs.filter(Boolean).slice(0, 2).join(' & ');
  let context: string;
  if (enrichedVorhaben.length === 0) {
    context = tx('Lege dein erstes Vorhaben an und starte die Auftragsklärung.');
  } else if (d.overdue.length > 0) {
    context = tx`Überfällige Aufgaben bei ${namen(d.overdue.map(a => a.verantwortlicherName))}.`;
  } else if (d.klaer.length > 0) {
    context = tx`Kritisch offen: ${titles(d.klaer.map(k => k.vorhabenName))}.`;
  } else if (d.active[0]) {
    context = tx`Alles im Plan — oberste Priorität hat ${d.active[0].fields.titel ?? ''}.`;
  } else {
    context = tx('Alle Vorhaben sind abgeschlossen oder zurückgestellt.');
  }

  const firstOverdue = d.overdue[0];

  const hero = enrichedVorhaben.length === 0 ? (
    crud.vorhaben.canWrite && (
      <HeroBanner
        icon={<IconPlus size={18} />}
        action={{ label: tx('Erstes Vorhaben anlegen'), onClick: () => crud.vorhaben.openCreate({}) }}
      >
        {tx('Noch kein Vorhaben erfasst — beginne mit der ersten Kundenanfrage.')}
      </HeroBanner>
    )
  ) : firstOverdue ? (
    <HeroBanner
      icon={<IconAlertTriangle size={18} />}
      action={{ label: tx('Aufgabe öffnen'), onClick: () => crud.aufgaben.openDetail(firstOverdue) }}
    >
      <b>{d.overdue.length === 1 ? tx('Eine Aufgabe ist überfällig') : tx`${d.overdue.length} Aufgaben sind überfällig`}</b>
      {' — '}
      {firstOverdue.fields.titel ?? ''} ({firstOverdue.verantwortlicherName}, {tx('fällig war')} {formatDate(firstOverdue.fields.faelligkeit)}).
    </HeroBanner>
  ) : undefined;

  const kpis = enrichedVorhaben.length > 0 ? (
    <StatStrip>
      <StatStripItem
        title={tx('Kritische Klärungspunkte')} value={d.klaer.length}
        icon={<IconAlertCircle size={16} />}
        tone={d.klaer.length > 0 ? 'destructive' : 'default'}
        onClick={() => toggle('klaer')} active={filter === 'klaer'}
      />
      <StatStripItem
        title={tx('Kritische Risiken')} value={d.risk.length}
        tone={d.risk.length > 0 ? 'warning' : 'default'}
        onClick={() => toggle('risk')} active={filter === 'risk'}
      />
      <StatStripItem
        title={tx('Muss ohne Bestätigung')} value={d.muss.length}
        icon={<IconChecklist size={16} />}
        tone={d.muss.length > 0 ? 'warning' : 'default'}
        onClick={() => toggle('muss')} active={filter === 'muss'}
      />
      <StatStripItem
        title={tx('Freigabe ausstehend')} value={d.freigabe.length}
        icon={<IconFileCheck size={16} />}
        tone={d.freigabe.length > 0 ? 'primary' : 'default'}
        onClick={() => toggle('freigabe')} active={filter === 'freigabe'}
      />
    </StatStrip>
  ) : undefined;

  const chip = (n: number, label: string, cls: string) =>
    n > 0 ? <span key={label} className={`text-xs font-medium ${cls}`}>{n} {label}</span> : null;

  const primary = (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b">
        <h2 className="text-base font-semibold">
          {tx('Aktive Vorhaben')} <span className="text-muted-foreground font-normal">({shown.length})</span>
        </h2>
        {crud.vorhaben.canWrite && (
          <Button size="sm" onClick={() => crud.vorhaben.openCreate({})}>
            <IconPlus size={16} className="shrink-0" /> {tx('Neues Vorhaben')}
          </Button>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          {filter === 'all' ? tx('Keine aktiven Vorhaben.') : tx('Kein Vorhaben mit diesem Befund — Filter oben erneut antippen.')}
        </p>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3">
          {shown.map(v => {
            const ziel = d.day(v.fields.zieltermin_intern);
            const late = ziel && ziel < today;
            const prio = lookupKey(v.fields.prioritaet);
            return (
              <li key={v.record_id} className="min-w-0">
                <div
                  role="button" tabIndex={0}
                  onClick={() => crud.vorhaben.openDetail(v)}
                  onKeyDown={e => { if (e.key === 'Enter') crud.vorhaben.openDetail(v); }}
                  className="w-full h-full cursor-pointer rounded-lg border p-3 text-left hover:bg-muted/50 overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{v.fields.titel ?? v.fields.vorhaben_nummer}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {v.fields.kunde ?? ''}{v.aufklaerungsverantwortlicherName ? ` · ${v.aufklaerungsverantwortlicherName}` : ''}
                      </div>
                    </div>
                    {(prio === 'dringend' || prio === 'hoch') && (
                      <span className="shrink-0 text-xs font-semibold text-destructive">{v.fields.prioritaet?.label}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs font-medium text-primary">{v.fields.aufklaerungsstatus?.label}</span>
                    {ziel && (
                      <span className={`text-xs ${late ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
                        {tx('Ziel')} {formatDate(v.fields.zieltermin_intern)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {chip(d.perV.klaer.get(v.record_id) ?? 0, tx('krit. Klärungspunkte'), 'text-destructive')}
                    {chip(d.perV.risk.get(v.record_id) ?? 0, tx('krit. Risiken'), 'text-amber-600')}
                    {chip(d.perV.muss.get(v.record_id) ?? 0, tx('Muss unbestätigt'), 'text-amber-600')}
                    {chip(d.perV.overdue.get(v.record_id) ?? 0, tx('überfällig'), 'text-destructive')}
                    {chip(d.perV.freigabe.get(v.record_id) ?? 0, tx('Freigabe offen'), 'text-primary')}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const aside = (
    <>
      <WorkList
        title={tx('Kritische Klärungspunkte')}
        items={d.klaer.map(k => {
          const go = flowActionFor('klaerungspunkte', 'status', k.record_id, 'geklaert');
          return {
            id: k.record_id,
            title: k.fields.fragestellung ?? '',
            secondLine: (
              <>
                <span className="font-medium text-destructive">{k.fields.status?.label}</span>
                <span className="text-muted-foreground"> · {k.vorhabenName}{k.verantwortlicherName ? ` · ${k.verantwortlicherName}` : ''}</span>
              </>
            ),
            action: go ? { label: tx('Abschließen'), onClick: go } : undefined,
          };
        })}
        onItemClick={id => { const r = enrichedKlaerungspunkte.find(x => x.record_id === id); if (r) crud.klaerungspunkte.openDetail(r); }}
        empty={{ text: tx('Keine kritischen Klärungspunkte offen.') }}
      />
      <WorkList
        title={tx('Freigaben ausstehend')}
        items={d.freigabe.map(e => ({
          id: e.record_id,
          title: `${e.vorhabenName} · ${e.fields.dokumenttyp?.label ?? ''}`,
          secondLine: (
            <>
              <span className="font-medium text-primary">{e.fields.freigabestatus?.label}</span>
              <span className="text-muted-foreground"> · {tx('Version')} {e.fields.version ?? 1}</span>
            </>
          ),
        }))}
        onItemClick={id => { const r = enrichedErgebnisdokumente.find(x => x.record_id === id); if (r) crud.ergebnisdokumente.openDetail(r); }}
        empty={{ text: tx('Keine Freigabe wartet auf Entscheidung.') }}
      />
      <div className="min-w-0 space-y-2">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{tx('Aufgaben von')}</span>
          <select
            value={person}
            onChange={e => setPerson(e.target.value)}
            className="min-w-0 max-w-full rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="all">{tx('Allen')}</option>
            {mitarbeitende.map(m => (
              <option key={m.record_id} value={m.record_id}>{personName(m)}</option>
            ))}
          </select>
        </label>
        <WorkList
          title={appLabel('aufgaben')}
          items={myTasks.map(a => {
            const f = d.day(a.fields.faelligkeit);
            const late = f && f < today;
            return {
              id: a.record_id,
              title: a.fields.titel ?? '',
              secondLine: (
                <>
                  <span className={late ? 'font-medium text-destructive' : 'font-medium text-primary'}>
                    {late ? tx('Überfällig') : a.fields.status?.label}
                  </span>
                  <span className="text-muted-foreground">
                    {f ? ` · ${formatDate(a.fields.faelligkeit)}` : ''} · {a.verantwortlicherName || vName(a.fields.vorhaben)}
                  </span>
                </>
              ),
            };
          })}
          onItemClick={id => { const r = enrichedAufgaben.find(x => x.record_id === id); if (r) crud.aufgaben.openDetail(r); }}
          empty={{ text: tx('Keine offenen Aufgaben.') }}
        />
      </div>
    </>
  );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{gruss(clock)}</h1>
        <p className="text-sm text-muted-foreground">
          {context} <span className="hidden sm:inline">· {format(clock, 'EEEE, d. MMMM', { locale: dateFnsLocale() })}</span>
        </p>
      </header>
      <DashboardGrid variant="wide" hero={hero} kpis={kpis} aside={aside} primary={primary} />
      {crud.surfaces}
    </div>
  );
}
