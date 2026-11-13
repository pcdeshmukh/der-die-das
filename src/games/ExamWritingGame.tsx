import { useRef, useState } from 'preact/hooks';
import { CriterionButtons, Countdown, ExamResults, TeacherShare, TeilIntro, TeilLabel, Translation } from '../components/Exam';
import { GameBar } from '../components/GameBar';
import type { FormField, WritingTask } from '../data/types';
import {
  GERMAN_NAMES,
  countWords,
  groupPoints,
  hasClosing,
  hasGreeting,
  maxPoints,
  points,
  resultKey,
  writingReport,
  writingTeile,
  type WritingTeil,
} from '../lib/exam';
import { meaning, t } from '../lib/i18n';
import { playFinish } from '../lib/sfx';
import { finishExamPart, finishRound } from '../lib/store';
import { SPECIAL_LETTERS, grade } from '../lib/typing';
import type { ExamGameProps } from './types';

type FormTeil = Extract<WritingTeil, { kind: 'form' }>;
type MessageTeil = Extract<WritingTeil, { kind: 'message' }>;
type Screen =
  | { kind: 'intro'; teil: number }
  | { kind: 'form'; part: FormTeil }
  | { kind: 'message'; part: MessageTeil }
  | { kind: 'mark'; part: MessageTeil };

/** Whether a gap of the form was filled in right; spelling slips (capitals, ae for ä) still count, as in the exam. */
function gapOk(field: FormField, value: string): boolean {
  const accepted = field.accepted ?? [];
  return field.options ? value === accepted[0] : grade(value, accepted) !== 'wrong';
}

/**
 * Schreiben. A form (Start Deutsch 1 Teil 1) is marked by the app. Messages are written first and marked by the
 * learner afterwards, against a model answer and the exam's criteria, so marking doesn't eat into the time.
 */
export function ExamWritingGame({ level, exam, run, onRetry, onExit }: ExamGameProps) {
  const parts = writingTeile(exam).filter((p) => run.teile.includes(p.teil));
  const form = parts.find((p): p is FormTeil => p.kind === 'form');
  const messages = parts.filter((p): p is MessageTeil => p.kind === 'message');
  const screens: Screen[] = [
    ...parts.flatMap((part): Screen[] => [
      { kind: 'intro', teil: part.teil },
      part.kind === 'form' ? { kind: 'form', part } : { kind: 'message', part },
    ]),
    ...messages.map((part): Screen => ({ kind: 'mark', part })),
  ];
  const gaps = form ? form.fields.filter((f) => f.value === undefined) : [];

  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<string[]>(() => gaps.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [texts, setTexts] = useState<Record<number, string>>({});
  const [levels, setLevels] = useState<Record<number, (number | null)[]>>(() =>
    Object.fromEntries(messages.map((m) => [m.teil, m.criteria.map(() => null)])),
  );
  const [start] = useState(Date.now);
  const [result, setResult] = useState<{ raw: number; max: number; ms: number; xp: number } | null>(null);
  const field = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const practice = !run.exam;
  const screen = screens[index];

  const formOk = gaps.map((f, i) => gapOk(f, values[i]));
  const formPoints = formOk.filter(Boolean).length;
  const messagePoints = (m: MessageTeil) => groupPoints(m.criteria, levels[m.teil]);

  /** Inserts ä ö ü ß into the field that last had focus. */
  function insert(letter: string) {
    const el = field.current;
    if (!el || el.readOnly) return;
    const startPos = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const value = el.value.slice(0, startPos) + letter + el.value.slice(end);
    if (el instanceof HTMLTextAreaElement) setText(Number(el.dataset.teil), value);
    else setValue(Number(el.dataset.gap), value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(startPos + 1, startPos + 1);
    });
  }

  function setValue(i: number, value: string) {
    setValues((vs) => vs.map((v, j) => (j === i ? value : v)));
  }

  function setText(teil: number, value: string) {
    setTexts((ts) => ({ ...ts, [teil]: value }));
  }

  function next() {
    // Practice shows what was right before moving on.
    if (screen.kind === 'form' && practice && !checked) return setChecked(true);
    scrollTo(0, 0);
    if (index + 1 < screens.length) return setIndex(index + 1);
    // As in the exam, messages are marked to whole points; the form's gaps count one each.
    const raw = formPoints + Math.round(messages.reduce((sum, m) => sum + messagePoints(m), 0));
    const max = gaps.length + messages.reduce((sum, m) => sum + maxPoints(m.criteria), 0);
    const xp = raw * 10;
    if (run.exam) finishExamPart(resultKey(level, exam, 'schreiben'), raw, xp);
    else finishRound(null, 0, xp);
    playFinish();
    setResult({ raw, max, ms: Date.now() - start, xp });
  }

  const report = () =>
    writingReport(exam, {
      form: form ? gaps.map((f, i) => ({ label: f.label, text: values[i], ok: formOk[i] })) : undefined,
      messages: messages.map((m) => ({ teil: m.teil, text: texts[m.teil] ?? '', selfMarked: messagePoints(m), max: maxPoints(m.criteria) })),
    });

  if (result) {
    return (
      <ExamResults
        title={`${GERMAN_NAMES.schreiben} · ${run.exam ? t('modelTest', { n: exam.id }) : `Teil ${run.teile[0]}`}`}
        raw={result.raw}
        max={result.max}
        module={run.module}
        exam={run.exam}
        ms={run.exam ? result.ms : undefined}
        xp={result.xp}
        onRetry={onRetry}
        onExit={onExit}
      >
        <TeacherShare text={report} />
        <section class="exam-review">
          {form && (
            <details class="exam-review-page" open={formPoints < gaps.length}>
              <summary>
                Teil {form.teil} · {t('score', { c: formPoints, n: gaps.length })}
              </summary>
              <Form title={form.title} fields={form.fields} gaps={gaps} values={values} checked onInput={() => {}} onFocus={() => {}} />
            </details>
          )}
          {messages.map((m) => (
            <details class="exam-review-page" open>
              <summary>
                Teil {m.teil} · {t('rawScore', { c: points(messagePoints(m)), n: maxPoints(m.criteria) })}
              </summary>
              <p class="exam-mytext pre">{texts[m.teil]?.trim() || '—'}</p>
              <p class="exam-model-label">{t('modelAnswer')}</p>
              <p class="pre">{m.task.model.de}</p>
              <Translation x={m.task.model} />
            </details>
          ))}
        </section>
      </ExamResults>
    );
  }

  const timer = run.exam && screen.kind !== 'mark' && <Countdown start={start} minutes={run.module.minutes} />;
  const markDone = screen.kind !== 'mark' || levels[screen.part.teil].every((l) => l !== null);
  return (
    <div class="game exam-game">
      <GameBar value={index / screens.length} onQuit={onExit}>
        {timer}
      </GameBar>
      {screen.kind === 'intro' && (
        <TeilIntro
          format={exam.format}
          module={run.module}
          teil={screen.teil}
          exam={run.exam}
          first={index === 0}
          onStart={() => setIndex(index + 1)}
        />
      )}

      {screen.kind === 'form' && (
        <div class="exam-page">
          <TeilLabel module={run.module} teil={screen.part.teil} />
          <div class="exam-text">
            <p class="pre">{screen.part.text.de}</p>
          </div>
          {checked && <Translation x={screen.part.text} />}
          <Form
            title={screen.part.title}
            fields={screen.part.fields}
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
        <MessagePage
          key={screen.part.teil}
          part={screen.part}
          module={run.module}
          translate={practice}
          text={texts[screen.part.teil] ?? ''}
          onText={(v) => setText(screen.part.teil, v)}
          onFocus={(el) => (field.current = el)}
          onInsert={insert}
        />
      )}

      {screen.kind === 'mark' && (
        <MarkPage
          key={`mark-${screen.part.teil}`}
          part={screen.part}
          text={texts[screen.part.teil] ?? ''}
          levels={levels[screen.part.teil]}
          onLevel={(i, l) =>
            setLevels((ls) => ({ ...ls, [screen.part.teil]: ls[screen.part.teil].map((x, j) => (j === i ? l : x)) }))
          }
          total={messagePoints(screen.part)}
        />
      )}

      {screen.kind !== 'intro' && (
        <div class="exam-nav">
          <button class="btn primary" disabled={!markDone} onClick={next}>
            {screen.kind === 'form' && practice && !checked ? t('check') : index + 1 === screens.length ? t('finish') : t('continue')}
          </button>
        </div>
      )}
    </div>
  );
}

