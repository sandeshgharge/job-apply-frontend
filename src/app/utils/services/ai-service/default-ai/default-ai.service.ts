import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AIServiceInterface } from '../ai.service.interface';

export class DefaultAiService implements AIServiceInterface {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.backendAiApiURL;

  generate(prompt: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}generate`, { prompt });
  }
}
