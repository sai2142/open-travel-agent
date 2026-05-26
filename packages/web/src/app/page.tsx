'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import SearchForm, { type SearchFormData } from '@/components/SearchForm';
import NaturalLanguageBar from '@/components/NaturalLanguageBar';
import FlightCard from '@/components/FlightCard';
import DateGrid from '@/components/DateGrid';
import ResultFilters, { applyFilters, getDefaultFilters, type FilterState } from '@/components/ResultFilters';
import PriceInsight, { getPriceLabel } from '@/components/PriceInsight';
import { ResultsSkeleton } from '@/components/LoadingSkeleton';

function encodeSearchToUrl(form: SearchFormData): string {
  const params = new URLSearchParams();
  if (form.origin) params.set('from', form.origin);
  if (form.destination) params.set('to', form.destination);
  params.set('mode', form.mode);
  if (form.mode === 'exact' || form.mode === 'date-flex') {
    if (form.departureDate) params.set('depart', form.departureDate);
    if (form.returnDate) params.set('return', form.returnDate);
  }
  if (form.mode === 'date-flex' && form.flexDays) params.set('flex', String(form.flexDays));
  if (form.mode === 'weekend' || form.mode === 'trip-length') {
    if (form.weekendMonth) params.set('month', form.weekendMonth);
  }
  if (form.mode === 'trip-length') {
    if (form.tripLengthMin) params.set('mindays', String(form.tripLengthMin));
    if (form.tripLengthMax) params.set('maxdays', String(form.tripLengthMax));
  }
  if (form.passengers > 1) params.set('pax', String(form.passengers));
  if (form.cabin !== 'ECONOMY') params.set('cabin', form.cabin);
  if (form.directOnly) params.set('direct', '1');
  return `${window.location.pathname}?${params.toString()}`;
}

function decodeUrlToOverrides(): Partial<SearchFormData> | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('from') && !params.has('to')) return null;

  const overrides: Partial<SearchFormData> = {};
  if (params.has('from')) overrides.origin = params.get('from')!.toUpperCase();
  if (params.has('to')) overrides.destination = params.get('to')!.toUpperCase();
  if (params.has('mode')) overrides.mode = params.get('mode') as SearchFormData['mode'];
  if (params.has('depart')) overrides.departureDate = params.get('depart')!;
  if (params.has('return')) overrides.returnDate = params.get('return')!;
  if (params.has('flex')) overrides.flexDays = Number(params.get('flex'));
  if (params.has('month')) overrides.weekendMonth = params.get('month')!;
  if (params.has('mindays')) overrides.tripLengthMin = Number(params.get('mindays'));
  if (params.has('maxdays')) overrides.tripLengthMax = Number(params.get('maxdays'));
  if (params.has('pax')) overrides.passengers = Number(params.get('pax'));
  if (params.has('cabin')) overrides.cabin = params.get('cabin')!;
  if (params.has('direct')) overrides.directOnly = params.get('direct') === '1';
  return overrides;
}

type ViewState =
  | { type: 'idle' }
  | { type: 'loading'; mode: string }
  | { type: 'exact-results'; data: ExactResults }
  | { type: 'flex-results'; data: FlexResults }
  | { type: 'error'; message: string };

interface ExactResults {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offers: any[];
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
  const [formOverrides, setFormOverrides] = useState<Partial<SearchFormData> | null>(null);
  const [nlApplied, setNlApplied] = useState(false);
  const [filters, setFilters] = useState<FilterState>(getDefaultFilters);
  const [lastSearchForm, setLastSearchForm] = useState<SearchFormData | null>(null);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    const urlOverrides = decodeUrlToOverrides();
    if (urlOverrides) {
      setFormOverrides(urlOverrides);
    }
  }, []);

  const handleNlParsed = (data: Partial<SearchFormData>) => {
    setFormOverrides(data);
    setNlApplied(true);
    setTimeout(() => setNlApplied(false), 2000);
  };

  const handleShare = useCallback(() => {
    if (!lastSearchForm) return;
    const url = encodeSearchToUrl(lastSearchForm);
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    });
    window.history.replaceState(null, '', url);
  }, [lastSearchForm]);

  const handleSearch = async (form: SearchFormData) => {
    setView({ type: 'loading', mode: form.mode });
    setFilters(getDefaultFilters());
    setLastSearchForm(form);
    window.history.replaceState(null, '', encodeSearchToUrl(form));

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

  const filteredResults = useMemo(() => {
    if (view.type !== 'exact-results') return [];
    return applyFilters(view.data.offers, filters);
  }, [view, filters]);

  const allPrices = useMemo(() => {
    if (view.type !== 'exact-results') return [];
    return view.data.offers.map((r: { offer: { price: { total: number } } }) => r.offer.price.total);
  }, [view]);

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

      {/* Natural Language Bar */}
      {isIdle && (
        <section className="px-4 pb-2 fade-in" style={{ animationDelay: '100ms' }}>
          <NaturalLanguageBar onParsed={handleNlParsed} />
        </section>
      )}

      {/* Divider */}
      {isIdle && (
        <div className="flex items-center gap-3 max-w-3xl mx-auto px-8 py-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/[0.06]" />
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">or use the form</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/[0.06]" />
        </div>
      )}

      {/* NL Applied indicator */}
      {nlApplied && (
        <div className="text-center text-xs text-[var(--color-success)] fade-in pb-2">
          Fields updated from your query
        </div>
      )}

      {/* Search Form */}
      <section className={`px-4 transition-all duration-500 ${isIdle ? 'py-2' : 'py-4'}`}>
        <SearchForm onSearch={handleSearch} loading={view.type === 'loading'} overrides={formOverrides} />
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
          <div className="space-y-3">
            {/* Provider badge + Share */}
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] px-1">
              <span>{view.data.totalOffers} flights found</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="glass-subtle px-2.5 py-1 rounded-full flex items-center gap-1.5 hover:bg-white/[0.06] transition-colors text-[var(--color-text-secondary)]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  {shareToast ? 'Copied!' : 'Share'}
                </button>
                <span className="glass-subtle px-2 py-0.5 rounded-full">via {view.data.provider}</span>
              </div>
            </div>

            {/* Price Insight */}
            <PriceInsight prices={allPrices} />

            {/* Filters + Sort */}
            <ResultFilters
              results={view.data.offers}
              filters={filters}
              onChange={setFilters}
              resultCount={filteredResults.length}
            />

            {/* Flight Cards */}
            {filteredResults.length === 0 ? (
              <div className="glass p-8 text-center text-[var(--color-text-muted)]">
                No flights match your filters. Try adjusting them.
              </div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              filteredResults.map((result: any, i: number) => (
                <FlightCard
                  key={i}
                  result={result}
                  rank={i}
                  priceLabel={getPriceLabel(result.offer.price.total, allPrices)}
                />
              ))
            )}
          </div>
        )}

        {view.type === 'flex-results' && (
          <div className="space-y-3">
            <div className="flex justify-end px-1">
              <button
                onClick={handleShare}
                className="glass-subtle px-2.5 py-1 rounded-full flex items-center gap-1.5 hover:bg-white/[0.06] transition-colors text-xs text-[var(--color-text-secondary)]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                {shareToast ? 'Copied!' : 'Share'}
              </button>
            </div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <DateGrid result={view.data as any} />
          </div>
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
