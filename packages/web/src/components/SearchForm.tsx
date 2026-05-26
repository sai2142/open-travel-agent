'use client';

import { useState, useEffect, useRef } from 'react';

export type SearchMode = 'exact' | 'date-flex' | 'weekend' | 'trip-length' | 'multi-city';

export interface MultiCityLeg {
  origin: string;
  destination: string;
  date: string;
}

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
  multiCityLegs: MultiCityLeg[];
}

interface Props {
  onSearch: (data: SearchFormData) => void;
  loading: boolean;
  overrides?: Partial<SearchFormData> | null;
  autoSubmit?: boolean;
}

const cabinOptions = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First' },
];

const modeOptions: { value: SearchMode; label: string; icon: string }[] = [
  { value: 'exact', label: 'Exact', icon: '📍' },
  { value: 'date-flex', label: 'Flexible', icon: '📅' },
  { value: 'weekend', label: 'Weekend', icon: '🌴' },
  { value: 'trip-length', label: 'Trip Length', icon: '📏' },
  { value: 'multi-city', label: 'Multi-City', icon: '🗺' },
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

function defaultLegs(): MultiCityLeg[] {
  return [
    { origin: '', destination: '', date: getTomorrow() },
    { origin: '', destination: '', date: getNextWeek() },
  ];
}

export default function SearchForm({ onSearch, loading, overrides, autoSubmit }: Props) {
  const didAutoSubmit = useRef(false);
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
    multiCityLegs: defaultLegs(),
  });

  useEffect(() => {
    if (overrides) {
      setForm((prev) => ({ ...prev, ...overrides }));
    }
  }, [overrides]);

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
      <div className="glass p-6 md:p-8 space-y-5">
        {/* Mode selector */}
        <div className="flex gap-1.5 p-1 glass-subtle rounded-xl">
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('mode', opt.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                form.mode === opt.value
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-xs">{opt.icon}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Airport inputs — hidden for multi-city */}
        {form.mode !== 'multi-city' && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                From
              </label>
              <input
                type="text"
                className="input-field text-xl font-bold uppercase tracking-wider text-center"
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
              className="mb-1 p-2.5 rounded-xl glass-subtle hover:bg-[var(--color-glass-hover)] transition-all hover:scale-105 active:scale-95"
              title="Swap airports"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M7 16l-4-4 4-4" />
                <path d="M17 8l4 4-4 4" />
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
            </button>

            <div className="flex-1">
              <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                To
              </label>
              <input
                type="text"
                className="input-field text-xl font-bold uppercase tracking-wider text-center"
                placeholder="LHR"
                maxLength={4}
                value={form.destination}
                onChange={(e) => update('destination', e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>
        )}

        {/* Multi-City Legs */}
        {form.mode === 'multi-city' && (
          <div className="space-y-3">
            {form.multiCityLegs.map((leg, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-medium mb-3 w-6 text-right shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  {idx === 0 && (
                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">From</label>
                  )}
                  <input
                    type="text"
                    className="input-field text-base font-bold uppercase tracking-wider text-center"
                    placeholder="DFW"
                    maxLength={4}
                    value={leg.origin}
                    onChange={(e) => {
                      const legs = [...form.multiCityLegs];
                      legs[idx] = { ...legs[idx], origin: e.target.value.toUpperCase() };
                      setForm((prev) => ({ ...prev, multiCityLegs: legs }));
                    }}
                    required
                  />
                </div>
                <div className="mb-1 text-[var(--color-text-muted)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  {idx === 0 && (
                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">To</label>
                  )}
                  <input
                    type="text"
                    className="input-field text-base font-bold uppercase tracking-wider text-center"
                    placeholder="LHR"
                    maxLength={4}
                    value={leg.destination}
                    onChange={(e) => {
                      const legs = [...form.multiCityLegs];
                      legs[idx] = { ...legs[idx], destination: e.target.value.toUpperCase() };
                      if (legs[idx + 1]) {
                        legs[idx + 1] = { ...legs[idx + 1], origin: e.target.value.toUpperCase() };
                      }
                      setForm((prev) => ({ ...prev, multiCityLegs: legs }));
                    }}
                    required
                  />
                </div>
                <div className="flex-1">
                  {idx === 0 && (
                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">Date</label>
                  )}
                  <input
                    type="date"
                    className="input-field"
                    value={leg.date}
                    onChange={(e) => {
                      const legs = [...form.multiCityLegs];
                      legs[idx] = { ...legs[idx], date: e.target.value };
                      setForm((prev) => ({ ...prev, multiCityLegs: legs }));
                    }}
                    required
                  />
                </div>
                {form.multiCityLegs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const legs = form.multiCityLegs.filter((_, i) => i !== idx);
                      setForm((prev) => ({ ...prev, multiCityLegs: legs }));
                    }}
                    className="mb-1 p-2 rounded-lg glass-subtle hover:bg-red-500/10 hover:text-red-400 transition-all text-[var(--color-text-muted)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {form.multiCityLegs.length < 6 && (
              <button
                type="button"
                onClick={() => {
                  const lastLeg = form.multiCityLegs[form.multiCityLegs.length - 1];
                  const newDate = new Date(lastLeg.date);
                  newDate.setDate(newDate.getDate() + 3);
                  const legs = [
                    ...form.multiCityLegs,
                    { origin: lastLeg.destination, destination: '', date: newDate.toISOString().split('T')[0] },
                  ];
                  setForm((prev) => ({ ...prev, multiCityLegs: legs }));
                }}
                className="w-full py-2 rounded-lg border border-dashed border-white/10 text-xs text-[var(--color-text-muted)] hover:border-indigo-500/30 hover:text-indigo-400 transition-all"
              >
                + Add flight
              </button>
            )}
          </div>
        )}

        {/* Date fields — multi-city dates are in the legs above */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {form.mode === 'multi-city' && (<></>)}
          {form.mode === 'exact' && (
            <>
              <div>
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                  Depart
                </label>
                <input type="date" className="input-field" value={form.departureDate}
                  onChange={(e) => update('departureDate', e.target.value)} required />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                  Return
                </label>
                <input type="date" className="input-field" value={form.returnDate}
                  onChange={(e) => update('returnDate', e.target.value)} />
              </div>
            </>
          )}

          {form.mode === 'date-flex' && (
            <>
              <div>
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                  Depart
                </label>
                <input type="date" className="input-field" value={form.departureDate}
                  onChange={(e) => update('departureDate', e.target.value)} required />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                  Return
                </label>
                <input type="date" className="input-field" value={form.returnDate}
                  onChange={(e) => update('returnDate', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                  &plusmn; Days
                </label>
                <input type="number" className="input-field" min={1} max={7} value={form.flexDays}
                  onChange={(e) => update('flexDays', Number(e.target.value))} />
              </div>
            </>
          )}

          {form.mode === 'weekend' && (
            <div className="col-span-2">
              <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                Month
              </label>
              <input type="month" className="input-field" value={form.weekendMonth}
                onChange={(e) => update('weekendMonth', e.target.value)} required />
            </div>
          )}

          {form.mode === 'trip-length' && (
            <>
              <div>
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                  Month
                </label>
                <input type="month" className="input-field" value={form.weekendMonth}
                  onChange={(e) => update('weekendMonth', e.target.value)} required />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                  Min Days
                </label>
                <input type="number" className="input-field" min={1} max={30} value={form.tripLengthMin}
                  onChange={(e) => update('tripLengthMin', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
                  Max Days
                </label>
                <input type="number" className="input-field" min={1} max={30} value={form.tripLengthMax}
                  onChange={(e) => update('tripLengthMax', Number(e.target.value))} />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
              Passengers
            </label>
            <input type="number" className="input-field" min={1} max={9} value={form.passengers}
              onChange={(e) => update('passengers', Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-widest font-medium">
              Cabin
            </label>
            <select className="input-field" value={form.cabin}
              onChange={(e) => update('cabin', e.target.value)}>
              {cabinOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)] cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.directOnly}
                onChange={(e) => update('directOnly', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 rounded-full bg-white/[0.06] border border-white/10 peer-checked:bg-indigo-500/30 peer-checked:border-indigo-500/50 transition-all" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white/30 peer-checked:bg-indigo-400 peer-checked:translate-x-4 transition-all" />
            </div>
            Nonstop only
          </label>

          <button type="submit" className="btn-primary flex items-center gap-2.5" disabled={loading}>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
