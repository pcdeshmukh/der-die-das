import { useEffect, useState } from 'preact/hooks';
import { CriterionButtons, ExamResults, TeacherShare, TeilIntro, TeilLabel, Translation } from '../components/Exam';
import { GameBar } from '../components/GameBar';
import { SpeakButton } from '../components/NounPrompt';
import type { CalendarSlot } from '../data/types';
import {
  GERMAN_NAMES,
  INTRO_KEYWORDS,
  TASK_NAMES,
  groupPoints,
  markedPoints,
  maxPoints,
  points,
  resultKey,
  speakingReport,
  speakingSteps,
  stepsMax,
  type SpeakStep,
} from '../lib/exam';
import { meaning, t, uiLang } from '../lib/i18n';
import { playFinish } from '../lib/sfx';
import { speak } from '../lib/speech';
import { finishExamPart, finishRound } from '../lib/store';
import type { ExamGameProps } from './types';

type Screen = { kind: 'intro'; teil: number } | { kind: 'step'; step: SpeakStep };
type Module = ExamGameProps['run']['module'];

/**
 * Sprechen with the app as partner: it asks or makes requests aloud, the learner speaks, then compares with an
 * example. Start Deutsch 1 marks each turn on the spot; Goethe A2 marks each Teil afterwards on a page of its own.
 * Notes typed along the way go into the report for a teacher.
 */
