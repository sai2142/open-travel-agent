import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';
import type { VaultData, VaultConfig } from '@open-travel-agent/shared-types';

const DEFAULT_CONFIG: VaultConfig = {
  vaultPath: './vault.enc',
  algorithm: 'aes-256-gcm',
  kdf: 'argon2id',
  kdfParams: {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  },
};

export class IdentityVault {
  private config: VaultConfig;
  private data: VaultData | null = null;
  private derivedKey: Buffer | null = null;

  constructor(config: Partial<VaultConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async unlock(masterPassword: string): Promise<void> {
    this.derivedKey = await this.deriveKey(masterPassword);

    if (await this.vaultExists()) {
      const encrypted = await readFile(this.config.vaultPath);
      this.data = this.decrypt(encrypted);
    } else {
      this.data = null;
    }
  }

  lock(): void {
    this.data = null;
    this.derivedKey = null;
  }

  isUnlocked(): boolean {
    return this.derivedKey !== null;
  }

  getData(): VaultData | null {
    this.ensureUnlocked();
    return this.data;
  }

  async setData(data: VaultData): Promise<void> {
    this.ensureUnlocked();
    this.data = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    const encrypted = this.encrypt(this.data);
    await writeFile(this.config.vaultPath, encrypted);
  }

  private async deriveKey(password: string): Promise<Buffer> {
    try {
      const argon2 = await import('argon2');
      const salt = await this.getOrCreateSalt();
      const hash = await argon2.hash(password, {
        type: 2, // argon2id
        memoryCost: this.config.kdfParams.memoryCost,
        timeCost: this.config.kdfParams.timeCost,
        parallelism: this.config.kdfParams.parallelism,
        salt,
        raw: true,
        hashLength: 32,
      });
      return Buffer.from(hash);
    } catch {
      const { pbkdf2Sync } = await import('node:crypto');
      const salt = await this.getOrCreateSalt();
      return pbkdf2Sync(password, salt, 100_000, 32, 'sha256');
    }
  }

  private async getOrCreateSalt(): Promise<Buffer> {
    const saltPath = this.config.vaultPath + '.salt';
    try {
      return await readFile(saltPath);
    } catch {
      const salt = randomBytes(32);
      await writeFile(saltPath, salt);
      return salt;
    }
  }

  private encrypt(data: VaultData): Buffer {
    if (!this.derivedKey) throw new Error('Vault is locked');

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.derivedKey, iv);
    const plaintext = Buffer.from(JSON.stringify(data), 'utf-8');

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]);
  }

  private decrypt(raw: Buffer): VaultData {
    if (!this.derivedKey) throw new Error('Vault is locked');

    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', this.derivedKey, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf-8')) as VaultData;
  }

  private async vaultExists(): Promise<boolean> {
    try {
      await access(this.config.vaultPath);
      return true;
    } catch {
      return false;
    }
  }

  private ensureUnlocked(): void {
    if (!this.derivedKey) {
      throw new Error('Vault is locked. Call unlock() first.');
    }
  }
}
