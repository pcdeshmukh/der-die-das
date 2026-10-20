import type { ComponentChildren } from 'preact';
import { t } from '../lib/i18n';
import { speak } from '../lib/speech';
import { Stars } from './Stars';

/** One line in the "practise these" list. */
export interface ReviewRow {
  key: string;
  label: ComponentChildren;
  sub?: string;
  emoji?: string;
  say?: string;
}

interface Props {
  correct: number;
  total: number;
  stars: number;
  xp: number;
  mistakes: ReviewRow[];
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
            {mistakes.map((m) => (
              <li key={m.key}>
                <button class="word-row" onClick={() => m.say && speak(m.say, true)}>
                  <span class="word-emoji">{m.emoji ?? ''}</span>
                  <span class="word-main">{m.label}</span>
                  {m.sub && <span class="word-en">{m.sub}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
