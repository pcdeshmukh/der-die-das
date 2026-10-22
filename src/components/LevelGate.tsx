import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getLevel, loadLevel } from '../data';
import type { Level, LevelId } from '../data/types';
import { t } from '../lib/i18n';

/** Renders its children once the level's content chunk has loaded. */
export function LevelGate({ id, children }: { id: LevelId; children: (level: Level) => ComponentChildren }) {
  const level = getLevel(id);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!level) loadLevel(id).catch(() => setFailed(true));
  }, [id, level]);
  if (level) return <>{children(level)}</>;
  return (
    <div class="screen center">
      <p class="muted">{failed ? t('loadFailed') : t('loading')}</p>
    </div>
  );
}
