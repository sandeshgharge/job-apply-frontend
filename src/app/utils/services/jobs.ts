import { Injectable, signal, inject, effect } from '@angular/core';
import { StorageService } from './storage';

export type JobStatus =
  | 'Applied'
  | '1st Interview'
  | '2nd Interview'
  | '3rd Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  appliedDate: string;
  status: JobStatus;
  notes?: string;
  salary?: string;
  contactName?: string;
  jobUrl?: string;
  jobDescription?: string;
  skillGroups?: SkillGroup[];
  coverLetter?: string;
}

const DEMO_JOBS: Job[] = [
  { id: '1', company: 'SAP SE', role: 'Frontend Developer', location: 'Walldorf, DE', appliedDate: '2025-04-01', status: '1st Interview', salary: '75,000 €', contactName: 'Maria Schmidt', jobUrl: '' },
  { id: '2', company: 'Siemens AG', role: 'Angular Engineer', location: 'München, DE', appliedDate: '2025-04-05', status: 'Applied', salary: '70,000 €', jobUrl: '' },
  { id: '3', company: 'Bosch GmbH', role: 'Software Engineer', location: 'Stuttgart, DE', appliedDate: '2025-03-22', status: 'Rejected', contactName: 'Hans Weber', jobUrl: '' },
  { id: '4', company: 'BASF SE', role: 'Full Stack Developer', location: 'Ludwigshafen, DE', appliedDate: '2025-04-10', status: 'Applied', salary: '72,000 €', jobUrl: '' }
];

@Injectable({ providedIn: 'root' })
export class JobsService {
  private storage = inject(StorageService);

  jobs = signal<Job[]>(this.storage.get<Job[]>('jad_jobs', DEMO_JOBS));

  constructor() {
    effect(() => { this.storage.set('jad_jobs', this.jobs()); });
  }

  addJob(job: Omit<Job, 'id'>): Job {
    const newJob = { ...job, id: Date.now().toString() };
    this.jobs.update(jobs => [newJob, ...jobs]);
    return newJob;
  }

  updateJob(id: string, updates: Partial<Job>): void {
    this.jobs.update(jobs => jobs.map(j => j.id === id ? { ...j, ...updates } : j));
  }

  deleteJob(id: string): void {
    this.jobs.update(jobs => jobs.filter(j => j.id !== id));
  }

  getStats() {
    const all = this.jobs();
    return {
      total: all.length,
      active: all.filter(j => !['Rejected', 'Withdrawn'].includes(j.status)).length,
      interviews: all.filter(j => j.status.includes('Interview')).length,
      offers: all.filter(j => j.status === 'Offer').length,
      rejected: all.filter(j => j.status === 'Rejected').length
    };
  }
}
