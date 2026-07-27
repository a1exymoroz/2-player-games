import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type ShotMark = null | 'hit' | 'miss';
type Orientation = 'H' | 'V';
type Phase = 'setup' | 'battle' | 'gameover';

interface Coord {
  row: number;
  col: number;
}

interface ShipConfig {
  name: string;
  size: number;
}

interface ShipInstance extends ShipConfig {
  cells: Coord[];
  hitCells: boolean[];
}

interface PlayerState {
  shipGrid: boolean[][];
  ships: ShipInstance[];
  unplacedShips: ShipConfig[];
  shots: ShotMark[][];
}

const GRID_SIZE = 10;

const SHIP_CONFIGS: ShipConfig[] = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 }
];

@Component({
  selector: 'app-battleship',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './battleship.component.html',
  styleUrl: './battleship.component.scss'
})
export class BattleshipComponent {
  readonly gridSize = GRID_SIZE;
  readonly colLabels = 'ABCDEFGHIJ'.split('');

  players: PlayerState[] = [this.createPlayerState(), this.createPlayerState()];
  activePlayerIndex: 0 | 1 = 0;
  phase: Phase = 'setup';
  awaitingPass = true;
  passMessage = 'Pass the device to Player 1';

  orientation: Orientation = 'H';
  selectedShipName: string | null = SHIP_CONFIGS[0].name;
  placementError: string | null = null;
  hoveredCell: Coord | null = null;

  winnerIndex: 0 | 1 | null = null;
  scores = { 0: 0, 1: 0 };

  private createPlayerState(): PlayerState {
    return {
      shipGrid: this.createGrid(false),
      ships: [],
      unplacedShips: SHIP_CONFIGS.map(s => ({ ...s })),
      shots: this.createGrid(null)
    };
  }

  private createGrid<T>(fill: T): T[][] {
    return Array.from({ length: GRID_SIZE }, () => Array<T>(GRID_SIZE).fill(fill));
  }

  gridIndices(): number[] {
    return Array.from({ length: GRID_SIZE }, (_, i) => i);
  }

  get activePlayer(): PlayerState {
    return this.players[this.activePlayerIndex];
  }

  get defenderIndex(): 0 | 1 {
    return this.activePlayerIndex === 0 ? 1 : 0;
  }

  get defender(): PlayerState {
    return this.players[this.defenderIndex];
  }

  // ---------- Placement ----------

  selectShip(name: string): void {
    this.selectedShipName = name;
    this.placementError = null;
  }

  toggleOrientation(): void {
    this.orientation = this.orientation === 'H' ? 'V' : 'H';
  }

  private computeCells(row: number, col: number, size: number, orientation: Orientation): Coord[] {
    const cells: Coord[] = [];
    for (let i = 0; i < size; i++) {
      cells.push(orientation === 'H' ? { row, col: col + i } : { row: row + i, col });
    }
    return cells;
  }

  private cellsInBounds(cells: Coord[]): boolean {
    return cells.every(c => c.row >= 0 && c.row < GRID_SIZE && c.col >= 0 && c.col < GRID_SIZE);
  }

  private cellsFree(player: PlayerState, cells: Coord[]): boolean {
    return cells.every(c => !player.shipGrid[c.row][c.col]);
  }

