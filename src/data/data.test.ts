import { describe, expect, it } from 'vitest';
import { LEVELS, allSentences, allWords, verbForms } from '.';
import { splitSentence } from '../games/SentenceGame';
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

  it('has sentences that split into words cleanly', () => {
    for (const s of allSentences(level)) {
      const { words, end } = splitSentence(s.de);
      expect(end, s.de).toMatch(/^[.?!]$/);
      expect(words.every((w) => w.length > 0 && !/[.?!]/.test(w)), s.de).toBe(true);
      expect(words.length, s.de).toBeGreaterThanOrEqual(2);
    }
  });

  it('has six present-tense forms for every verb', () => {
    expect(level.verbs?.pronouns).toHaveLength(6);
    for (const v of level.verbs?.verbs ?? []) expect(v.present, v.infinitive).toHaveLength(6);
    expect(verbForms(level).length).toBe((level.verbs?.verbs.length ?? 0) * 6);
  });

  it('conjugates regular verbs by the rule', () => {
    const regular = ['wohnen', 'kommen', 'machen', 'spielen', 'lernen', 'kaufen', 'trinken', 'gehen', 'kochen', 'hören', 'brauchen', 'fragen'];
    for (const v of level.verbs?.verbs.filter((x) => regular.includes(x.infinitive)) ?? []) {
      const stem = v.infinitive.slice(0, -2);
      expect(v.present, v.infinitive).toEqual([stem + 'e', stem + 'st', stem + 't', v.infinitive, stem + 't', v.infinitive]);
    }
  });
});
