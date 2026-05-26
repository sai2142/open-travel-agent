import { Command } from 'commander';
import { createInterface } from 'node:readline';
import { IdentityVault } from '@open-travel-agent/agent-core';
import type { VaultData, TravelerIdentity, PassportInfo, FrequentFlyerEntry } from '@open-travel-agent/shared-types';

function prompt(question: string, hidden: boolean = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    if (hidden) {
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
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

export function createVaultCommand(): Command {
  const vault = new Command('vault')
    .description('Manage encrypted identity vault (passport, KTN, loyalty numbers)');

  vault
    .command('show')
    .description('Show vault contents (requires master password)')
    .action(async () => {
      const v = new IdentityVault();
      const password = await prompt('Master password: ', true);

      try {
        await v.unlock(password);
        const data = v.getData();
        if (!data) {
          console.log('\nVault is empty. Use "travel-agent vault set" to add your information.\n');
          return;
        }

        const p = data.identity.passport;
        console.log('\n  Passport');
        console.log(`    Name:     ${p.fullName}`);
        console.log(`    Number:   ***${p.number.slice(-4)}`);
        console.log(`    Country:  ${p.issuingCountry}`);
        console.log(`    Expiry:   ${p.expiryDate}`);
        console.log(`    DoB:      ${p.dateOfBirth}`);

        if (data.identity.knownTravelerNumber) {
          console.log(`\n  KTN:        ${data.identity.knownTravelerNumber}`);
        }
        if (data.identity.redressNumber) {
          console.log(`  Redress:    ${data.identity.redressNumber}`);
        }

        if (data.identity.frequentFlyer.length > 0) {
          console.log('\n  Frequent Flyer');
          for (const ff of data.identity.frequentFlyer) {
            console.log(`    ${ff.airline} (${ff.airlineCode}): ${ff.number}`);
          }
        }

        console.log('');
      } catch (err) {
        console.error('Failed to unlock vault:', err instanceof Error ? err.message : err);
        process.exit(1);
      } finally {
        v.lock();
      }
    });

  vault
    .command('set')
    .description('Set vault data interactively')
    .action(async () => {
      const v = new IdentityVault();
      const password = await prompt('Master password (new or existing): ', true);

      try {
        await v.unlock(password);

        console.log('\nEnter passport details:');
        const passport: PassportInfo = {
          fullName: await prompt('  Full name (as on passport): '),
          number: await prompt('  Passport number: '),
          issuingCountry: await prompt('  Issuing country (e.g., US): '),
          nationality: await prompt('  Nationality (e.g., US): '),
          dateOfBirth: await prompt('  Date of birth (YYYY-MM-DD): '),
          expiryDate: await prompt('  Expiry date (YYYY-MM-DD): '),
          gender: (await prompt('  Gender (M/F/X): ')).toUpperCase() as 'M' | 'F' | 'X',
        };

        const ktn = await prompt('Known Traveler Number (or Enter to skip): ');
        const redress = await prompt('Redress Number (or Enter to skip): ');

        const ffEntries: FrequentFlyerEntry[] = [];
        let addMore = true;
        while (addMore) {
          const airline = await prompt('Frequent flyer airline name (or Enter to skip): ');
          if (!airline) break;
          const code = await prompt('  Airline code (e.g., AA): ');
          const number = await prompt('  Membership number: ');
          ffEntries.push({ airline, airlineCode: code.toUpperCase(), number });
          const more = await prompt('Add another? (y/N): ');
          addMore = more.toLowerCase() === 'y';
        }

        const identity: TravelerIdentity = {
          passport,
          knownTravelerNumber: ktn || undefined,
          redressNumber: redress || undefined,
          frequentFlyer: ffEntries,
        };

        const data: VaultData = {
          identity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await v.setData(data);
        console.log('\nVault saved and encrypted.\n');
      } catch (err) {
        console.error('Vault error:', err instanceof Error ? err.message : err);
        process.exit(1);
      } finally {
        v.lock();
      }
    });

  return vault;
}
