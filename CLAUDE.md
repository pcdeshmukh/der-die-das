# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

German learning games (A1 and A2 now, B1–C2 later) as a static Preact + TypeScript + Vite PWA, hosted on GitHub Pages at https://pcdeshmukh.github.io/der-die-das/. Single player only: there is no backend, and all progress lives in `localStorage`.

## Commands

```sh
npm run dev                       # dev server
npm test                          # vitest, all tests
npx vitest run src/data           # content tests only
npx vitest run -t "phrase set"    # tests whose name matches
npx tsc --noEmit                  # type-check (also the first step of npm run build)
npm run build                     # tsc + vite build into dist/
npm run preview                   # serve dist/ at /der-die-das/
npm run icons                     # regenerate PWA icons from public/logo.svg
```

There is no linter. Pushing to `main` runs tests, builds, and deploys to Pages (`.github/workflows/deploy.yml`). The repo has a PR-required ruleset, but pushing directly to `main` is fine for this owner.

## Architecture

**Content is data, not code.** Everything a learner sees lives in `src/data/<level>/*.json` (`a1`, `a2`), and each level's `src/data/<level>/index.ts` imports its JSON files and exports them as one `LevelContent` (topics, verbs, grammar, phrases, chapters). New JSON files must be imported there.
- Each level is its own lazily loaded chunk: `LOADERS` in `src/data/index.ts` maps level ids to `import('./a1')` etc. Levels without a loader are "coming soon" (B1+). `LEVELS` holds only `id`/`slug`/`available`; screens get content through `<LevelGate>` (`src/components/LevelGate.tsx`), which calls `loadLevel` and renders once it arrives. Tests call `await loadAllLevels()`.
- The service worker doesn't precache level chunks; they're cached on first use (`runtimeCaching` in `vite.config.ts`, matching `assets/[abc][12]-*.js`). Keep a new level's directory named like `b1` so its chunk matches.
- Topic files: `nouns` (`de`, `article`, `plural|null`, `en`, `es`, optional `emoji`) plus `sentences`.
- `verbs.json`: six present forms per verb, plus `prompts`, the pronouns a conjugation prompt may show. A1 uses bare "sie" only for "she". From A2, verbs also carry `preterite` (six forms) and `perfect` (`"hat gemacht"`/`"ist gegangen"`); the verbs page offers the Präteritum and Perfekt modes only when a level's verbs have them.
- `grammar*.json`: lessons with a rule and gap items (`q` contains `___`). With `shuffle: true`, the options are whole sentences instead.
- `phrases*.json`: a situation, the right German phrase `a`, and `wrong` options.
- `chapters.json`: maps the 24 syllabus chapters to content ids.

**No made-up words, anywhere.** Every option a learner sees must be made of real German word forms. A wrong option may be wrong in context (wrong case, tense, person, word order, function), but never an invented form like *gehte*, *Kochin* or *gebackt*. Generated options follow the same rule: Plural Rush asks for the ending in dictionary notation (`pluralEndingOptions` in `src/lib/german.ts`), and verb games offer only the verb's own real forms (checked in `src/games/verbs.test.ts`).

`src/data/data.test.ts` and `src/lib/chapters.test.ts` are the content contract. They check:
- valid articles, and no noun duplicated across topics
- `en` and `es` on everything, unique per topic (Word Match pairs them)
- sentence punctuation (Sentence Builder splits on spaces)
- grammar items: one gap, answer in its options, capitalised options when the gap starts the sentence
- phrase-set shape
- every chapter link resolves, and every topic and lesson is in some chapter

**Topic ids double as routes.** Hash routing: `#/<level>/<topicId>/<modeId>`; see `src/lib/router.ts` and `src/app.tsx`.
- Plain ids are vocabulary topics. `g-<id>` is a grammar lesson and `p-<id>` a phrase set.
- Pseudo-topics: `mixed`, `review`, `verbs`, `numbers`, `alphabet`.
- `grammar`, `phrases` and `chapter-N` are list and chapter pages.

