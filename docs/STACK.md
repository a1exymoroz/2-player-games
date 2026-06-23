# Tech Stack

Technology stack for **2 Player Games** — a collection of classic 2-player games built as a client-side Angular application.

## Frontend

| Layer | Technology |
|-------|------------|
| **Framework** | [Angular](https://angular.dev/) 17.3 |
| **Language** | [TypeScript](https://www.typescriptlang.org/) 5.4 (strict mode) |
| **Styling** | [SCSS](https://sass-lang.com/) (component-scoped + global `styles.scss`) |
| **Routing** | Angular Router (`provideRouter`) |
| **Animations** | `@angular/animations` |
| **Forms** | `@angular/forms` (available; games use component state today) |

## Architecture & Patterns

- **Standalone components** — no NgModules; each component declares its own `imports`
- **Client-side only** — no backend, API, or database
- **In-memory game state** — logic lives in components (e.g. Tic Tac Toe board, scores)
- **RxJS** 7.8 — included with Angular (minimal direct use so far)
- **Zone.js** 0.14 — Angular change detection

## Build & Tooling

| Tool | Purpose |
|------|---------|
| **Angular CLI** 17.3 | Scaffolding, dev server, production builds |
| **`@angular-devkit/build-angular`** | Application builder (`application` target) |
| **Node.js** 18+ | Runtime |
| **npm** | Package manager |

## Testing

| Tool | Purpose |
|------|---------|
| **Karma** 6.4 | Test runner |
| **Jasmine** 5.1 | Test framework |
| **karma-jasmine-html-reporter** | HTML test reports |
| **karma-coverage** | Code coverage |

## Project Structure

```
src/
├── app/
│   ├── pages/home/          # Game selection landing page
│   ├── games/tic-tac-toe/   # Tic Tac Toe game
│   ├── app.routes.ts        # Route definitions
│   └── app.config.ts        # App providers (router)
├── styles.scss              # Global styles
└── main.ts                  # Bootstrap entry point
```

## Runtime & Deployment

- **Dev server:** `ng serve` → `http://localhost:4200`
- **Production build:** static output to `dist/two-player-games`
- **Target:** ES2022 (browser)
- **Hosting:** any static host (Netlify, Vercel, GitHub Pages, etc.)

## What's Not in the Stack

- No backend (Node, Python, etc.)
- No database
- No real-time multiplayer (WebSockets, Firebase, etc.)
- No state management library (NgRx, Akita, etc.)
- No UI component library (Material, PrimeNG, etc.)
- No CSS framework (Bootstrap, Tailwind, etc.)

## Summary

A single-page **Angular 17** app with **TypeScript** and **SCSS**, using standalone components and client-side game logic. It is a frontend-only static application designed for local 2-player play on one device.
