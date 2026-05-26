'use client';

import { useState, useMemo } from 'react';

export type SortBy = 'score' | 'price' | 'duration' | 'stops';

export interface FilterState {
  sortBy: SortBy;
  maxStops: number | null;
  maxPrice: number | null;
  maxDuration: number | null;
  airlines: Set<string>;
  directOnly: boolean;
  departTimeMin: number;
  departTimeMax: number;
}

interface ScoredOffer {
  offer: {
    outbound: {
      segments: Array<{ carrier: string; carrierName?: string; departure: { at: string } }>;
      duration: string;
      stops: number;
    };
    inbound?: { duration: string; stops: number };
    price: { total: number };
  };
  score: number;
}

interface Props {
  results: ScoredOffer[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
}

const sortOptions: { value: SortBy; label: string; description: string }[] = [
  { value: 'score', label: 'Best', description: 'Price + duration + stops' },
  { value: 'price', label: 'Cheapest', description: 'Lowest total price' },
  { value: 'duration', label: 'Fastest', description: 'Shortest travel time' },
  { value: 'stops', label: 'Fewest stops', description: 'Least connections' },
];

function parseDurationMinutes(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0');
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

export function applyFilters(results: ScoredOffer[], filters: FilterState): ScoredOffer[] {
  let filtered = results.filter((r) => {
    if (filters.directOnly && r.offer.outbound.stops > 0) return false;
    if (filters.maxStops !== null && r.offer.outbound.stops > filters.maxStops) return false;
    if (filters.maxPrice !== null && r.offer.price.total > filters.maxPrice) return false;

    if (filters.maxDuration !== null) {
      const mins = parseDurationMinutes(r.offer.outbound.duration);
      if (mins > filters.maxDuration * 60) return false;
    }

    if (filters.airlines.size > 0) {
      const carrier = r.offer.outbound.segments[0]?.carrier;
      if (!filters.airlines.has(carrier)) return false;
    }

    const departHour = new Date(r.offer.outbound.segments[0].departure.at).getHours();
    if (departHour < filters.departTimeMin || departHour > filters.departTimeMax) return false;

    return true;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
    case 'price':
      sorted.sort((a, b) => a.offer.price.total - b.offer.price.total);
      break;
    case 'duration':
      sorted.sort((a, b) =>
        parseDurationMinutes(a.offer.outbound.duration) - parseDurationMinutes(b.offer.outbound.duration)
      );
      break;
    case 'stops':
      sorted.sort((a, b) => a.offer.outbound.stops - b.offer.outbound.stops);
      break;
    case 'score':
    default:
      sorted.sort((a, b) => b.score - a.score);
      break;
  }

  return sorted;
}

export function getDefaultFilters(): FilterState {
  return {
    sortBy: 'score',
    maxStops: null,
    maxPrice: null,
    maxDuration: null,
    airlines: new Set(),
    directOnly: false,
    departTimeMin: 0,
    departTimeMax: 23,
  };
}

export default function ResultFilters({ results, filters, onChange, resultCount }: Props) {
  const [expanded, setExpanded] = useState(false);

  const availableAirlines = useMemo(() => {
    const map = new Map<string, string>();
    results.forEach((r) => {
      const seg = r.offer.outbound.segments[0];
      if (seg) map.set(seg.carrier, seg.carrierName || seg.carrier);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [results]);

  const priceRange = useMemo(() => {
    if (results.length === 0) return { min: 0, max: 1000 };
    const prices = results.map((r) => r.offer.price.total);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [results]);

  const activeFilterCount = [
    filters.maxStops !== null,
    filters.maxPrice !== null,
    filters.maxDuration !== null,
    filters.airlines.size > 0,
    filters.directOnly,
    filters.departTimeMin > 0 || filters.departTimeMax < 23,
  ].filter(Boolean).length;

  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3 fade-in">
      {/* Sort bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Sort</span>
        <div className="flex gap-1 p-0.5 glass-subtle rounded-lg">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ sortBy: opt.value })}
              title={opt.description}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filters.sortBy === opt.value
                  ? 'bg-white/[0.08] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            expanded || activeFilterCount > 0
              ? 'glass text-white'
              : 'glass-subtle text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <span className="text-[11px] text-[var(--color-text-muted)]">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter panel */}
      {expanded && (
        <div className="glass p-5 space-y-5 fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            {/* Stops */}
            <div>
              <label className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2.5">
                Max Stops
              </label>
              <div className="flex gap-1">
                {[
                  { value: null, label: 'Any' },
                  { value: 0, label: '0' },
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => update({ maxStops: opt.value })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filters.maxStops === opt.value
                        ? 'bg-white/[0.08] text-white'
                        : 'bg-white/[0.02] text-[var(--color-text-muted)] hover:bg-white/[0.04]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2.5">
                Max Price
              </label>
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                step={10}
                value={filters.maxPrice ?? priceRange.max}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  update({ maxPrice: val >= priceRange.max ? null : val });
                }}
                className="w-full accent-indigo-500 mb-2"
              />
              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2.5">
                <span className="text-sm text-[var(--color-text-muted)] font-medium">$</span>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  placeholder="Any"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    update({ maxPrice: val });
                  }}
                  className="bg-transparent text-sm text-[var(--color-text-primary)] outline-none w-full placeholder:text-[var(--color-text-muted)]"
                />
              </div>
            </div>

            {/* Max Duration */}
            <div>
              <label className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2.5">
                Max Duration
              </label>
              <input
                type="range"
                min={2}
                max={24}
                step={1}
                value={filters.maxDuration ?? 24}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  update({ maxDuration: val >= 24 ? null : val });
                }}
                className="w-full accent-indigo-500 mb-2"
              />
              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2.5">
                <span className="text-sm text-[var(--color-text-muted)] font-medium">hr</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  placeholder="Any"
                  value={filters.maxDuration ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    update({ maxDuration: val });
                  }}
                  className="bg-transparent text-sm text-[var(--color-text-primary)] outline-none w-full placeholder:text-[var(--color-text-muted)]"
                />
              </div>
            </div>

            {/* Departure Time */}
            <div>
              <label className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2.5">
                Departure Window
              </label>
              <div className="text-center text-sm font-medium text-[var(--color-text-primary)] mb-2">
                {formatHour(filters.departTimeMin)} — {formatHour(filters.departTimeMax)}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2.5">
                  <select
                    value={filters.departTimeMin}
                    onChange={(e) => update({ departTimeMin: Number(e.target.value) })}
                    className="bg-transparent text-sm text-[var(--color-text-primary)] outline-none w-full cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
                <span className="text-sm text-[var(--color-text-muted)] font-medium">to</span>
                <div className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2.5">
                  <select
                    value={filters.departTimeMax}
                    onChange={(e) => update({ departTimeMax: Number(e.target.value) })}
                    className="bg-transparent text-sm text-[var(--color-text-primary)] outline-none w-full cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Airlines */}
          {availableAirlines.length > 1 && (
            <div>
              <label className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2">
                Airlines
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableAirlines.map(([code, name]) => {
                  const active = filters.airlines.size === 0 || filters.airlines.has(code);
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        const next = new Set(filters.airlines);
                        if (next.has(code)) {
                          next.delete(code);
                        } else {
                          next.add(code);
                        }
                        update({ airlines: next });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        active
                          ? 'bg-white/[0.06] text-white border border-white/10'
                          : 'bg-white/[0.02] text-[var(--color-text-muted)] border border-transparent'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reset */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => onChange(getDefaultFilters())}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Reset all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
