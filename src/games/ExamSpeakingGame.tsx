import { useEffect, useState } from 'preact/hooks';
import { ExamResults, RatingButtons, TeacherShare, TeilIntro, TeilLabel, Translation } from '../components/Exam';
import { GameBar } from '../components/GameBar';
import { SpeakButton } from '../components/NounPrompt';
import {
  GERMAN_NAMES,
  INTRO_KEYWORDS,
  TASK_NAMES,
  markedPoints,
  points,
  resultKey,
  speakingReport,
  speakingSteps,
  type Rating,
  type SpeakStep,
} from '../lib/exam';
import { t } from '../lib/i18n';
import { playFinish } from '../lib/sfx';
import { speak } from '../lib/speech';
import { finishExamPart, finishRound } from '../lib/store';
import type { ExamGameProps } from './types';

type Screen = { kind: 'intro'; teil: number } | { kind: 'step'; step: SpeakStep };

/**
 * Sprechen with the app as partner: it asks or makes requests aloud, the learner speaks, then compares with an
 * example and marks the turn. Notes typed along the way go into the report for a teacher.
 */
export function ExamSpeakingGame({ level, exam, run, onRetry, onExit }: ExamGameProps) {
  const [steps] = useState(() => speakingSteps(exam, run.teile));
  const screens: Screen[] = [];
  for (const step of steps) {
    if (!screens.some((s) => s.kind === 'intro' && s.teil === step.teil)) screens.push({ kind: 'intro', teil: step.teil });
    screens.push({ kind: 'step', step });
  }
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ raw: number; xp: number } | null>(null);
  const screen = screens[index];
  const max = steps.reduce((sum, s) => sum + s.max, 0);
  const marked = () => markedPoints(steps.map((s) => ({ max: s.max, rating: ratings[s.key] ?? null })));

  function next() {
    scrollTo(0, 0);
    if (index + 1 < screens.length) return setIndex(index + 1);
    const raw = marked();
    const xp = raw * 10;
    if (run.exam) finishExamPart(resultKey(level, exam, 'sprechen'), raw, xp);
    else finishRound(null, 0, xp);
    playFinish();
    setResult({ raw, xp });
  }

  const report = () => speakingReport(exam, steps, notes, marked());

  if (result) {
    return (
      <ExamResults
        title={`${GERMAN_NAMES.sprechen} · ${run.exam ? t('modelTest', { n: exam.id }) : `Teil ${run.teile[0]}`}`}
        raw={result.raw}
        max={max}
        exam={run.exam}
        xp={result.xp}
        onRetry={onRetry}
        onExit={onExit}
      >
        <TeacherShare text={report} />
        <section class="exam-review">
          {steps.map((step) => (
            <div class="review-item">
              <p class="small">
                <b>
                  Teil {step.teil} · {TASK_NAMES[step.kind]}
                </b>{' '}
                <span class="muted">
                  {points(step.max * (ratings[step.key] ?? 0))}/{step.max}
                </span>
              </p>
              {step.partner && <p class="muted small">„{step.partner.de}“</p>}
              {notes[step.key]?.trim() && <p class="exam-mytext pre">{notes[step.key].trim()}</p>}
              <p class="small">
                {t('example')}: {step.model.de}
              </p>
            </div>
          ))}
        </section>
      </ExamResults>
    );
  }

  return (
    <div class="game exam-game">
      <GameBar value={index / screens.length} onQuit={onExit} />
      {screen.kind === 'intro' ? (
        <TeilIntro module={run.module} teil={screen.teil} exam={run.exam} first={index === 0} onStart={() => setIndex(index + 1)} />
      ) : (
        <>
          <Turn
            key={screen.step.key}
            step={screen.step}
            module={run.module}
            revealed={!!revealed[screen.step.key]}
            onReveal={() => setRevealed((r) => ({ ...r, [screen.step.key]: true }))}
            note={notes[screen.step.key] ?? ''}
            onNote={(text) => setNotes((n) => ({ ...n, [screen.step.key]: text }))}
            rating={ratings[screen.step.key] ?? null}
            onRate={(r) => setRatings((rs) => ({ ...rs, [screen.step.key]: r }))}
          />
          <div class="exam-nav">
            <button class="btn primary" disabled={!(screen.step.key in ratings)} onClick={next}>
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
  rating,
  onRate,
}: {
  step: SpeakStep;
  module: ExamGameProps['run']['module'];
  revealed: boolean;
  onReveal: () => void;
  note: string;
  onNote: (text: string) => void;
  rating: Rating | null;
  onRate: (r: Rating) => void;
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
      <p class="exam-speak-task">{t(`speak_${step.kind}`)}</p>
      <textarea
        class="exam-notes"
        rows={2}
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
          <p class="exam-model-text pre">{step.model.de}</p>
          <SpeakButton text={step.model.de} />
          <Translation x={step.model} />
          {step.reply && (
            <>
              <p class="exam-model-label">{t('partnerReplies')}</p>
              <p class="exam-model-text">{step.reply.de}</p>
              <Translation x={step.reply} />
            </>
          )}
          <p class="muted small">{t('howDidItGo')}</p>
          <RatingButtons max={step.max} value={rating} onChange={onRate} />
        </div>
      )}
    </div>
  );
}
