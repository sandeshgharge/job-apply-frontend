import { inject, Injectable, signal } from '@angular/core';
import { User } from '../entities/user';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../store/auth/auth.selectors';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private store = inject(Store);
  private user = this.store.selectSignal(selectCurrentUser);

  login(email: string, password: string): boolean {
    if (email && password.length >= 6) {
      const name = email.split('@')[0].replace(/[._]/g, ' ');
      this.currentUser.set({ email, name });
      
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
  }

  getUser(): User | null {
    return this.currentUser();
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}
