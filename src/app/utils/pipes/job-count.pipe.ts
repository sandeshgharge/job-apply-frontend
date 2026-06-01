import { Pipe, PipeTransform } from '@angular/core';
import { JobDetails, JobStatus } from '@app/utils/entities/job-details';

@Pipe({ name: 'jobCount', standalone: true })
export class JobCountPipe implements PipeTransform {
  transform(jobs: JobDetails[], status: JobStatus): number {
    return jobs.filter(j => j.status === status).length;
  }
}
