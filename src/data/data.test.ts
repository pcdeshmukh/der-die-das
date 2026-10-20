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

  it.each(['en', 'es'] as const)('has unique %s meanings within each topic (Word Match needs this)', (lang) => {
    for (const topic of level.topics) {
      const meanings = topic.nouns.map((n) => n[lang]);
      expect(meanings.filter((e, i) => meanings.indexOf(e) !== i), topic.id).toEqual([]);
    }
  });

  it('translates everything into English and Spanish', () => {
    const texts = [
      ...level.topics.flatMap((t) => [t.title, ...t.nouns, ...t.sentences]),
      ...(level.verbs?.verbs ?? []),
      ...level.grammar.flatMap((l) => [l.title, l.rule, ...l.items]),
    ];
    for (const x of texts) {
      const label = JSON.stringify(x).slice(0, 80);
      expect(x.en?.trim(), label).toBeTruthy();
      expect(x.es?.trim(), label).toBeTruthy();
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
    expect(level.verbs?.prompts).toHaveLength(6);
    // A bare "sie" may stand for only one person, or a prompt would have two right answers.
    const bareSie = level.verbs!.prompts.filter((p) => p.includes('sie'));
    expect(bareSie.length).toBeLessThanOrEqual(1);
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

  it('has well-formed grammar exercises', () => {
    const ids = level.grammar.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lesson of level.grammar) {
      expect(lesson.rule.en && lesson.rule.de, lesson.id).toBeTruthy();
      for (const item of lesson.items) {
        const options = item.options ?? lesson.options;
        const label = `${lesson.id}: ${item.q}`;
        expect(options, label).toContain(item.a);
        expect(new Set(options).size, label).toBe(options.length);
        const gaps = item.q.split('___').length - 1;
        // Either a fill-in-the-gap sentence, or a prompt whose options are whole sentences.
        expect(gaps === 1 || (gaps === 0 && lesson.shuffle), label).toBe(true);
        // A gap at the start of the sentence needs capitalised options.
        if (item.q.startsWith('___')) expect(item.a[0], label).toBe(item.a[0].toUpperCase());
      }
    }
  });

  it.each(level.topics.map((t) => [t.id, t] as const))('topic %s has enough nouns and sentences', (_, topic) => {
    expect(topic.nouns.length).toBeGreaterThanOrEqual(15);
    expect(topic.sentences.length).toBeGreaterThanOrEqual(6);
  });

  it.each(level.grammar.map((l) => [l.id, l] as const))('grammar lesson %s has at least 8 exercises', (_, lesson) => {
    expect(lesson.items.length).toBeGreaterThanOrEqual(8);
  });

  it.each(level.phrases.map((l) => [l.id, l] as const))('phrase set %s is well-formed', (_, lesson) => {
    expect(lesson.title.en && lesson.title.de && lesson.title.es).toBeTruthy();
    expect(lesson.items.length).toBeGreaterThanOrEqual(6);
    for (const item of lesson.items) {
      const label = `${lesson.id}: ${item.a}`;
      expect(item.situation.en?.trim() && item.situation.es?.trim(), label).toBeTruthy();
      expect(item.en?.trim() && item.es?.trim(), label).toBeTruthy();
      expect(item.wrong.length, label).toBeGreaterThanOrEqual(2);
      expect(item.wrong.length, label).toBeLessThanOrEqual(3);
      expect(new Set([item.a, ...item.wrong]).size, label).toBe(item.wrong.length + 1);
    }
  });

  it('has unique grammar and phrase ids', () => {
    const ids = [...level.grammar.map((l) => l.id), ...level.phrases.map((l) => `p:${l.id}`)];
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });
});
