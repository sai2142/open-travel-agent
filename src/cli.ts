#!/usr/bin/env node

import { Command } from 'commander';
import { createSearchCommand } from './cli/search.js';
import { createCardsCommand } from './cli/cards-cmd.js';
import { createVaultCommand } from './cli/vault-cmd.js';
import { createBookCommand } from './cli/book-cmd.js';

const program = new Command();

program
  .name('travel-agent')
  .version('0.1.0')
  .description(
    'AI-powered CLI agent for searching flights, optimizing for credit card rewards, and generating ready-to-book itineraries.',
  );

program.addCommand(createSearchCommand());
program.addCommand(createCardsCommand());
program.addCommand(createVaultCommand());
program.addCommand(createBookCommand());

program
  .command('init')
  .description('Setup wizard for API keys, cards, and preferences')
  .action(() => {
    console.log('Init wizard coming soon. For now, copy .env.example to .env and fill in your Duffel token.');
  });

program
  .command('profile')
  .description('Manage travel preferences')
  .action(() => {
    console.log('Profile management coming soon.');
  });

program.parse();
