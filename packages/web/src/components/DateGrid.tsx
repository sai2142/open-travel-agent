'use client';

interface DatePair {
  departureDate: string;
  returnDate?: string;
}

interface DateGridCell {
  datePair: DatePair;
  bestPrice: number;
  offerCount: number;
}

interface DateGridResult {
  cells: DateGridCell[];
  bestOverall: DateGridCell | null;
  searchedCombinations: number;
  totalOffersFound: number;
  searchDurationMs: number;
  cachedHits: number;
}

interface Props {
  result: DateGridResult;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
}

function priceColor(price: number, min: number, max: number): string {
  if (max === min) return 'var(--color-price-low)';
  const ratio = (price - min) / (max - min);
  if (ratio <= 0.33) return 'var(--color-price-low)';
  if (ratio <= 0.66) return 'var(--color-price-mid)';
  return 'var(--color-price-high)';
}

function priceBg(price: number, min: number, max: number): string {
  if (max === min) return 'rgba(34, 197, 94, 0.1)';
  const ratio = (price - min) / (max - min);
  if (ratio <= 0.33) return 'rgba(34, 197, 94, 0.1)';
  if (ratio <= 0.66) return 'rgba(245, 158, 11, 0.08)';
  return 'rgba(239, 68, 68, 0.08)';
}

export default function DateGrid({ result }: Props) {
  if (result.cells.length === 0) {
    return (
      <div className="glass p-8 text-center text-[var(--color-text-muted)]">
        No results found for any date combination.
      </div>
    );
  }

  const sorted = [...result.cells].sort((a, b) => a.bestPrice - b.bestPrice);
  const minPrice = sorted[0].bestPrice;
  const maxPrice = sorted[sorted.length - 1].bestPrice;

  return (
    <div className="space-y-4 fade-in">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
        <span>{result.searchedCombinations} combinations searched</span>
        <span>{result.totalOffersFound} offers found</span>
        <span>{(result.searchDurationMs / 1000).toFixed(1)}s</span>
        {result.cachedHits > 0 && <span>{result.cachedHits} cache hits</span>}
      </div>

      {/* Best deal highlight */}
      {result.bestOverall && (
        <div className="glass p-4 border-l-2 border-l-[var(--color-success)]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--color-success)] font-semibold uppercase tracking-wider">
                Best Deal
              </span>
              <div className="text-sm text-[var(--color-text-primary)] mt-1">
                {formatShortDate(result.bestOverall.datePair.departureDate)}
                {result.bestOverall.datePair.returnDate &&
                  ` - ${formatShortDate(result.bestOverall.datePair.returnDate)}`}
              </div>
            </div>
            <div className="price-tag text-2xl text-[var(--color-success)]">
              ${result.bestOverall.bestPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      {/* Price legend */}
      <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(34, 197, 94, 0.3)' }} />
          Cheap
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.3)' }} />
          Mid
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(239, 68, 68, 0.3)' }} />
          Pricey
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-2">
        {sorted.map((cell, i) => (
          <div
            key={i}
            className="glass-subtle flex items-center justify-between p-3 hover:bg-[var(--color-glass-hover)] transition-colors cursor-default"
            style={{ background: priceBg(cell.bestPrice, minPrice, maxPrice) }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-bold w-6 text-center"
                style={{ color: priceColor(cell.bestPrice, minPrice, maxPrice) }}
              >
                {i + 1}
              </span>
              <div>
                <span className="text-sm text-[var(--color-text-primary)]">
                  {formatShortDate(cell.datePair.departureDate)}
                </span>
                {cell.datePair.returnDate && (
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {' '}&rarr; {formatShortDate(cell.datePair.returnDate)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {cell.offerCount} offer{cell.offerCount !== 1 ? 's' : ''}
              </span>
              <span
                className="price-tag text-base"
                style={{ color: priceColor(cell.bestPrice, minPrice, maxPrice) }}
              >
                ${cell.bestPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
