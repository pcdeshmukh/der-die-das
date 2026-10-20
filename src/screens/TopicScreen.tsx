import { NounLabel } from '../components/NounLabel';
import { Stars } from '../components/Stars';
import type { Level } from '../data/types';
import { t, uiLang } from '../lib/i18n';
import { MIXED, MODES, REVIEW, poolFor, starKey } from '../lib/modes';
import { href } from '../lib/router';
import { speak } from '../lib/speech';
import { progress } from '../lib/store';
import { NotFound } from './NotFound';

export function TopicScreen({ level, topicId }: { level: Level; topicId: string }) {
  const p = progress.value;
  const topic = level.topics.find((x) => x.id === topicId);
  if (!topic && topicId !== MIXED && topicId !== REVIEW) return <NotFound />;

  const title = topic ? topic.title[uiLang()] : t(topicId === MIXED ? 'mixed' : 'review');
  const emoji = topic ? topic.emoji : topicId === MIXED ? '🎲' : '🔁';

  return (
    <div class="screen">
      <h1 class="screen-title">
        <span class="title-emoji">{emoji}</span> {title}
      </h1>
      {topic && uiLang() === 'en' && <p class="muted subtitle">{topic.title.de}</p>}

      <div class="mode-list">
        {MODES.map((mode) => {
          const pool = poolFor(level, topicId, mode.skill, p.words) ?? [];
          const key = starKey(level, topicId, mode.id);
          const playable = pool.length >= mode.min;
          const body = (
            <>
              <span class="mode-icon">{mode.icon}</span>
              <span class="mode-text">
                <span class="mode-name">{t(`mode_${mode.id}`)}</span>
                <span class="mode-desc">{playable ? t(`mode_${mode.id}_desc`) : t('tooFew')}</span>
              </span>
              {key ? <Stars value={p.stars[key] ?? 0} /> : <span class="badge">{pool.length}</span>}
            </>
          );
          return playable ? (
            <a class="mode-card" href={href(level.slug, topicId, mode.id)}>
              {body}
            </a>
          ) : (
            <div class="mode-card locked">{body}</div>
          );
        })}
      </div>
      <p class="muted small">{t('moreSoon')}</p>

      {topic && (
        <details class="word-list-box">
          <summary>
            {t('wordList')} ({topic.nouns.length})
          </summary>
          <p class="muted small">{t('tapToHear')}</p>
          <ul class="word-list">
            {topic.nouns.map((n) => (
              <li>
                <button class="word-row" onClick={() => speak(`${n.article} ${n.de}`, true)}>
                  <span class="word-emoji">{n.emoji ?? ''}</span>
                  <span class="word-main">
                    <NounLabel noun={n} />
                    {n.plural && <span class="word-plural">die {n.plural}</span>}
                  </span>
                  <span class="word-en">{n.en}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
