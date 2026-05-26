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

export default function FlightCard({ result, rank, priceLabel }: Props) {
  const { offer, score, cardRecommendation } = result;

  return (
    <div
      className="glass hover:bg-[var(--color-glass-hover)] hover:border-white/10 transition-all duration-200 p-5 fade-in-up"
      style={{ animationDelay: `${rank * 70}ms`, opacity: 0 }}
    >
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

      {/* Card recommendation */}
      {cardRecommendation && (
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

      {/* Booking link */}
      {offer.bookingUrl && isValidBookingUrl(offer.bookingUrl) && (
        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          <a
            href={offer.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
          >
            Book on {offer.provider}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
