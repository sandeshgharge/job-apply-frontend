import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { HomeComponent } from './home/home';
import { authGuard } from './utils/guards/auth.guard';
import { AuthCallback } from './auth-callback/auth-callback';
import { SetPassword } from './set-password/set-password';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'auth/callback', component: AuthCallback },
  { path: 'set-password', component: SetPassword, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
