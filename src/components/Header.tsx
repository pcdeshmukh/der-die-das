import { href } from '../lib/router';
import { t } from '../lib/i18n';
import { currentStreak, progress, updateSettings } from '../lib/store';

export function Header({ parts }: { parts: string[] }) {
  const p = progress.value;
  const lang = p.settings.uiLang;
  return (
    <header class="header">
      {parts.length ? (
        <a class="icon-btn" href={href(...parts.slice(0, -1))} aria-label={t('back')}>
          ←
        </a>
      ) : (
        <a class="brand" href="#/">
          <span class="art-der">der</span> <span class="art-die">die</span> <span class="art-das">das</span>
        </a>
      )}
      <div class="header-stats">
        <span title={t('streak')}>🔥 {currentStreak(p)}</span>
        <span title={t('xp')}>⭐ {p.xp}</span>
      </div>
      <div class="lang-toggle" role="group" aria-label={t('menuLang')}>
        {(['en', 'de'] as const).map((l) => (
          <button class={l === lang ? 'active' : ''} aria-pressed={l === lang} onClick={() => updateSettings({ uiLang: l })}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <a class="icon-btn" href="#/settings" aria-label={t('settings')}>
        ⚙️
      </a>
    </header>
  );
}
