import { inject, Injectable } from '@angular/core';
import { ApiAgentInfo } from '../entities/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AgentsService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.backendAiApiURL;

  createAgent(agent: ApiAgentInfo) {
    return firstValueFrom(
      this.http.post<any>(`${this.baseUrl}agents/`, agent)
    );
  }

  updateAgent(id: string, agent: Omit<ApiAgentInfo, 'id' | 'userId'>) {
    return this.http.put<any>(`${this.baseUrl}agents/${id}`, agent);
  }

  deleteAgent(id: string) {
    return firstValueFrom(
      this.http.delete<any>(`${this.baseUrl}agents/${id}`)
    );
  }
}
