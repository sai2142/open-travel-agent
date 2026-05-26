'use client';

import { useState, useRef } from 'react';
import type { SearchFormData, SearchMode } from './SearchForm';

interface Props {
  onParsed: (data: Partial<SearchFormData>) => void;
}

const EXAMPLES = [
  'Cheapest weekend flight DFW to London in August',
  'Nonstop Dallas to Paris, flexible ±3 days around July 15',
  'Business class NYC to Tokyo, 5-7 day trip in September',
  'Round trip DFW to Columbus OH, departing next Friday',
];

export default function NaturalLanguageBar({ onParsed }: Props) {
  const [query, setQuery] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleParse = async () => {
    if (!query.trim() || parsing) return;
    setParsing(true);
    setError('');

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      const formData: Partial<SearchFormData> = {};
      if (data.origin) formData.origin = data.origin;
      if (data.destination) formData.destination = data.destination;
      if (data.departureDate) formData.departureDate = data.departureDate;
      if (data.returnDate) formData.returnDate = data.returnDate;
      if (data.passengers) formData.passengers = data.passengers;
      if (data.cabin) formData.cabin = data.cabin;
      if (data.directOnly !== undefined) formData.directOnly = data.directOnly;
      if (data.mode) formData.mode = data.mode as SearchMode;
      if (data.flexDays) formData.flexDays = data.flexDays;
      if (data.weekendMonth) formData.weekendMonth = data.weekendMonth;
      if (data.tripLengthMin) formData.tripLengthMin = data.tripLengthMin;
      if (data.tripLengthMax) formData.tripLengthMax = data.tripLengthMax;

      onParsed(formData);
      setQuery('');
    } catch (err) {
      console.error('NL parse error:', err);
      setError('Failed to parse your request');
    } finally {
      setParsing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleParse();
    }
  };

  const handleExample = (example: string) => {
    setQuery(example);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Input bar */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
        <div className="relative flex items-center glass rounded-xl overflow-hidden">
          <div className="pl-4 text-[var(--color-text-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
              <path d="M12 2a14 14 0 0 1 4 10" />
              <path d="M2 12h10" />
              <path d="M19 7l3-3m0 0l-3-3m3 3h-6" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try: cheapest weekend flight DFW to London in August..."
            className="flex-1 bg-transparent px-3 py-4 text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
          />
          <button
            type="button"
            onClick={handleParse}
            disabled={!query.trim() || parsing}
            className="px-4 py-2 mr-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/20"
          >
            {parsing ? (
              <span className="search-progress flex gap-1">
                <span className="dot w-1 h-1 bg-indigo-300 rounded-full" />
                <span className="dot w-1 h-1 bg-indigo-300 rounded-full" />
                <span className="dot w-1 h-1 bg-indigo-300 rounded-full" />
              </span>
            ) : (
              'Parse'
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[var(--color-danger)] text-center fade-in">{error}</p>
      )}

      {/* Example pills */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => handleExample(ex)}
            className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] px-2.5 py-1 rounded-full glass-subtle hover:bg-white/[0.03] transition-colors truncate max-w-[220px]"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
