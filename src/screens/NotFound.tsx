import { t } from '../lib/i18n';

export function NotFound() {
  return (
    <div class="screen center">
      <p class="results-emoji">🤷</p>
      <p>{t('notFound')}</p>
      <a class="btn primary" href="#/">
        {t('goHome')}
      </a>
    </div>
  );
}
