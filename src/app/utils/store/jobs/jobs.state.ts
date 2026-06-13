import { JobDetails } from '../../entities/job-details';

export interface JobsState {
  jobs: JobDetails[];
  loading: boolean;
  error: string | null;
}
