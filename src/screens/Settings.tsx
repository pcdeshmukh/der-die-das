import { t } from '../lib/i18n';
import { hasGermanVoice, speak, speechSupported } from '../lib/speech';
import { progress, resetProgress, setUiLang, updateSettings, type HintLang, type Settings as S, type UiLang } from '../lib/store';

const LANG_NAMES: Record<UiLang, string> = { en: 'English', de: 'Deutsch', es: 'Español' };
const HINT_LANGS: HintLang[] = ['en', 'es'];

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
  const { uiLang: lang, hintLang } = progress.value.settings;
  return (
    <div class="screen">
      <h1 class="screen-title">{t('settings')}</h1>
      <div class="settings">
        <div class="setting-row">
          <span>{t('menuLang')}</span>
          <div class="segmented">
            {(Object.keys(LANG_NAMES) as UiLang[]).map((l) => (
              <button class={lang === l ? 'active' : ''} onClick={() => setUiLang(l)}>
                {LANG_NAMES[l]}
              </button>
            ))}
          </div>
        </div>
        <div class="setting-row">
          <span>{t('hintLang')}</span>
          <div class="segmented">
            {HINT_LANGS.map((l) => (
              <button class={hintLang === l ? 'active' : ''} onClick={() => updateSettings({ hintLang: l })}>
                {LANG_NAMES[l]}
              </button>
            ))}
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
