import { useRef, useState } from 'preact/hooks';
import { Countdown, ExamResults, RatingButtons, TeacherShare, TeilIntro, TeilLabel, Translation } from '../components/Exam';
import { GameBar } from '../components/GameBar';
import type { FormField, WritingTask } from '../data/types';
import {
  FORM_MAX,
  GERMAN_NAMES,
  POINT_MAX,
  countWords,
  hasClosing,
  hasGreeting,
  points,
  resultKey,
  writingReport,
  type Rating,
} from '../lib/exam';
import { meaning, t } from '../lib/i18n';
import { playFinish } from '../lib/sfx';
import { finishExamPart, finishRound } from '../lib/store';
import { SPECIAL_LETTERS, grade } from '../lib/typing';
import type { ExamGameProps } from './types';

type Screen = { kind: 'intro'; teil: number } | { kind: 'form' } | { kind: 'message' } | { kind: 'mark' };

/** Whether a gap of the form was filled in right; spelling slips (capitals, ae for ä) still count, as in the exam. */
function gapOk(field: FormField, value: string): boolean {
  const accepted = field.accepted ?? [];
  return field.options ? value === accepted[0] : grade(value, accepted) !== 'wrong';
}

/** Schreiben: Teil 1 fills in a form and is marked by the app; Teil 2 is a short message the learner marks. */
export function ExamWritingGame({ level, exam, run, onRetry, onExit }: ExamGameProps) {
  const t1 = exam.schreiben.teil1;
  const t2 = exam.schreiben.teil2;
  const gaps = t1.fields.filter((f) => f.value === undefined);
  const screens: Screen[] = [];
  if (run.teile.includes(1)) screens.push({ kind: 'intro', teil: 1 }, { kind: 'form' });
  if (run.teile.includes(2)) screens.push({ kind: 'intro', teil: 2 }, { kind: 'message' }, { kind: 'mark' });

  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<string[]>(() => gaps.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [text, setText] = useState('');
  const [ratings, setRatings] = useState<(Rating | null)[]>([null, null, null, null]);
  const [start] = useState(Date.now);
  const [result, setResult] = useState<{ raw: number; max: number; ms: number; xp: number } | null>(null);
  const field = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const practice = !run.exam;
  const screen = screens[index];

  const formOk = gaps.map((f, i) => gapOk(f, values[i]));
  const formPoints = formOk.filter(Boolean).length;
  const messageMax = POINT_MAX * 3 + FORM_MAX;
  const messagePoints = ratings.reduce<number>((sum, r, i) => sum + (r ?? 0) * (i < 3 ? POINT_MAX : FORM_MAX), 0);
  const playsForm = run.teile.includes(1);
  const playsMessage = run.teile.includes(2);

  /** Inserts ä ö ü ß into the field that last had focus. */
  function insert(letter: string) {
    const el = field.current;
    if (!el || el.readOnly) return;
    const startPos = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const value = el.value.slice(0, startPos) + letter + el.value.slice(end);
    if (el instanceof HTMLTextAreaElement) setText(value);
    else setValue(Number(el.dataset.gap), value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(startPos + 1, startPos + 1);
    });
  }

  function setValue(i: number, value: string) {
    setValues((vs) => vs.map((v, j) => (j === i ? value : v)));
  }

  function next() {
    // Practice shows what was right before moving on.
    if (screen.kind === 'form' && practice && !checked) return setChecked(true);
    scrollTo(0, 0);
    if (index + 1 < screens.length) return setIndex(index + 1);
    const raw = (playsForm ? formPoints : 0) + (playsMessage ? Math.round(messagePoints) : 0);
    const max = (playsForm ? gaps.length : 0) + (playsMessage ? messageMax : 0);
    const xp = raw * 10;
    if (run.exam) finishExamPart(resultKey(level, exam, 'schreiben'), raw, xp);
    else finishRound(null, 0, xp);
    playFinish();
    setResult({ raw, max, ms: Date.now() - start, xp });
  }

  const report = () =>
    writingReport(exam, {
      form: playsForm ? gaps.map((f, i) => ({ label: f.label, text: values[i], ok: formOk[i] })) : undefined,
      text: playsMessage ? text : undefined,
      selfMarked: playsMessage ? messagePoints : undefined,
    });

  if (result) {
    return (
      <ExamResults
        title={`${GERMAN_NAMES.schreiben} · ${run.exam ? t('modelTest', { n: exam.id }) : `Teil ${run.teile[0]}`}`}
        raw={result.raw}
        max={result.max}
        exam={run.exam}
        ms={run.exam ? result.ms : undefined}
        xp={result.xp}
        onRetry={onRetry}
        onExit={onExit}
      >
        <TeacherShare text={report} />
        <section class="exam-review">
          {playsForm && (
            <details class="exam-review-page" open={formPoints < gaps.length}>
              <summary>
                Teil 1 · {t('score', { c: formPoints, n: gaps.length })}
              </summary>
              <Form title={t1.title} fields={t1.fields} gaps={gaps} values={values} checked onInput={() => {}} onFocus={() => {}} />
            </details>
          )}
          {playsMessage && (
            <details class="exam-review-page" open>
              <summary>Teil 2 · {t('rawScore', { c: points(messagePoints), n: messageMax })}</summary>
              <p class="exam-mytext pre">{text.trim() || '—'}</p>
              <p class="exam-model-label">{t('modelAnswer')}</p>
              <p class="pre">{t2.model.de}</p>
              <Translation x={t2.model} />
            </details>
          )}
        </section>
      </ExamResults>
    );
  }

  const timer = run.exam && screen.kind !== 'mark' && <Countdown start={start} minutes={run.module.minutes} />;
  const words = countWords(text);
  return (
    <div class="game exam-game">
      <GameBar value={index / screens.length} onQuit={onExit}>
        {timer}
      </GameBar>
      {screen.kind === 'intro' && (
        <TeilIntro module={run.module} teil={screen.teil} exam={run.exam} first={index === 0} onStart={() => setIndex(index + 1)} />
      )}

      {screen.kind === 'form' && (
        <div class="exam-page">
          <TeilLabel module={run.module} teil={1} />
          <div class="exam-text">
            <p class="pre">{t1.text.de}</p>
          </div>
          {checked && <Translation x={t1.text} />}
          <Form
            title={t1.title}
            fields={t1.fields}
            gaps={gaps}
            values={values}
            checked={checked}
            onInput={setValue}
            onFocus={(el) => (field.current = el)}
          />
          <LetterKeys onInsert={insert} disabled={checked} />
        </div>
      )}

      {screen.kind === 'message' && (
        <div class="exam-page">
          <TeilLabel module={run.module} teil={2} />
          <Task task={exam.schreiben.teil2} translate={practice} />
          <textarea
            class="exam-textarea"
            rows={8}
            lang="de"
            spellcheck={false}
            autocapitalize="sentences"
            placeholder={t('writeHere')}
            value={text}
            onFocus={(e) => (field.current = e.currentTarget)}
            onInput={(e) => setText(e.currentTarget.value)}
          />
          <LetterKeys onInsert={insert} />
          <p class={words >= 20 ? 'muted small' : 'small text-bad'}>{t('wordCount', { n: words })}</p>
        </div>
      )}

      {screen.kind === 'mark' && (
        <div class="exam-page">
          <h2 class="exam-h2">{t('markYourself')}</h2>
          <p class="muted small">{t('markHelp')}</p>
          <Task task={exam.schreiben.teil2} translate={false} />
          <p class="exam-mytext pre">{text.trim() || '—'}</p>
          <p class="small">
            {hasGreeting(text) ? '✓' : '✗'} {t('greetingCheck')} · {hasClosing(text) ? '✓' : '✗'} {t('closingCheck')} ·{' '}
            {t('words', { n: words })}
          </p>
          <details class="exam-details" open>
            <summary>{t('modelAnswer')}</summary>
            <p class="pre">{t2.model.de}</p>
            <Translation x={t2.model} />
          </details>
          {t2.points.map((p, i) => (
            <RatingButtons
              max={POINT_MAX}
              value={ratings[i]}
              label={p.de}
              onChange={(r) => setRatings((rs) => rs.map((x, j) => (j === i ? r : x)))}
            />
          ))}
          <RatingButtons
            max={FORM_MAX}
            value={ratings[3]}
            label={t('formPoint')}
            onChange={(r) => setRatings((rs) => rs.map((x, j) => (j === 3 ? r : x)))}
          />
          <p class="exam-mark-total">{t('rawScore', { c: points(messagePoints), n: messageMax })}</p>
        </div>
      )}

      {screen.kind !== 'intro' && (
        <div class="exam-nav">
          <button class="btn primary" disabled={screen.kind === 'mark' && ratings.some((r) => r === null)} onClick={next}>
            {screen.kind === 'form' && practice && !checked ? t('check') : index + 1 === screens.length ? t('finish') : t('continue')}
          </button>
        </div>
      )}
    </div>
  );
}

