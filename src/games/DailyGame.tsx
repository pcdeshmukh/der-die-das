import { useState } from 'preact/hooks';
import { NounLabel } from '../components/NounLabel';
import { SpeakButton } from '../components/NounPrompt';
import { allWords, grammarItems, verbForms } from '../data';
import type { Level, WordRef } from '../data/types';
import { meaning, t } from '../lib/i18n';
import { random, shuffle, withSeed } from '../lib/random';
import { dailyStreak, finishDaily, progress, today } from '../lib/store';
import { articleQuestion } from './ArticleGame';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import { conjugationQuestion } from './ConjugationGame';
import { grammarQuestion } from './GrammarGame';
import { numberQuestion } from './NumbersGame';
import { pluralQuestion } from './PluralGame';
import { formalTimeQuestion, informalTimeQuestion } from './TimeGame';

export const DAILY_BONUS_XP = 50;

/** German word → pick its meaning; distractors come from the same topic. */
function meaningQuestion(w: WordRef, words: WordRef[]): ChoiceQuestion {
  const others = shuffle(words.filter((x) => x.topic === w.topic && x.id !== w.id)).slice(0, 3);
  return {
    key: `meaning:${w.id}`,
    statId: w.id,
    skill: 'meaning',
    prompt: (answered) => (
      <>
        <div class="noun-emoji" aria-hidden="true">
          {answered ? (w.emoji ?? '❔') : '❔'}
        </div>
        <div class="noun-word">
          <NounLabel noun={w} />
        </div>
        <div class="noun-hint">{t('whatMeans')}</div>
        <SpeakButton text={`${w.article} ${w.de}`} />
      </>
    ),
    options: shuffle([w, ...others]).map(meaning),
    answer: meaning(w),
    sayAfter: `${w.article} ${w.de}`,
    solution: <b>{meaning(w)}</b>,
    review: { label: <NounLabel noun={w} />, sub: meaning(w), emoji: w.emoji, say: `${w.article} ${w.de}` },
  };
}

const pick = <T,>(items: T[], n: number) => shuffle(items).slice(0, n);

/** Twelve mixed questions, the same for everyone on a given day. */
export function dailyQuestions(level: Level, day: string): ChoiceQuestion[] {
  return withSeed(`daily:${level.id}:${day}`, () => {
    const words = allWords(level);
    const plurals = words.filter((w) => w.plural);
    const exercises = level.grammar.flatMap((l) => grammarItems(level, l));
    const numberOrTime =
      random() < 0.5
        ? numberQuestion(0, random() < 0.5 ? 'toWord' : 'toDigits')
        : random() < 0.6
          ? informalTimeQuestion(0)
          : formalTimeQuestion(0);
    return shuffle([
      ...pick(words, 3).map(articleQuestion),
      ...pick(words, 2).map((w) => meaningQuestion(w, words)),
      ...pick(plurals, 2).map(pluralQuestion),
      ...pick(verbForms(level), 2).map((f) => conjugationQuestion(level, f)),
      ...pick(exercises, 2).map(grammarQuestion),
      numberOrTime,
    ]);
  });
}

export function DailyGame({ level, onExit }: { level: Level; onExit: () => void }) {
  // Fixed at the start, so a round played across midnight still counts for the day it began.
  const [day] = useState(today);
  const [questions] = useState(() => dailyQuestions(level, day));
  return (
    <ChoiceGame
      questions={questions}
      starKey={null}
      onExit={onExit}
      onFinish={(correct, total) => finishDaily(day, { correct, total }, DAILY_BONUS_XP)}
      resultsExtra={() => (
        <p class="muted">
          ⚡ {t('dailyStreak', { n: dailyStreak(progress.value) })} · {t('dailyBonus', { n: DAILY_BONUS_XP })}
        </p>
      )}
    />
  );
}
