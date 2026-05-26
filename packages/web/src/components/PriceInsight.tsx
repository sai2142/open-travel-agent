'use client';

interface Props {
  prices: number[];
}

function getPercentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

export default function PriceInsight({ prices }: Props) {
  if (prices.length < 3) return null;

  const sorted = [...prices].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p25 = getPercentile(sorted, 25);
  const p50 = getPercentile(sorted, 50);
  const p75 = getPercentile(sorted, 75);

  const segments = [
    { label: 'Low', color: 'bg-emerald-500', range: `$${Math.round(min)}–$${Math.round(p25)}` },
    { label: 'Typical', color: 'bg-amber-500', range: `$${Math.round(p25)}–$${Math.round(p75)}` },
    { label: 'High', color: 'bg-red-500', range: `$${Math.round(p75)}–$${Math.round(max)}` },
  ];

  const lowPct = ((p25 - min) / (max - min)) * 100;
  const midPct = ((p75 - p25) / (max - min)) * 100;
  const highPct = ((max - p75) / (max - min)) * 100;

  return (
    <div className="glass-subtle p-3 fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-medium">
          Price Insight
        </span>
        <span className="text-[11px] text-[var(--color-text-secondary)]">
          Median ${Math.round(p50)}
        </span>
      </div>

      {/* Bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden mb-2">
        <div className="bg-emerald-500/60 rounded-l-full" style={{ width: `${lowPct}%` }} />
        <div className="bg-amber-500/50" style={{ width: `${midPct}%` }} />
        <div className="bg-red-500/50 rounded-r-full" style={{ width: `${highPct}%` }} />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px]">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
            <span className="text-[var(--color-text-muted)]">{s.label}</span>
            <span className="text-[var(--color-text-secondary)]">{s.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function getPriceLabel(price: number, allPrices: number[]): { label: string; color: string } {
  if (allPrices.length < 3) return { label: '', color: '' };
  const sorted = [...allPrices].sort((a, b) => a - b);
  const p25 = getPercentile(sorted, 25);
  const p75 = getPercentile(sorted, 75);

  if (price <= p25) return { label: 'Low', color: 'text-[var(--color-success)]' };
  if (price >= p75) return { label: 'High', color: 'text-[var(--color-danger)]' };
  return { label: 'Typical', color: 'text-[var(--color-warning)]' };
}
