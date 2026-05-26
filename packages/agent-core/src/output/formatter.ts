import chalk from 'chalk';
import type { ScoredOffer } from '../scoring/index.js';
import type { VaultData } from '@open-travel-agent/shared-types';
import { parseDurationMinutes } from '../scoring/index.js';

export function formatRankedResults(scored: ScoredOffer[], topN: number = 5): string {
  const lines: string[] = [];
  const top = scored.slice(0, topN);

  lines.push('');
  lines.push(chalk.bold.cyan(`  ✈  Top ${top.length} Flight Options`));
  lines.push(chalk.dim('  ─'.repeat(30)));
  lines.push('');

  for (let i = 0; i < top.length; i++) {
    lines.push(formatOffer(top[i], i + 1));
    lines.push('');
  }

  lines.push(chalk.dim('  Select an option: travel-agent book --offer <number>'));
  lines.push('');

  return lines.join('\n');
}

function formatOffer(scored: ScoredOffer, rank: number): string {
  const { offer, score, cardRecommendation } = scored;
  const lines: string[] = [];
  const rankLabel = rank <= 3
    ? chalk.bold.yellow(`  #${rank}`)
    : chalk.bold(`  #${rank}`);

  const carrier = offer.validatingCarrier || offer.outbound.segments[0].carrier;
  const carrierName = offer.outbound.segments[0].carrierName || carrier;

  lines.push(
    `${rankLabel}  ${chalk.bold(carrierName)} — ${chalk.green.bold(`$${offer.price.total.toFixed(2)}`)} ${chalk.dim(offer.price.currency)}  ${chalk.dim(`(score: ${(score * 100).toFixed(0)})`)}`,
  );

  lines.push(formatItinerary('  OUT', offer.outbound));

  if (offer.inbound) {
    lines.push(formatItinerary('  RET', offer.inbound));
  }

  if (offer.seatsRemaining && offer.seatsRemaining <= 4) {
    lines.push(chalk.red(`      ⚠ Only ${offer.seatsRemaining} seats left`));
  }

  if (cardRecommendation) {
    const effectivePrice = offer.price.total - cardRecommendation.totalEstimatedValue;
    lines.push(chalk.magenta(`      💳 ${cardRecommendation.rationale}`));
    lines.push(chalk.dim(`         Effective price after rewards: `) + chalk.green(`$${effectivePrice.toFixed(2)}`));
  }

  return lines.join('\n');
}

function formatItinerary(label: string, itinerary: { segments: Array<{ departure: { airport: string; at: string }; arrival: { airport: string; at: string }; carrier: string; flightNumber: string }>; duration: string; stops: number }): string {
  const first = itinerary.segments[0];
  const last = itinerary.segments[itinerary.segments.length - 1];
  const depTime = formatTime(first.departure.at);
  const arrTime = formatTime(last.arrival.at);
  const dur = formatDuration(itinerary.duration);
  const stopsLabel = itinerary.stops === 0
    ? chalk.green('nonstop')
    : chalk.yellow(`${itinerary.stops} stop${itinerary.stops > 1 ? 's' : ''}`);

  const flightNums = itinerary.segments.map((s) => s.flightNumber).join(' → ');

  return `    ${chalk.dim(label)}  ${first.departure.airport} ${depTime} → ${last.arrival.airport} ${arrTime}  ${dur}  ${stopsLabel}  ${chalk.dim(flightNums)}`;
}

function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return chalk.bold(`${h12}:${m}${ampm}`);
}

function formatDuration(isoDuration: string): string {
  const totalMin = parseDurationMinutes(isoDuration);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return chalk.dim(`${h}h${m > 0 ? ` ${m}m` : ''}`);
}

