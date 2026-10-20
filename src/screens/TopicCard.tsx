import type { ComponentChildren } from 'preact';
import type { Level } from '../data/types';
import { modesFor, type TopicInfo } from '../lib/modes';
import { href } from '../lib/router';
import { progress } from '../lib/store';

/** Stars earned across a topic's games, out of the maximum. */
export function StarCount({ level, topicId }: { level: Level; topicId: string }) {
  const p = progress.value;
  const modes = modesFor(level, topicId);
  const earned = modes.reduce((sum, m) => sum + (p.stars[`${level.id}/${topicId}/${m.id}`] ?? 0), 0);
  return (
    <>
      <span class="star on">★</span> {earned}/{modes.length * 3}
    </>
  );
}

export function TopicCard({ level, info, meta }: { level: Level; info: TopicInfo; meta?: ComponentChildren }) {
  return (
    <a class="topic-card" href={href(level.slug, info.id)}>
      <span class="topic-emoji">{info.emoji}</span>
      <span class="topic-name">{info.title}</span>
      <span class="topic-meta">
        {meta && <>{meta} · </>}
        <StarCount level={level} topicId={info.id} />
      </span>
    </a>
  );
}
