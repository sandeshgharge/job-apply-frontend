import { inject, Injectable, signal } from '@angular/core';
import { User } from '../entities/user';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../store/auth/auth.selectors';
import { supabase } from '../supabase/client'

@Injectable({ providedIn: 'root' })
export class AuthService {

  private store = inject(Store);

  async login(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password
    });
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

  async getUser() {
    return await supabase.auth.getUser();
  }

  async isLoggedIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }

  onAuthStateChange(callback: any) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
