import { Injectable, signal, inject, effect } from '@angular/core';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { JobDetails } from '@app/utils/entities/job-details';

import { BackendApiService } from './backend-service/backend-api-services';
import { FileService } from './file.service';
import { firstValueFrom, map } from 'rxjs';
import { selectUserID } from '../store/auth/auth.selectors';
import { Store } from '@ngrx/store';
import { ToastService } from './toast.service';
import { CoverLetterDocInfo } from '../entities/cover-letter';
import { CvData } from '../entities/cv';
import { selectAllJobs } from '../store/jobs/jobs.selectors';
import { addJob } from '../store/jobs/jobs.actions';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private storage = inject(StorageService);
  private backendApi = inject(BackendApiService);
  private store = inject(Store);
  private toastService = inject(ToastService);

  jobs = this.store.selectSignal(selectAllJobs);
  userid = this.store.selectSignal(selectUserID);

  private jobDetails = new BehaviorSubject<JobDetails | null>(null);
  jobDetails$ = this.jobDetails.asObservable();

  setDefaultJobDetails() {
    this.jobDetails.next({
      id: '',
      userId: this.userid(),
      companyName: '',
      role: '',
      companyLocation: '',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Open',
      salary: '',
      contactName: '',
      jobUrl: '',
      jobDescription: '',
      coverLetterPdfUrl: '',
      cvPdfUrl: ''
    });
  }
  setJobDetails(details: JobDetails) {
    this.jobDetails.next(details);
  }

  updateField<K extends keyof JobDetails>(
    key: K,
    value: JobDetails[K]
  ) {
    const current = this.jobDetails.value;

    this.jobDetails.next({
      ...(current || {} as JobDetails),
      [key]: value
    } as JobDetails);
  }

  constructor() {
    this.setDefaultJobDetails();
  }

  loadJobs(): Observable<JobDetails[]> {
    return of(this.jobs());
  }

  extractJobDescription(url: string): Observable<{ url: string, description: string }> {
    console.log("Sending job URL to backend for extraction:", 'extract-job-description');
    return this.backendApi.post<{ url: string, description: string }>('extract-job-description', { url });
  }

  extractJobDetails(jobDescription: string): Observable<JobDetails> {
    console.log("Sending job description to backend for extraction:", 'extract-job-data');
    return this.backendApi.post<JobDetails>('extract-job-data', { job_description: jobDescription });
  }

  // ── Backend CRUD methods (used by NgRx effects) ──────────────

  /**
   * Fetch all jobs for the current user from the backend.
   * TODO: Update URL when backend is ready.
   */
  fetchJobs(): Observable<JobDetails[]> {
    return this.backendApi.get<JobDetails[]>(`jobs/user/${this.userid()}`);
  }

  /**
   * Create a new job on the backend.
   * TODO: Update URL when backend is ready.
   */
  createJob(job: JobDetails): Observable<JobDetails> {
    return this.backendApi.post<JobDetails>('jobs/upsert', {
      ...job,
      userId: this.userid()
    });
  }

  /**
   * Update an existing job on the backend.
   * TODO: Update URL when backend is ready.
   */
  updateJob(id: string, changes: Partial<JobDetails>): Observable<JobDetails> {
    return this.backendApi.put<JobDetails>(`jobs/${id}`, changes).pipe(
      map((response: any) => ({ ...changes, id } as JobDetails))
    );
  }

  /**
   * Delete a job on the backend.
   * TODO: Update URL when backend is ready.
   */
  deleteJob(id: string) {
    return this.backendApi.delete<void>(`jobs/${id}`);
  }

  fetchPreview(type: 'cv' | 'cl', data: any): Observable<any> {
    const endpoint = type === 'cv' ? 'cv' : 'cover-letter';
    console.log(data)
    return this.backendApi.post<any>(endpoint + '/preview', data);
  }

  downloadPDF(type: 'cv' | 'cl', data: any): Observable<Blob> {
    const endpoint = type === 'cv' ? 'cv' : 'cover-letter';
    return this.backendApi.post<Blob>(endpoint + '/pdf', data
      , { responseType: 'blob' }
    );
  }

  getStats() {
    const all = this.jobs();
    return {
      total: all.length,
      active: all.filter(j => !['Rejected', 'Withdrawn'].includes(j.status?.toString() || '')).length,
      interviews: all.filter(j => j.status?.includes('Interview')).length,
      offers: all.filter(j => j.status === 'Offer').length,
      rejected: all.filter(j => j.status === 'Rejected').length
    };
  }

  applyAndSaveJob(cvData: CvData, coverLetterData: CoverLetterDocInfo): Observable<any> {
    const jobDetails = this.jobDetails.value;
    if (!jobDetails) throw new Error('No job details found.');

    let hasMissingFields = false;
    if (!jobDetails.companyName?.trim()) {
      this.toastService.show('Company name is required.', 'error');
      hasMissingFields = true;
    }
    if (!jobDetails.companyLocation?.trim()) {
      this.toastService.show('Company location is required.', 'error');
      hasMissingFields = true;
    }
    if (!jobDetails.role?.trim()) {
      this.toastService.show('Role is required.', 'error');
      hasMissingFields = true;
    }
    if (hasMissingFields) {
      throw new Error('Missing required fields. Please fill in all required information before applying.');
    }

    return this.backendApi.post<any>('jobs', { jd: { ...jobDetails, user_id: this.userid()}, cv_data: cvData, cover_letter_data: coverLetterData } );
  }

  /**
   * Converts a Blob to a base64 data URL for use with FileService upload.
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
