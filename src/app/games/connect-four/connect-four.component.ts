import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type Player = 1 | 2 | null;
type Cell = { row: number; col: number };

const ROWS = 6;
const COLS = 7;

@Component({
  selector: 'app-connect-four',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './connect-four.component.html',
  styleUrl: './connect-four.component.scss'
})
export class ConnectFourComponent {
  readonly rows = ROWS;
  readonly cols = COLS;

  board: Player[][] = this.createEmptyBoard();
  currentPlayer: 1 | 2 = 1;
  winner: Player = null;
  isDraw = false;
  winningCells: Cell[] = [];
  hoveredColumn: number | null = null;

  scores = { 1: 0, 2: 0 };

  private readonly directionPairs: [Cell, Cell][] = [
    [{ row: 0, col: 1 }, { row: 0, col: -1 }],
    [{ row: 1, col: 0 }, { row: -1, col: 0 }],
    [{ row: 1, col: 1 }, { row: -1, col: -1 }],
    [{ row: 1, col: -1 }, { row: -1, col: 1 }]
  ];

  private createEmptyBoard(): Player[][] {
    return Array.from({ length: ROWS }, () => Array<Player>(COLS).fill(null));
  }

  columnIndices(): number[] {
    return Array.from({ length: COLS }, (_, i) => i);
  }

  rowIndices(): number[] {
    return Array.from({ length: ROWS }, (_, i) => i);
  }

  getLowestEmptyRow(col: number): number {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!this.board[r][col]) {
        return r;
      }
    }
    return -1;
  }

  dropDisc(col: number): void {
    if (this.winner || this.isDraw) {
      return;
    }

    const row = this.getLowestEmptyRow(col);
    if (row === -1) {
      return;
    }

    this.board[row][col] = this.currentPlayer;

    const winningLine = this.checkWinner(row, col);
    if (winningLine) {
      this.winner = this.currentPlayer;
      this.winningCells = winningLine;
      this.scores[this.currentPlayer]++;
    } else if (this.board.every(rowCells => rowCells.every(cell => cell !== null))) {
      this.isDraw = true;
    } else {
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }
  }

  private checkWinner(row: number, col: number): Cell[] | null {
    const player = this.board[row][col];

    for (const [dirA, dirB] of this.directionPairs) {
      const cells: Cell[] = [{ row, col }];

      for (const dir of [dirA, dirB]) {
        let r = row + dir.row;
        let c = col + dir.col;
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === player) {
          cells.push({ row: r, col: c });
          r += dir.row;
          c += dir.col;
        }
      }

      if (cells.length >= 4) {
        return cells;
      }
    }

    return null;
  }

  isWinningCell(row: number, col: number): boolean {
    return this.winningCells.some(cell => cell.row === row && cell.col === col);
  }

  isGhostCell(row: number, col: number): boolean {
    if (this.hoveredColumn !== col || this.winner || this.isDraw) {
      return false;
    }
    return row === this.getLowestEmptyRow(col);
  }

  onColumnHover(col: number): void {
    this.hoveredColumn = col;
  }

  onColumnLeave(): void {
    this.hoveredColumn = null;
  }

  resetGame(): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 1;
    this.winner = null;
    this.isDraw = false;
    this.winningCells = [];
    this.hoveredColumn = null;
  }

  resetScores(): void {
    this.scores = { 1: 0, 2: 0 };
    this.resetGame();
  }
}
