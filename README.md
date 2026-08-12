# 2 Player Games

A collection of classic 2-player games built with Angular 17, meant to be played by two people sharing one device/keyboard.

## Games Available

- 🏎️ **Car Duel** — Two cars race and ram each other across physics-based tracks (Matter.js). Player 1 drives with `←`/`→`, Player 2 with `A`/`D`, and `Space` resets. Knock your opponent off the track or over a rising water hazard to win. Multiple levels: Oval Track, Floating Islands, See-Saw, Sky Hooks.
- 🔴 **Connect Four** — Classic disc-drop strategy game. Get four in a row (horizontally, vertically, or diagonally) before your opponent.
- 🚢 **Battleship** — Place your fleet, then take turns firing at your opponent's grid to sink their ships first. Pass-and-play on a single device.
- ⭕ **Tic Tac Toe** — The classic X and O game. Get three in a row to win.

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

### Build

Create a production build:

```bash
npm run build
```

## Features

- Modern, responsive UI
- Score tracking
- Smooth animations
- Pass-and-play design — no accounts, no backend, everything runs locally in the browser
- Mobile-friendly design

## Tech Stack

- Angular 17 (standalone components)
- TypeScript
- SCSS
- [Matter.js](https://brm.io/matter-js/) — 2D physics engine powering Car Duel

See [docs/STACK.md](docs/STACK.md) for the full technical breakdown.
