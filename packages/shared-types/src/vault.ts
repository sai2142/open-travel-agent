export interface PassportInfo {
  fullName: string;
  number: string;
  issuingCountry: string;
  nationality: string;
  dateOfBirth: string; // YYYY-MM-DD
  expiryDate: string;  // YYYY-MM-DD
  gender: 'M' | 'F' | 'X';
}

export interface TravelerIdentity {
  passport: PassportInfo;
  knownTravelerNumber?: string;
  redressNumber?: string;
  frequentFlyer: FrequentFlyerEntry[];
}

export interface FrequentFlyerEntry {
  airline: string;
  airlineCode: string;
  number: string;
}

export interface VaultData {
  identity: TravelerIdentity;
  createdAt: string;
  updatedAt: string;
}

export interface VaultConfig {
  vaultPath: string;
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  kdf: 'argon2id';
  kdfParams: {
    memoryCost: number;
    timeCost: number;
    parallelism: number;
  };
}
