import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CoverLetterInfo, defaultcl } from '@app/utils/entities/cover-letter';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CLService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.backendAiApiURL;

  // --- Draft State ---
  draftCoverLetter = signal<CoverLetterInfo>(defaultcl());

  clearDraft() {
    this.draftCoverLetter.set(defaultcl());
  }

  updateDraft(coverLetterInfo: CoverLetterInfo) {
    this.draftCoverLetter.set(coverLetterInfo);
  }

  // Cover Letter Operations

  /**
   * Save a cover letter
   */
  saveCoverLetter(clInfo: CoverLetterInfo): Observable<CoverLetterInfo> {
    return this.http.put<CoverLetterInfo>(`${this.baseUrl}cover-letter/${clInfo.id}`, clInfo);
  }

  /**
   * Save cover letter as (create a copy)
   */
  saveAsCoverLetter(clInfo: CoverLetterInfo): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}cover-letter`, clInfo);
  }

  /**
   * Get all cover letters
   */
  getCoverLetters(uID: string): Observable<CoverLetterInfo[]> {
    return this.http.get<CoverLetterInfo[]>(`${this.baseUrl}cover-letter/user/${uID}`);
  }

  /**
   * Delete a cover letter
   */
  deleteCoverLetter(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}cover-letter/${id}`);
  }
}