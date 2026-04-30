import { Pipe, PipeTransform } from '@angular/core';
import { Job, JobStatus } from '../services/jobs';

@Pipe({ name: 'jobCount', standalone: true })
export class JobCountPipe implements PipeTransform {
  transform(jobs: Job[], status: JobStatus): number {
    return jobs.filter(j => j.status === status).length;
  }
}
