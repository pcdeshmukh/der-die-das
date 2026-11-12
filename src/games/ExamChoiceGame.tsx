import { useMemo, useState } from 'preact/hooks';
import { AudioPlayer, Countdown, ExamResults, TeilIntro, TeilLabel, Transcript, Translation } from '../components/Exam';
import { GameBar } from '../components/GameBar';
import type { ExamAd, ExamText } from '../data/types';
import { ABC, GERMAN_NAMES, choicePages, resultKey, type ExamItem, type ExamPage } from '../lib/exam';
import { meaning, t } from '../lib/i18n';
import { playCorrect, playFinish, playWrong } from '../lib/sfx';
import { finishExamPart, finishRound } from '../lib/store';
import type { ExamGameProps } from './types';

type Screen = { kind: 'intro'; teil: number } | { kind: 'page'; page: ExamPage };

/**
 * Hören and Lesen: pages of recordings or texts with a/b/c, richtig/falsch or two-ad questions. In exam mode
 * answers can change until the page is left and are marked at the end; in practice each answer is marked at once.
 */
export function ExamChoiceGame({ level, exam, run, onRetry, onExit }: ExamGameProps) {
  const module = run.module.id as 'hoeren' | 'lesen';
  const pages = useMemo(() => choicePages(exam, module, run.teile), [exam, module, run]);
  const screens = useMemo(() => {
    const out: Screen[] = [];
    for (const page of pages) {
      if (!out.some((s) => s.kind === 'intro' && s.teil === page.teil)) out.push({ kind: 'intro', teil: page.teil });
      out.push({ kind: 'page', page });
    }
    return out;
  }, [pages]);
  const items = pages.flatMap((p) => p.items);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [start] = useState(Date.now);
  const [result, setResult] = useState<{ correct: number; ms: number; xp: number } | null>(null);
  const practice = !run.exam;

  function pick(item: ExamItem, option: number) {
    if (practice && item.key in answers) return;
    setAnswers((a) => ({ ...a, [item.key]: option }));
    if (practice) (option === item.answer ? playCorrect : playWrong)();
  }

  function next() {
    scrollTo(0, 0);
    if (index + 1 < screens.length) return setIndex(index + 1);
    const correct = items.filter((x) => answers[x.key] === x.answer).length;
    const xp = correct * 10;
    if (run.exam) finishExamPart(resultKey(level, exam, module), correct, xp);
    else finishRound(null, 0, xp);
    playFinish();
    setResult({ correct, ms: Date.now() - start, xp });
  }

  const title = `${GERMAN_NAMES[module]} · ${run.exam ? t('modelTest', { n: exam.id }) : `Teil ${run.teile[0]}`}`;
  if (result) {
    return (
      <ExamResults
        title={title}
        raw={result.correct}
        max={items.length}
        exam={run.exam}
        ms={run.module.timed ? result.ms : undefined}
        xp={result.xp}
        onRetry={onRetry}
        onExit={onExit}
      >
        <section class="exam-review">
          {pages.map((page) => (
            <PageReview page={page} answers={answers} />
          ))}
        </section>
      </ExamResults>
    );
  }

  const screen = screens[index];
  const done = pages.filter((p) => p.items.every((x) => x.key in answers)).length;
  const pageDone = screen.kind === 'page' && screen.page.items.every((x) => x.key in answers);
  return (
    <div class="game exam-game">
      <GameBar value={done / pages.length} onQuit={onExit}>
        {run.exam && run.module.timed && <Countdown start={start} minutes={run.module.minutes} />}
      </GameBar>
      {screen.kind === 'intro' ? (
        <TeilIntro
          module={run.module}
          teil={screen.teil}
          exam={run.exam}
          first={index === 0}
          onStart={() => setIndex(index + 1)}
        />
      ) : (
        <>
          <div class="exam-page" key={screen.page.key}>
            <TeilLabel module={run.module} teil={screen.page.teil} />
            <Stimulus page={screen.page} exam={run.exam} />
            {screen.page.items.map((item) => (
              <ItemBlock
                item={item}
                page={screen.page}
                picked={answers[item.key]}
                revealed={practice && item.key in answers}
                onPick={(o) => pick(item, o)}
              />
            ))}
            {/* Below the questions, so the options don't jump when it appears. */}
            {practice && pageDone && <Explanation page={screen.page} />}
          </div>
          <div class="exam-nav">
            <button class="btn primary" disabled={practice && !pageDone} onClick={next}>
              {index + 1 === screens.length ? t('finish') : t('continue')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** What the questions are about: a recording, a note or email, or a sign (ads are the options themselves). */
function Stimulus({ page, exam }: { page: ExamPage; exam: boolean }) {
  const s = page.stimulus;
  switch (s.kind) {
    case 'audio':
      return <AudioPlayer key={page.key} lines={s.lines} limit={exam ? s.plays : Infinity} />;
    case 'text':
      return <TextCard text={s.text} />;
    case 'sign':
      return (
        <>
          <p class="exam-where">📍 {s.where.de}</p>
          <div class="exam-sign">{s.sign.de}</div>
        </>
      );
    case 'ads':
      return null;
  }
}

/** In practice, once a page is answered: the transcript of a recording, or the translation of a text or sign. */
function Explanation({ page }: { page: ExamPage }) {
  const s = page.stimulus;
  switch (s.kind) {
    case 'audio':
      return (
        <details class="exam-details" open>
          <summary>{t('transcript')}</summary>
          <Transcript lines={s.lines} />
        </details>
      );
    case 'text':
      return <TranslationBox text={meaning(s.text)} />;
    case 'sign':
      return <TranslationBox text={`${meaning(s.where)}: ${meaning(s.sign)}`} />;
    case 'ads':
      return null;
  }
}

function TranslationBox({ text }: { text: string }) {
  return (
    <details class="exam-details">
      <summary>{t('translation')}</summary>
      <p class="translation pre">{text}</p>
    </details>
  );
}

function TextCard({ text }: { text: ExamText }) {
  return (
    <div class="exam-text">
      {text.head?.map((h) => (
        <p class="exam-text-head">{h}</p>
      ))}
      <p class="pre">{text.de}</p>
    </div>
  );
}

function AdCard({ ad }: { ad: ExamAd }) {
  return (
    <>
      <span class="exam-ad-title">{ad.title}</span>
      <span class="pre">{ad.de}</span>
      {ad.foot && <span class="exam-ad-foot">{ad.foot}</span>}
    </>
  );
}

/** How an option looks: picked (exam mode), or right/wrong once marked. */
function optionState(item: ExamItem, i: number, picked: number | undefined, revealed: boolean) {
  if (!revealed) return picked === i ? 'selected' : '';
  return i === item.answer ? 'reveal' : picked === i ? 'picked-wrong' : 'dim';
}

const optionLabel = (item: ExamItem, i: number) => (item.kind === 'abc' ? `${ABC[i]}) ${item.options[i]}` : item.options[i]);

function ItemBlock({
  item,
  page,
  picked,
  revealed,
  onPick,
}: {
  item: ExamItem;
  page: ExamPage;
  picked: number | undefined;
  revealed: boolean;
  onPick: (option: number) => void;
}) {
  const ads = page.stimulus.kind === 'ads' ? page.stimulus.ads : null;
  const right = picked === item.answer;
  return (
    <div class="exam-item">
      <p class="exam-q">
        <span class="exam-n">{item.n}</span>
        <span>{item.q.de}</span>
      </p>
      {revealed && <Translation x={item.q} />}
      <div class={`exam-options exam-options-${item.kind}`}>
        {item.options.map((o, i) => (
          <button class={`exam-option ${optionState(item, i, picked, revealed)}`} disabled={revealed} onClick={() => onPick(i)}>
            <span class="exam-letter">{item.kind === 'rf' ? (i === 0 ? '✓' : '✗') : ABC[i]}</span>
            {ads ? (
              <span class="exam-ad">
                <AdCard ad={ads[i]} />
                {revealed && <Translation x={ads[i]} />}
              </span>
            ) : (
              <span>{o}</span>
            )}
          </button>
        ))}
      </div>
      {/* A wrong answer needs no words: the right option is already shown in green. */}
      {revealed && right && <p class="exam-feedback feedback-ok">{t('correct')}</p>}
    </div>
  );
}

/** One page on the results screen: each question with the learner's answer, and the text or transcript. */
function PageReview({ page, answers }: { page: ExamPage; answers: Record<string, number> }) {
  const wrong = page.items.some((x) => answers[x.key] !== x.answer);
  const s = page.stimulus;
  return (
    <details class="exam-review-page" open={wrong}>
      <summary>
        {page.items.map((x) => (
          <span class={answers[x.key] === x.answer ? 'review-mark ok' : 'review-mark bad'}>
            {answers[x.key] === x.answer ? '✓' : '✗'} {x.n}
          </span>
        ))}
        <span class="muted small">Teil {page.teil}</span>
      </summary>
      {s.kind === 'audio' && <Transcript lines={s.lines} />}
      {s.kind === 'text' && (
        <>
          <TextCard text={s.text} />
          <Translation x={s.text} />
        </>
      )}
      {s.kind === 'sign' && (
        <>
          <p class="exam-where">📍 {s.where.de}</p>
          <div class="exam-sign">{s.sign.de}</div>
          <Translation x={s.sign} />
        </>
      )}
      {page.items.map((item) => {
        const picked = answers[item.key];
        return (
          <div class="review-item">
            <p class="exam-q">
              <span class="exam-n">{item.n}</span>
              <span>{item.q.de}</span>
            </p>
            <Translation x={item.q} />
            {s.kind === 'ads' &&
              s.ads.map((ad, i) => (
                <div class={i === item.answer ? 'review-ad right' : 'review-ad'}>
                  <span class="exam-letter">{ABC[i]}</span>
                  <span class="exam-ad">
                    <AdCard ad={ad} />
                    <Translation x={ad} />
                  </span>
                </div>
              ))}
            <p class="small">
              {t('yourAnswer')}:{' '}
              <b class={picked === item.answer ? 'text-ok' : 'text-bad'}>
                {picked === undefined ? t('noAnswer') : optionLabel(item, picked)}
              </b>
              {picked !== item.answer && (
                <>
                  {' · '}
                  {t('solution')}: <b>{optionLabel(item, item.answer)}</b>
                </>
              )}
            </p>
          </div>
        );
      })}
    </details>
  );
}
