import { Injectable, inject } from '@angular/core';
import { BackendApiService } from './backend-service/backend-api-services';
import { CoverLetterInfo } from '../entities/cover-letter';

@Injectable({ providedIn: 'root' })
export class CLService {
  private backendApi = inject(BackendApiService);

  // Cover Letter Operations

  /**
   * Save a cover letter
   */
  async saveCoverLetter(coverLetterData: CoverLetterInfo): Promise<any> {
    return this.backendApi.post('/cover-letters', coverLetterData);
  }

  /**
   * Save cover letter as (create a copy)
   */
  async saveAsCoverLetter(coverLetterData: CoverLetterInfo): Promise<any> {
    return this.backendApi.post('/cover-letters/copy', coverLetterData);
  }

  /**
   * Update a cover letter
   */
  async updateCoverLetter(id: string, coverLetterData: CoverLetterInfo): Promise<any> {
    return this.backendApi.put(`/cover-letters/${id}`, coverLetterData);
  }

  /**
   * Get a cover letter by ID
   */
  async getCoverLetter(id: string): Promise<any> {
    return this.backendApi.get(`/cover-letters/${id}`);
  }

  /**
   * Get all cover letters
   */
  async getCoverLetters(): Promise<any> {
    return this.backendApi.get('/cover-letters');
  }

  /**
   * Delete a cover letter
   */
  async deleteCoverLetter(id: string): Promise<any> {
    return this.backendApi.delete(`/cover-letters/${id}`);
  }

  /**
   * Search cover letters
   */
  async searchCoverLetters(query: any): Promise<any> {
    return this.backendApi.post('/cover-letters/search', query);
  }
}