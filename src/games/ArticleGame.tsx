import { useState } from 'preact/hooks';
import { NounLabel } from '../components/NounLabel';
import { NounPrompt } from '../components/NounPrompt';
import { ARTICLES, type WordRef } from '../data/types';
import { meaning } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { pickWords } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 15;

export function articleQuestion(w: WordRef): ChoiceQuestion {
  return {
    key: `article:${w.id}`,
    statId: w.id,
    skill: 'article',
    layout: 'articles',
    optionClass: (o) => `art-btn art-btn-${o}`,
    prompt: (answered) => <NounPrompt word={w} hideArticle={!answered} />,
    options: shuffle(ARTICLES),
    answer: w.article,
    sayAfter: `${w.article} ${w.de}`,
    solution: <NounLabel noun={w} />,
    review: { label: <NounLabel noun={w} />, sub: meaning(w), emoji: w.emoji, say: `${w.article} ${w.de}` },
  };
}

export function ArticleGame({ pool, starKey, onRetry, onExit }: GameProps<WordRef>) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, 'article', Math.min(ROUND_SIZE, pool.length)).map(articleQuestion),
  );
  return <ChoiceGame questions={questions} starKey={starKey} onRetry={onRetry} onExit={onExit} />;
}
