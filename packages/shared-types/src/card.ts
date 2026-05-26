export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  network: 'Visa' | 'Mastercard' | 'Amex' | 'Discover';
  annualFee: number;
  categories: RewardCategory[];
  perks: CardPerk[];
}

export interface RewardCategory {
  category: string;
  multiplier: number;
  description?: string;
  airlines?: string[];
}

export interface CardPerk {
  type: PerkType;
  description: string;
  value?: number;
  airlines?: string[];
}

export type PerkType =
  | 'free_checked_bag'
  | 'lounge_access'
  | 'travel_credit'
  | 'priority_boarding'
  | 'companion_pass'
  | 'trip_delay_insurance'
  | 'no_foreign_transaction_fee'
  | 'global_entry_credit'
  | 'seat_upgrade'
  | 'other';

export interface CardRecommendation {
  card: CreditCard;
  estimatedRewardsValue: number;
  applicablePerks: CardPerk[];
  totalEstimatedValue: number;
  rationale: string;
}

export interface UserCardProfile {
  cards: CreditCard[];
  preferredPointValuation: Record<string, number>;
}
