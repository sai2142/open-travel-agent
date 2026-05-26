import { describe, it, expect, afterEach } from 'vitest';
import { IdentityVault } from './vault.js';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testVaultPath = join(tmpdir(), `test-vault-${Date.now()}.enc`);

async function cleanup() {
  try { await unlink(testVaultPath); } catch {}
  try { await unlink(testVaultPath + '.salt'); } catch {}
}

describe('IdentityVault', () => {
  afterEach(cleanup);

  it('starts locked', () => {
    const vault = new IdentityVault({ vaultPath: testVaultPath });
    expect(vault.isUnlocked()).toBe(false);
  });

  it('unlocks with password', async () => {
    const vault = new IdentityVault({ vaultPath: testVaultPath });
    await vault.unlock('test-password');
    expect(vault.isUnlocked()).toBe(true);
  });

  it('returns null for empty vault', async () => {
    const vault = new IdentityVault({ vaultPath: testVaultPath });
    await vault.unlock('test-password');
    expect(vault.getData()).toBeNull();
  });

  it('encrypts and decrypts vault data', async () => {
    const vault = new IdentityVault({ vaultPath: testVaultPath });
    await vault.unlock('test-password');

    const data = {
      identity: {
        passport: {
          fullName: 'John Doe',
          number: 'AB1234567',
          issuingCountry: 'US',
          nationality: 'US',
          dateOfBirth: '1990-01-15',
          expiryDate: '2030-01-15',
          gender: 'M' as const,
        },
        knownTravelerNumber: '12345678',
        frequentFlyer: [
          { airline: 'American Airlines', airlineCode: 'AA', number: 'FF123456' },
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await vault.setData(data);
    vault.lock();

    const vault2 = new IdentityVault({ vaultPath: testVaultPath });
    await vault2.unlock('test-password');
    const loaded = vault2.getData();
    expect(loaded).toBeTruthy();
    expect(loaded!.identity.passport.fullName).toBe('John Doe');
    expect(loaded!.identity.passport.number).toBe('AB1234567');
    expect(loaded!.identity.knownTravelerNumber).toBe('12345678');
    expect(loaded!.identity.frequentFlyer[0].number).toBe('FF123456');
  });

  it('fails to decrypt with wrong password', async () => {
    const vault = new IdentityVault({ vaultPath: testVaultPath });
    await vault.unlock('correct-password');
    await vault.setData({
      identity: {
        passport: {
          fullName: 'Jane Doe',
          number: 'XY9876543',
          issuingCountry: 'US',
          nationality: 'US',
          dateOfBirth: '1985-06-20',
          expiryDate: '2029-06-20',
          gender: 'F' as const,
        },
        frequentFlyer: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    vault.lock();

    const vault2 = new IdentityVault({ vaultPath: testVaultPath });
    await expect(vault2.unlock('wrong-password')).rejects.toThrow();
  });

  it('throws when accessing data while locked', () => {
    const vault = new IdentityVault({ vaultPath: testVaultPath });
    expect(() => vault.getData()).toThrow('Vault is locked');
  });

  it('locks and clears data from memory', async () => {
    const vault = new IdentityVault({ vaultPath: testVaultPath });
    await vault.unlock('test-password');
    vault.lock();
    expect(vault.isUnlocked()).toBe(false);
    expect(() => vault.getData()).toThrow();
  });
});
