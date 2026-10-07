# Arrow Escape

**Clear the path. Escape the board.**

Arrow Escape is a casual logic puzzle for the browser. Every board is full of arrows, and each one can only slide the way it points. Tap an arrow to send it off the board, but only if nothing is in its path. Clear every arrow to win.

It is a fully static React + Vite app: no backend, no accounts, no external APIs. It deploys anywhere that can serve files.

## Features

- **100 levels** across six difficulty tiers, from 3×3 boards up to 8×8 expert puzzles
- **Every level is verified solvable** by a solver, in the generator, in the test suite and at runtime
- **Responsive**: built for phones first (320px and up), with tablet, desktop and landscape layouts
- **Offline-ready PWA**: web manifest plus a service worker that precaches the whole game
- **Local progress**: unlocked levels, best scores, stars and settings are saved in `localStorage`
- **Undo, restart and hints**
- **Stars and best scores** for every level
- **Keyboard support and accessibility**: semantic buttons, labels, visible focus, screen-reader announcements and reduced motion
- **Synthesized sound effects** made with the Web Audio API, so there are no audio files to download
- **No backend**: nothing to host besides static files

## How to play

1. Tap an arrow. It slides off the board in the direction it points.
2. If another arrow is **anywhere** in its path, it's blocked and won't move.
3. Clear every arrow to finish the level.

The perfect score for a level equals its number of arrows, since each arrow needs exactly one move. **Bumping a blocked arrow costs a move**, and so does **asking for a hint**. Fewer wasted moves earn more stars. Undo takes back your last escape, but bumps and hints stay counted.

| Key           | Action                 |
| ------------- | ---------------------- |
| `Tab` / `Enter` | Move between and press controls and arrows |
| `Esc`         | Go back                |
| `R`           | Restart level          |
| `U`           | Undo                   |
| `H`           | Hint                   |

## Development

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm test                 # unit tests (engine, game state, solver, validator, storage, scoring, all 100 levels)
npm run lint             # oxlint
npm run levels:validate  # validate every level and print difficulty stats per tier
npm run levels:generate  # regenerate src/data/levels.js (deterministic)
```

Node 20.19+ (or 22.12+) is required, as for Vite 8.

## Build

```bash
npm run build     # outputs static files to dist/
npm run preview   # serve the production build locally (service worker enabled)
```

The build uses a relative base path (`./`), so the same `dist/` works at a domain root and in a sub-folder.

### Canonical and social URLs

Canonical and Open Graph tags need the site's public URL. Set it at build time:

```bash
SITE_URL=https://arrow-escape.example.com npm run build
```

Vercel (`VERCEL_PROJECT_PRODUCTION_URL`) and Netlify (`URL`) provide this automatically. Without it, the tags fall back to page-relative URLs.

## Deployment

### Vercel

1. Import the repository in Vercel.
2. It detects Vite automatically: build command `npm run build`, output directory `dist`.
3. Deploy. No environment variables are required.

### Netlify

1. Add a new site from the repository.
2. Build command: `npm run build`. Publish directory: `dist`.
3. Deploy.

### GitHub Pages

1. In the repository settings, go to **Pages** and set the source to **GitHub Actions**.
2. Add `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          SITE_URL: https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

Because the base path is relative, no extra configuration is needed for the `/<repo>/` sub-path.

### Any static host

Upload the contents of `dist/`. The game is a single page with no client-side routes, so no rewrite rules are needed.

## Project structure

```text
src/
├── components/        UI: screens (Home, LevelSelect, GameScreen, HowToPlay, Settings),
│                      Arrow, GameBoard, GameHeader, GameControls, CompletionModal, Logo, …
├── data/
│   ├── levels.js      100 levels as compact grids ("^ v < > .") — generated
│   └── tiers.js       difficulty tiers and board sizes
├── game/              framework-free logic
│   ├── engine.js      canArrowEscape, getBlockingArrow, moveArrow, getValidMoves, getHintMove, …
│   ├── gameState.js   gameplay state machine (taps, escapes, undo, hints, restart)
│   ├── solver.js      complete solver + difficulty metrics
│   ├── validator.js   structural + solvability checks for levels
│   ├── levelFormat.js grid <-> level object encoding
│   ├── scoring.js     star thresholds
│   ├── storage.js     versioned, sanitized localStorage persistence
│   └── sound.js       Web Audio sound effects
├── hooks/             useGame (gameplay reducer), useProgress, keyboard + motion hooks
└── styles/            variables (design tokens), global, game, screens, responsive
scripts/               level generator and validator
tests/                 node:test unit tests
pwa/service-worker.js  service worker template (precache list injected at build)
```

### How levels are made

`scripts/generate-levels.mjs` builds each board in reverse solution order. Every new arrow must have a clear path at the moment it is placed, so the board is solvable by construction. Placement is biased to create dependency chains, many candidates are scored (target arrow count, chain depth, few free arrows at the start, direction balance, few "giveaway" edge arrows), and the best is refined with a local search. About a third of the boards are symmetric. The output is then re-checked by the independent solver and validator.

Because removing an arrow can only ever clear paths, the game is monotonic: a free arrow stays free. That makes a greedy solver complete, so validation is fast and exact.

## Credits

Font: [Nunito](https://github.com/googlefonts/nunito) (SIL Open Font License), self-hosted through `@fontsource-variable/nunito`. Only the Latin subset is loaded.
