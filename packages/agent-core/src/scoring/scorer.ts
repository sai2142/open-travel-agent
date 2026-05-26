import type { FlightOffer, UserPreferences, CreditCard, CardRecommendation, CardPerk, UserCardProfile } from '@open-travel-agent/shared-types';

export interface ScoredOffer {
  offer: FlightOffer;
  score: number;
  breakdown: ScoreBreakdown;
  cardRecommendation?: CardRecommendation;
}

export interface ScoreBreakdown {
  priceScore: number;
  durationScore: number;
  stopsScore: number;
  timeScore: number;
  airlineScore: number;
  rewardsScore: number;
}

const WEIGHTS = {
  price: 0.35,
  duration: 0.25,
  stops: 0.20,
  time: 0.10,
  airline: 0.05,
  rewards: 0.05,
};

export function scoreOffers(
  offers: FlightOffer[],
  preferences: UserPreferences,
  cardProfile?: UserCardProfile,
): ScoredOffer[] {
  if (offers.length === 0) return [];

  const priceRange = getRange(offers.map((o) => o.price.total));
  const durationRange = getRange(offers.map((o) => parseDurationMinutes(o.outbound.duration)));

  const scored = offers.map((offer) => {
    const priceScore = normalizeInverse(offer.price.total, priceRange);
    const durationScore = normalizeInverse(
      parseDurationMinutes(offer.outbound.duration),
      durationRange,
    );
    const stopsScore = scoreStops(offer.outbound.stops, preferences.maxStops);
    const timeScore = scoreTime(offer.outbound.segments[0].departure.at, preferences);
    const airlineScore = scoreAirline(offer.validatingCarrier, preferences);

    let rewardsScore = 0;
    let cardRecommendation: CardRecommendation | undefined;

    if (cardProfile && cardProfile.cards.length > 0) {
      cardRecommendation = getBestCard(offer, cardProfile);
      rewardsScore = cardRecommendation
        ? Math.min(cardRecommendation.totalEstimatedValue / offer.price.total, 1)
        : 0;
    }

    const breakdown: ScoreBreakdown = {
      priceScore,
      durationScore,
      stopsScore,
      timeScore,
      airlineScore,
      rewardsScore,
    };

    const score =
      priceScore * WEIGHTS.price +
      durationScore * WEIGHTS.duration +
      stopsScore * WEIGHTS.stops +
      timeScore * WEIGHTS.time +
      airlineScore * WEIGHTS.airline +
      rewardsScore * WEIGHTS.rewards;

    return { offer, score, breakdown, cardRecommendation };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function getBestCard(
  offer: FlightOffer,
  profile: UserCardProfile,
): CardRecommendation | undefined {
  let best: CardRecommendation | undefined;

  for (const card of profile.cards) {
    const rewardsValue = estimateRewardsValue(offer, card, profile.preferredPointValuation);
    const applicablePerks = getApplicablePerks(offer, card);
    const perkValue = applicablePerks.reduce((sum, p) => sum + (p.value || 0), 0);
    const totalEstimatedValue = rewardsValue + perkValue;

    if (!best || totalEstimatedValue > best.totalEstimatedValue) {
      best = {
        card,
        estimatedRewardsValue: rewardsValue,
        applicablePerks,
        totalEstimatedValue,
        rationale: buildRationale(card, rewardsValue, applicablePerks),
      };
    }
  }

  return best;
}

function estimateRewardsValue(
  offer: FlightOffer,
  card: CreditCard,
  valuations: Record<string, number>,
): number {
  const travelCategory = card.categories.find(
    (c) => c.category === 'travel' || c.category === 'airlines',
  );
  const generalCategory = card.categories.find((c) => c.category === 'general');
  const multiplier = travelCategory?.multiplier || generalCategory?.multiplier || 1;
  const centsPerPoint = valuations[card.issuer] || 1.0;
  return (offer.price.total * multiplier * centsPerPoint) / 100;
}

function getApplicablePerks(offer: FlightOffer, card: CreditCard): CardPerk[] {
  return card.perks.filter((perk) => {
    if (perk.airlines && perk.airlines.length > 0) {
      return perk.airlines.includes(offer.validatingCarrier || '');
    }
    return true;
  });
}

function buildRationale(
  card: CreditCard,
  rewardsValue: number,
  perks: CardPerk[],
): string {
  const parts = [`Use ${card.name}: ~$${rewardsValue.toFixed(2)} in rewards`];
  if (perks.length > 0) {
    const perkNames = perks.map((p) => p.description).slice(0, 3);
    parts.push(`+ perks: ${perkNames.join(', ')}`);
  }
  return parts.join(' ');
}

function scoreStops(stops: number, maxPreferred: number): number {
  if (stops === 0) return 1.0;
  if (stops <= maxPreferred) return 0.6;
  return 0.2;
}

function scoreTime(departureAt: string, preferences: UserPreferences): number {
  if (!preferences.preferredDepartureWindow) return 0.5;
  const hour = new Date(departureAt).getHours();
  const earliest = parseInt(preferences.preferredDepartureWindow.earliest.split(':')[0], 10);
  const latest = parseInt(preferences.preferredDepartureWindow.latest.split(':')[0], 10);
  if (hour >= earliest && hour <= latest) return 1.0;
  const distance = Math.min(Math.abs(hour - earliest), Math.abs(hour - latest));
  return Math.max(0, 1 - distance * 0.15);
}

function scoreAirline(
  carrier: string | undefined,
  preferences: UserPreferences,
): number {
  if (!carrier) return 0.5;
  if (preferences.preferredAirlines.includes(carrier)) return 1.0;
  return 0.5;
}

function getRange(values: number[]): [number, number] {
  return [Math.min(...values), Math.max(...values)];
}

function normalizeInverse(value: number, [min, max]: [number, number]): number {
  if (max === min) return 1;
  return 1 - (value - min) / (max - min);
}

export function parseDurationMinutes(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0', 10) * 60) + parseInt(match[2] || '0', 10);
}
