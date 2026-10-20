import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { GameBar } from '../components/GameBar';
import { Results, type ReviewRow } from '../components/Results';
import { t } from '../lib/i18n';
import { playCorrect, playFinish, playWrong } from '../lib/sfx';
import { speak } from '../lib/speech';
import { starsFor, type Skill } from '../lib/srs';
import { finishRound, recordAnswer } from '../lib/store';

export interface ChoiceQuestion {
  key: string;
  /** progress id when the question is tracked by spaced repetition */
  statId?: string;
  /** rendered in the card; `answered` lets it reveal the solution */
  prompt: (answered: boolean) => ComponentChildren;
  options: string[];
  answer: string;
  /** spoken when the question appears (listening questions) */
  sayFirst?: string;
  /** spoken once the player has answered */
  sayAfter?: string;
  /** the solution as a short phrase for the feedback line */
  solution: ComponentChildren;
  review: Omit<ReviewRow, 'key'>;
}

export type ChoiceLayout = 'articles' | 'grid' | 'list';

interface Props {
  questions: ChoiceQuestion[];
  skill: Skill | null;
  starKey: string | null;
  layout: ChoiceLayout;
  optionClass?: (option: string) => string;
  onRetry: () => void;
  onExit: () => void;
}

/** One question at a time, pick one option; correct answers advance on their own. */
export function ChoiceGame({ questions, skill, starKey, layout, optionClass, onRetry, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const answeredRight = chosen !== null && chosen === q.answer;

  function answer(option: string) {
    if (chosen !== null) return;
    const ok = option === q.answer;
    setChosen(option);
    setResults([...results, ok]);
    if (skill && q.statId) recordAnswer(skill, q.statId, ok);
    if (q.sayAfter) speak(q.sayAfter);
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
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setChosen(null);
      return;
    }
    const correct = results.filter(Boolean).length;
    finishRound(starKey, starsFor(correct, questions.length), xp);
    playFinish();
    setDone(true);
  }

  useEffect(() => {
    if (q.sayFirst && !done) speak(q.sayFirst, true);
  }, [index]);

  // Correct answers move on by themselves; wrong ones wait so the player can read the fix.
  useEffect(() => {
    if (!answeredRight) return;
    const timer = setTimeout(advance, 900);
    return () => clearTimeout(timer);
  }, [answeredRight, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) answer(q.options[n - 1]);
      else if ((e.key === 'Enter' || e.key === ' ') && chosen !== null && !answeredRight) {
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
        total={questions.length}
        stars={starsFor(correct, questions.length)}
        xp={xp}
        mistakes={questions.filter((_, i) => !results[i]).map((x) => ({ key: x.key, ...x.review }))}
        onRetry={onRetry}
        onExit={onExit}
      />
    );
  }

  const state = chosen === null ? '' : answeredRight ? 'is-correct' : 'is-wrong';
  // Long options (e.g. "fünf nach halb zwölf") don't fit two per row on a phone.
  const shownLayout = layout === 'grid' && q.options.some((o) => o.length > 16) ? 'list' : layout;
  return (
    <div class="game">
      <GameBar value={(index + (chosen !== null ? 1 : 0)) / questions.length} onQuit={onExit}>
        {combo >= 3 && <span class="combo">🔥 {t('combo', { n: combo })}</span>}
      </GameBar>

      <div class="stage">
        <div class={`noun-card ${state}`} key={q.key}>
          {q.prompt(chosen !== null)}
        </div>
        <div class="feedback" aria-live="polite">
          {answeredRight && <p class="feedback-ok">{t('correct')}</p>}
          {chosen !== null && !answeredRight && (
            <>
              <p class="feedback-bad">
                {t('itIs')} {q.solution}
              </p>
              <button class="btn primary" onClick={advance}>
                {t('continue')}
              </button>
            </>
          )}
        </div>
      </div>

      <div class={`choices choices-${shownLayout}`}>
        {q.options.map((o, i) => {
          const cls = chosen === null ? '' : o === q.answer ? 'reveal' : chosen === o ? 'picked-wrong' : 'dim';
          return (
            <button class={`choice ${optionClass?.(o) ?? ''} ${cls}`} disabled={chosen !== null} onClick={() => answer(o)}>
              {o}
              <kbd>{i + 1}</kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
}