  private hasAdjacentShip(player: PlayerState, cells: Coord[]): boolean {
    return cells.some(c => {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = c.row + dr;
          const col = c.col + dc;
          if (r >= 0 && r < GRID_SIZE && col >= 0 && col < GRID_SIZE && player.shipGrid[r][col]) {
            return true;
          }
        }
      }
      return false;
    });
  }

  private isValidPlacement(player: PlayerState, cells: Coord[]): boolean {
    return this.cellsInBounds(cells) && this.cellsFree(player, cells) && !this.hasAdjacentShip(player, cells);
  }

  placeShip(row: number, col: number): void {
    if (this.phase !== 'setup' || !this.selectedShipName) {
      return;
    }

    const player = this.activePlayer;
    const config = player.unplacedShips.find(s => s.name === this.selectedShipName);
    if (!config) {
      return;
    }

    const cells = this.computeCells(row, col, config.size, this.orientation);
    if (!this.isValidPlacement(player, cells)) {
      this.placementError = 'Ships must stay on the grid and cannot overlap or touch other ships.';
      return;
    }

    cells.forEach(c => (player.shipGrid[c.row][c.col] = true));
    player.ships.push({ ...config, cells, hitCells: cells.map(() => false) });
    player.unplacedShips = player.unplacedShips.filter(s => s.name !== config.name);
    this.selectedShipName = player.unplacedShips[0]?.name ?? null;
    this.placementError = null;
  }

  removeShip(name: string): void {
    const player = this.activePlayer;
    const ship = player.ships.find(s => s.name === name);
    if (!ship) {
      return;
    }

    ship.cells.forEach(c => (player.shipGrid[c.row][c.col] = false));
    player.ships = player.ships.filter(s => s.name !== name);
    player.unplacedShips.push({ name: ship.name, size: ship.size });
    player.unplacedShips.sort(
      (a, b) => SHIP_CONFIGS.findIndex(s => s.name === a.name) - SHIP_CONFIGS.findIndex(s => s.name === b.name)
    );
    this.selectedShipName = name;
    this.placementError = null;
  }

  randomizePlacement(): void {
    const player = this.activePlayer;
    player.shipGrid = this.createGrid(false);
    player.ships = [];

    for (const config of SHIP_CONFIGS) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 500) {
        attempts++;
        const orientation: Orientation = Math.random() < 0.5 ? 'H' : 'V';
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        const cells = this.computeCells(row, col, config.size, orientation);
        if (this.isValidPlacement(player, cells)) {
          cells.forEach(c => (player.shipGrid[c.row][c.col] = true));
          player.ships.push({ ...config, cells, hitCells: cells.map(() => false) });
          placed = true;
        }
      }
    }

    player.unplacedShips = [];
    this.selectedShipName = null;
    this.placementError = null;
  }

  onCellHover(row: number, col: number): void {
    this.hoveredCell = { row, col };
  }

  onCellLeave(): void {
    this.hoveredCell = null;
  }

  getPreviewCells(): Coord[] {
    if (this.phase !== 'setup' || !this.hoveredCell || !this.selectedShipName) {
      return [];
    }
    const config = this.activePlayer.unplacedShips.find(s => s.name === this.selectedShipName);
    if (!config) {
      return [];
    }
    return this.computeCells(this.hoveredCell.row, this.hoveredCell.col, config.size, this.orientation);
  }

  isPreviewValid(): boolean {
    const cells = this.getPreviewCells();
    return cells.length > 0 && this.isValidPlacement(this.activePlayer, cells);
  }

  isCellInPreview(row: number, col: number): boolean {
    return this.getPreviewCells().some(c => c.row === row && c.col === col);
  }

  confirmReady(): void {
    if (this.activePlayer.unplacedShips.length > 0) {
      return;
    }

    if (this.activePlayerIndex === 0) {
      this.activePlayerIndex = 1;
      this.orientation = 'H';
      this.selectedShipName = this.players[1].unplacedShips[0]?.name ?? null;
      this.awaitingPass = true;
      this.passMessage = 'Pass the device to Player 2';
    } else {
      this.phase = 'battle';
      this.activePlayerIndex = 0;
      this.awaitingPass = true;
      this.passMessage = 'Pass the device to Player 1 — Battle begins!';
    }
  }

  // ---------- Battle ----------

  fireAt(row: number, col: number): void {
    if (this.phase !== 'battle' || this.awaitingPass) {
      return;
    }

    const defender = this.defender;
    if (defender.shots[row][col] !== null) {
      return;
    }

    const isHit = defender.shipGrid[row][col];
    defender.shots[row][col] = isHit ? 'hit' : 'miss';

    if (isHit) {
      const ship = defender.ships.find(s => s.cells.some(c => c.row === row && c.col === col));
      if (ship) {
        const idx = ship.cells.findIndex(c => c.row === row && c.col === col);
        ship.hitCells[idx] = true;
      }
    }

    const allSunk = defender.ships.every(s => s.hitCells.every(h => h));
    if (allSunk) {
      this.phase = 'gameover';
      this.winnerIndex = this.activePlayerIndex;
      this.scores[this.activePlayerIndex]++;
    } else {
      this.activePlayerIndex = this.defenderIndex;
      this.awaitingPass = true;
      this.passMessage = `Pass the device to Player ${this.activePlayerIndex + 1}`;
    }
  }

  isShipSunk(ship: ShipInstance): boolean {
    return ship.hitCells.every(h => h);
  }

  sunkCellsFor(player: PlayerState): Coord[] {
    return player.ships.filter(s => this.isShipSunk(s)).flatMap(s => s.cells);
  }

  isSunkCell(player: PlayerState, row: number, col: number): boolean {
    return this.sunkCellsFor(player).some(c => c.row === row && c.col === col);
  }

  dismissPass(): void {
    this.awaitingPass = false;
  }

  // ---------- Lifecycle ----------

  resetGame(): void {
    this.players = [this.createPlayerState(), this.createPlayerState()];
    this.activePlayerIndex = 0;
    this.phase = 'setup';
    this.awaitingPass = true;
    this.passMessage = 'Pass the device to Player 1';
    this.orientation = 'H';
    this.selectedShipName = SHIP_CONFIGS[0].name;
    this.placementError = null;
    this.hoveredCell = null;
    this.winnerIndex = null;
  }

  resetScores(): void {
    this.scores = { 0: 0, 1: 0 };
    this.resetGame();
  }
}
