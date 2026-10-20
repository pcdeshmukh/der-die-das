# der die das

German learning games for the browser, level by level (A1 → C2). Play on your phone or desktop:
**https://pcdeshmukh.github.io/der-die-das/**

Works offline and can be added to your home screen. Progress is saved in your browser.

## Games (A1)

- **Der · Die · Das**: pick the right article for a noun.
- **Word Match**: match German nouns to their English meaning.

Each topic has both games, plus **Mixed** (all topics) and **Review** (words you last got wrong).
Words you miss come back sooner (Leitner-style spaced repetition).

Menus can be switched between English and German.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # content + logic tests
npm run build    # production build into dist/
```

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Adding content

Vocabulary lives in `src/data/<level>/<topic>.json`:

```json
{ "de": "Tisch", "article": "der", "plural": "Tische", "en": "table", "emoji": "🪑" }
```

Register a new topic file in `src/data/index.ts`. A level with topics becomes playable automatically.
`npm test` checks articles, duplicates, and that English meanings are unique within a topic.

## Stack

Preact + TypeScript + Vite, `@preact/signals` for state, `vite-plugin-pwa` for offline support.

## License

[Apache License 2.0](LICENSE)
