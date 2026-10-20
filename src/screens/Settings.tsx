import { t } from '../lib/i18n';
import { hasGermanVoice, speak, speechSupported } from '../lib/speech';
import { progress, resetProgress, updateSettings, type Settings as S } from '../lib/store';

function Toggle({ label, field }: { label: string; field: 'sound' | 'speech' | 'showHint' }) {
  const s: S = progress.value.settings;
  return (
    <label class="setting-row">
      <span>{label}</span>
      <input type="checkbox" class="switch" checked={s[field]} onChange={(e) => updateSettings({ [field]: e.currentTarget.checked })} />
    </label>
  );
}

export function Settings() {
  const lang = progress.value.settings.uiLang;
  return (
    <div class="screen">
      <h1 class="screen-title">{t('settings')}</h1>
      <div class="settings">
        <div class="setting-row">
          <span>{t('menuLang')}</span>
          <div class="segmented">
            <button class={lang === 'en' ? 'active' : ''} onClick={() => updateSettings({ uiLang: 'en' })}>
              English
            </button>
            <button class={lang === 'de' ? 'active' : ''} onClick={() => updateSettings({ uiLang: 'de' })}>
              Deutsch
            </button>
          </div>
        </div>
        <Toggle label={t('soundEffects')} field="sound" />
        {speechSupported ? (
          <>
            <Toggle label={t('speech')} field="speech" />
            <div class="setting-row">
              <span class="muted small">{hasGermanVoice() ? 'der Tisch, die Lampe, das Bett' : t('noVoice')}</span>
              <button class="btn small" onClick={() => speak('der Tisch, die Lampe, das Bett', true)}>
                🔊 {t('testVoice')}
              </button>
            </div>
          </>
        ) : (
          <p class="muted small">{t('noSpeech')}</p>
        )}
        <Toggle label={t('showHint')} field="showHint" />
        <div class="setting-row">
          <span />
          <button class="btn danger" onClick={() => confirm(t('resetConfirm')) && resetProgress()}>
            {t('reset')}
          </button>
        </div>
      </div>
      <p class="muted small">v{__APP_VERSION__}</p>
    </div>
  );
}
