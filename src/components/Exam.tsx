import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ExamLine, Titled } from '../data/types';
import { formatDuration } from '../lib/duration';
import { GERMAN_NAMES, points, scaled, type Criterion, type ExamFormat, type ModuleInfo } from '../lib/exam';
import { INSTRUCTIONS } from '../lib/examTexts';
import { meaning, t, uiLang } from '../lib/i18n';
import { shareText, type Shared } from '../lib/share';
import { speakLines, type Playback } from '../lib/speech';
import { progress } from '../lib/store';

/** The learner-language version of German exam text, when translations are switched on. */
export function Translation({ x }: { x: Titled }) {
  if (!progress.value.settings.showHint) return null;
  return <p class="translation">{meaning(x)}</p>;
}

/** "👂 Hören · Teil 2", above every page of a part. */
export function TeilLabel({ module, teil }: { module: ModuleInfo; teil: number }) {
  return (
    <p class="exam-teil-label">
      {module.icon} {GERMAN_NAMES[module.id]} · Teil {teil}
    </p>
  );
}

/** The instructions before a Teil, in German as on the exam paper. */
export function TeilIntro({
  format,
  module,
  teil,
  exam,
  first,
  onStart,
}: {
  format: ExamFormat;
  module: ModuleInfo;
  teil: number;
  exam: boolean;
  /** the first Teil of the run, which also explains how the run works */
  first: boolean;
  onStart: () => void;
}) {
  const text = INSTRUCTIONS[format][module.id][teil - 1];
  // Speaking and free writing are marked by the learner, so they get the note about that instead.
  const selfMarked = module.id === 'sprechen' || (module.id === 'schreiben' && !exam && (format !== 'sd1' || teil === 2));
  const note = selfMarked
    ? t('teacherHint')
    : exam
      ? module.timed
        ? t('examNoteTimed', { n: module.minutes })
        : t('examNote')
      : module.id === 'hoeren'
        ? t('practiceNoteListen')
        : t('practiceNote');
  return (
    <div class="exam-intro">
      <TeilLabel module={module} teil={teil} />
      <p class="exam-instruction">{text.de}</p>
      <Translation x={text} />
      {first && <p class="muted small">{note}</p>}
      <button class="btn primary" onClick={onStart}>
        {t('start')}
      </button>
    </div>
  );
}

/** Time left in an exam part; after the limit it counts the time over, in red. */
export function Countdown({ start, minutes }: { start: number; minutes: number }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tick);
  }, []);
  const left = minutes * 60_000 - (now - start);
  return left >= 0 ? (
    <span class="timer">⏱ {formatDuration(left + 999)}</span>
  ) : (
    <span class="timer over" title={t('timeUp')}>
      ⏱ +{formatDuration(-left)}
    </span>
  );
}

