'use client';

import { useState } from 'react';
import SearchForm, { type SearchFormData } from '@/components/SearchForm';
import FlightCard from '@/components/FlightCard';
import DateGrid from '@/components/DateGrid';
import { ResultsSkeleton } from '@/components/LoadingSkeleton';

type ViewState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'exact-results'; data: ExactResults }
  | { type: 'flex-results'; data: FlexResults }
  | { type: 'error'; message: string };

interface ExactResults {
  offers: Array<{
    offer: {
      id: string;
      provider: string;
      outbound: { segments: Array<Record<string, unknown>>; duration: string; stops: number };
      inbound?: { segments: Array<Record<string, unknown>>; duration: string; stops: number };
      price: { total: number; currency: string; perPassenger?: number };
      seatsRemaining?: number;
      bookingUrl?: string;
      validatingCarrier?: string;
    };
    score: number;
    breakdown: Record<string, number>;
    cardRecommendation?: Record<string, unknown>;
  }>;
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
    setView({ type: 'loading' });

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

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="pt-12 pb-2 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          <span className="text-[var(--color-accent)]">Open</span> Travel Agent
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-md mx-auto">
          Search 300+ airlines. Optimize for your credit card rewards. Find the cheapest dates.
        </p>
      </header>

      {/* Search Form */}
      <section className="px-4 py-8">
        <SearchForm onSearch={handleSearch} loading={view.type === 'loading'} />
      </section>

      {/* Results */}
      <section className="px-4 pb-16 max-w-3xl mx-auto w-full">
        {view.type === 'loading' && <ResultsSkeleton />}

        {view.type === 'error' && (
          <div className="glass p-6 border-l-2 border-l-[var(--color-danger)] fade-in">
            <div className="text-sm text-[var(--color-danger)] font-medium">Search Error</div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{view.message}</p>
          </div>
        )}

        {view.type === 'exact-results' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] px-1">
              <span>{view.data.totalOffers} flights found</span>
              <span>via {view.data.provider}</span>
            </div>
            {view.data.offers.length === 0 ? (
              <div className="glass p-8 text-center text-[var(--color-text-muted)]">
                No flights found. Try adjusting your search.
              </div>
            ) : (
              view.data.offers.map((result: Record<string, unknown>, i: number) => (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <FlightCard key={i} result={result as any} rank={i} />
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
      <footer className="mt-auto py-6 text-center text-xs text-[var(--color-text-muted)]">
        Open Travel Agent v0.2.0 &middot; Sandbox Mode
      </footer>
    </main>
  );
}
