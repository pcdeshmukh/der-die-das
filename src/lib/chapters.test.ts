import { describe, expect, it } from 'vitest';
import { LEVELS } from '../data';
import { GRAMMAR_PREFIX, PHRASE_PREFIX, describeTopic } from './modes';

describe.each(LEVELS.filter((l) => l.chapters.length))('$id chapters', (level) => {
  it('has 24 chapters numbered in order', () => {
    expect(level.chapters.map((c) => c.n)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
  });

  it.each(level.chapters.map((c) => [c.n, c] as const))('chapter %i links only to existing content', (_, chapter) => {
    for (const id of chapter.links) expect(describeTopic(level, id), id).not.toBeNull();
  });

  it('puts every topic, grammar lesson and phrase set in some chapter', () => {
    const linked = new Set(level.chapters.flatMap((c) => c.links));
    const all = [
      ...level.topics.map((t) => t.id),
      ...level.grammar.map((l) => GRAMMAR_PREFIX + l.id),
      ...level.phrases.map((l) => PHRASE_PREFIX + l.id),
    ];
    expect(all.filter((id) => !linked.has(id))).toEqual([]);
  });
});
