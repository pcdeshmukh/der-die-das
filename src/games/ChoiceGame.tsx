import type { ComponentChildren } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { GameBar } from '../components/GameBar';
import { Results, type ReviewRow } from '../components/Results';
import { formatDuration } from '../lib/duration';
import { t } from '../lib/i18n';
import { playCorrect, playFinish, playWrong } from '../lib/sfx';
import { speak } from '../lib/speech';
import { starsFor, type Skill } from '../lib/srs';
import { finishRound, recordAnswer } from '../lib/store';
import { SPECIAL_LETTERS, grade, type Grade } from '../lib/typing';
import { ChallengeLink } from './challengeContext';

export type ChoiceLayout = 'articles' | 'grid' | 'list';

export interface ChoiceQuestion {
  key: string;
  /** progress id and skill when the question is tracked by spaced repetition */
  statId?: string;
  skill?: Skill;
  /** per question, so one round can mix kinds (the daily challenge does) */
  layout?: ChoiceLayout;
  optionClass?: (option: string) => string;
  /** rendered in the card; `answered` lets it reveal the solution */
  prompt: (answered: boolean) => ComponentChildren;
  options: string[];
  answer: string;
  /** spoken when the question appears (listening questions) */
  sayFirst?: string;
  /** spoken once the player has answered */
  sayAfter?: string;
  /** the solution as a short phrase for the feedback line; omit it when the card already shows the answer */
  solution?: ComponentChildren;
  review: Omit<ReviewRow, 'key'>;
  /** how to ask this question when the player types answers instead of tapping them */
  typed?: TypedAnswer;
}

export interface TypedAnswer {
  /** every answer that counts; the first is the one shown as the fix */
  accepted: string[];
  /** replaces the question's prompt, e.g. to show a meaning instead of the word */
  prompt?: (answered: boolean) => ComponentChildren;
  placeholder?: string;
  /** shown under the input, e.g. the choices a grammar gap allows */
  hint?: ComponentChildren;
  /** replaces the question's solution */
  solution?: ComponentChildren;
}

interface Props {
  questions: ChoiceQuestion[];
  starKey: string | null;
  /** default for questions that don't set their own */
  layout?: ChoiceLayout;
  /** omit to hide "Play again" (one-shot rounds like the daily challenge) */
  onRetry?: () => void;
  onExit: () => void;
  /** called once when the round ends, after the usual progress is saved; `ms` is the time taken */
  onFinish?: (correct: number, total: number, ms: number) => void;
  /** show a running clock in the game bar (challenges) */
  timed?: boolean;
  /** extra lines on the results screen, rendered after onFinish */
  resultsExtra?: () => ComponentChildren;
  /** type answers instead of picking them, for questions that support it */
  typing?: boolean;
}

interface Picked {
  text: string;
  ok: boolean;
  /** how a typed answer matched; 'close' means right apart from capitals or umlauts */
  grade?: Grade;
}

