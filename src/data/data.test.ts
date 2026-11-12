import { describe, expect, it } from 'vitest';
import { loadAllLevels, allSentences, allWords, verbForms } from '.';
import { splitSentence } from '../games/SentenceGame';
import { ARTICLES, type ExamQuestion } from './types';

const LEVELS = await loadAllLevels();

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

  it('has well-formed Präteritum and Perfekt where given', () => {
    for (const v of level.verbs?.verbs ?? []) {
      if (v.preterite) expect(v.preterite, v.infinitive).toHaveLength(6);
      if (v.perfect) expect(v.perfect, v.infinitive).toMatch(/^(hat|ist) \S+$/);
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

describe('all levels', () => {
  it('teach each noun only once', () => {
    const seen = new Map<string, string>();
    const repeats: string[] = [];
    for (const level of LEVELS)
      for (const w of allWords(level)) {
        if (seen.has(w.de)) repeats.push(`${w.de} (${seen.get(w.de)} and ${w.id})`);
        seen.set(w.de, w.id);
      }
    expect(repeats).toEqual([]);
  });
});

describe.each(LEVELS.filter((l) => l.exams.length))('$id model tests', (level) => {
  it('number the tests 1, 2, 3, …', () => {
    expect(level.exams.map((e) => e.id)).toEqual(level.exams.map((_, i) => String(i + 1)));
  });

  describe.each(level.exams.map((e) => [e.id, e] as const))('Modelltest %s', (_, exam) => {
    const abc = (qs: ExamQuestion[], label: string) => {
      for (const q of qs) {
        expect(q.options, `${label}: ${q.de}`).toHaveLength(3);
        expect(new Set(q.options).size, `${label}: ${q.de}`).toBe(3);
        expect([0, 1, 2], `${label}: ${q.de}`).toContain(q.a);
      }
      // The right answer shouldn't always sit in the same place.
      expect(new Set(qs.map((q) => q.a)).size, label).toBeGreaterThan(1);
    };
    const richtigFalsch = (qs: ExamQuestion[], label: string) => {
      for (const q of qs) {
        expect(typeof q.a, `${label}: ${q.de}`).toBe('boolean');
        expect(q.options, `${label}: ${q.de}`).toBeUndefined();
      }
      expect(new Set(qs.map((q) => q.a)).size, `${label} needs both richtig and falsch`).toBe(2);
    };

    it('has the parts of Start Deutsch 1', () => {
      expect(exam.hoeren.teil1).toHaveLength(6);
      expect(exam.hoeren.teil2).toHaveLength(4);
      expect(exam.hoeren.teil3).toHaveLength(5);
      expect(exam.lesen.teil1).toHaveLength(2);
      expect(exam.lesen.teil1.flatMap((x) => x.items)).toHaveLength(5);
      expect(exam.lesen.teil2).toHaveLength(5);
      expect(exam.lesen.teil3).toHaveLength(5);
      expect(exam.schreiben.teil1.fields.filter((f) => f.value === undefined)).toHaveLength(5);
      expect(exam.schreiben.teil2.points).toHaveLength(3);
      expect(exam.sprechen.teil2).toHaveLength(2);
      for (const topic of exam.sprechen.teil2) expect(topic.cards.length, topic.topic.de).toBeGreaterThanOrEqual(2);
      expect(exam.sprechen.teil3.length).toBeGreaterThanOrEqual(4);
    });

    it('has well-formed Hören and Lesen questions', () => {
      abc(exam.hoeren.teil1, 'Hören 1');
      richtigFalsch(exam.hoeren.teil2, 'Hören 2');
      abc(exam.hoeren.teil3, 'Hören 3');
      richtigFalsch(exam.lesen.teil1.flatMap((x) => x.items), 'Lesen 1');
      for (const x of exam.lesen.teil2) expect([0, 1], x.de).toContain(x.a);
      expect(new Set(exam.lesen.teil2.map((x) => x.a)).size, 'Lesen 2').toBe(2);
      richtigFalsch(exam.lesen.teil3, 'Lesen 3');
    });

    it('has recordings made of whole sentences', () => {
      const all = [exam.hoeren.teil1, exam.hoeren.teil2, exam.hoeren.teil3].flat();
      for (const item of all) {
        expect(item.audio.length, item.de).toBeGreaterThan(0);
        for (const line of item.audio) {
          expect(line.de, item.de).toMatch(/[.?!]$/);
          expect([undefined, 1, 2], line.de).toContain(line.who);
        }
      }
    });

    it('has a form whose gaps can be filled from the text', () => {
      const { text, fields } = exam.schreiben.teil1;
      for (const f of fields) {
        expect(f.label.trim() && f.en.trim() && f.es.trim(), f.label).toBeTruthy();
        if (f.value !== undefined) continue;
        expect(f.accepted?.length, f.label).toBeGreaterThan(0);
        if (f.options) expect(f.options, f.label).toContain(f.accepted![0]);
        // A written gap's answer is in the text (ticked boxes may need a small step of reasoning).
        else expect(f.accepted!.some((a) => text.de.includes(a)), `${f.label}: ${f.accepted}`).toBe(true);
      }
    });

    it('translates everything into English and Spanish', () => {
      // Every German text in a model test sits in an object with `de`, `en` and `es`.
      const walk = (x: unknown, path: string) => {
        if (Array.isArray(x)) return x.forEach((y, i) => walk(y, `${path}[${i}]`));
        if (!x || typeof x !== 'object') return;
        const o = x as Record<string, unknown>;
        if ('de' in o) {
          for (const lang of ['de', 'en', 'es']) expect(String(o[lang] ?? '').trim(), `${path}.${lang}`).toBeTruthy();
        }
        for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`);
      };
      walk(exam, `exam ${exam.id}`);
    });
  });
});
