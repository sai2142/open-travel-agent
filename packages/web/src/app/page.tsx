'use client';

import { useState, useRef } from 'react';
import SearchForm, { type SearchFormData } from '@/components/SearchForm';
import NaturalLanguageBar from '@/components/NaturalLanguageBar';
import FlightCard from '@/components/FlightCard';
import DateGrid from '@/components/DateGrid';
import { ResultsSkeleton } from '@/components/LoadingSkeleton';

type ViewState =
  | { type: 'idle' }
  | { type: 'loading'; mode: string }
  | { type: 'exact-results'; data: ExactResults }
  | { type: 'flex-results'; data: FlexResults }
  | { type: 'error'; message: string };

interface ExactResults {
  offers: Array<Record<string, unknown>>;
  totalOffers: number;
  provider: string;
}

interface FlexResults {
  cells: Array<{
    datePair: { departureDate: string; returnDate?: string };
    bestPrice: number;
    offerCount: number;
  }>;
  bestOverall: {
    datePair: { departureDate: string; returnDate?: string };
    bestPrice: number;
    offerCount: number;
  } | null;
  searchedCombinations: number;
  totalOffersFound: number;
  searchDurationMs: number;
  cachedHits: number;
}

export default function Home() {
  const [view, setView] = useState<ViewState>({ type: 'idle' });

  const handleSearch = async (form: SearchFormData) => {
    setView({ type: 'loading', mode: form.mode });

    try {
      if (form.mode === 'exact') {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: form.origin,
            destination: form.destination,
            departureDate: form.departureDate,
            returnDate: form.returnDate || undefined,
            passengers: form.passengers,
            cabin: form.cabin,
            directOnly: form.directOnly,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setView({ type: 'exact-results', data });
      } else {
        const body: Record<string, unknown> = {
          mode: form.mode,
          origin: form.origin,
          destination: form.destination,
          passengers: form.passengers,
          cabin: form.cabin,
          directOnly: form.directOnly,
        };

        if (form.mode === 'date-flex') {
          body.departureDate = form.departureDate;
          body.returnDate = form.returnDate || undefined;
          body.flexDays = form.flexDays;
        } else if (form.mode === 'weekend') {
          body.targetMonth = form.weekendMonth;
        } else if (form.mode === 'trip-length') {
          body.targetMonth = form.weekendMonth;
          body.tripLengthMin = form.tripLengthMin;
          body.tripLengthMax = form.tripLengthMax;
        }

        const res = await fetch('/api/search/flex', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setView({ type: 'flex-results', data });
      }
    } catch (err) {
      setView({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  };

  const isIdle = view.type === 'idle';

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero / Header */}
      <header className={`px-6 text-center transition-all duration-500 ${isIdle ? 'pt-[18vh] pb-4' : 'pt-8 pb-2'}`}>
        <div className={`transition-all duration-500 ${isIdle ? 'scale-100' : 'scale-90'}`}>
          <h1 className={`font-bold tracking-tight transition-all duration-500 ${isIdle ? 'text-5xl md:text-7xl' : 'text-2xl md:text-3xl'}`}>
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Flyte
            </span>
          </h1>
          {isIdle && (
            <p className="text-base md:text-lg text-[var(--color-text-secondary)] mt-4 max-w-lg mx-auto leading-relaxed fade-in">
              Search 300+ airlines. Find the cheapest dates.
              <br />
              <span className="text-[var(--color-text-muted)]">Optimized for your credit card rewards.</span>
            </p>
          )}
        </div>
      </header>

      {/* Search Form */}
      <section className={`px-4 transition-all duration-500 ${isIdle ? 'py-10' : 'py-4'}`}>
        <SearchForm onSearch={handleSearch} loading={view.type === 'loading'} />
      </section>

      {/* Feature Pills — only on idle */}
      {isIdle && (
        <section className="px-4 pb-12 max-w-3xl mx-auto w-full fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: '✈', text: '300+ Airlines' },
              { icon: '📅', text: 'Flexible Dates' },
              { icon: '💳', text: 'Rewards Scoring' },
              { icon: '⚡', text: 'Real-time Pricing' },
            ].map((pill) => (
              <div
                key={pill.text}
                className="glass-subtle px-4 py-2 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
              >
                <span>{pill.icon}</span>
                {pill.text}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <section className="px-4 pb-16 max-w-3xl mx-auto w-full">
        {view.type === 'loading' && (
          <div className="space-y-4">
            <div className="text-center text-sm text-[var(--color-text-muted)] fade-in">
              {view.mode === 'exact'
                ? 'Searching flights...'
                : 'Searching date combinations...'}
            </div>
            <ResultsSkeleton count={view.mode === 'exact' ? 4 : 6} />
          </div>
        )}

        {view.type === 'error' && (
          <div className="glass p-6 border-l-2 border-l-[var(--color-danger)] fade-in">
            <div className="text-sm text-[var(--color-danger)] font-medium">Search Error</div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{view.message}</p>
          </div>
        )}

        {view.type === 'exact-results' && (
          <div className="space-y-3 fade-in">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] px-1 pb-1">
              <span>{view.data.totalOffers} flights found</span>
              <span className="glass-subtle px-2 py-0.5 rounded-full">via {view.data.provider}</span>
            </div>
            {view.data.offers.length === 0 ? (
              <div className="glass p-8 text-center text-[var(--color-text-muted)]">
                No flights found. Try adjusting your search.
              </div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              view.data.offers.map((result: any, i: number) => (
                <FlightCard key={i} result={result} rank={i} />
              ))
            )}
          </div>
        )}

        {view.type === 'flex-results' && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <DateGrid result={view.data as any} />
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-[11px] text-[var(--color-text-muted)] tracking-wide">
        <span className="bg-gradient-to-r from-indigo-400/60 to-purple-400/60 bg-clip-text text-transparent font-medium">
          Flyte
        </span>
        {' '}v0.3.0
      </footer>
    </main>
  );
}
