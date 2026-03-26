import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type Player = 'X' | 'O' | null;
type Board = Player[];

@Component({
  selector: 'app-tic-tac-toe',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './tic-tac-toe.component.html',
  styleUrl: './tic-tac-toe.component.scss'
})
export class TicTacToeComponent {
  board: Board = Array(9).fill(null);
  currentPlayer: 'X' | 'O' = 'X';
  winner: Player = null;
  isDraw = false;
  winningLine: number[] = [];
  
  scores = {
    X: 0,
    O: 0
  };

  private winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  makeMove(index: number): void {
    if (this.board[index] || this.winner || this.isDraw) {
      return;
    }

    this.board[index] = this.currentPlayer;
    
    const winResult = this.checkWinner();
    if (winResult) {
      this.winner = this.currentPlayer;
      this.winningLine = winResult;
      this.scores[this.currentPlayer]++;
    } else if (this.board.every(cell => cell !== null)) {
      this.isDraw = true;
    } else {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }
  }

  private checkWinner(): number[] | null {
    for (const pattern of this.winPatterns) {
      const [a, b, c] = pattern;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return pattern;
      }
    }
    return null;
  }

  resetGame(): void {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.winner = null;
    this.isDraw = false;
    this.winningLine = [];
  }

  resetScores(): void {
    this.scores = { X: 0, O: 0 };
    this.resetGame();
  }

  isWinningCell(index: number): boolean {
    return this.winningLine.includes(index);
  }
}