export function formatBookingDetails(
  scored: ScoredOffer,
  vaultData?: VaultData | null,
): string {
  const { offer, cardRecommendation } = scored;
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold.cyan('  📋 Ready-to-Book Details'));
  lines.push(chalk.dim('  ─'.repeat(30)));
  lines.push('');

  // Itinerary
  lines.push(chalk.bold('  Itinerary'));
  const outSeg = offer.outbound.segments;
  lines.push(formatItinerary('  OUT', offer.outbound));
  if (outSeg.length > 1) {
    for (let i = 0; i < outSeg.length; i++) {
      const s = outSeg[i];
      lines.push(chalk.dim(`         Leg ${i + 1}: ${s.flightNumber}  ${s.departure.airport}→${s.arrival.airport}  ${formatDuration(s.duration)}  ${s.carrierName || s.carrier}`));
    }
  }
  if (offer.inbound) {
    lines.push(formatItinerary('  RET', offer.inbound));
    const retSeg = offer.inbound.segments;
    if (retSeg.length > 1) {
      for (let i = 0; i < retSeg.length; i++) {
        const s = retSeg[i];
        lines.push(chalk.dim(`         Leg ${i + 1}: ${s.flightNumber}  ${s.departure.airport}→${s.arrival.airport}  ${formatDuration(s.duration)}  ${s.carrierName || s.carrier}`));
      }
    }
  }
  lines.push('');

  // Fare breakdown
  lines.push(chalk.bold('  Fare'));
  lines.push(`    Total: ${chalk.green.bold(`$${offer.price.total.toFixed(2)}`)} ${offer.price.currency}`);
  if (offer.price.base) {
    lines.push(`    Base:  $${offer.price.base.toFixed(2)}  |  Taxes: $${(offer.price.taxes || 0).toFixed(2)}`);
  }
  if (offer.price.perPassenger) {
    lines.push(`    Per passenger: $${offer.price.perPassenger.toFixed(2)}`);
  }
  lines.push('');

  // Payment / card recommendation
  if (cardRecommendation) {
    const effectivePrice = offer.price.total - cardRecommendation.totalEstimatedValue;
    lines.push(chalk.bold('  Payment Recommendation'));
    lines.push(`    ${chalk.magenta.bold(cardRecommendation.card.name)} (${cardRecommendation.card.network})`);
    lines.push(`    Rewards earned:   ${chalk.green(`$${cardRecommendation.estimatedRewardsValue.toFixed(2)}`)}`);
    if (cardRecommendation.applicablePerks.length > 0) {
      lines.push('    Applicable perks:');
      for (const perk of cardRecommendation.applicablePerks) {
        lines.push(`      • ${perk.description}${perk.value ? chalk.dim(` (~$${perk.value}/yr)`) : ''}`);
      }
    }
    lines.push(`    Total value:      ${chalk.green(`$${cardRecommendation.totalEstimatedValue.toFixed(2)}`)}`);
    lines.push(`    Effective price:  ${chalk.green.bold(`$${effectivePrice.toFixed(2)}`)}`);
    lines.push('');
  }

  // Passenger details from vault
  if (vaultData) {
    const p = vaultData.identity.passport;
    lines.push(chalk.bold('  Passenger Details (from vault)'));
    lines.push(`    Full name:    ${p.fullName}`);
    lines.push(`    Date of birth: ${p.dateOfBirth}`);
    lines.push(`    Gender:       ${p.gender}`);
    lines.push(`    Passport:     ${maskString(p.number)} (${p.issuingCountry}, exp ${p.expiryDate})`);
    if (vaultData.identity.knownTravelerNumber) {
      lines.push(`    KTN:          ${vaultData.identity.knownTravelerNumber}`);
    }
    if (vaultData.identity.redressNumber) {
      lines.push(`    Redress:      ${vaultData.identity.redressNumber}`);
    }
    const carrier = offer.validatingCarrier;
    const relevantFF = carrier
      ? vaultData.identity.frequentFlyer.find((ff) => ff.airlineCode === carrier)
      : undefined;
    if (relevantFF) {
      lines.push(`    FF#:          ${relevantFF.airline} — ${relevantFF.number}`);
    }
    const otherFF = vaultData.identity.frequentFlyer.filter((ff) => ff.airlineCode !== carrier);
    if (otherFF.length > 0) {
      lines.push(chalk.dim(`    Other FF#:    ${otherFF.map((ff) => `${ff.airlineCode}:${ff.number}`).join(', ')}`));
    }
    lines.push('');
  }

  // Booking links
  lines.push(chalk.bold('  Book'));
  const carrier = offer.validatingCarrier || offer.outbound.segments[0].carrier;
  const deeplink = buildBookingDeeplink(offer);
  if (deeplink) {
    lines.push(`    ${chalk.underline(deeplink)}`);
  }
  lines.push(chalk.dim(`    Search on Google Flights: ${buildGoogleFlightsLink(offer)}`));
  lines.push('');

  return lines.join('\n');
}

