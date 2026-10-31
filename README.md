# Career Bingo · 職場生存賓果

A bilingual (繁體中文 / English) 5×5 bingo game about surviving life in tech. Pick a role, get a card, mark what you've lived through, and export a share-ready PNG.

- 8 roles, each with its own prompt deck (PM, RD, QA, UI, UX, Marketing, AM, Everyone in Tech)
- 240 original prompts written natively in both languages
- 12-line bingo detection (rows, columns, diagonals); pre-marked center tile ☕ 「今天也有來上班」 / "Showed up anyway"
- Progress saved locally; switching language never reshuffles your card
- High-resolution PNG export, fully offline-capable
- No backend, no accounts, no tracking

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Vitest · html-to-image

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173/career-bingo/
npm test           # unit tests (logic, storage, question bank)
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build locally
```

Requires Node 20+.

## Deploy to GitHub Pages

The repo ships with `.github/workflows/deploy.yml`.

1. Push this project to a GitHub repo (e.g. `career-bingo`) on the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or run the workflow manually). It installs, runs the tests, builds, and publishes.
4. Your site is live at `https://<username>.github.io/<repo-name>/`.

The workflow sets `BASE_PATH=/<repo-name>/` automatically, so renaming the repo just works.

For a **user site** (`<username>.github.io`) or a **custom domain**, build with `BASE_PATH=/`:

```bash
BASE_PATH=/ npm run build
```

## Project structure

```
src/
  types.ts                 Role, Lang, Prompt, GameState
  data/
    questions.ts           Question bank — stable IDs + zh-TW/en text
    roles.ts               Role names, emoji, tint/accent colors
  i18n/translations.ts     All UI copy in both languages
  lib/
    bingo.ts               Pure game logic: sampling, 12 lines, new-line detection
    storage.ts             localStorage load/save + validation of stale data
    export.ts              DOM → PNG (3× pixel ratio)
  hooks/useGame.ts         Single source of truth for game state
  components/
    Header.tsx             Logo + language toggle
    Landing.tsx            Hero + CTA
    RolePicker.tsx         8 role cards
    BingoBoard.tsx         The exportable card (title, role, stats, grid)
    BingoTile.tsx          One tile; auto-shrinks text to fit
  (sizes in the game column use cqw so board + buttons scale together and fit the window height)
    Results.tsx            Export / new card / clear / switch role
    ConfirmDialog.tsx      Native <dialog> for destructive actions
  App.tsx                  Screens, celebration toasts, confirmation flow
.github/workflows/deploy.yml
```

### Key design decisions

- **The board stores prompt IDs, never text.** Language is purely a display concern, so toggling 中文/EN can't reshuffle or unmark anything.
- **Storage is validated on load.** Unknown roles, removed prompts, wrong-length boards, or corrupted JSON fall back safely (the board regenerates) instead of crashing. If localStorage is blocked, the game keeps working in memory and shows a small notice.
- **Celebrations fire only on newly completed lines** from a user's tap — not on reload, role switch, or re-rendering an unchanged line.
- **Confirmations only when there's something to lose.** "New card" and "Switch role" skip the dialog if nothing is marked.
- **Tiles auto-fit text.** Long prompts shrink in small steps instead of overflowing, so new content doesn't break the 375px layout.

## Adding prompts

Edit `src/data/questions.ts`:

- Append to the role's list with the next ID (e.g. `pm-031`). **Never renumber or reuse an ID** — saved boards reference them.
- Write each language natively; aim for under ~40 English characters.
- No real companies, products-as-brands, or real people.
- `npm test` checks for duplicate IDs, duplicate text, empty translations, role-prefix consistency, and minimum pool size.

### ⚠️ Content backlog

The brief targets **50 prompts per role (400 total)**. v1 ships **30 per role (240)**, prioritizing quality. **160 prompts remain** (20 per role). The tests enforce ≥30 per role; raise the threshold in `src/data/questions.test.ts` once the bank is complete.

## QA checklist

Automated (`npm test`, 32 tests):
- [x] 25 cells, pre-marked center at index 12, 24 unique prompts from the chosen role
- [x] Row/column/diagonal each = 1 line; intersecting lines counted separately; blackout = 12
- [x] Unmarking removes the line
- [x] Regenerate produces a different board
- [x] Language switch keeps board + marks; storage round-trips
- [x] Stale IDs, cross-role prompts, garbage JSON, and throwing storage handled
- [x] Question bank: unique IDs, no empty or duplicate text, ≥30 per role

Manual (verified in Chrome at 375px and 1280px):
- [x] No horizontal scroll at 375px
- [x] Refresh restores role, board, marks, and language
- [x] Celebration toast on a new line only
- [x] Clear marks / new card / switch role confirm when progress exists
- [x] PNG export includes title, role, line count, language; Chinese renders correctly
- [x] Keyboard: Tab through tiles, Space/Enter toggles, visible focus ring, Esc closes dialogs
- [ ] Spot-check export on iOS Safari and Android Chrome before sharing widely
- [ ] Reduced motion: enable OS setting and confirm animations are suppressed

## Future scope (not in v1)

User-submitted prompts, moderation, rankings, shared challenge links, cloud sync, optional Supabase backend.

---

Bella Chen
