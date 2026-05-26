import type { CreditCard, UserCardProfile } from '@open-travel-agent/shared-types';

export const SAMPLE_CARDS: CreditCard[] = [
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    network: 'Visa',
    annualFee: 95,
    categories: [
      { category: 'travel', multiplier: 5, description: '5x on travel booked via Chase Travel' },
      { category: 'dining', multiplier: 3 },
      { category: 'general', multiplier: 1 },
    ],
    perks: [
      { type: 'trip_delay_insurance', description: 'Trip delay reimbursement', value: 25 },
      { type: 'no_foreign_transaction_fee', description: 'No foreign transaction fees' },
    ],
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    network: 'Visa',
    annualFee: 550,
    categories: [
      { category: 'travel', multiplier: 10, description: '10x on hotels and car rentals via Chase Travel' },
      { category: 'airlines', multiplier: 5, description: '5x on flights via Chase Travel' },
      { category: 'dining', multiplier: 3 },
      { category: 'general', multiplier: 1 },
    ],
    perks: [
      { type: 'travel_credit', description: '$300 annual travel credit', value: 300 },
      { type: 'lounge_access', description: 'Priority Pass lounge access', value: 150 },
      { type: 'global_entry_credit', description: 'Global Entry/TSA PreCheck credit', value: 20 },
      { type: 'no_foreign_transaction_fee', description: 'No foreign transaction fees' },
      { type: 'trip_delay_insurance', description: 'Trip delay reimbursement', value: 50 },
    ],
  },
  {
    id: 'amex-platinum',
    name: 'Amex Platinum',
    issuer: 'Amex',
    network: 'Amex',
    annualFee: 695,
    categories: [
      { category: 'airlines', multiplier: 5, description: '5x on flights booked directly with airlines' },
      { category: 'travel', multiplier: 5, description: '5x on prepaid hotels via Amex Travel' },
      { category: 'general', multiplier: 1 },
    ],
    perks: [
      { type: 'lounge_access', description: 'Centurion Lounge + Priority Pass', value: 300 },
      { type: 'travel_credit', description: '$200 airline fee credit', value: 200 },
      { type: 'global_entry_credit', description: 'Global Entry/TSA PreCheck credit', value: 20 },
      { type: 'no_foreign_transaction_fee', description: 'No foreign transaction fees' },
    ],
  },
  {
    id: 'capital-one-venture',
    name: 'Capital One Venture',
    issuer: 'Capital One',
    network: 'Visa',
    annualFee: 95,
    categories: [
      { category: 'travel', multiplier: 5, description: '5x on hotels and car rentals via Capital One Travel' },
      { category: 'airlines', multiplier: 5, description: '5x on flights via Capital One Travel' },
      { category: 'general', multiplier: 2 },
    ],
    perks: [
      { type: 'global_entry_credit', description: 'Global Entry/TSA PreCheck credit', value: 20 },
      { type: 'no_foreign_transaction_fee', description: 'No foreign transaction fees' },
    ],
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    network: 'Visa',
    annualFee: 395,
    categories: [
      { category: 'travel', multiplier: 10, description: '10x on hotels and car rentals via Capital One Travel' },
      { category: 'airlines', multiplier: 5, description: '5x on flights via Capital One Travel' },
      { category: 'general', multiplier: 2 },
    ],
    perks: [
      { type: 'travel_credit', description: '$300 annual travel credit', value: 300 },
      { type: 'lounge_access', description: 'Capital One Lounge + Priority Pass + Plaza Premium', value: 250 },
      { type: 'global_entry_credit', description: 'Global Entry/TSA PreCheck credit', value: 20 },
      { type: 'no_foreign_transaction_fee', description: 'No foreign transaction fees' },
    ],
  },
  {
    id: 'united-explorer',
    name: 'United Explorer Card',
    issuer: 'Chase',
    network: 'Visa',
    annualFee: 95,
    categories: [
      { category: 'airlines', multiplier: 2, description: '2x on United purchases', airlines: ['UA'] },
      { category: 'travel', multiplier: 2, description: '2x on other travel' },
      { category: 'dining', multiplier: 2 },
      { category: 'general', multiplier: 1 },
    ],
    perks: [
      { type: 'free_checked_bag', description: 'Free first checked bag on United', value: 70, airlines: ['UA'] },
      { type: 'priority_boarding', description: 'Priority boarding on United', airlines: ['UA'] },
      { type: 'no_foreign_transaction_fee', description: 'No foreign transaction fees' },
    ],
  },
  {
    id: 'delta-skymiles-gold',
    name: 'Delta SkyMiles Gold',
    issuer: 'Amex',
    network: 'Amex',
    annualFee: 150,
    categories: [
      { category: 'airlines', multiplier: 2, description: '2x on Delta purchases', airlines: ['DL'] },
      { category: 'dining', multiplier: 2 },
      { category: 'general', multiplier: 1 },
    ],
    perks: [
      { type: 'free_checked_bag', description: 'Free first checked bag on Delta', value: 70, airlines: ['DL'] },
      { type: 'priority_boarding', description: 'Priority boarding on Delta', airlines: ['DL'] },
      { type: 'no_foreign_transaction_fee', description: 'No foreign transaction fees' },
    ],
  },
];

export const DEFAULT_POINT_VALUATIONS: Record<string, number> = {
  Chase: 1.5,
  Amex: 1.5,
  'Capital One': 1.5,
  Citi: 1.2,
};

export function buildCardProfile(cardIds: string[]): UserCardProfile {
  const cards = SAMPLE_CARDS.filter((c) => cardIds.includes(c.id));
  return {
    cards,
    preferredPointValuation: DEFAULT_POINT_VALUATIONS,
  };
}
