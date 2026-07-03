import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocalAiService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.backendAiApiURL;

  generate(prompt: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}generate`, { prompt });
  }
}
