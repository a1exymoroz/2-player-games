import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TicTacToeComponent } from './games/tic-tac-toe/tic-tac-toe.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'games/tic-tac-toe', component: TicTacToeComponent },
  { path: '**', redirectTo: '' }
];
