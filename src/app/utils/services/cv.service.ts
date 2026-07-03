import { Injectable, inject, signal } from '@angular/core';
import { CVInfo, defaultCV } from '@app/utils/entities/cv';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CvService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.backendAiApiURL;

  // --- Draft State ---
  draftCV = signal<CVInfo>(defaultCV());

  clearDraft() {
    this.draftCV.set(defaultCV());
  }

  updateDraft(cvInfo: CVInfo) {
    this.draftCV.set(cvInfo);
  }

  // CV Operations

  /**
   * Save a CV
   */
  saveCV(cvInfo: CVInfo): Observable<CVInfo> {
    return this.http.put<CVInfo>(`${this.baseUrl}cv/${cvInfo.id}`, cvInfo);
  }

  /**
   * Save CV as (create a copy)
   */
  saveAsCV(cvInfo: CVInfo): Observable<CVInfo> {
    return this.http.post<CVInfo>(`${this.baseUrl}cv`, cvInfo);
  }

  /**
   * Get all CVs
   */
  getCVs(uID : string): Observable<CVInfo []> {
    return this.http.get<CVInfo[]>(`${this.baseUrl}cv/user/${uID}`);
  }

  /**
   * Delete a CV
   */
  deleteCV(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}cvs/${id}`);
  }
}