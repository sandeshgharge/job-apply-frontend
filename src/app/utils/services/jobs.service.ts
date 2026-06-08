import { Injectable, signal, inject, effect } from '@angular/core';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { JobDetails } from '@app/utils/entities/job-details';

import { BackendApiService } from './backend-service/backend-api-services';
import { CoverLetterDocInfo } from '../entities/cover-letter';
import { FileService } from './file.service';
import { firstValueFrom } from 'rxjs';
import { selectUserID } from '../store/auth/auth.selectors';
import { Store } from '@ngrx/store';

const DEMO_JOBS: JobDetails[] = [
  { id: '1', companyName: 'SAP SE', role: 'Frontend Developer', companyLocation: 'Walldorf, DE', appliedDate: '2025-04-01', status: '1st Interview', salary: '75,000 €', contactName: 'Maria Schmidt', jobUrl: 'www.google.com', jobDescription: '' },
  { id: '2', companyName: 'Siemens AG', role: 'Angular Engineer', companyLocation: 'München, DE', appliedDate: '2025-04-05', status: 'Applied', salary: '70,000 €', jobUrl: '', jobDescription: '' },
  { id: '3', companyName: 'Bosch GmbH', role: 'Software Engineer', companyLocation: 'Stuttgart, DE', appliedDate: '2025-03-22', status: 'Rejected', contactName: 'Hans Weber', jobUrl: '', jobDescription: '' },
  { id: '4', companyName: 'BASF SE', role: 'Full Stack Developer', companyLocation: 'Ludwigshafen, DE', appliedDate: '2025-04-10', status: 'Applied', salary: '72,000 €', jobUrl: '', jobDescription: '' }
];

@Injectable({ providedIn: 'root' })
export class JobsService {
  private storage = inject(StorageService);
  private backendApi = inject(BackendApiService);
  private store = inject(Store);

  private fileService = inject(FileService);

  jobs = signal<JobDetails[]>(this.storage.get<JobDetails[]>('jad_jobs', DEMO_JOBS));
  userid = this.store.selectSignal(selectUserID);

  private jobDetails = new BehaviorSubject<JobDetails | null>(null);
  jobDetails$ = this.jobDetails.asObservable();

  setDefaultJobDetails() {
    this.jobDetails.next({
      id: '',
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
    effect(() => { this.storage.set('jad_jobs', this.jobs()); });
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

  addJob(job: Omit<JobDetails, 'id'>): JobDetails {
    const newJob = { ...job, id: Date.now().toString() };
    this.jobs.update(jobs => [newJob, ...jobs]);
    return newJob;
  }

  updateJob(id: string, updates: Partial<JobDetails>): void {
    this.jobs.update(jobs => jobs.map(j => j.id === id ? { ...j, ...updates } : j));
  }

  deleteJob(id: string): void {
    this.jobs.update(jobs => jobs.filter(j => j.id !== id));
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

  async applyAndSaveJob(cvHtml: string, clHtml: string): Promise<void> {
    const jobDetails = this.jobDetails.value;
    if (!jobDetails) throw new Error('No job details found.');

    // Use existing ID or generate a new UUID
    const jobId = jobDetails.id || crypto.randomUUID();

    let cvPdfUrl = jobDetails.cvPdfUrl || '';
    let clPdfUrl = jobDetails.coverLetterPdfUrl || '';

    // Upload CV PDF if HTML is provided
    if (cvHtml) {
      const cvBlob = await firstValueFrom(this.downloadPDF('cv', { html: cvHtml }));
      const cvDataUrl = await this.blobToDataUrl(cvBlob);
      const fileName = `${this.userid()}/${jobId}/cv_${Date.now()}.pdf`;
      const uploadedUrl = await this.fileService.uploadPDF('application-documents', fileName, cvDataUrl);
      if (!uploadedUrl) throw new Error('CV PDF upload failed');
      cvPdfUrl = uploadedUrl;
    }

    // Upload Cover Letter PDF if HTML is provided
    if (clHtml) {
      const clBlob = await firstValueFrom(this.downloadPDF('cl', { html: clHtml }));
      const clDataUrl = await this.blobToDataUrl(clBlob);
      const fileName = `${this.userid()}/${jobId}/cover_letter_${Date.now()}.pdf`;
      const uploadedUrl = await this.fileService.uploadPDF('application-documents', fileName, clDataUrl);
      if (!uploadedUrl) throw new Error('Cover Letter PDF upload failed');
      clPdfUrl = uploadedUrl;
    }

    // Prepare job record for database
    const jobToSave = {
      id: jobId,
      user_id: this.userid(),
      company_name: jobDetails.companyName,
      role: jobDetails.role,
      company_location: jobDetails.companyLocation,
      applied_date: jobDetails.appliedDate,
      status: 'Applied',
      salary: jobDetails.salary,
      contact_name: jobDetails.contactName,
      job_url: jobDetails.jobUrl,
      notes: jobDetails.notes,
      job_description: jobDetails.jobDescription,
      cover_letter_pdf_url: clPdfUrl,
      cv_pdf_url: cvPdfUrl,
    };

    await firstValueFrom(
      this.backendApi.post<any>('jobs/upsert', jobToSave)
    );

    // Update the local active job details
    this.jobDetails.next({
      ...jobDetails,
      id: jobId,
      status: 'Applied',
      cvPdfUrl,
      coverLetterPdfUrl: clPdfUrl
    });

    // Update local jobs list
    this.jobs.update(jobs => {
      const existingIndex = jobs.findIndex(j => j.id === jobId);
      const updatedJob = { ...this.jobDetails.value! };
      if (existingIndex >= 0) {
        const newJobs = [...jobs];
        newJobs[existingIndex] = updatedJob;
        return newJobs;
      } else {
        return [updatedJob, ...jobs];
      }
    });
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
