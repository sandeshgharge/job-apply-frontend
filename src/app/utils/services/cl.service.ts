import { Injectable, inject } from '@angular/core';
import { BackendApiService } from './backend-service/backend-api-services';
import { CoverLetterInfo } from '../entities/cover-letter';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CLService {
  private backendApi = inject(BackendApiService);

  // Cover Letter Operations

  /**
   * Save a cover letter
   */
  saveCoverLetter(clInfo: CoverLetterInfo): Observable<CoverLetterInfo> {
    return this.backendApi.put('cover-letter/' + clInfo.id, clInfo);
  }

  /**
   * Save cover letter as (create a copy)
   */
  saveAsCoverLetter(clInfo: CoverLetterInfo): Observable<CoverLetterInfo> {
    return this.backendApi.post('cover-letter', clInfo);
  }

  /**
   * Get all cover letters
   */
  getCoverLetters(uID: string): Observable<CoverLetterInfo[]> {
    return this.backendApi.get('cover-letter/user/' + uID);
  }

  /**
   * Delete a cover letter
   */
  async deleteCoverLetter(id: string): Promise<any> {
    return this.backendApi.delete(`cover-letter/${id}`);
  }
}