import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { UserPreferences } from '@open-travel-agent/shared-types';

const PROFILE_DIR = join(homedir(), '.travel-agent');
const PROFILE_PATH = join(PROFILE_DIR, 'profile.json');

export interface UserProfile {
  cardIds: string[];
  preferences: UserPreferences;
}

const DEFAULT_PROFILE: UserProfile = {
  cardIds: [],
  preferences: {
    homeAirports: [],
    preferredAirlines: [],
    preferredAlliances: [],
    maxStops: 2,
    maxLayoverMinutes: 240,
    currency: 'USD',
  },
};

export async function loadProfile(): Promise<UserProfile> {
  try {
    const raw = await readFile(PROFILE_PATH, 'utf-8');
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await mkdir(PROFILE_DIR, { recursive: true });
  await writeFile(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');
}

export function getProfilePath(): string {
  return PROFILE_PATH;
}
