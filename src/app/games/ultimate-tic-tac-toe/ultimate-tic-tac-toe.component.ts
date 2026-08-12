import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type Player = 'X' | 'O';
type Cell = Player | null;
type SubBoard = Cell[];
type BoardResult = Player | 'draw' | null;

const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

@Component({
  selector: 'app-ultimate-tic-tac-toe',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ultimate-tic-tac-toe.component.html',
  styleUrl: './ultimate-tic-tac-toe.component.scss'
})
export class UltimateTicTacToeComponent {
  boards: SubBoard[] = Array.from({ length: 9 }, () => Array(9).fill(null));
  boardResults: BoardResult[] = Array(9).fill(null);
  // Which 3 cells resolved each sub-board, so the winning triple can be
  // highlighted the same way the single-board game does — null until that
  // sub-board is won (never set for a drawn sub-board).
  subWinningLines: (number[] | null)[] = Array(9).fill(null);

  currentPlayer: Player = 'X';
  // The sub-board the current player must play in. null means any
  // unresolved board is fair game — true at game start, and again whenever
  // a move points to a board that's already been won or drawn.
  activeBoard: number | null = null;

  winner: Player | null = null;
  isDraw = false;
  winningLine: number[] = [];

  scores = { X: 0, O: 0 };

  makeMove(boardIndex: number, cellIndex: number): void {
    if (this.winner || this.isDraw) {
      return;
    }
    if (this.activeBoard !== null && this.activeBoard !== boardIndex) {
      return;
    }
    if (this.boardResults[boardIndex] || this.boards[boardIndex][cellIndex]) {
      return;
    }

    this.boards[boardIndex][cellIndex] = this.currentPlayer;

    const subWin = this.findWinningLine(this.boards[boardIndex]);
    if (subWin) {
      this.boardResults[boardIndex] = this.currentPlayer;
      this.subWinningLines[boardIndex] = subWin;
    } else if (this.boards[boardIndex].every(cell => cell !== null)) {
      this.boardResults[boardIndex] = 'draw';
    }

    const metaWin = this.findMetaWinningLine();
    if (metaWin) {
      this.winner = this.currentPlayer;
      this.winningLine = metaWin;
      this.scores[this.currentPlayer]++;
      return;
    }

    if (this.boardResults.every(result => result !== null)) {
      this.isDraw = true;
      return;
    }

    // Sends the opponent to the sub-board matching the cell just played —
    // unless that board is already decided, in which case they're free to
    // pick any board that's still open.
    this.activeBoard = this.boardResults[cellIndex] ? null : cellIndex;
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
  }

  isBoardActive(boardIndex: number): boolean {
    if (this.winner || this.isDraw || this.boardResults[boardIndex]) {
      return false;
    }
    return this.activeBoard === null || this.activeBoard === boardIndex;
  }

  isWinningBoard(boardIndex: number): boolean {
    return this.winningLine.includes(boardIndex);
  }

  isWinningSubCell(boardIndex: number, cellIndex: number): boolean {
    return !!this.subWinningLines[boardIndex]?.includes(cellIndex);
  }

  private findWinningLine(cells: Cell[]): number[] | null {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return pattern;
      }
    }
    return null;
  }

  private findMetaWinningLine(): number[] | null {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      const resultA = this.boardResults[a];
      // A drawn sub-board can't contribute to a meta win — only matching X/O results count.
      if (resultA && resultA !== 'draw' && resultA === this.boardResults[b] && resultA === this.boardResults[c]) {
        return pattern;
      }
    }
    return null;
  }

  resetGame(): void {
    this.boards = Array.from({ length: 9 }, () => Array(9).fill(null));
    this.boardResults = Array(9).fill(null);
    this.subWinningLines = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.activeBoard = null;
    this.winner = null;
    this.isDraw = false;
    this.winningLine = [];
  }

  resetScores(): void {
    this.scores = { X: 0, O: 0 };
    this.resetGame();
  }
}
