import { describe, expect, it } from 'vitest';
import type { WordRef } from '../data/types';
import { INTERVALS, pickWords, review, starsFor, statKey, weakWords, type WordStat } from './srs';

const word = (de: string): WordRef => ({ de, article: 'der', plural: null, en: de, id: de, topic: 't' });

describe('review', () => {
  it('moves up a box when correct and resets when wrong', () => {
    const a = review(undefined, true, 0);
    expect(a).toEqual({ box: 1, due: INTERVALS[1], seen: 1, correct: 1 });
    const b = review(a, false, 0);
    expect(b).toEqual({ box: 0, due: 0, seen: 2, correct: 1 });
  });

  it('caps at the top box', () => {
    let s: WordStat | undefined;
    for (let i = 0; i < 20; i++) s = review(s, true, 0);
    expect(s!.box).toBe(INTERVALS.length - 1);
  });
});

describe('pickWords', () => {
  it('prefers due words, then unseen, then not yet due', () => {
    const words = ['due', 'new', 'later'].map(word);
    const stats = {
      [statKey('article', 'due')]: { box: 1, due: 50, seen: 1, correct: 1 },
      [statKey('article', 'later')]: { box: 3, due: 500, seen: 3, correct: 3 },
    };
    expect(pickWords(words, stats, 'article', 1, 100).map((w) => w.id)).toEqual(['due']);
    expect(new Set(pickWords(words, stats, 'article', 2, 100).map((w) => w.id))).toEqual(new Set(['due', 'new']));
  });
});

describe('weakWords', () => {
  it('returns words whose last answer was wrong', () => {
    const words = ['a', 'b', 'c'].map(word);
    const stats = {
      [statKey('article', 'a')]: review(undefined, false, 0),
      [statKey('article', 'b')]: review(undefined, true, 0),
    };
    expect(weakWords(words, stats, 'article').map((w) => w.id)).toEqual(['a']);
  });
});

describe('starsFor', () => {
  it('maps accuracy to stars', () => {
    expect(starsFor(15, 15)).toBe(3);
    expect(starsFor(12, 15)).toBe(2);
    expect(starsFor(8, 15)).toBe(1);
    expect(starsFor(2, 15)).toBe(0);
  });
});
