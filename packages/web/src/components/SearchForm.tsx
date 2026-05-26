'use client';

import { useState } from 'react';

export type SearchMode = 'exact' | 'date-flex' | 'weekend' | 'trip-length';

export interface SearchFormData {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  cabin: string;
  directOnly: boolean;
  mode: SearchMode;
  flexDays: number;
  weekendMonth: string;
  tripLengthMin: number;
  tripLengthMax: number;
}

interface Props {
  onSearch: (data: SearchFormData) => void;
  loading: boolean;
}

const cabinOptions = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First' },
];

const modeOptions: { value: SearchMode; label: string; description: string }[] = [
  { value: 'exact', label: 'Exact', description: 'Specific dates' },
  { value: 'date-flex', label: 'Flexible', description: '+-N days' },
  { value: 'weekend', label: 'Weekend', description: 'Fri-Sun trips' },
  { value: 'trip-length', label: 'Trip Length', description: 'N-M day range' },
];

function getNextMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getNextWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() + 8);
  return d.toISOString().split('T')[0];
}

export default function SearchForm({ onSearch, loading }: Props) {
  const [form, setForm] = useState<SearchFormData>({
    origin: '',
    destination: '',
    departureDate: getTomorrow(),
    returnDate: getNextWeek(),
    passengers: 1,
    cabin: 'ECONOMY',
    directOnly: false,
    mode: 'exact',
    flexDays: 3,
    weekendMonth: getNextMonth(),
    tripLengthMin: 3,
    tripLengthMax: 5,
  });

  const update = (field: keyof SearchFormData, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(form);
  };

  const swapAirports = () => {
    setForm((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="glass p-6 md:p-8 space-y-6">
        {/* Mode selector */}
        <div className="flex gap-2 flex-wrap">
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('mode', opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                form.mode === opt.value
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'glass-subtle text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-glass-hover)]'
              }`}
            >
              <span className="block">{opt.label}</span>
              <span className="block text-[11px] opacity-70">{opt.description}</span>
            </button>
          ))}
        </div>

        {/* Airport inputs */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
              From
            </label>
            <input
              type="text"
              className="input-field text-lg font-semibold uppercase tracking-wide"
              placeholder="DFW"
              maxLength={4}
              value={form.origin}
              onChange={(e) => update('origin', e.target.value.toUpperCase())}
              required
            />
          </div>

          <button
            type="button"
            onClick={swapAirports}
            className="mt-5 p-2 rounded-full glass-subtle hover:bg-[var(--color-glass-hover)] transition-colors"
            title="Swap airports"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
            </svg>
          </button>

          <div className="flex-1">
            <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
              To
            </label>
            <input
              type="text"
              className="input-field text-lg font-semibold uppercase tracking-wide"
              placeholder="LHR"
              maxLength={4}
              value={form.destination}
              onChange={(e) => update('destination', e.target.value.toUpperCase())}
              required
            />
          </div>
        </div>

        {/* Date fields — change based on mode */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {form.mode === 'exact' && (
            <>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                  Depart
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={form.departureDate}
                  onChange={(e) => update('departureDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                  Return
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={form.returnDate}
                  onChange={(e) => update('returnDate', e.target.value)}
                />
              </div>
            </>
          )}

          {form.mode === 'date-flex' && (
            <>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                  Depart
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={form.departureDate}
                  onChange={(e) => update('departureDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                  Return
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={form.returnDate}
                  onChange={(e) => update('returnDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                  Flex Days
                </label>
                <input
                  type="number"
                  className="input-field"
                  min={1}
                  max={7}
                  value={form.flexDays}
                  onChange={(e) => update('flexDays', Number(e.target.value))}
                />
              </div>
            </>
          )}

          {form.mode === 'weekend' && (
            <div className="col-span-2">
              <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                Month
              </label>
              <input
                type="month"
                className="input-field"
                value={form.weekendMonth}
                onChange={(e) => update('weekendMonth', e.target.value)}
                required
              />
            </div>
          )}

          {form.mode === 'trip-length' && (
            <>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                  Month
                </label>
                <input
                  type="month"
                  className="input-field"
                  value={form.weekendMonth}
                  onChange={(e) => update('weekendMonth', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                  Min Days
                </label>
                <input
                  type="number"
                  className="input-field"
                  min={1}
                  max={30}
                  value={form.tripLengthMin}
                  onChange={(e) => update('tripLengthMin', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                  Max Days
                </label>
                <input
                  type="number"
                  className="input-field"
                  min={1}
                  max={30}
                  value={form.tripLengthMax}
                  onChange={(e) => update('tripLengthMax', Number(e.target.value))}
                />
              </div>
            </>
          )}

          {/* Passengers & Cabin — always visible */}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
              Passengers
            </label>
            <input
              type="number"
              className="input-field"
              min={1}
              max={9}
              value={form.passengers}
              onChange={(e) => update('passengers', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
              Cabin
            </label>
            <select
              className="input-field"
              value={form.cabin}
              onChange={(e) => update('cabin', e.target.value)}
            >
              {cabinOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Direct only toggle + Search button */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.directOnly}
              onChange={(e) => update('directOnly', e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--color-accent)]"
            />
            Nonstop only
          </label>

          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            {loading ? (
              <>
                <span className="search-progress flex gap-1">
                  <span className="dot w-1.5 h-1.5 bg-white rounded-full" />
                  <span className="dot w-1.5 h-1.5 bg-white rounded-full" />
                  <span className="dot w-1.5 h-1.5 bg-white rounded-full" />
                </span>
                Searching
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Search Flights
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