export function ExamSpeakingGame({ level, exam, run, onRetry, onExit }: ExamGameProps) {
  // Pronunciation is marked once for the whole test, so only when it is taken as in the exam.
  const [steps] = useState(() => speakingSteps(exam, run.teile, run.exam));
  const screens: Screen[] = [];
  for (const step of steps) {
    if (!screens.some((s) => s.kind === 'intro' && s.teil === step.teil)) screens.push({ kind: 'intro', teil: step.teil });
    screens.push({ kind: 'step', step });
  }
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [levels, setLevels] = useState<Record<string, (number | null)[]>>(() =>
    Object.fromEntries(steps.map((s) => [s.key, (s.criteria ?? []).map(() => null)])),
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ raw: number; xp: number } | null>(null);
  const screen = screens[index];

  function next() {
    scrollTo(0, 0);
    if (index + 1 < screens.length) return setIndex(index + 1);
    const raw = markedPoints(steps, levels);
    const xp = raw * 10;
    if (run.exam) finishExamPart(resultKey(level, exam, 'sprechen'), raw, xp);
    else finishRound(null, 0, xp);
    playFinish();
    setResult({ raw, xp });
  }

  if (result) {
    return (
      <ExamResults
        title={`${GERMAN_NAMES.sprechen} · ${run.exam ? t('modelTest', { n: exam.id }) : `Teil ${run.teile[0]}`}`}
        raw={result.raw}
        max={stepsMax(steps)}
        module={run.module}
        exam={run.exam}
        xp={result.xp}
        onRetry={onRetry}
        onExit={onExit}
      >
        <TeacherShare text={() => speakingReport(exam, steps, notes, levels)} />
        <section class="exam-review">
          {steps.map((step) => (
            <div class="review-item">
              <p class="small">
                <b>
                  {step.key === 'mark-pronunciation'
                    ? `${TASK_NAMES.mark}: ${step.criteria?.[0].label?.de}`
                    : `Teil ${step.teil} · ${TASK_NAMES[step.kind]}`}
                </b>{' '}
                {step.criteria && (
                  <span class="muted">
                    {points(groupPoints(step.criteria, levels[step.key]))}/{maxPoints(step.criteria)}
                  </span>
                )}
              </p>
              {step.partner && <p class="muted small">„{step.partner.de}“</p>}
              {notes[step.key]?.trim() && <p class="exam-mytext pre">{notes[step.key].trim()}</p>}
              {step.model && (
                <p class="small pre">
                  {t('example')}: {step.model.de}
                </p>
              )}
            </div>
          ))}
        </section>
      </ExamResults>
    );
  }

  const step = screen.kind === 'step' ? screen.step : null;
  const marked = (key: string) => levels[key].every((l) => l !== null);
  // A turn can be left once its example has been seen and, where it is marked on the spot, marked.
  const canGo = !step || (marked(step.key) && (step.kind === 'mark' || !!revealed[step.key]));
  const setLevel = (key: string, i: number, l: number) =>
    setLevels((ls) => ({ ...ls, [key]: ls[key].map((x, j) => (j === i ? l : x)) }));
  return (
    <div class="game exam-game">
      <GameBar value={index / screens.length} onQuit={onExit} />
      {screen.kind === 'intro' ? (
        <TeilIntro
          format={exam.format}
          module={run.module}
          teil={screen.teil}
          exam={run.exam}
          first={index === 0}
          onStart={() => setIndex(index + 1)}
        />
      ) : (
        <>
          {screen.step.kind === 'mark' ? (
            <MarkPage
              key={screen.step.key}
              step={screen.step}
              module={run.module}
              levels={levels[screen.step.key]}
              onLevel={(i, l) => setLevel(screen.step.key, i, l)}
            />
          ) : (
            <Turn
              key={screen.step.key}
              step={screen.step}
              module={run.module}
              revealed={!!revealed[screen.step.key]}
              onReveal={() => setRevealed((r) => ({ ...r, [screen.step.key]: true }))}
              note={notes[screen.step.key] ?? ''}
              onNote={(text) => setNotes((n) => ({ ...n, [screen.step.key]: text }))}
              levels={levels[screen.step.key]}
              onLevel={(i, l) => setLevel(screen.step.key, i, l)}
            />
          )}
          <div class="exam-nav">
            <button class="btn primary" disabled={!canGo} onClick={next}>
              {index + 1 === screens.length ? t('finish') : t('continue')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Turn({
  step,
  module,
  revealed,
  onReveal,
  note,
  onNote,
  levels,
  onLevel,
}: {
  step: SpeakStep;
  module: Module;
  revealed: boolean;
  onReveal: () => void;
  note: string;
  onNote: (text: string) => void;
  levels: (number | null)[];
  onLevel: (criterion: number, level: number) => void;
}) {
  const [textShown, setTextShown] = useState(false);
  // The partner speaks first; the learner can read along only on request, as the exam is spoken.
  useEffect(() => {
    if (step.partner) speak(step.partner.de, true);
  }, [step.key]);
  return (
    <div class="exam-page">
      <TeilLabel module={module} teil={step.teil} />
      {/* When asking, the topic is on the learner's card. */}
      {step.topic && step.kind !== 'ask' && <p class="exam-topic">{t('topicIs', { t: step.topic.de })}</p>}
      {step.task && (
        <div>
          <p class="exam-topic">{step.task.de}</p>
          <Translation x={step.task} />
        </div>
      )}
      <div class="noun-card exam-speak-card">
        {step.kind === 'intro' && (
          <div class="keyword-sheet">
            {INTRO_KEYWORDS.map((k) => (
              <span class="keyword">{k}</span>
            ))}
          </div>
        )}
        {step.kind === 'ask' && (
          <div class="word-card">
            <span class="muted small">{step.topic?.de}</span>
            <b>{step.word}</b>
          </div>
        )}
        {step.kind === 'talk' && step.q && (
          <div class="word-card talk-card">
            <b>{step.q.de}</b>
            <div class="keyword-sheet">
              {step.prompts?.map((k) => (
                <span class="keyword">{k}</span>
              ))}
            </div>
          </div>
        )}
        {step.calendar && <Calendar day={step.day ?? ''} slots={step.calendar} />}
        {step.emoji && <div class={step.kind === 'react' ? 'noun-emoji partner-card' : 'noun-emoji'}>{step.emoji}</div>}
        {step.partner && (
          <div class="exam-partner">
            <span class="muted small">{t('youHear')}</span>
            <button class="listen-btn small" onClick={() => speak(step.partner!.de, true)} aria-label={t('listenAgain')}>
              🔊
            </button>
            {textShown || revealed ? (
              <p class="exam-partner-text">„{step.partner.de}“</p>
            ) : (
              <button class="link-btn" onClick={() => setTextShown(true)}>
                {t('showText')}
              </button>
            )}
            {revealed && <Translation x={step.partner} />}
          </div>
        )}
      </div>
      <p class="exam-speak-task">{t(`speak_${step.kind as Exclude<SpeakStep['kind'], 'mark'>}`)}</p>
      <textarea
        class="exam-notes"
        rows={step.kind === 'talk' ? 4 : 2}
        lang="de"
        spellcheck={false}
        placeholder={t('notesPlaceholder')}
        value={note}
        onInput={(e) => onNote(e.currentTarget.value)}
      />
      {!revealed ? (
        <button class="btn" onClick={onReveal}>
          {t('showExample')}
        </button>
      ) : (
        <div class="exam-model">
          <p class="exam-model-label">{t('example')}</p>
          {step.model && (
            <>
              <p class="exam-model-text pre">{step.model.de}</p>
              <SpeakButton text={step.model.de} />
              <Translation x={step.model} />
            </>
          )}
          {step.reply && (
            <>
              <p class="exam-model-label">{t('partnerReplies')}</p>
              <p class="exam-model-text">{step.reply.de}</p>
              <Translation x={step.reply} />
            </>
          )}
          {step.criteria && (
            <>
              <p class="muted small">{t('howDidItGo')}</p>
              {step.criteria.map((c, i) => (
                <CriterionButtons criterion={c} level={levels[i]} onChange={(l) => onLevel(i, l)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** The learner's calendar for planning (Sprechen Teil 3 of A2): free hours are blank. */
function Calendar({ day, slots }: { day: string; slots: CalendarSlot[] }) {
  return (
    <div class="calendar">
      <p class="calendar-head">
        {t('yourCalendar')} · {day}
      </p>
      <table>
        <tbody>
          {slots.map((s) => (
            <tr class={s.entry ? 'busy' : 'free'}>
              <td class="calendar-time">{s.time}</td>
              <td>
                {s.entry && (
                  <>
                    {s.entry.de}
                    {uiLang() !== 'de' && <span class="muted small"> · {meaning(s.entry)}</span>}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Goethe A2: the learner marks a whole Teil (or their pronunciation) by the exam's criteria. */
function MarkPage({
  step,
  module,
  levels,
  onLevel,
}: {
  step: SpeakStep;
  module: Module;
  levels: (number | null)[];
  onLevel: (criterion: number, level: number) => void;
}) {
  const criteria = step.criteria ?? [];
  const pronunciation = step.key === 'mark-pronunciation';
  return (
    <div class="exam-page">
      <TeilLabel module={module} teil={step.teil} />
      <h2 class="exam-h2">{pronunciation ? t('markPronunciation') : t('markTeil', { n: step.teil })}</h2>
      <p class="muted small">{pronunciation ? t('markPronunciationHelp') : t('markSpeakHelp')}</p>
      {criteria.map((c, i) => (
        <CriterionButtons criterion={c} level={levels[i]} onChange={(l) => onLevel(i, l)} />
      ))}
      <p class="exam-mark-total">{t('rawScore', { c: points(groupPoints(criteria, levels)), n: maxPoints(criteria) })}</p>
    </div>
  );
}
