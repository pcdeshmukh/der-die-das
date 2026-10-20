import type { ComponentChildren } from 'preact';
import type { WordRef } from '../data/types';
import { t } from '../lib/i18n';
import { speak } from '../lib/speech';
import { NounLabel } from './NounLabel';
import { Stars } from './Stars';

interface Props {
  correct: number;
  total: number;
  stars: number;
  xp: number;
  mistakes: WordRef[];
  onRetry: () => void;
  onExit: () => void;
  children?: ComponentChildren;
}

export function Results({ correct, total, stars, xp, mistakes, onRetry, onExit, children }: Props) {
  return (
    <div class="results">
      <div class="results-emoji">{stars === 3 ? '🏆' : stars === 2 ? '🎉' : stars === 1 ? '👍' : '💪'}</div>
      <h1>{t('roundDone')}</h1>
      <Stars value={stars} />
      <p class="results-score">{t('score', { c: correct, n: total })}</p>
      {children}
      <p class="results-xp">+{xp} XP</p>
      <div class="results-actions">
        <button class="btn primary" onClick={onRetry}>
          {t('playAgain')}
        </button>
        <button class="btn" onClick={onExit}>
          {t('done')}
        </button>
      </div>
      {mistakes.length > 0 && (
        <section class="mistakes">
          <h2>{t('practiseThese')}</h2>
          <ul class="word-list">
            {mistakes.map((w) => (
              <li>
                <button class="word-row" onClick={() => speak(`${w.article} ${w.de}`, true)}>
                  <span class="word-emoji">{w.emoji ?? ''}</span>
                  <NounLabel noun={w} />
                  <span class="word-en">{w.en}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
