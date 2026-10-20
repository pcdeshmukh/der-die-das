import { useEffect, useState } from 'preact/hooks';
import { GameBar } from '../components/GameBar';
import { NounLabel } from '../components/NounLabel';
import { Results } from '../components/Results';
import { ARTICLES, type Article } from '../data/types';
import { t } from '../lib/i18n';
import { playCorrect, playFinish, playWrong } from '../lib/sfx';
import { speak } from '../lib/speech';
import { pickWords, starsFor } from '../lib/srs';
import { finishRound, progress, recordAnswer } from '../lib/store';
import type { GameProps } from './types';

const ROUND_SIZE = 15;
const KEYS: Record<string, Article> = { '1': 'der', '2': 'die', '3': 'das' };

export function ArticleGame({ pool, starKey, onRetry, onExit }: GameProps) {
  const [words] = useState(() => pickWords(pool, progress.peek().words, 'article', Math.min(ROUND_SIZE, pool.length)));
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<Article | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);

  const word = words[index];
  const answeredRight = chosen !== null && chosen === word.article;

  function answer(a: Article) {
    if (chosen) return;
    const ok = a === word.article;
    setChosen(a);
    setResults([...results, ok]);
    recordAnswer('article', word.id, ok);
    speak(`${word.article} ${word.de}`);
    if (ok) {
      const c = combo + 1;
      setCombo(c);
      setXp(xp + 10 + Math.min(c - 1, 5) * 2);
      playCorrect();
    } else {
      setCombo(0);
      playWrong();
    }
  }

  function advance() {
    if (index + 1 < words.length) {
      setIndex(index + 1);
      setChosen(null);
      return;
    }
    const correct = results.filter(Boolean).length;
    finishRound(starKey, starsFor(correct, words.length), xp);
    playFinish();
    setDone(true);
  }

  // Correct answers move on by themselves; wrong ones wait so the player can read the fix.
  useEffect(() => {
    if (!answeredRight) return;
    const timer = setTimeout(advance, 900);
    return () => clearTimeout(timer);
  }, [answeredRight, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (KEYS[e.key]) answer(KEYS[e.key]);
      else if ((e.key === 'Enter' || e.key === ' ') && chosen && !answeredRight) {
        e.preventDefault();
        advance();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  if (done) {
    const correct = results.filter(Boolean).length;
    return (
      <Results
        correct={correct}
        total={words.length}
        stars={starsFor(correct, words.length)}
        xp={xp}
        mistakes={words.filter((_, i) => !results[i])}
        onRetry={onRetry}
        onExit={onExit}
      />
    );
  }

  const state = chosen === null ? '' : answeredRight ? 'is-correct' : 'is-wrong';
  return (
    <div class="game">
      <GameBar value={(index + (chosen ? 1 : 0)) / words.length} onQuit={onExit}>
        {combo >= 3 && <span class="combo">🔥 {t('combo', { n: combo })}</span>}
      </GameBar>

      <div class="stage">
        <div class={`noun-card ${state}`} key={word.id}>
          <div class="noun-emoji" aria-hidden="true">
            {word.emoji ?? '❔'}
          </div>
          <div class="noun-word">
            <NounLabel noun={word} hideArticle={chosen === null} />
          </div>
          {progress.value.settings.showHint && <div class="noun-hint">{word.en}</div>}
          <button
            class="icon-btn speak-btn"
            aria-label="🔊"
            onClick={() => speak(chosen ? `${word.article} ${word.de}` : word.de, true)}
          >
            🔊
          </button>
        </div>

        <div class="feedback" aria-live="polite">
          {answeredRight && <p class="feedback-ok">{t('correct')}</p>}
          {chosen && !answeredRight && (
            <>
              <p class="feedback-bad">
                {t('itIs')} <NounLabel noun={word} />
              </p>
              <button class="btn primary" onClick={advance}>
                {t('continue')}
              </button>
            </>
          )}
        </div>
      </div>

      <div class="article-buttons">
        {ARTICLES.map((a, i) => {
          const cls = chosen === null ? '' : a === word.article ? 'reveal' : chosen === a ? 'picked-wrong' : 'dim';
          return (
            <button class={`art-btn art-btn-${a} ${cls}`} disabled={chosen !== null} onClick={() => answer(a)}>
              {a}
              <kbd>{i + 1}</kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
}
