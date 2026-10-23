import { signal } from '@preact/signals';

// Hash routing keeps GitHub Pages happy (no server-side rewrites needed).
const parse = () =>
  (typeof location === 'undefined' ? '' : location.hash)
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);

export const route = signal<string[]>(parse());

// Tests import this module outside a browser.
if (typeof window !== 'undefined') {
  addEventListener('hashchange', () => {
    route.value = parse();
    scrollTo(0, 0);
  });
}

export const href = (...parts: string[]) => '#/' + parts.map(encodeURIComponent).join('/');

export function navigate(...parts: string[]) {
  location.hash = href(...parts);
}