/** Plays a recording when it appears; `limit` caps how often it can be played (once or twice in the exam). */
export function AudioPlayer({ lines, limit }: { lines: ExamLine[]; limit: number }) {
  const [played, setPlayed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = useRef<Playback | null>(null);

  function play() {
    if (current.current) return;
    setPlayed((n) => n + 1);
    setPlaying(true);
    const playback = speakLines(lines);
    current.current = playback;
    playback.done.then(() => {
      if (current.current !== playback) return;
      current.current = null;
      setPlaying(false);
    });
  }

  useEffect(() => {
    play();
    return () => {
      const playback = current.current;
      current.current = null;
      playback?.stop();
    };
  }, []);

  const left = limit - played;
  const status = playing
    ? t('playing')
    : !Number.isFinite(limit)
      ? t('listenAgain')
      : left > 0
        ? t('playsLeft', { n: left })
        : t('noPlaysLeft');
  return (
    <div class="audio-player">
      <button class="listen-btn" disabled={playing || left <= 0} onClick={play} aria-label={t('play')}>
        {playing ? '🔊' : '▶'}
      </button>
      <span class="muted small">{status}</span>
    </div>
  );
}

/** A recording's text, line by line with translations, and a button to hear it again. */
export function Transcript({ lines }: { lines: ExamLine[] }) {
  const current = useRef<Playback | null>(null);
  useEffect(() => () => current.current?.stop(), []);
  const dialogue = lines.some((l) => l.who === 2);
  return (
    <div class="transcript">
      <button
        class="icon-btn transcript-play"
        aria-label={t('listenAgain')}
        onClick={() => {
          current.current?.stop();
          current.current = speakLines(lines);
        }}
      >
        🔊
      </button>
      {lines.map((l) => (
        <div class={dialogue ? `transcript-line who-${l.who ?? 1}` : 'transcript-line'}>
          <p>{l.de}</p>
          <Translation x={l} />
        </div>
      ))}
    </div>
  );
}

const DONE_LABELS = ['rateFull', 'ratePart', 'rateNone'] as const;

/** Green for the best level, red for the worst, amber between. */
const tone = (level: number, levels: number) => (level === 0 ? 'top' : level === levels - 1 ? 'low' : 'mid');

/** German for German menus, else the chosen translation language. */
const inUiLang = (x: Titled) => (uiLang() === 'de' ? x.de : meaning(x));

/** One criterion marked as on the exam's sheets: done/partly/not done, or A to E. */
export function CriterionButtons({
  criterion,
  level,
  onChange,
  label,
}: {
  criterion: Criterion;
  level: number | null;
  onChange: (level: number) => void;
  /** overrides the criterion's own label, e.g. a content point of the task */
  label?: ComponentChildren;
}) {
  const ae = criterion.scale === 'ae';
  const hint = level !== null && criterion.hints?.[level];
  return (
    <div class="rating">
      {label ?? (criterion.label && (
        <p class="rating-label">
          {criterion.label.de}
          {uiLang() !== 'de' && <span class="muted"> · {meaning(criterion.label)}</span>}
        </p>
      ))}
      <div class={ae ? 'rating-buttons ae' : 'rating-buttons'} role="group">
        {criterion.points.map((p, i) => (
          <button class={level === i ? `rating-btn active ${tone(i, criterion.points.length)}` : 'rating-btn'} aria-pressed={level === i} onClick={() => onChange(i)}>
            {ae ? 'ABCDE'[i] : t(DONE_LABELS[i])}
            <span class="rating-points">{points(p)}</span>
          </button>
        ))}
      </div>
      {hint && <p class="rating-hint">{inUiLang(hint)}</p>}
    </div>
  );
}

/** Sends the tasks and answers to a teacher: share sheet, clipboard, or a box to copy from. */
export function TeacherShare({ text }: { text: () => string }) {
  const [state, setState] = useState<Shared | null>(null);
  const [body, setBody] = useState('');
  async function send() {
    const report = text();
    setBody(report);
    setState(await shareText(report));
  }
  return (
    <div class="teacher-share">
      <p class="muted small">{t('teacherHint')}</p>
      <button class="btn" onClick={send}>
        📨 {t('sendTeacher')}
      </button>
      {state === 'copied' && <p class="muted small">{t('teacherCopied')}</p>}
      {state === 'failed' && (
        <label class="teacher-text">
          <span class="muted small">{t('copyThis')}</span>
          <textarea readOnly rows={8} value={body} onFocus={(e) => e.currentTarget.select()} />
        </label>
      )}
    </div>
  );
}

/** The top of a part's results: points, the certificate scale in exam mode, time, XP and the buttons. */
export function ExamResults({
  title,
  raw,
  max,
  module,
  exam,
  ms,
  xp,
  onRetry,
  onExit,
  children,
}: {
  title: string;
  raw: number;
  max: number;
  module: ModuleInfo;
  exam: boolean;
  ms?: number;
  xp: number;
  onRetry: () => void;
  onExit: () => void;
  children?: ComponentChildren;
}) {
  const share = max ? raw / max : 0;
  return (
    <div class="results exam-results">
      <div class="results-emoji">{share >= 0.9 ? '🏆' : share >= 0.6 ? '🎉' : share >= 0.4 ? '👍' : '💪'}</div>
      <h1>{title}</h1>
      <p class="results-score">{t('rawScore', { c: points(raw), n: max })}</p>
      {exam && <p class="exam-scaled">{t('scaledScore', { p: scaled(module, raw) })}</p>}
      {ms !== undefined && <p class="muted">{t('time', { t: formatDuration(ms) })}</p>}
      <p class="results-xp">+{xp} XP</p>
      <div class="results-actions">
        <button class="btn primary" onClick={onRetry}>
          {t('playAgain')}
        </button>
        <button class="btn" onClick={onExit}>
          {t('done')}
        </button>
      </div>
      {children}
    </div>
  );
}
