import { Injectable, inject, signal } from '@angular/core';
import { CVInfo, defaultCV } from '@app/utils/entities/cv';
import { BackendApiService } from './backend-service/backend-api-services';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CvService {
  private backendApi = inject(BackendApiService);

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
    return this.backendApi.put('cv/' + cvInfo.id, cvInfo);
  }

  /**
   * Save CV as (create a copy)
   */
  saveAsCV(cvInfo: CVInfo): Observable<CVInfo> {
    return this.backendApi.post('cv', cvInfo);
  }

  /**
   * Get all CVs
   */
  getCVs(uID : string): Observable<CVInfo []> {
    return this.backendApi.get('cv/user/'+uID);
  }

  /**
   * Delete a CV
   */
  async deleteCV(id: string): Promise<any> {
    return this.backendApi.delete(`/cvs/${id}`);
  }
}