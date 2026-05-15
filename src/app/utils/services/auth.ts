import { inject, Injectable, signal } from '@angular/core';
import { User } from '../entities/user';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../store/auth/auth.selectors';
import { from, of, switchMap, throwError } from 'rxjs';
import { supabase } from '../supabase/client';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private store = inject(Store);

  login(email: string, password: string) {
    return from(
      supabase.auth.signInWithPassword({
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
    return await supabase.auth.signUp({
      email,
      password
    });
  }

  async logout() {
    return await supabase.auth.signOut();
  }

  getUser() {
    return this.store.selectSignal(selectCurrentUser);
  }

  async isLoggedIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }

  onAuthStateChange(callback: any) {
    return supabase.auth.onAuthStateChange(callback);
  }

  setPassword(newPassword: string) {
    return from(supabase.auth.updateUser({ password: newPassword }));
  }
}
