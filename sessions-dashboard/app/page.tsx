'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Search, X, Calendar } from 'lucide-react';
import useSWR from 'swr';
import { SessionRecord } from '@/types';

const CAPACITY = 15;

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function capacityColor(inscrits: number): string {
  const ratio = inscrits / CAPACITY;
  if (ratio >= 1) return '#dc2626';
  if (ratio >= 0.8) return '#d97706';
  return '#16a34a';
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('API error');
    return r.json();
  });

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="h-3.5 w-24 rounded bg-neutral-200 shrink-0" />
      <div className="h-3.5 flex-1 rounded bg-neutral-200" />
      <div className="h-3.5 w-16 rounded bg-neutral-200 shrink-0" />
    </div>
  );
}

function SuggestionItem({
  session,
  onSelect,
}: {
  session: SessionRecord;
  onSelect: (s: SessionRecord) => void;
}) {
  const restants = Math.max(0, CAPACITY - session.nombreInscrits);
  const color = capacityColor(session.nombreInscrits);

  return (
    <button
      onMouseDown={(e) => e.preventDefault()} // prevent blur before click
      onClick={() => onSelect(session)}
      className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
    >
      <span className="font-mono text-[11px] text-neutral-400 shrink-0 leading-none">
        {session.session_id}
      </span>
      <span className="flex-1 text-sm text-neutral-700 truncate">{session.nomFormation}</span>
      {session.format.length > 0 && (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 shrink-0 hidden sm:block">
          {session.format[0]}
        </span>
      )}
      <span className="text-[11px] text-neutral-400 shrink-0 tabular-nums">
        {session.nombreInscrits}/{CAPACITY}
      </span>
      <span className="text-[11px] font-semibold shrink-0 tabular-nums" style={{ color }}>
        {restants} pl.
      </span>
    </button>
  );
}

function SessionCard({ session }: { session: SessionRecord }) {
  const restants = Math.max(0, CAPACITY - session.nombreInscrits);
  const color = capacityColor(session.nombreInscrits);
  const pct = Math.min(100, Math.round((session.nombreInscrits / CAPACITY) * 100));
  const isComplete = session.nombreInscrits >= CAPACITY;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
      {/* Card header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-neutral-800 leading-snug mb-1.5">
            {session.nomFormation}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-neutral-500">Session {session.numeroSession}</span>
            <span className="text-neutral-300 select-none">·</span>
            <span className="font-mono text-[11px] text-neutral-400">{session.session_id}</span>
          </div>
        </div>
        <span
          className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full"
          style={
            isComplete
              ? { background: '#fee2e2', color: '#dc2626' }
              : { background: '#dcfce7', color: '#16a34a' }
          }
        >
          {isComplete ? 'Complet' : 'Disponible'}
        </span>
      </div>

      {/* Format badges */}
      {session.format.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {session.format.map((f) => (
            <span
              key={f}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Dates */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
          <Calendar className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          <span>
            {formatDate(session.dateDebut)} → {formatDate(session.dateFin)}
          </span>
        </div>
        {session.dateLimiteInscription && (
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: '#fef3c7', color: '#d97706' }}
          >
            Limite : {session.dateLimiteInscription}
          </span>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Capacité', value: CAPACITY, color: '#737373' },
          { label: 'Inscrits', value: session.nombreInscrits, color },
          { label: 'Restants', value: restants, color },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-neutral-50 rounded-lg p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              {kpi.label}
            </p>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: kpi.color }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Taux de remplissage
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color }}>
            {pct}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input → query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(inputValue), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  const shouldFetch = debouncedQuery.length >= 2 && !selectedSession;

  const {
    data: suggestions,
    isLoading,
    error,
  } = useSWR<SessionRecord[]>(
    shouldFetch
      ? `/api/sessions?q=${encodeURIComponent(debouncedQuery)}&mode=suggest`
      : null,
    fetcher
  );

  // Open dropdown when new suggestions arrive
  useEffect(() => {
    if (shouldFetch && (suggestions !== undefined || isLoading)) {
      setDropdownOpen(true);
    }
  }, [suggestions, isLoading, shouldFetch]);

  function handleSelect(session: SessionRecord) {
    setSelectedSession(session);
    setInputValue(`${session.session_id} — ${session.nomFormation}`);
    setDropdownOpen(false);
  }

  function handleClear() {
    setInputValue('');
    setDebouncedQuery('');
    setSelectedSession(null);
    setDropdownOpen(false);
    inputRef.current?.focus();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setSelectedSession(null);
  }

  const showDropdown = dropdownOpen && !selectedSession && debouncedQuery.length >= 2;

  return (
    <div style={{ background: '#F9F5F2' }} className="min-h-screen">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Image
            src="/logo-medere.svg"
            alt="Médéré"
            width={120}
            height={36}
            className="object-contain h-8 w-auto"
            priority
          />
          <div className="h-5 w-px bg-neutral-200" />
          <span className="text-sm font-medium text-neutral-600">Capacité des sessions</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-neutral-800 mb-1">
          Rechercher une session
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Classe virtuelle — {CAPACITY} places par session
        </p>

        {/* Search input + dropdown */}
        <div className="relative mb-8">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-neutral-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (debouncedQuery.length >= 2 && !selectedSession) setDropdownOpen(true);
              }}
              onBlur={() => setDropdownOpen(false)}
              placeholder="Numéro de session, nom de la formation…"
              className="w-full rounded-lg border border-neutral-200 bg-white py-3 pl-10 pr-10 text-sm text-neutral-800 shadow-sm placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className="absolute right-3 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
              {isLoading && !suggestions && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}
              {error && (
                <p className="px-4 py-3 text-sm text-red-500">
                  Erreur lors du chargement. Veuillez réessayer.
                </p>
              )}
              {!isLoading && !error && suggestions?.length === 0 && (
                <p className="px-4 py-3 text-sm text-neutral-500">Aucune session trouvée.</p>
              )}
              {suggestions && suggestions.length > 0 &&
                suggestions.map((s) => (
                  <SuggestionItem key={s.id} session={s} onSelect={handleSelect} />
                ))}
            </div>
          )}
        </div>

        {/* Initial state */}
        {!selectedSession && !inputValue && (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400 select-none">
            <Search className="mb-4 h-12 w-12 opacity-30" />
            <p className="text-sm">Tapez au moins 2 caractères pour rechercher une session</p>
          </div>
        )}

        {/* Session card */}
        {selectedSession && <SessionCard session={selectedSession} />}
      </main>
    </div>
  );
}
