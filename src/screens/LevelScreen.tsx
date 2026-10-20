import { wordsOf } from '../data';
import type { Level } from '../data/types';
import { t, uiLang } from '../lib/i18n';
import { GRAMMAR_PREFIX, MODES, NUMBERS, REVIEW, MIXED, VERBS, modesFor, poolFor } from '../lib/modes';
import { href } from '../lib/router';
import { progress } from '../lib/store';

function StarCount({ level, topicId }: { level: Level; topicId: string }) {
  const p = progress.value;
  const modes = modesFor(level, topicId);
  const earned = modes.reduce((sum, m) => sum + (p.stars[`${level.id}/${topicId}/${m.id}`] ?? 0), 0);
  return (
    <>
      <span class="star on">★</span> {earned}/{modes.length * 3}
    </>
  );
}

export function LevelScreen({ level }: { level: Level }) {
  const p = progress.value;
  const reviewCount = MODES.filter((m) => m.skill).reduce(
    (n, m) => n + (poolFor(level, REVIEW, m, p.words)?.length ?? 0),
    0,
  );
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

      <h2 class="section-title">{t('grammar')}</h2>
      <div class="topic-grid">
        {level.verbs && (
          <a class="topic-card" href={href(level.slug, VERBS)}>
            <span class="topic-emoji">🔤</span>
            <span class="topic-name">{t('verbs')}</span>
            <span class="topic-meta">
              {t('verbsSub', { n: level.verbs.verbs.length })} · <StarCount level={level} topicId={VERBS} />
            </span>
          </a>
        )}
        <a class="topic-card" href={href(level.slug, NUMBERS)}>
          <span class="topic-emoji">🔢</span>
          <span class="topic-name">{t('numbersTopic')}</span>
          <span class="topic-meta">
            {t('numbersSub')} · <StarCount level={level} topicId={NUMBERS} />
          </span>
        </a>
        {level.grammar.map((lesson) => (
          <a class="topic-card" href={href(level.slug, GRAMMAR_PREFIX + lesson.id)}>
            <span class="topic-emoji">{lesson.emoji}</span>
            <span class="topic-name">{lesson.title[uiLang()]}</span>
            <span class="topic-meta">
              {t('exercises', { n: lesson.items.length })} · <StarCount level={level} topicId={GRAMMAR_PREFIX + lesson.id} />
            </span>
          </a>
        ))}
      </div>

      <h2 class="section-title">{t('topics')}</h2>
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