function MessagePage({
  part,
  module,
  translate,
  text,
  onText,
  onFocus,
  onInsert,
}: {
  part: MessageTeil;
  module: ExamGameProps['run']['module'];
  translate: boolean;
  text: string;
  onText: (text: string) => void;
  onFocus: (el: HTMLTextAreaElement) => void;
  onInsert: (letter: string) => void;
}) {
  const words = countWords(text);
  // Under half the asked-for words marks the task as not done (E), so warn well before that.
  const few = words < Number(part.words.match(/\d+/)?.[0] ?? 0) * 0.7;
  return (
    <div class="exam-page">
      <TeilLabel module={module} teil={part.teil} />
      <Task task={part.task} translate={translate} />
      <textarea
        class="exam-textarea"
        rows={8}
        lang="de"
        spellcheck={false}
        autocapitalize="sentences"
        placeholder={t('writeHere')}
        data-teil={part.teil}
        value={text}
        onFocus={(e) => onFocus(e.currentTarget)}
        onInput={(e) => onText(e.currentTarget.value)}
      />
      <LetterKeys onInsert={onInsert} />
      <p class={few ? 'small text-bad' : 'muted small'}>{t('wordCount', { n: words, range: part.words })}</p>
    </div>
  );
}

/** The learner marks their own message, criterion by criterion, next to a model answer. */
function MarkPage({
  part,
  text,
  levels,
  onLevel,
  total,
}: {
  part: MessageTeil;
  text: string;
  levels: (number | null)[];
  onLevel: (criterion: number, level: number) => void;
  total: number;
}) {
  return (
    <div class="exam-page">
      <p class="exam-teil-label">✍️ Schreiben · Teil {part.teil}</p>
      <h2 class="exam-h2">{t('markYourself')}</h2>
      <p class="muted small">{t('markHelp')}</p>
      <Task task={part.task} translate={false} />
      <p class="exam-mytext pre">{text.trim() || '—'}</p>
      <p class="small">
        {hasGreeting(text) ? '✓' : '✗'} {t('greetingCheck')} · {hasClosing(text) ? '✓' : '✗'} {t('closingCheck')} ·{' '}
        {t('wordCount', { n: countWords(text), range: part.words })}
      </p>
      <details class="exam-details" open>
        <summary>{t('modelAnswer')}</summary>
        <p class="pre">{part.task.model.de}</p>
        <Translation x={part.task.model} />
      </details>
      {part.criteria.map((c, i) => (
        <CriterionButtons criterion={c} level={levels[i]} onChange={(l) => onLevel(i, l)} />
      ))}
      <p class="exam-mark-total">{t('rawScore', { c: points(total), n: maxPoints(part.criteria) })}</p>
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
