# der die das

German learning games for the browser, level by level (A1 → C2). Play on your phone or desktop:
**https://pcdeshmukh.github.io/der-die-das/**

Works offline and can be added to your home screen. Progress is saved in your browser.

## Games (A1)

Every vocabulary topic has:

- **Der · Die · Das**: pick the right article for a noun.
- **Word Match**: match German nouns to their English meaning.
- **Plural Rush**: pick the right plural among plausible wrong ones.
- **Listen & Pick**: hear a word and pick what you heard (needs browser speech).
- **Sentence Builder**: put shuffled words into a correct German sentence.

Plus, under *Grammar & skills*:

- **Conjugation**: present tense of 37 A1 verbs, including stem changes and modals.
- **Numbers**: read, write and hear numbers up to 999 (watch out for 47 vs 74).
- **Telling the time**: everyday ("halb drei") and official ("vierzehn Uhr dreißig") time.
- **Grammar lessons**, each with a short rule and a practice round: *ein/eine*, accusative
  (*den/einen*), *nicht/kein*, possessives (*mein/dein/sein/ihr*), *er/sie/es*, question words,
  *am/um/im*, and separable verbs.

**Daily challenge**: 12 mixed questions (articles, meanings, plurals, verbs, grammar, numbers or
time), the same for everyone on a given day, one attempt per day, with its own streak and a bonus.

**Mixed** draws from every topic, and **Review** collects whatever you last got wrong in any game.
Items you miss come back sooner (Leitner-style spaced repetition).

Menus are available in English, German and Spanish. Meanings and translations are shown in English
or Spanish; with German menus you choose which one in Settings.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # content + logic tests
npm run build    # production build into dist/
```

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Adding content

Content lives in `src/data/<level>/`. Each topic file has `nouns` and `sentences`:

```json
{ "de": "Tisch", "article": "der", "plural": "Tische", "en": "table", "es": "mesa", "emoji": "🪑" }
{ "de": "Wo ist der Bahnhof?", "en": "Where is the train station?", "es": "¿Dónde está la estación de tren?" }
```

Verbs are in `verbs.json` with their six present-tense forms, and grammar lessons in `grammar.json`
(a rule plus gap sentences like `"Ich habe ___ Hund."`). Numbers and times are generated.

Register a new topic file in `src/data/index.ts`. A level with topics becomes playable automatically.
`npm test` checks articles, duplicates, that everything has English and Spanish translations
(unique per topic), sentence punctuation,
verb tables, and the number/time generators.

## Stack

Preact + TypeScript + Vite, `@preact/signals` for state, `vite-plugin-pwa` for offline support.

## License

[Apache License 2.0](LICENSE)
