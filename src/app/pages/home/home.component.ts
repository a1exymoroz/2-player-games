import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  players: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  games: Game[] = [
    {
      id: 'tic-tac-toe',
      name: 'Tic Tac Toe',
      description: 'Classic X and O game. Get three in a row to win!',
      icon: '⭕',
      route: '/games/tic-tac-toe',
      players: '2 Players'
    },
    {
      id: 'connect-four',
      name: 'Connect Four',
      description: 'Drop discs and connect four in a row!',
      icon: '🔴',
      route: '/games/connect-four',
      players: '2 Players'
    },
    {
      id: 'battleship',
      name: 'Battleship',
      description: 'Hunt and sink your opponent\'s fleet!',
      icon: '🚢',
      route: '/games/battleship',
      players: '2 Players'
    }
  ];
}
