import chalk from 'chalk';
import type { DateGridResult, DateGridCell } from '@open-travel-agent/shared-types';
import { parseDurationMinutes } from '../scoring/index.js';

export function formatDateGrid(result: DateGridResult, topN: number = 10): string {
  const lines: string[] = [];
  const { cells, bestOverall, searchedCombinations, totalOffersFound, searchDurationMs, cachedHits } = result;

  lines.push('');
  lines.push(chalk.bold.cyan(`  📅 Flexible Date Search Results`));
  lines.push(chalk.dim('  ─'.repeat(30)));
  lines.push('');

  lines.push(chalk.dim(`  ${result.request.origin} → ${result.request.destination}  |  Mode: ${result.request.mode}`));
  lines.push(chalk.dim(`  Searched ${searchedCombinations} date combinations in ${(searchDurationMs / 1000).toFixed(1)}s  |  ${totalOffersFound} total flights  |  ${cachedHits} cached`));
  lines.push('');

  if (cells.length === 0) {
    lines.push(chalk.yellow('  No flights found for any date combination.'));
    lines.push('');
    return lines.join('\n');
  }

  if (bestOverall) {
    lines.push(chalk.bold.green(`  ⭐ Best: $${bestOverall.bestPrice.toFixed(2)}  —  ${bestOverall.datePair.departureDate}${bestOverall.datePair.returnDate ? ` → ${bestOverall.datePair.returnDate}` : ''}`));
    const carrier = bestOverall.bestOffer.validatingCarrier || bestOverall.bestOffer.outbound.segments[0].carrier;
    const carrierName = bestOverall.bestOffer.outbound.segments[0].carrierName || carrier;
    const dur = formatDuration(bestOverall.bestOffer.outbound.duration);
    const stops = bestOverall.bestOffer.outbound.stops === 0
      ? chalk.green('nonstop')
      : chalk.yellow(`${bestOverall.bestOffer.outbound.stops} stop${bestOverall.bestOffer.outbound.stops > 1 ? 's' : ''}`);
    lines.push(chalk.dim(`        ${carrierName}  ${dur}  ${stops}  (${bestOverall.offerCount} options)`));
    lines.push('');
  }

  lines.push(chalk.bold('  All Date Options (by price)'));
  lines.push('');

  const top = cells.slice(0, topN);
  for (let i = 0; i < top.length; i++) {
    lines.push(formatGridCell(top[i], i + 1, bestOverall?.bestPrice));
  }

  if (cells.length > topN) {
    lines.push(chalk.dim(`  ... and ${cells.length - topN} more date combinations`));
  }

  lines.push('');
  return lines.join('\n');
}

function formatGridCell(cell: DateGridCell, rank: number, bestPrice?: number): string {
  const { datePair, bestPrice: price, bestOffer, offerCount } = cell;
  const carrier = bestOffer.validatingCarrier || bestOffer.outbound.segments[0].carrier;
  const carrierName = bestOffer.outbound.segments[0].carrierName || carrier;
  const dur = formatDuration(bestOffer.outbound.duration);
  const stops = bestOffer.outbound.stops === 0
    ? chalk.green('nonstop')
    : chalk.yellow(`${bestOffer.outbound.stops} stop${bestOffer.outbound.stops > 1 ? 's' : ''}`);

  const dateRange = datePair.returnDate
    ? `${datePair.departureDate} → ${datePair.returnDate}`
    : datePair.departureDate;

  const priceDiff = bestPrice && price > bestPrice
    ? chalk.dim(` (+$${(price - bestPrice).toFixed(0)})`)
    : '';

  const priceColor = rank <= 3 ? chalk.green.bold : chalk.white;

  return `  ${chalk.dim(`#${rank}`)}  ${priceColor(`$${price.toFixed(2)}`)}${priceDiff}  ${dateRange}  ${carrierName}  ${dur}  ${stops}  ${chalk.dim(`(${offerCount} flights)`)}`;
}