export function formatResultsJson(scored: ScoredOffer[], topN: number = 5): string {
  const top = scored.slice(0, topN);
  return JSON.stringify(
    top.map(({ offer, score, breakdown, cardRecommendation }) => ({
      id: offer.id,
      carrier: offer.validatingCarrier,
      price: offer.price,
      outbound: summarizeItinerary(offer.outbound),
      inbound: offer.inbound ? summarizeItinerary(offer.inbound) : null,
      score: Math.round(score * 100),
      breakdown,
      cardRecommendation: cardRecommendation
        ? {
            card: cardRecommendation.card.name,
            estimatedRewardsValue: cardRecommendation.estimatedRewardsValue,
            totalEstimatedValue: cardRecommendation.totalEstimatedValue,
            effectivePrice: offer.price.total - cardRecommendation.totalEstimatedValue,
            rationale: cardRecommendation.rationale,
          }
        : null,
      bookingLinks: {
        googleFlights: buildGoogleFlightsLink(offer),
      },
    })),
    null,
    2,
  );
}

function summarizeItinerary(it: { segments: Array<{ departure: { airport: string; at: string }; arrival: { airport: string; at: string }; carrier: string; flightNumber: string }>; duration: string; stops: number }) {
  const lastSeg = it.segments[it.segments.length - 1];
  return {
    route: it.segments.map((s) => s.departure.airport).concat(lastSeg.arrival.airport).join('→'),
    flights: it.segments.map((s) => s.flightNumber),
    stops: it.stops,
    duration: it.duration,
  };
}

function maskString(s: string): string {
  if (s.length <= 4) return '****';
  return '***' + s.slice(-4);
}

function buildBookingDeeplink(offer: { validatingCarrier?: string; outbound: { segments: Array<{ carrier: string; flightNumber: string; departure: { airport: string; at: string } }> } }): string | null {
  const carrier = offer.validatingCarrier || offer.outbound.segments[0].carrier;
  const airlineUrls: Record<string, string> = {
    AA: 'https://www.aa.com',
    UA: 'https://www.united.com',
    DL: 'https://www.delta.com',
    BA: 'https://www.britishairways.com',
    AF: 'https://www.airfrance.com',
    LH: 'https://www.lufthansa.com',
    IB: 'https://www.iberia.com',
    EK: 'https://www.emirates.com',
    SQ: 'https://www.singaporeair.com',
    QF: 'https://www.qantas.com',
    AC: 'https://www.aircanada.com',
    NH: 'https://www.ana.co.jp/en',
    JL: 'https://www.jal.co.jp/en',
    KL: 'https://www.klm.com',
    SK: 'https://www.flysas.com',
    FI: 'https://www.icelandair.com',
    AS: 'https://www.alaskaair.com',
    WN: 'https://www.southwest.com',
    B6: 'https://www.jetblue.com',
    NK: 'https://www.spirit.com',
    F9: 'https://www.flyfrontier.com',
  };
  return airlineUrls[carrier] || null;
}

function buildGoogleFlightsLink(offer: { outbound: { segments: Array<{ departure: { airport: string; at: string }; arrival: { airport: string; at: string } }> }; inbound?: { segments: Array<{ departure: { airport: string; at: string } }> } }): string {
  const origin = offer.outbound.segments[0].departure.airport;
  const lastSeg = offer.outbound.segments[offer.outbound.segments.length - 1];
  const dest = lastSeg.arrival.airport;
  const depDate = offer.outbound.segments[0].departure.at.slice(0, 10);

  let url = `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${dest}+on+${depDate}`;

  if (offer.inbound) {
    const retDate = offer.inbound.segments[0].departure.at.slice(0, 10);
    url += `+return+${retDate}`;
  }

  return url;
}
