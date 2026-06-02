import { Injectable, signal, inject, effect } from '@angular/core';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { JobDetails } from '@app/utils/entities/job-details';

import { BackendApiService } from './backend-service/backend-api-services';
import { CoverLetterDocInfo } from '../entities/cover-letter';

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

  jobs = signal<JobDetails[]>(this.storage.get<JobDetails[]>('jad_jobs', DEMO_JOBS));

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
      jobDescription: ''
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
}
