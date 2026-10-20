import type { ComponentChildren } from 'preact';
import { t } from '../lib/i18n';

export function GameBar({ value, onQuit, children }: { value: number; onQuit: () => void; children?: ComponentChildren }) {
  return (
    <div class="game-bar">
      <button class="icon-btn" onClick={onQuit} aria-label={t('quit')}>
        ✕
      </button>
      <div class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
        <div class="progress-fill" style={{ width: `${value * 100}%` }} />
      </div>
      <div class="game-bar-extra">{children}</div>
    </div>
  );
}
