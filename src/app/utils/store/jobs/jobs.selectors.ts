import { createFeatureSelector, createSelector } from '@ngrx/store';
import { JobsState } from './jobs.state';

export const selectJobsState = createFeatureSelector<JobsState>('jobs');

export const selectAllJobs = createSelector(
  selectJobsState,
  (state: JobsState) => state.jobs
);

export const selectJobsLoading = createSelector(
  selectJobsState,
  (state: JobsState) => state.loading
);

export const selectJobsError = createSelector(
  selectJobsState,
  (state: JobsState) => state.error
);

export const selectJobById = (id: string) => createSelector(
  selectAllJobs,
  (jobs) => jobs.find(j => j.id === id) ?? null
);

export const selectJobsStats = createSelector(
  selectAllJobs,
  (jobs) => {
    return {
      total: jobs.length,
      active: jobs.filter(j => !['Rejected', 'Withdrawn'].includes(j.status?.toString() || '')).length,
      interviews: jobs.filter(j => j.status?.includes('Interview')).length,
      offers: jobs.filter(j => j.status === 'Offer').length,
      rejected: jobs.filter(j => j.status === 'Rejected').length
    };
  }
);

export const selectUpcomingInterviews = createSelector(
  selectAllJobs,
  (jobs) => jobs.filter(j => j.status?.includes('Interview')).slice(0, 5)
);

export const selectRecentActivity = createSelector(
  selectAllJobs,
  (jobs) => [...jobs]
    .sort((a, b) => new Date(b.appliedDate ?? '').getTime() - new Date(a.appliedDate ?? '').getTime())
    .slice(0, 5)
);
