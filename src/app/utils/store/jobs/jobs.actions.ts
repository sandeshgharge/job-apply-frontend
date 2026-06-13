import { createAction, props } from '@ngrx/store';
import { JobDetails, JobStatus } from '../../entities/job-details';
import { CoverLetterDocInfo } from '@app/utils/entities/cover-letter';
import { CvData } from '@app/utils/entities/cv';

/**
 * Load all jobs for the current user
 */
export const loadJobs = createAction(
  '[Jobs] Load Jobs'
);

export const loadJobsSuccess = createAction(
  '[Jobs] Load Jobs Success',
  props<{ jobs: JobDetails[] }>()
);

export const loadJobsFailure = createAction(
  '[Jobs] Load Jobs Failure',
  props<{ error: string }>()
);

export const applyAndSaveJob = createAction(
  '[Jobs] Apply and Save Job',
  props<{ cvData: CvData, coverLetterData: CoverLetterDocInfo }>()
);

/**
 * Add (create) a new job
 */
export const addJob = createAction(
  '[Jobs] Add Job',
  props<{ job: JobDetails }>()
);

export const addJobSuccess = createAction(
  '[Jobs] Add Job Success',
  props<{ job: JobDetails }>()
);

export const addJobFailure = createAction(
  '[Jobs] Add Job Failure',
  props<{ error: string }>()
);

/**
 * Update an existing job (full or partial)
 */
export const updateJob = createAction(
  '[Jobs] Update Job',
  props<{ id: string; changes: Partial<JobDetails> }>()
);

export const updateJobSuccess = createAction(
  '[Jobs] Update Job Success',
  props<{ job: JobDetails }>()
);

export const updateJobFailure = createAction(
  '[Jobs] Update Job Failure',
  props<{ error: string }>()
);

/**
 * Delete a job
 */
export const deleteJob = createAction(
  '[Jobs] Delete Job',
  props<{ id: string }>()
);

export const deleteJobSuccess = createAction(
  '[Jobs] Delete Job Success',
  props<{ id: string }>()
);

export const deleteJobFailure = createAction(
  '[Jobs] Delete Job Failure',
  props<{ error: string }>()
);

/**
 * Clear all jobs (e.g. on logout)
 */
export const clearJobs = createAction(
  '[Jobs] Clear Jobs'
);
