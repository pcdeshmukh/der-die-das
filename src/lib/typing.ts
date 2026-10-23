/**
 * Grading typed answers. Extra spaces and final punctuation never matter. Capital letters and
 * umlauts written as ae/oe/ue/ss still count as right, but the player is shown the exact spelling.
 */
export type Grade = 'exact' | 'close' | 'wrong';

const tidy = (s: string) =>
  s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?,]+$/, '')
    .replace(/[’`´]/g, "'");

const loose = (s: string) =>
  tidy(s)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');

/** `accepted` holds every answer that counts; the first is the one shown as the solution. */
export function grade(input: string, accepted: string[]): Grade {
  const typed = tidy(input);
  if (accepted.some((a) => tidy(a) === typed)) return 'exact';
  if (accepted.some((a) => loose(a) === loose(typed))) return 'close';
  return 'wrong';
}

/** Letters that are missing on many phone keyboards. */
export const SPECIAL_LETTERS = ['ä', 'ö', 'ü', 'ß'];