export function formatDatePriceMatrix(result: DateGridResult): string {
  const lines: string[] = [];
  const { cells, request } = result;

  if (cells.length === 0) return '  No data for matrix.\n';

  lines.push('');
  lines.push(chalk.bold.cyan('  📊 Date–Price Matrix'));
  lines.push(chalk.dim('  ─'.repeat(30)));
  lines.push('');

  if (request.mode === 'date-flex' && request.returnDate) {
    return lines.join('\n') + formatTwoDimensionalMatrix(cells, request.departureDate!, request.returnDate!);
  }

  for (const cell of cells) {
    const bar = priceBar(cell.bestPrice, cells);
    const dateLabel = cell.datePair.returnDate
      ? `${cell.datePair.departureDate} → ${cell.datePair.returnDate}`
      : cell.datePair.departureDate;
    lines.push(`  ${dateLabel}  ${chalk.green(`$${cell.bestPrice.toFixed(0)}`)}  ${bar}`);
  }

  lines.push('');
  return lines.join('\n');
}

function formatTwoDimensionalMatrix(
  cells: DateGridCell[],
  baseDep: string,
  baseRet: string,
): string {
  const depDates = [...new Set(cells.map((c) => c.datePair.departureDate))].sort();
  const retDates = [...new Set(cells.map((c) => c.datePair.returnDate!))].sort();

  const priceMap = new Map<string, number>();
  let minPrice = Infinity;
  let maxPrice = 0;
  for (const cell of cells) {
    const key = `${cell.datePair.departureDate}|${cell.datePair.returnDate}`;
    priceMap.set(key, cell.bestPrice);
    if (cell.bestPrice < minPrice) minPrice = cell.bestPrice;
    if (cell.bestPrice > maxPrice) maxPrice = cell.bestPrice;
  }

  const lines: string[] = [];
  const colWidth = 8;

  // Header
  const header = '  Dep \\ Ret  ' + retDates.map((d) => d.slice(5).padStart(colWidth)).join('');
  lines.push(chalk.dim(header));

  for (const dep of depDates) {
    let row = `  ${dep.slice(5)}       `;
    for (const ret of retDates) {
      const key = `${dep}|${ret}`;
      const price = priceMap.get(key);
      if (price !== undefined) {
        const formatted = `$${price.toFixed(0)}`;
        const colored = price === minPrice
          ? chalk.green.bold(formatted)
          : price <= minPrice * 1.1
            ? chalk.green(formatted)
            : price >= maxPrice * 0.9
              ? chalk.red(formatted)
              : chalk.white(formatted);
        row += colored.padStart(colWidth);
      } else {
        row += chalk.dim('   ---').padStart(colWidth);
      }
    }
    lines.push(row);
  }

  lines.push('');
  lines.push(chalk.dim(`  ${chalk.green('■')} cheapest   ${chalk.white('■')} mid-range   ${chalk.red('■')} most expensive`));
  lines.push('');
  return lines.join('\n');
}

function priceBar(price: number, allCells: DateGridCell[]): string {
  const prices = allCells.map((c) => c.bestPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (max === min) return chalk.green('████████████████');
  const ratio = (price - min) / (max - min);
  const filled = Math.round((1 - ratio) * 16);
  const bar = '█'.repeat(filled) + '░'.repeat(16 - filled);
  if (ratio < 0.33) return chalk.green(bar);
  if (ratio < 0.66) return chalk.yellow(bar);
  return chalk.red(bar);
}

export function formatFlexResultsJson(result: DateGridResult): string {
  return JSON.stringify(
    {
      mode: result.request.mode,
      origin: result.request.origin,
      destination: result.request.destination,
      searchedCombinations: result.searchedCombinations,
      totalOffersFound: result.totalOffersFound,
      searchDurationMs: result.searchDurationMs,
      cachedHits: result.cachedHits,
      bestOverall: result.bestOverall
        ? {
            price: result.bestOverall.bestPrice,
            dates: result.bestOverall.datePair,
            carrier: result.bestOverall.bestOffer.validatingCarrier,
            stops: result.bestOverall.bestOffer.outbound.stops,
            duration: result.bestOverall.bestOffer.outbound.duration,
          }
        : null,
      cells: result.cells.map((c) => ({
        dates: c.datePair,
        bestPrice: c.bestPrice,
        carrier: c.bestOffer.validatingCarrier,
        stops: c.bestOffer.outbound.stops,
        offerCount: c.offerCount,
      })),
    },
    null,
    2,
  );
}

function formatDuration(isoDuration: string): string {
  const totalMin = parseDurationMinutes(isoDuration);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return chalk.dim(`${h}h${m > 0 ? ` ${m}m` : ''}`);
}
