'use client';

import { useState } from 'react';

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
  breakdown: Record<string, number>;
  cardRecommendation?: CardRecommendation;
}

interface Props {
  result: ScoredOffer;
  rank: number;
  priceLabel?: { label: string; color: string };
}

function isValidBookingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] || '0';
  const m = match[2] || '0';
  return `${h}h ${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function stopsLabel(stops: number): string {
  if (stops === 0) return 'Nonstop';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
}

function stopsColor(stops: number): string {
  if (stops === 0) return 'text-[var(--color-success)]';
  if (stops === 1) return 'text-[var(--color-warning)]';
  return 'text-[var(--color-danger)]';
}

function layoverDuration(prevArrival: string, nextDeparture: string): string {
  const ms = new Date(nextDeparture).getTime() - new Date(prevArrival).getTime();
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function ItineraryRow({ itinerary, label }: { itinerary: Itinerary; label: string }) {
  const first = itinerary.segments[0];
  const last = itinerary.segments[itinerary.segments.length - 1];

  return (
    <div className="flex items-center gap-3 md:gap-4">
      <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider w-11 shrink-0 text-right">
        {label}
      </span>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-right shrink-0 w-[72px]">
          <div className="text-[15px] font-semibold leading-tight">{formatTime(first.departure.at)}</div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-medium">{first.departure.airport}</div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-[80px]">
          <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
            {parseDuration(itinerary.duration)}
          </span>
          <div className="w-full flex items-center gap-0.5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-white/10" />
            {itinerary.stops > 0 &&
              itinerary.segments.slice(0, -1).map((seg, i) => (
                <div key={i} className="relative group">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-[var(--color-text-muted)] whitespace-nowrap opacity-70">
                    {seg.arrival.airport}
                  </span>
                </div>
              ))}
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/10 to-transparent" />
            <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[5px] border-transparent border-l-white/20" />
          </div>
          <span className={`text-[10px] font-medium ${stopsColor(itinerary.stops)}`}>
            {stopsLabel(itinerary.stops)}
          </span>
        </div>

        <div className="shrink-0 w-[72px]">
          <div className="text-[15px] font-semibold leading-tight">{formatTime(last.arrival.at)}</div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-medium">{last.arrival.airport}</div>
        </div>
      </div>

      <div className="shrink-0 text-right w-[100px] hidden sm:block">
        <div className="text-[12px] text-[var(--color-text-secondary)] truncate">
          {first.carrierName || first.carrier}
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)] font-mono">{first.flightNumber}</div>
      </div>
    </div>
  );
}

function SegmentDetail({ segments }: { segments: Segment[] }) {
  return (
    <div className="space-y-0">
      {segments.map((seg, i) => (
        <div key={i}>
          {/* Layover indicator */}
          {i > 0 && (
            <div className="flex items-center gap-2 py-2 pl-6">
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/15">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-[11px] text-amber-400 font-medium">
                  {layoverDuration(segments[i - 1].arrival.at, seg.departure.at)} layover in {seg.departure.airport}
                </span>
              </div>
            </div>
          )}

          {/* Segment row */}
          <div className="flex items-start gap-3 py-2">
            <div className="w-5 flex flex-col items-center pt-1">
              <div className="w-2 h-2 rounded-full border-2 border-indigo-400/50 bg-transparent" />
              <div className="w-px flex-1 bg-white/10 min-h-[24px]" />
              <div className="w-2 h-2 rounded-full bg-indigo-400/50" />
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-semibold">{formatTime(seg.departure.at)}</span>
                  <span className="text-xs text-[var(--color-text-muted)] ml-2">{seg.departure.airport}</span>
                  {seg.departure.terminal && (
                    <span className="text-[10px] text-[var(--color-text-muted)] ml-1">T{seg.departure.terminal}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-mono">{seg.flightNumber}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                <span>{parseDuration(seg.duration)}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{seg.carrierName || seg.carrier}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="capitalize">{seg.cabin.toLowerCase()}</span>
              </div>

              <div className="flex items-baseline">
                <span className="text-sm font-semibold">{formatTime(seg.arrival.at)}</span>
                <span className="text-xs text-[var(--color-text-muted)] ml-2">{seg.arrival.airport}</span>
                {seg.arrival.terminal && (
                  <span className="text-[10px] text-[var(--color-text-muted)] ml-1">T{seg.arrival.terminal}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FlightCard({ result, rank, priceLabel }: Props) {
  const { offer, score, breakdown, cardRecommendation } = result;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="glass hover:bg-[var(--color-glass-hover)] hover:border-white/10 transition-all duration-200 fade-in-up cursor-pointer"
      style={{ animationDelay: `${rank * 70}ms`, opacity: 0 }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              rank === 0
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/20'
                : 'bg-white/[0.04] text-[var(--color-text-muted)]'
            }`}>
              #{rank + 1}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-indigo-400/50" />
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {Math.round(score * 100)} pts
              </span>
            </div>
            {offer.seatsRemaining && offer.seatsRemaining <= 4 && (
              <span className="text-[10px] text-[var(--color-danger)] font-semibold bg-red-500/10 px-1.5 py-0.5 rounded">
                {offer.seatsRemaining} left
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="price-tag text-xl">
                <span className="text-[var(--color-text-muted)] text-sm font-normal">$</span>
                {offer.price.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              {priceLabel?.label && (
                <div className={`text-[10px] font-semibold ${priceLabel.color}`}>
                  {priceLabel.label} price
                </div>
              )}
              {!priceLabel?.label && offer.price.perPassenger && (
                <div className="text-[10px] text-[var(--color-text-muted)]">
                  ${offer.price.perPassenger}/person
                </div>
              )}
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className={`text-[var(--color-text-muted)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Itineraries */}
        <div className="space-y-3">
          <ItineraryRow itinerary={offer.outbound} label={formatDate(offer.outbound.segments[0].departure.at)} />
          {offer.inbound && (
            <>
              <div className="border-t border-white/[0.04]" />
              <ItineraryRow itinerary={offer.inbound} label={formatDate(offer.inbound.segments[0].departure.at)} />
            </>
          )}
        </div>

        {/* Card recommendation teaser */}
        {cardRecommendation && !expanded && (
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-success)] flex items-center gap-1.5">
                <span>💳</span>
                {cardRecommendation.card.name}
              </span>
              <span className="text-[var(--color-success)] font-semibold">
                +${cardRecommendation.totalEstimatedValue.toFixed(0)} value
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div className="border-t border-white/[0.06] bg-white/[0.015] px-5 pb-5 pt-4 space-y-5" onClick={(e) => e.stopPropagation()}>
          {/* Outbound detail */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Outbound</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">{formatDate(offer.outbound.segments[0].departure.at)}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
              <span className="text-[10px] text-[var(--color-text-secondary)]">{parseDuration(offer.outbound.duration)} total</span>
            </div>
            <SegmentDetail segments={offer.outbound.segments} />
          </div>

          {/* Inbound detail */}
          {offer.inbound && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Return</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{formatDate(offer.inbound.segments[0].departure.at)}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                <span className="text-[10px] text-[var(--color-text-secondary)]">{parseDuration(offer.inbound.duration)} total</span>
              </div>
              <SegmentDetail segments={offer.inbound.segments} />
            </div>
          )}

          {/* Card Recommendation Detail */}
          {cardRecommendation && (
            <div className="glass-subtle p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">💳</span>
                <span className="text-sm font-medium text-[var(--color-success)]">
                  {cardRecommendation.card.name}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">by {cardRecommendation.card.issuer}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[var(--color-text-muted)]">Rewards value: </span>
                  <span className="text-[var(--color-success)] font-semibold">${cardRecommendation.estimatedRewardsValue.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">Effective cost: </span>
                  <span className="text-white font-semibold">
                    ${(offer.price.total - cardRecommendation.totalEstimatedValue).toFixed(0)}
                  </span>
                </div>
              </div>
              {cardRecommendation.rationale && (
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  {cardRecommendation.rationale}
                </p>
              )}
            </div>
          )}

          {/* Score Breakdown */}
          {breakdown && Object.keys(breakdown).length > 0 && (
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Score Breakdown</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                    <span className="text-[11px] text-[var(--color-text-muted)] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-[11px] text-[var(--color-text-primary)] font-medium">{typeof value === 'number' ? (value * 100).toFixed(0) : value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking CTA */}
          {offer.bookingUrl && isValidBookingUrl(offer.bookingUrl) ? (
            <a
              href={offer.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-sm font-semibold transition-all"
            >
              Book on {offer.provider}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-1.5 -mt-0.5">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </a>
          ) : (
            <div className="text-center text-xs text-[var(--color-text-muted)] py-2">
              Booking link not available for this flight
            </div>
          )}
        </div>
      )}
    </div>
  );
}
