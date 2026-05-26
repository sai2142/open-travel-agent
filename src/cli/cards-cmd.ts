import { Command } from 'commander';
import chalk from 'chalk';
import { SAMPLE_CARDS, loadProfile, saveProfile, getProfilePath } from '@open-travel-agent/agent-core';

export function createCardsCommand(): Command {
  const cards = new Command('cards')
    .description('Manage credit cards for rewards scoring');

  cards
    .command('list')
    .description('List all available cards and your saved selections')
    .action(async () => {
      const profile = await loadProfile();
      const saved = new Set(profile.cardIds);

      console.log('\nAvailable cards:\n');
      for (const card of SAMPLE_CARDS) {
        const selected = saved.has(card.id);
        const marker = selected ? chalk.green('  ✓ ') : '    ';
        const topCategory = card.categories
          .filter((c) => c.category !== 'general')
          .sort((a, b) => b.multiplier - a.multiplier)[0];
        const perks = card.perks.length;
        console.log(
          `${marker}${chalk.bold(card.id.padEnd(28))} ${card.name.padEnd(28)} ${topCategory ? `${topCategory.multiplier}x ${topCategory.category}` : ''}  ${chalk.dim(`$${card.annualFee}/yr  ${perks} perks`)}`,
        );
      }

      if (saved.size > 0) {
        console.log(chalk.dim(`\n  Your cards: ${[...saved].join(', ')}`));
        console.log(chalk.dim(`  Stored in: ${getProfilePath()}`));
      } else {
        console.log(chalk.yellow('\n  No cards saved. Use "travel-agent cards add <id>" to add yours.'));
      }
      console.log('');
    });

  cards
    .command('add <cardId>')
    .description('Add a card to your profile')
    .action(async (cardId: string) => {
      const card = SAMPLE_CARDS.find((c) => c.id === cardId);
      if (!card) {
        console.error(`Unknown card: ${cardId}`);
        console.error('Run "travel-agent cards list" to see available cards.');
        process.exit(1);
      }

      const profile = await loadProfile();
      if (profile.cardIds.includes(cardId)) {
        console.log(`${card.name} is already in your profile.`);
        return;
      }

      profile.cardIds.push(cardId);
      await saveProfile(profile);
      console.log(chalk.green(`Added ${card.name} to your profile.`));
      console.log(chalk.dim('Your cards will be used automatically for rewards scoring.'));
    });

  cards
    .command('remove <cardId>')
    .description('Remove a card from your profile')
    .action(async (cardId: string) => {
      const profile = await loadProfile();
      const idx = profile.cardIds.indexOf(cardId);
      if (idx === -1) {
        console.log(`${cardId} is not in your profile.`);
        return;
      }

      profile.cardIds.splice(idx, 1);
      await saveProfile(profile);

      const card = SAMPLE_CARDS.find((c) => c.id === cardId);
      console.log(chalk.green(`Removed ${card?.name || cardId} from your profile.`));
    });

  return cards;
}
