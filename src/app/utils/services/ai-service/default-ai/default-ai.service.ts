import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AIServiceInterface, AIPrompt } from '../ai.service.interface';

@Injectable({ providedIn: 'root' })
export class DefaultAiService implements AIServiceInterface {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.backendAiApiURL;

  generate(prompt: AIPrompt): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}generate`, prompt);
  }

  extractJobData(jobDescription: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}extract-job-data`, { jobDescription });
  }
}
