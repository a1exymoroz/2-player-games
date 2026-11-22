# 2 Player Games

A collection of classic 2-player games built with Angular 17, meant to be played by two people sharing one device/keyboard.

## Games Available

- 🏎️ **Car Duel** — Two cars, one screen: touch the other driver's head to win the round, but if your own head hits anything, or you sink or fly off the screen, you lose it. First to 5. Built in Unity 6 (2D physics) and embedded as a Web build; red drives with `A`/`D`, blue with `←`/`→`, or the on-screen ◄ ► buttons on touch screens. 12 arenas, rising water in sudden death.
- 🔴 **Connect Four** — Classic disc-drop strategy game. Get four in a row (horizontally, vertically, or diagonally) before your opponent.
- 🚢 **Battleship** — Place your fleet, then take turns firing at your opponent's grid to sink their ships first. Pass-and-play on a single device.
- ⭕ **Tic Tac Toe** — The classic X and O game. Get three in a row to win.
- 🧩 **Ultimate Tic Tac Toe** — A 3×3 grid of tic-tac-toe boards. The cell you play sends your opponent to the matching board next; win 3 boards in a row on the meta-board to take the game.

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
- [Unity 6](https://unity.com/) Web build — Car Duel (served from `src/assets/car-game`, framed by an Angular page)

See [docs/STACK.md](docs/STACK.md) for the full technical breakdown.
