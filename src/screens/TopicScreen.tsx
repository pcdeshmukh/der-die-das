import { NounLabel } from '../components/NounLabel';
import { Stars } from '../components/Stars';
import type { Level } from '../data/types';
import { meaning, t, uiLang } from '../lib/i18n';
import { MIXED, NUMBERS, REVIEW, VERBS, grammarLesson, isPlayable, modesFor, poolFor, starKey } from '../lib/modes';
import { href } from '../lib/router';
import { speak, speechSupported } from '../lib/speech';
import { progress } from '../lib/store';
import { NotFound } from './NotFound';

const PSEUDO = {
  [MIXED]: { title: 'mixed', emoji: '🎲' },
  [REVIEW]: { title: 'review', emoji: '🔁' },
  [VERBS]: { title: 'verbs', emoji: '🔤' },
  [NUMBERS]: { title: 'numbersTopic', emoji: '🔢' },
} as const;

export function TopicScreen({ level, topicId }: { level: Level; topicId: string }) {
  const p = progress.value;
  const topic = level.topics.find((x) => x.id === topicId);
  const lesson = grammarLesson(level, topicId);
  const pseudo = PSEUDO[topicId as keyof typeof PSEUDO];
  const modes = modesFor(level, topicId);
  if ((!topic && !lesson && !pseudo) || modes.length === 0) return <NotFound />;

  const named = topic ?? lesson;
  const title = named ? named.title[uiLang()] : t(pseudo.title);
  const emoji = named ? named.emoji : pseudo.emoji;

  return (
    <div class="screen">
      <h1 class="screen-title">
        <span class="title-emoji">{emoji}</span> {title}
      </h1>
      {named && uiLang() !== 'de' && <p class="muted subtitle">{named.title.de}</p>}
      {lesson && <p class="rule-box">💡 {lesson.rule[uiLang()]}</p>}

      <div class="mode-list">
        {modes.map((mode) => {
          const pool = poolFor(level, topicId, mode, p.words) ?? [];
          // Review only lists games that have something to review.
          if (topicId === REVIEW && pool.length === 0) return null;
          const key = starKey(level, topicId, mode.id);
          const playable = isPlayable(mode, pool);
          const reason = mode.needsSpeech && !speechSupported ? t('needsSpeech') : t('tooFew');
          const body = (
            <>
              <span class="mode-icon">{mode.icon}</span>
              <span class="mode-text">
                <span class="mode-name">{lesson ? t('practice') : t(`mode_${mode.id}`)}</span>
                <span class="mode-desc">{playable ? t(`mode_${mode.id}_desc`) : reason}</span>
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
                  <span class="word-en">{meaning(n)}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {lesson && (
        <details class="word-list-box">
          <summary>
            {t('examples')} ({lesson.items.length})
          </summary>
          <ul class="word-list">
            {lesson.items.map((item) => {
              const full = item.q.includes('___') ? item.q.replace('___', item.a) : item.a;
              return (
                <li>
                  <button class="word-row" onClick={() => speak(full.split(' – ')[0], true)}>
                    <span class="word-main">{full}</span>
                    <span class="word-en">{meaning(item)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {topicId === VERBS && level.verbs && (
        <details class="word-list-box">
          <summary>
            {t('verbTable')} ({level.verbs.verbs.length})
          </summary>
          <div class="verb-tables">
            {level.verbs.verbs.map((v) => (
              <table class="verb-table">
                <caption>
                  <button class="link-btn" onClick={() => speak(v.infinitive, true)}>
                    {v.infinitive}
                  </button>{' '}
                  <span class="muted small">{meaning(v)}</span>
                </caption>
                <tbody>
                  {v.present.map((form, i) => (
                    <tr>
                      <td class="muted">{level.verbs!.pronouns[i]}</td>
                      <td>{form}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
