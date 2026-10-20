import { describe, expect, it } from 'vitest';
import { LEVELS, allWords } from '.';
import { ARTICLES } from './types';

describe.each(LEVELS.filter((l) => l.topics.length))('$id content', (level) => {
  const words = allWords(level);

  it('has valid articles and fields', () => {
    for (const w of words) {
      expect(ARTICLES, w.de).toContain(w.article);
      expect(w.de.trim(), w.id).toBe(w.de);
      expect(w.de[0], `${w.de} should be capitalised`).toBe(w.de[0].toUpperCase());
      expect(w.en.length, w.id).toBeGreaterThan(0);
    }
  });

  it('has unique topic ids and no duplicate nouns', () => {
    const topicIds = level.topics.map((t) => t.id);
    expect(new Set(topicIds).size).toBe(topicIds.length);
    const nouns = words.map((w) => w.de);
    expect(nouns.filter((n, i) => nouns.indexOf(n) !== i)).toEqual([]);
  });

  it('has unique English meanings within each topic (Word Match needs this)', () => {
    for (const topic of level.topics) {
      const en = topic.nouns.map((n) => n.en);
      expect(en.filter((e, i) => en.indexOf(e) !== i), topic.id).toEqual([]);
    }
  });
});