`src/lib/modes.ts` is the hub tying them together:
- `MODES` registry, each mode with a section and SRS skill
- `modesFor(level, topicId)`: which games a page offers
- `poolFor`: the items a round draws from (Review = items whose last answer was wrong)
- `describeTopic`: title and emoji for any id
- `starKey`: where best stars are stored

**Games.** `src/screens/GameScreen.tsx` maps mode ids to game components.
- Most games are thin builders over `src/games/ChoiceGame.tsx` (one question, pick an option, auto-advance on correct, results screen). Each builder exports an `xxxQuestion()` function returning `ChoiceQuestion`s. A question carries its own `skill`, `statId`, `layout` and `optionClass`, so one round can mix kinds.
- `DailyGame.tsx` composes those builders into 12 questions inside `withSeed('daily:<level>:<date>')`, so everyone gets the same set each day. Any randomness that question builders use must go through `src/lib/random.ts` (`random`, `randInt`, `shuffle`), never `Math.random`, or the daily set stops being deterministic.
- `MatchGame` and `SentenceGame` have their own interaction and don't use ChoiceGame.
- **Challenges** (`src/games/challenge.ts`, `src/screens/ChallengeScreen.tsx`): a timed round anyone can replay from a link, `#/challenge/<level>/<topic>/<mode>/<seed>[/<name>/<correct>/<total>/<seconds>]`. The seed fixes the questions (`withSeed`, with empty SRS stats so picking doesn't depend on the player), and the link carries the challenger's result; there is no server. Results screens of challengeable games show "Challenge a friend" through the `ChallengeLink` context that `GameScreen` provides. Games with speech or their own interaction (listen, match, sentences, alphabet) aren't challengeable.
- **Typing** (`settings.typing`, the switch on topic pages): modes marked `typeable` get `typing` in their `GameProps`, and ChoiceGame then shows a text field for questions that carry `typed` (accepted answers, optional own prompt and hint). Grading is in `src/lib/typing.ts`: exact, close (case or ae/oe/ue/ss, counted right with a spelling note), or wrong. Grammar items without a gap stay multiple choice. `src/games/typing.test.ts` checks every typed answer against the content.
- Generated content (numbers, clock times, plural endings) comes from `src/lib/german.ts`.

**State.** `src/lib/store.ts` keeps one `@preact/signals` signal, `progress`, persisted to `localStorage` (`der-die-das:v1`). It holds XP, the day streak, daily-challenge results and streak, per-item SRS stats (keyed `skill|itemId`, Leitner boxes in `src/lib/srs.ts`), best stars and settings.
- Components that read `progress.value` re-render automatically.
- Game components snapshot with `progress.peek()` when picking a round, so answers recorded mid-round don't reshuffle it.
- New settings fields need defaults in `defaults()`; `load()` merges saved data over them.

**Languages.** `src/lib/i18n.ts` holds the UI strings for `en`, `de` and `es`; the `Strings` type forces every key into all three.
- `t(key, vars)` is for UI text. `meaning(x)` picks a content item's `en` or `es` according to `settings.hintLang`.
- Choosing EN or ES menus also switches `hintLang`; German menus keep the chosen translation language (`setUiLang` in `src/lib/store.ts`).
- Never render `.en` directly. Spanish is Spain Spanish (coche, móvil, ordenador).

**Platform constraints.**
- `vite.config.ts` sets `base: '/der-die-das/'`; hash routing avoids server rewrites.
- The service worker (vite-plugin-pwa, autoUpdate) caches aggressively. When checking a new build in a browser, unregister it or clear caches first. Players can do the same with Settings → Update app (`src/lib/update.ts`), which keeps their progress.
- Speech uses the browser's `speechSynthesis` (`src/lib/speech.ts`). Modes with `needsSpeech` are disabled where it's unsupported. Sound effects are synthesized in `src/lib/sfx.ts`.
- Styling is a single `src/styles.css` with CSS variables and dark mode via `prefers-color-scheme`, laid out mobile-first (max-width 640px).
