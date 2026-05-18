import { Injectable, signal, inject, effect } from '@angular/core';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { JobDetails } from '../entities/job-details';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';



const DEMO_JOBS: JobDetails[] = [
  { id: '1', companyName: 'SAP SE', role: 'Frontend Developer', companyLocation: 'Walldorf, DE', appliedDate: '2025-04-01', status: '1st Interview', salary: '75,000 €', contactName: 'Maria Schmidt', jobUrl: '', jobDescription: '' },
  { id: '2', companyName: 'Siemens AG', role: 'Angular Engineer', companyLocation: 'München, DE', appliedDate: '2025-04-05', status: 'Applied', salary: '70,000 €', jobUrl: '', jobDescription: '' },
  { id: '3', companyName: 'Bosch GmbH', role: 'Software Engineer', companyLocation: 'Stuttgart, DE', appliedDate: '2025-03-22', status: 'Rejected', contactName: 'Hans Weber', jobUrl: '', jobDescription: '' },
  { id: '4', companyName: 'BASF SE', role: 'Full Stack Developer', companyLocation: 'Ludwigshafen, DE', appliedDate: '2025-04-10', status: 'Applied', salary: '72,000 €', jobUrl: '', jobDescription: '' }
];

@Injectable({ providedIn: 'root' })
export class JobsService {
  private storage = inject(StorageService);

  jobs = signal<JobDetails[]>(this.storage.get<JobDetails[]>('jad_jobs', DEMO_JOBS));

  private jobDetails = new BehaviorSubject<JobDetails | null>(null);
  jobDetails$ = this.jobDetails.asObservable();
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

  constructor(private http: HttpClient) {
    effect(() => { this.storage.set('jad_jobs', this.jobs()); });
  }

  loadJobs(): Observable<JobDetails[]> {
    return of(this.jobs());
  }

  extractJobDescription(url: string): Observable<{ url: string, description: string }> {
    console.log("Sending job URL to backend for extraction:", environment.backendAiApiURL + 'extract-job-description');
    return this.http.post<any>(environment.backendAiApiURL + 'extract-job-description', { url });
  }

  extractJobDetails(jobDescription: string): Observable<JobDetails> {
    console.log("Sending job description to backend for extraction:", environment.backendAiApiURL + 'extract-job-data');
    return this.http.post<JobDetails>(environment.backendAiApiURL + 'extract-job-data', { job_description: jobDescription });
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
