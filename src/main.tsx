import { effect } from '@preact/signals';
import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { progress } from './lib/store';
import './styles.css';

effect(() => {
  document.documentElement.lang = progress.value.settings.uiLang;
});

registerSW({ immediate: true });

render(<App />, document.getElementById('app')!);
