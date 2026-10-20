import { describe, expect, it } from 'vitest';
import { LEVELS } from '../data';
import { GRAMMAR_PREFIX, PHRASE_PREFIX, describeTopic } from './modes';

const A1 = LEVELS[0];

describe('A1 chapters', () => {
  it('has 24 chapters numbered in order', () => {
    expect(A1.chapters.map((c) => c.n)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
  });

  it.each(A1.chapters.map((c) => [c.n, c] as const))('chapter %i links only to existing content', (_, chapter) => {
    for (const id of chapter.links) expect(describeTopic(A1, id), id).not.toBeNull();
  });

  it('puts every topic, grammar lesson and phrase set in some chapter', () => {
    const linked = new Set(A1.chapters.flatMap((c) => c.links));
    const all = [
      ...A1.topics.map((t) => t.id),
      ...A1.grammar.map((l) => GRAMMAR_PREFIX + l.id),
      ...A1.phrases.map((l) => PHRASE_PREFIX + l.id),
    ];
    expect(all.filter((id) => !linked.has(id))).toEqual([]);
  });
});
