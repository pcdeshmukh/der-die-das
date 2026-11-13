import { useMemo, useState } from 'preact/hooks';
import { AudioPlayer, Countdown, ExamResults, TeilIntro, TeilLabel, Transcript, Translation } from '../components/Exam';
import { GameBar } from '../components/GameBar';
import type { ExamAd, ExamText, PictureOption } from '../data/types';
import { GERMAN_NAMES, LETTERS, choicePages, resultKey, type ExamItem, type ExamPage } from '../lib/exam';
import { NO_AD } from '../lib/examTexts';
import { meaning, t } from '../lib/i18n';
import { playCorrect, playFinish, playWrong } from '../lib/sfx';
import { finishExamPart, finishRound } from '../lib/store';
import type { ExamGameProps } from './types';

type Screen = { kind: 'intro'; teil: number } | { kind: 'page'; page: ExamPage };

/**
 * Hören and Lesen: pages of recordings or texts with a/b/c, richtig/falsch, Ja/Nein, two-ad or matching
 * questions. In exam mode answers can change until the page is left and are marked at the end; in practice
 * each answer is marked at once.
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
        module={run.module}
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
          format={exam.format}
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
            <Stimulus page={screen.page} exam={run.exam} revealed={practice && pageDone} />
            {screen.page.q && (
              <>
                <p class="exam-page-q">{screen.page.q.de}</p>
                {practice && pageDone && <Translation x={screen.page.q} />}
              </>
            )}
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

/**
 * What the questions are about: a recording (with pictures to match), a text, a sign, or ads to match.
 * The two ads of Start Deutsch 1 Lesen Teil 2 are the options themselves, so they show with the question.
 */
function Stimulus({ page, exam, revealed }: { page: ExamPage; exam: boolean; revealed: boolean }) {
  const s = page.stimulus;
  switch (s.kind) {
    case 'audio':
      return (
        <>
          <AudioPlayer key={page.key} lines={s.lines} limit={exam ? s.plays : Infinity} />
          {s.pictures && <Pictures pictures={s.pictures} translate={revealed} />}
        </>
      );
    case 'text':
      return <TextCard text={s.text} />;
    case 'sign':
      return (
        <>
          <p class="exam-where">📍 {s.where.de}</p>
          <div class="exam-sign">{s.sign.de}</div>
        </>
      );
    case 'adlist':
      return <AdList ads={s.ads} translate={revealed} />;
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
    default:
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

/** The pictures a conversation is matched to (Hören Teil 2 of A2): a letter, an emoji and a caption. */
function Pictures({ pictures, translate }: { pictures: PictureOption[]; translate: boolean }) {
  return (
    <div class="exam-pictures">
      {pictures.map((p, i) => (
        <div class="exam-picture">
          <span class="exam-letter">{LETTERS[i]}</span>
          <span class="exam-picture-emoji" aria-hidden="true">
            {p.emoji}
          </span>
          <span class="exam-picture-text">
            <span lang="de">{p.de}</span>
            {translate && <Translation x={p} />}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The ads people are matched to (Lesen Teil 4 of A2), and X for "none fits". */
function AdList({ ads, translate }: { ads: ExamAd[]; translate: boolean }) {
  return (
    <div class="exam-adlist">
      {ads.map((ad, i) => (
        <div class="exam-adlist-item">
          <span class="exam-letter">{LETTERS[i]}</span>
          <span class="exam-ad">
            <AdCard ad={ad} />
            {translate && <Translation x={ad} />}
          </span>
        </div>
      ))}
      <div class="exam-adlist-item none">
        <span class="exam-letter">X</span>
        <span class="exam-ad">
          {NO_AD.de}
          {translate && <Translation x={NO_AD} />}
        </span>
      </div>
    </div>
  );
}

/** How an option looks: picked (exam mode), or right/wrong once marked. */
function optionState(item: ExamItem, i: number, picked: number | undefined, revealed: boolean) {
  if (!revealed) return picked === i ? 'selected' : '';
  return i === item.answer ? 'reveal' : picked === i ? 'picked-wrong' : 'dim';
}

/** An option as the review spells it out: "b) 10.15 Uhr", "falsch", "c – 🏊 Schwimmbad". */
function optionLabel(item: ExamItem, i: number) {
  if (item.kind === 'abc') return `${LETTERS[i]}) ${item.options[i]}`;
  if (item.kind === 'match' && item.labels) return `${item.options[i]} – ${item.labels[i]}`;
  return item.options[i];
}

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
  if (item.kind === 'match') {
    // A row of letters: the pictures or ads they stand for are shown above.
    return (
      <div class="exam-item">
        <div class="exam-match">
          <p class="exam-q">
            <span class="exam-n">{item.n}</span>
            <span>{item.q.de}</span>
          </p>
          <div class="exam-options exam-options-match">
            {item.options.map((o, i) => (
              <button class={`exam-option ${optionState(item, i, picked, revealed)}`} disabled={revealed} onClick={() => onPick(i)}>
                {o}
              </button>
            ))}
          </div>
        </div>
        {revealed && <Translation x={item.q} />}
      </div>
    );
  }
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
            <span class="exam-letter">{item.kind === 'rf' ? (i === 0 ? '✓' : '✗') : LETTERS[i]}</span>
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
      {s.kind === 'audio' && (
        <>
          <Transcript lines={s.lines} />
          {s.pictures && <Pictures pictures={s.pictures} translate />}
        </>
      )}
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
      {s.kind === 'adlist' && <AdList ads={s.ads} translate />}
      {page.q && (
        <>
          <p class="exam-page-q">{page.q.de}</p>
          <Translation x={page.q} />
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
                  <span class="exam-letter">{LETTERS[i]}</span>
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
