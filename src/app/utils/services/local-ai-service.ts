import { Injectable, inject } from '@angular/core';
import { BackendApiService } from './backend-service/backend-api-services';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocalAiService {
  private backendApiService = inject(BackendApiService);

  generate(prompt: string): Observable<any> {
    return this.backendApiService.post('generate', { prompt });
  }
}
