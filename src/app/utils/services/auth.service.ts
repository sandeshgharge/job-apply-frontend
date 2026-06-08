import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '@app/utils/entities/user';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '@app/utils/store/auth/auth.selectors';
import { firstValueFrom, Observable, of, map, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private http = inject(HttpClient);

  login(email: string, password: string) {
    return this.http.post<{
      access_token: string;
      refresh_token: string;
      user: { id: string; email: string; };
    }>(`${environment.backendAiApiURL}auth/login`, {
      email,
      password
    });
  }

  signUp(email: string, password: string) {
    return this.http.post<any>(`${environment.backendAiApiURL}auth/signup`, {
      email,
      password
    });
  }

  logout() {
    const token = sessionStorage.getItem('access_token') || '';
    return this.http.post<any>(`${environment.backendAiApiURL}auth/logout`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  /**
   * Returns a Promise that resolves to the same shape as the old Supabase
   * getSession() for backward compatibility with BackendApiService and auth effects:
   * { data: { session: { access_token, user: { id, email } } | null } }
   */
  getSession(): Promise<{ data: { session: { access_token: string; user: { id: string; email: string } } | null } }> {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      return Promise.resolve({ data: { session: null } });
    }
    return firstValueFrom(
      this.http.get<any>(`${environment.backendAiApiURL}auth/session`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).pipe(
        map(response => ({
          data: {
            session: response?.session ?? response ?? null
          }
        })),
        catchError(() => of({ data: { session: null } }))
      )
    );
  }

  async isLoggedIn(): Promise<boolean> {
    const { data } = await this.getSession();
    return !!data.session;
  }

  /**
   * Token-based check replacement for the old Supabase onAuthStateChange.
   * Immediately invokes the callback with the current auth state.
   */
  onAuthStateChange(callback: any) {
    const token = sessionStorage.getItem('access_token');
    const event = token ? 'SIGNED_IN' : 'SIGNED_OUT';
    callback(event, token ? { access_token: token } : null);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  setPassword(newPassword: string): Observable<any> {
    const token = sessionStorage.getItem('access_token') || '';
    return this.http.post<any>(`${environment.backendAiApiURL}auth/set-password`, {
      new_password: newPassword
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
}
