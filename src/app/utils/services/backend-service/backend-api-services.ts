import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class BackendApiService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly baseUrl = environment.backendAiApiURL;

  /**
   * Get the authorization header with Bearer token
   */
  private async getAuthHeaders(): Promise<{ [header: string]: string }> {
    try {
      const session = await this.authService.getSession();
      if (session?.data.session?.access_token) {
        return {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        };
      }
      // Return default headers if no token
      return { 'Content-Type': 'application/json' };
    } catch (error) {
      console.error('Error getting auth token:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  /**
   * GET request with automatic auth header
   */
  async get<T>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    return firstValueFrom(this.http.get<T>(`${this.baseUrl}${url}`, { headers }));
  }

  /**
   * POST request with automatic auth header
   */
  async post<T>(url: string, body: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    return firstValueFrom(this.http.post<T>(`${this.baseUrl}${url}`, body, { headers }));
  }

  /**
   * PUT request with automatic auth header
   */
  async put<T>(url: string, body: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    return firstValueFrom(this.http.put<T>(`${this.baseUrl}${url}`, body, { headers }));
  }

  /**
   * DELETE request with automatic auth header
   */
  async delete<T>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    return firstValueFrom(this.http.delete<T>(`${this.baseUrl}${url}`, { headers }));
  }
}