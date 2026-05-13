import { inject, Injectable, signal } from '@angular/core';
import { User } from '../entities/user';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../store/auth/auth.selectors';
import { from, of, switchMap, throwError } from 'rxjs';
import { SupabaseClient } from '../supabase/client';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private store = inject(Store);
  private supabase = inject(SupabaseClient).client;

  login(email: string, password: string) {
    return from(
      this.supabase.auth.signInWithPassword({
        email,
        password
      })
    ).pipe(
      switchMap(response => {

        if (response.error) {
          return throwError(() => response.error);
        }

        return of(response);
      })
    );
  }

  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({
      email,
      password
    });
  }

  async logout() {
    return await this.supabase.auth.signOut();
  }

  getUser() {
    return this.store.selectSignal(selectCurrentUser);
  }

  async isLoggedIn(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    return !!data.session;
  }

  onAuthStateChange(callback: any) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  setPassword(newPassword: string) {
    return from(this.supabase.auth.updateUser({ password: newPassword }));
  }
}
