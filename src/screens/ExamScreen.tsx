import { useState } from 'preact/hooks';
import type { ExamSet, Level } from '../data/types';
import { ExamChoiceGame } from '../games/ExamChoiceGame';
import { ExamSpeakingGame } from '../games/ExamSpeakingGame';
import { ExamWritingGame } from '../games/ExamWritingGame';
import { EXAM_PREFIX, GERMAN_NAMES, modulesOf, outcome, predicate, resultKey, scaled, type Run } from '../lib/exam';
import { t, uiLang } from '../lib/i18n';
import { href, navigate } from '../lib/router';
import { speechSupported } from '../lib/speech';
import { progress, type ExamResult } from '../lib/store';

/** The four parts' latest exam results, and the outcome once all four have one. */
export function examResults(level: Level, exam: ExamSet) {
  const p = progress.value;
  const modules = modulesOf(exam);
  const results = modules.map((m) => p.exams[resultKey(level, exam, m.id)] as ExamResult | undefined);
  const done = results.filter((r) => r !== undefined).length;
  const result = done === modules.length ? outcome(exam, results.map((r) => r!.raw)) : null;
  return { results, done, result };
}

/** A model test: its score sheet, and each part to take as in the exam or to practise Teil by Teil. */
export function ExamScreen({ level, exam }: { level: Level; exam: ExamSet }) {
  const { results, result } = examResults(level, exam);
  const modules = modulesOf(exam);
  const page = EXAM_PREFIX + exam.id;
  const a2 = exam.format === 'a2';
  return (
    <div class="screen">
      <h1 class="screen-title">
        <span class="title-emoji">📝</span> {t('modelTest', { n: exam.id })}
      </h1>
      <p class="muted subtitle small">{t(a2 ? 'examFormatA2' : 'examFormat')}</p>

      <div class="exam-scores">
        {modules.map((m, i) => (
          <div class="exam-score">
            <span aria-hidden="true">{m.icon}</span>
            <span class="exam-score-value">
              {results[i] ? scaled(m, results[i].raw) : '–'}
              <span class="muted">/25</span>
            </span>
            <span class="exam-score-label">{t(`mod_${m.id}`)}</span>
          </div>
        ))}
        <p class={result === null ? 'exam-total muted small' : result.passed ? 'exam-total pass' : 'exam-total fail'}>
          {result === null ? (
            t('examTotalHint')
          ) : (
            <>
              {t('examTotal')}: <b>{result.total}/100</b> ·{' '}
              {result.passed ? (
                <>
                  {predicate(result.total)} · ✅ {t('passed')}
                </>
              ) : (
                <>
                  {t('notPassed')}
                  {result.short && <> ({t(result.short === 'written' ? 'shortWritten' : 'shortOral')})</>}
                </>
              )}
            </>
          )}
        </p>
      </div>
      <p class="muted small">{t(a2 ? 'passInfoA2' : 'passInfo')}</p>

      <div class="mode-list">
        {modules.map((m, i) => {
          const blocked = m.needsSpeech && !speechSupported;
          const last = results[i];
          return (
            <div class={blocked ? 'exam-part locked' : 'exam-part'}>
              <div class="exam-part-head">
                <span class="mode-icon">{m.icon}</span>
                <span class="mode-text">
                  <span class="mode-name">
                    {t(`mod_${m.id}`)}
                    {uiLang() !== 'de' && <span class="muted"> · {GERMAN_NAMES[m.id]}</span>}
                  </span>
                  <span class="mode-desc">
                    {blocked
                      ? t('needsSpeech')
                      : [t('examMinutes', { n: m.minutes }), t('teileCount', { n: m.teile }), last && t('lastScore', { p: scaled(m, last.raw) })]
                          .filter(Boolean)
                          .join(' · ')}
                  </span>
                </span>
              </div>
              {!blocked && (
                <div class="exam-part-actions">
                  <a class="btn primary" href={href(level.slug, page, m.id)}>
                    {t('takeExam')}
                  </a>
                  <div class="exam-practice">
                    <span class="muted small">{t('practiseTeil')}</span>
                    {Array.from({ length: m.teile }, (_, j) => (
                      <a class="btn small" href={href(level.slug, page, `${m.id}-${j + 1}`)}>
                        {t('teil', { n: j + 1 })}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const GAMES = { hoeren: ExamChoiceGame, lesen: ExamChoiceGame, schreiben: ExamWritingGame, sprechen: ExamSpeakingGame };

/** One part of a model test, as in the exam or one Teil to practise. */
export function ExamRunScreen({ level, exam, run }: { level: Level; exam: ExamSet; run: Run }) {
  // Bumping the round starts the part afresh.
  const [round, setRound] = useState(0);
  const exit = () => navigate(level.slug, EXAM_PREFIX + exam.id);
  if (run.module.needsSpeech && !speechSupported) {
    return (
      <div class="screen center">
        <p>{t('needsSpeech')}</p>
        <button class="btn primary" onClick={exit}>
          {t('back')}
        </button>
      </div>
    );
  }
  const Game = GAMES[run.module.id];
  return <Game key={round} level={level} exam={exam} run={run} onRetry={() => setRound((r) => r + 1)} onExit={exit} />;
}
