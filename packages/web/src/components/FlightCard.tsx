'use client';

interface Segment {
  carrier: string;
  carrierName?: string;
  flightNumber: string;
  departure: { airport: string; terminal?: string; at: string };
  arrival: { airport: string; terminal?: string; at: string };
  duration: string;
  cabin: string;
}

interface Itinerary {
  segments: Segment[];
  duration: string;
  stops: number;
}

interface Price {
  total: number;
  currency: string;
  perPassenger?: number;
}

interface CardRecommendation {
  card: { name: string; issuer: string };
  estimatedRewardsValue: number;
  totalEstimatedValue: number;
  rationale: string;
}

interface ScoreBreakdown {
  priceScore: number;
  durationScore: number;
  stopsScore: number;
}

interface ScoredOffer {
  offer: {
    id: string;
    provider: string;
    outbound: Itinerary;
    inbound?: Itinerary;
    price: Price;
    seatsRemaining?: number;
    bookingUrl?: string;
    validatingCarrier?: string;
  };
  score: number;
  breakdown: ScoreBreakdown;
  cardRecommendation?: CardRecommendation;
}

interface Props {
  result: ScoredOffer;
  rank: number;
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] || '0';
  const m = match[2] || '0';
  return `${h}h ${m}m`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function stopsLabel(stops: number): string {
  if (stops === 0) return 'Nonstop';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
}

function ItineraryRow({ itinerary, label }: { itinerary: Itinerary; label: string }) {
  const first = itinerary.segments[0];
  const last = itinerary.segments[itinerary.segments.length - 1];

  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider w-12 shrink-0">
        {label}
      </span>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Departure */}
        <div className="text-right shrink-0">
          <div className="text-base font-semibold">{formatTime(first.departure.at)}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{first.departure.airport}</div>
        </div>

        {/* Duration line */}
        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-[100px]">
          <span className="text-xs text-[var(--color-text-secondary)]">
            {parseDuration(itinerary.duration)}
          </span>
          <div className="w-full flex items-center">
            <div className="flex-1 h-px bg-[var(--color-glass-border)]" />
            {itinerary.stops > 0 &&
              itinerary.segments.slice(0, -1).map((seg, i) => (
                <div key={i} className="relative mx-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" />
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-[var(--color-text-muted)] whitespace-nowrap">
                    {seg.arrival.airport}
                  </span>
                </div>
              ))}
            <div className="flex-1 h-px bg-[var(--color-glass-border)]" />
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {stopsLabel(itinerary.stops)}
          </span>
        </div>

        {/* Arrival */}
        <div className="shrink-0">
          <div className="text-base font-semibold">{formatTime(last.arrival.at)}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{last.arrival.airport}</div>
        </div>
      </div>

      {/* Carrier */}
      <div className="shrink-0 text-right">
        <div className="text-xs text-[var(--color-text-secondary)]">
          {first.carrierName || first.carrier}
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)]">{first.flightNumber}</div>
      </div>
    </div>
  );
}

export default function FlightCard({ result, rank }: Props) {
  const { offer, score, cardRecommendation } = result;

  return (
    <div className="glass hover:bg-[var(--color-glass-hover)] transition-all p-5 fade-in" style={{ animationDelay: `${rank * 60}ms` }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-lg">
            #{rank + 1}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            Score {Math.round(score * 100)}
          </span>
          {offer.seatsRemaining && offer.seatsRemaining <= 4 && (
            <span className="text-[10px] text-[var(--color-danger)] font-medium">
              {offer.seatsRemaining} left
            </span>
          )}
        </div>

        <div className="text-right">
          <div className="price-tag text-xl text-white">
            ${offer.price.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            {offer.price.currency}
            {offer.price.perPassenger && ` / $${offer.price.perPassenger} pp`}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <ItineraryRow itinerary={offer.outbound} label={formatDate(offer.outbound.segments[0].departure.at)} />
        {offer.inbound && (
          <ItineraryRow itinerary={offer.inbound} label={formatDate(offer.inbound.segments[0].departure.at)} />
        )}
      </div>

      {cardRecommendation && (
        <div className="mt-4 pt-3 border-t border-[var(--color-glass-border)]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-success)]">
              {cardRecommendation.card.name}
            </span>
            <span className="text-[var(--color-success)] font-semibold">
              +${cardRecommendation.totalEstimatedValue.toFixed(0)} value
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1 line-clamp-1">
            {cardRecommendation.rationale}
          </p>
        </div>
      )}

      {offer.bookingUrl && (
        <div className="mt-3 pt-3 border-t border-[var(--color-glass-border)]">
          <a
            href={offer.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            View on {offer.provider} &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
