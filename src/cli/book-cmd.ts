import { Command } from 'commander';
import { createInterface } from 'node:readline';
import { IdentityVault, formatBookingDetails } from '@open-travel-agent/agent-core';
import type { ScoredOffer } from '@open-travel-agent/agent-core';

let lastSearchResults: ScoredOffer[] = [];

export function setLastSearchResults(results: ScoredOffer[]): void {
  lastSearchResults = results;
}

export function getLastSearchResults(): ScoredOffer[] {
  return lastSearchResults;
}

export function createBookCommand(): Command {
  return new Command('book')
    .description('Show ready-to-book details for a search result')
    .requiredOption('--offer <number>', 'Offer number from search results (1-based)')
    .option('--vault', 'Include passenger details from vault', false)
    .action(async (flags: { offer: string; vault: boolean }) => {
      const idx = parseInt(flags.offer, 10) - 1;

      if (lastSearchResults.length === 0) {
        console.error('No search results available. Run a search first in the same session, or use the interactive search flow.');
        process.exit(1);
      }

      if (idx < 0 || idx >= lastSearchResults.length) {
        console.error(`Invalid offer number. Choose 1-${lastSearchResults.length}.`);
        process.exit(1);
      }

      const scored = lastSearchResults[idx];
      let vaultData = null;

      if (flags.vault) {
        const vault = new IdentityVault();
        const password = await promptPassword('Vault master password: ');
        try {
          await vault.unlock(password);
          vaultData = vault.getData();
          vault.lock();
        } catch (err) {
          console.error('Failed to unlock vault:', err instanceof Error ? err.message : err);
        }
      }

      console.log(formatBookingDetails(scored, vaultData));
    });
}

function promptPassword(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    process.stdout.write(question);
    let input = '';
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (char: string) => {
      if (char === '\n' || char === '\r' || char === '') {
        process.stdin.setRawMode?.(false);
        process.stdin.removeListener('data', onData);
        rl.close();
        process.stdout.write('\n');
        resolve(input);
      } else if (char === '' || char === '\b') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        input += char;
        process.stdout.write('*');
      }
    };
    process.stdin.on('data', onData);
  });
}
