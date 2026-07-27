import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { StackComponent } from './pages/stack/stack.component';
import { TicTacToeComponent } from './games/tic-tac-toe/tic-tac-toe.component';
import { CarGameComponent } from './games/car-game/car-game.component';
import { ConnectFourComponent } from './games/connect-four/connect-four.component';
import { BattleshipComponent } from './games/battleship/battleship.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'stack', component: StackComponent },
  { path: 'games/tic-tac-toe', component: TicTacToeComponent },
  { path: 'games/car-game', component: CarGameComponent },
  { path: 'games/connect-four', component: ConnectFourComponent },
  { path: 'games/battleship', component: BattleshipComponent },
  { path: '**', redirectTo: '' }
];