/** One question at a time, pick one option; correct answers advance on their own. */
export function ChoiceGame({
  questions,
  starKey,
  layout = 'grid',
  onRetry,
  onExit,
  onFinish,
  resultsExtra,
  timed,
  typing,
}: Props) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);
  const [startedAt] = useState(Date.now);
  const [now, setNow] = useState(startedAt);
  const challengeLink = useContext(ChallengeLink);

  const q = questions[index];
  const typed = typing ? q.typed : undefined;
  const answered = picked !== null;
  const answeredRight = picked?.ok ?? false;

  function answer(option: string) {
    if (picked) return;
    const ok = option === q.answer;
    record({ text: option, ok });
  }

  function answerTyped(text: string) {
    if (picked || !typed || !text.trim()) return;
    const g = grade(text, typed.accepted);
    record({ text, ok: g !== 'wrong', grade: g });
  }

  function record(p: Picked) {
    const { ok } = p;
    setPicked(p);
    setResults([...results, ok]);
    if (q.skill && q.statId) recordAnswer(q.skill, q.statId, ok);
    if (q.sayAfter) speak(q.sayAfter);
    if (ok) {
      const c = combo + 1;
      setCombo(c);
      // Typing is harder than tapping, so it earns more.
      setXp(xp + (p.grade ? 15 : 10) + Math.min(c - 1, 5) * 2);
      playCorrect();
    } else {
      setCombo(0);
      playWrong();
    }
  }

  function advance() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    const correct = results.filter(Boolean).length;
    finishRound(starKey, starsFor(correct, questions.length), xp);
    onFinish?.(correct, questions.length, Date.now() - startedAt);
    playFinish();
    setDone(true);
  }

  useEffect(() => {
    if (q.sayFirst && !done) speak(q.sayFirst, true);
  }, [index]);

  useEffect(() => {
    if (!timed || done) return;
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, [timed, done]);

  // Correct answers move on by themselves; wrong ones (and typos) wait so the player can read the fix.
  const waits = answered && (!answeredRight || picked.grade === 'close');
  useEffect(() => {
    if (!answeredRight || waits) return;
    const timer = setTimeout(advance, 900);
    return () => clearTimeout(timer);
  }, [answeredRight, waits, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      const n = Number(e.key);
      if (!typed && n >= 1 && n <= q.options.length) answer(q.options[n - 1]);
      else if ((e.key === 'Enter' || (!typed && e.key === ' ')) && waits) {
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
      >
        {resultsExtra?.()}
        {challengeLink && (
          <a class="btn challenge-btn" href={challengeLink}>
            ⚔️ {t('challengeFriend')}
          </a>
        )}
      </Results>
    );
  }

  const state = !answered ? '' : answeredRight ? 'is-correct' : 'is-wrong';
  const solution = typed?.solution ?? q.solution;
  // Long options (e.g. "fünf nach halb zwölf") don't fit two per row on a phone.
  const base = q.layout ?? layout;
  const shownLayout = base === 'grid' && q.options.some((o) => o.length > 16) ? 'list' : base;
  return (
    <div class={typed ? 'game typing' : 'game'}>
      <GameBar value={(index + (answered ? 1 : 0)) / questions.length} onQuit={onExit}>
        {timed ? (
          <span class="timer">⏱ {formatDuration(now - startedAt)}</span>
        ) : (
          combo >= 3 && <span class="combo">🔥 {t('combo', { n: combo })}</span>
        )}
      </GameBar>

      <div class="stage">
        <div class={`noun-card ${state}`} key={q.key}>
          {(typed?.prompt ?? q.prompt)(answered)}
        </div>
        {/* Right under the card, so the phone keyboard doesn't cover it. */}
        {typed && <TypeAnswer key={index} typed={typed} answered={answered} onSubmit={answerTyped} />}
        <div class="feedback" aria-live="polite">
          {answeredRight && <p class="feedback-ok">{t('correct')}</p>}
          {picked?.grade === 'close' && (
            <p class="feedback-spelling">
              {t('spelling')} <b>{typed!.accepted[0]}</b>
            </p>
          )}
          {answered && !answeredRight && (
            <>
              {picked.grade && <p class="typed-wrong">{picked.text}</p>}
              {/* A typed answer has no buttons to show the right one, so always spell it out. */}
              {(solution || typed) && (
                <p class="feedback-bad">
                  {t('itIs')} {solution ?? <b>{typed!.accepted[0]}</b>}
                </p>
              )}
            </>
          )}
          {waits && (
            <button class="btn primary" onClick={advance}>
              {t('continue')}
            </button>
          )}
        </div>
      </div>

      {!typed && (
        <div class={`choices choices-${shownLayout}`}>
          {q.options.map((o, i) => {
            const cls = !answered ? '' : o === q.answer ? 'reveal' : picked.text === o ? 'picked-wrong' : 'dim';
            return (
              <button class={`choice ${q.optionClass?.(o) ?? ''} ${cls}`} disabled={answered} onClick={() => answer(o)}>
                {o}
                <kbd>{i + 1}</kbd>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** A text field with ä ö ü ß keys, since many phone keyboards lack them. */
function TypeAnswer({
  typed,
  answered,
  onSubmit,
}: {
  typed: TypedAnswer;
  answered: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  function insert(letter: string) {
    const el = input.current;
    if (!el || answered) return;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    setText(text.slice(0, start) + letter + text.slice(end));
    requestAnimationFrame(() => el.setSelectionRange(start + 1, start + 1));
  }

  return (
    <form
      class="type-answer"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(text);
      }}
    >
      {typed.hint && <p class="type-hint muted small">{typed.hint}</p>}
      <div class="type-row">
        <input
          ref={input}
          class="type-input"
          value={text}
          readOnly={answered}
          placeholder={typed.placeholder ?? t('typeHere')}
          lang="de"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck={false}
          enterkeyhint="done"
          onInput={(e) => setText(e.currentTarget.value)}
        />
        <button class="btn primary" type="submit" disabled={answered || !text.trim()}>
          {t('check')}
        </button>
      </div>
      <div class="letter-keys">
        {SPECIAL_LETTERS.map((l) => (
          // mousedown would move focus off the input and close the phone keyboard
          <button
            type="button"
            class="letter-key"
            disabled={answered}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert(l)}
          >
            {l}
          </button>
        ))}
      </div>
    </form>
  );
}
