import { useState } from 'preact/hooks';
import { NounLabel } from '../components/NounLabel';
import { NounPrompt, SpeakButton } from '../components/NounPrompt';
import { allWords } from '../data';
import { ARTICLES, type Level, type WordRef } from '../data/types';
import { meaning, t } from '../lib/i18n';
import { pickWords } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 15;

const withArticle = (w: WordRef) => `${w.article} ${w.de}`;

/**
 * `synonyms`: other nouns with the same meaning, which count too when the player types
 * the noun from its meaning (car → das Auto or der Wagen).
 */
export function articleQuestion(w: WordRef, synonyms: WordRef[] = []): ChoiceQuestion {
  return {
    key: `article:${w.id}`,
    statId: w.id,
    skill: 'article',
    layout: 'articles',
    optionClass: (o) => `art-btn art-btn-${o}`,
    prompt: (answered) => <NounPrompt word={w} hideArticle={!answered} />,
    options: ARTICLES,
    answer: w.article,
    sayAfter: `${w.article} ${w.de}`,
    solution: <NounLabel noun={w} />,
    review: {
      label: <NounLabel noun={w} />,
      sub: meaning(w),
      emoji: w.emoji,
      say: `${w.article} ${w.de}`,
    },
    typed: {
      accepted: [withArticle(w), ...synonyms.map(withArticle)],
      placeholder: t('typeNoun'),
      prompt: (answered) => (
        <>
          {w.emoji && (
            <div class="noun-emoji" aria-hidden="true">
              {w.emoji}
            </div>
          )}
          <div class="noun-word">{answered ? <NounLabel noun={w} /> : meaning(w)}</div>
          {answered ? <div class="noun-hint">{meaning(w)}</div> : <div class="noun-hint">{t('typeNounHint')}</div>}
          {answered && <SpeakButton text={withArticle(w)} />}
        </>
      ),
    },
  };
}

/** Nouns elsewhere in the level that mean the same in the player's translation language. */
function synonymsOf(level: Level, w: WordRef) {
  return allWords(level).filter((x) => x.id !== w.id && meaning(x) === meaning(w));
}

export function ArticleGame({ level, pool, starKey, onRetry, onExit, typing }: GameProps<WordRef>) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, 'article', Math.min(ROUND_SIZE, pool.length)).map((w) =>
      articleQuestion(w, typing ? synonymsOf(level, w) : []),
    ),
  );
  return <ChoiceGame questions={questions} starKey={starKey} typing={typing} onRetry={onRetry} onExit={onExit} />;
}
