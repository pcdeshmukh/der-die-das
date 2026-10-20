import { wordsOf } from '../data';
import type { Level } from '../data/types';
import { t, uiLang } from '../lib/i18n';
import { ALPHABET, MODES, NUMBERS, REVIEW, MIXED, VERBS, describeTopic, modesFor, poolFor } from '../lib/modes';
import { href } from '../lib/router';
import { progress } from '../lib/store';
import { StarCount, TopicCard } from './TopicCard';

/** Stars earned in all of a chapter's linked topics, as a share for the progress bar. */
function chapterProgress(level: Level, links: string[]): number {
  const p = progress.value;
  let earned = 0;
  let max = 0;
  for (const id of links) {
    for (const m of modesFor(level, id)) {
      earned += p.stars[`${level.id}/${id}/${m.id}`] ?? 0;
      max += 3;
    }
  }
  return max ? earned / max : 0;
}

export function LevelScreen({ level }: { level: Level }) {
  const p = progress.value;
  const reviewCount = MODES.filter((m) => m.skill).reduce(
    (n, m) => n + (poolFor(level, REVIEW, m, p.words)?.length ?? 0),
    0,
  );
  const skills = [VERBS, NUMBERS, ALPHABET].map((id) => describeTopic(level, id)).filter((x) => x !== null);
  return (
    <div class="screen">
      <h1 class="screen-title">
        {level.id} · {t(`level_${level.id}`)}
      </h1>

      <h2 class="section-title">{t('practice')}</h2>
      <div class="topic-grid">
        <a class="topic-card special" href={href(level.slug, MIXED)}>
          <span class="topic-emoji">🎲</span>
          <span class="topic-name">{t('mixed')}</span>
          <span class="topic-meta">{t('mixedSub')}</span>
        </a>
        {reviewCount > 0 ? (
          <a class="topic-card special" href={href(level.slug, REVIEW)}>
            <span class="topic-emoji">🔁</span>
            <span class="topic-name">{t('review')}</span>
            <span class="topic-meta">{t('reviewSub', { n: reviewCount })}</span>
          </a>
        ) : (
          <div class="topic-card special locked">
            <span class="topic-emoji">🔁</span>
            <span class="topic-name">{t('review')}</span>
            <span class="topic-meta">{t('reviewEmpty')}</span>
          </div>
        )}
      </div>

      {level.chapters.length > 0 && (
        <>
          <h2 class="section-title">{t('chapters')}</h2>
          <ol class="chapter-list">
            {level.chapters.map((c) => (
              <li>
                <a class="chapter-row" href={href(level.slug, `chapter-${c.n}`)}>
                  <span class="chapter-n">{c.n}</span>
                  <span class="chapter-title">{c.title[uiLang()]}</span>
                  <span class="chapter-bar" aria-hidden="true">
                    <span style={{ width: `${chapterProgress(level, c.links) * 100}%` }} />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </>
      )}

      <h2 class="section-title">{t('skills')}</h2>
      <div class="topic-grid">
        {level.grammar.length > 0 && (
          <a class="topic-card" href={href(level.slug, 'grammar')}>
            <span class="topic-emoji">✏️</span>
            <span class="topic-name">{t('grammarLessons')}</span>
            <span class="topic-meta">{t('lessonsCount', { n: level.grammar.length })}</span>
          </a>
        )}
        {level.phrases.length > 0 && (
          <a class="topic-card" href={href(level.slug, 'phrases')}>
            <span class="topic-emoji">💬</span>
            <span class="topic-name">{t('phraseSets')}</span>
            <span class="topic-meta">{t('setsCount', { n: level.phrases.length })}</span>
          </a>
        )}
        {skills.map((info) => (
          <TopicCard level={level} info={info} />
        ))}
      </div>

      <h2 class="section-title">{t('vocabulary')}</h2>
      <div class="topic-grid">
        {level.topics.map((topic) => (
          <a class="topic-card" href={href(level.slug, topic.id)}>
            <span class="topic-emoji">{topic.emoji}</span>
            <span class="topic-name">{topic.title[uiLang()]}</span>
            <span class="topic-meta">
              {t('words', { n: wordsOf(level, topic).length })} · <StarCount level={level} topicId={topic.id} />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