function Task({ task, translate }: { task: WritingTask; translate: boolean }) {
  return (
    <div class="exam-task">
      <p>{task.task.de}</p>
      {translate && <Translation x={task.task} />}
      <ul>
        {task.points.map((p) => (
          <li>
            {p.de}
            {translate && <Translation x={p} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The form of Schreiben Teil 1, with its five gaps numbered; `checked` marks them and shows the solutions. */
function Form({
  title,
  fields,
  gaps,
  values,
  checked,
  onInput,
  onFocus,
}: {
  title: string;
  fields: FormField[];
  gaps: FormField[];
  values: string[];
  checked: boolean;
  onInput: (gap: number, value: string) => void;
  onFocus: (el: HTMLInputElement) => void;
}) {
  return (
    <div class="exam-form">
      <p class="exam-form-title">{title}</p>
      {fields.map((f) => {
        if (f.value !== undefined) {
          return (
            <div class="form-row">
              <span class="form-label">{f.label}</span>
              <span class="form-value">{f.value}</span>
            </div>
          );
        }
        const i = gaps.indexOf(f);
        const ok = gapOk(f, values[i]);
        // Right apart from capitals or ae/oe/ue/ss: it counts, but the exact spelling is shown.
        const close = ok && !f.options && grade(values[i], f.accepted ?? []) === 'close';
        return (
          <div class={checked ? `form-row gap ${ok ? 'ok' : 'bad'}` : 'form-row gap'}>
            <label class="form-label" for={`gap-${i}`}>
              <span class="exam-n">{i + 1}</span> {f.label}
              {checked && <span class="form-label-tr">{meaning(f)}</span>}
            </label>
            {f.options ? (
              <div class="segmented form-options" role="group">
                {f.options.map((o) => (
                  <button class={values[i] === o ? 'active' : ''} aria-pressed={values[i] === o} disabled={checked} onClick={() => onInput(i, o)}>
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <input
                id={`gap-${i}`}
                data-gap={i}
                class="form-input"
                value={values[i]}
                readOnly={checked}
                lang="de"
                autocomplete="off"
                autocapitalize="off"
                autocorrect="off"
                spellcheck={false}
                onFocus={(e) => onFocus(e.currentTarget)}
                onInput={(e) => onInput(i, e.currentTarget.value)}
              />
            )}
            {checked && (!ok || close) && <span class={ok ? 'form-fix close' : 'form-fix'}>{f.accepted?.[0]}</span>}
          </div>
        );
      })}
    </div>
  );
}

function LetterKeys({ onInsert, disabled }: { onInsert: (letter: string) => void; disabled?: boolean }) {
  return (
    <div class="letter-keys">
      {SPECIAL_LETTERS.map((l) => (
        // mousedown would move focus off the field and close the phone keyboard
        <button type="button" class="letter-key" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => onInsert(l)}>
          {l}
        </button>
      ))}
    </div>
  );
}
