import { signal } from '@preact/signals';

// Hash routing keeps GitHub Pages happy (no server-side rewrites needed).
const parse = () =>
  location.hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);

export const route = signal<string[]>(parse());

addEventListener('hashchange', () => {
  route.value = parse();
  scrollTo(0, 0);
});

export const href = (...parts: string[]) => '#/' + parts.map(encodeURIComponent).join('/');

export function navigate(...parts: string[]) {
  location.hash = href(...parts);
}
