import { createReducer, on } from '@ngrx/store';
import { JobsState } from './jobs.state';
import {
  loadJobs,
  loadJobsSuccess,
  loadJobsFailure,
  addJob,
  addJobSuccess,
  addJobFailure,
  updateJob,
  updateJobSuccess,
  updateJobFailure,
  deleteJob,
  deleteJobSuccess,
  deleteJobFailure,
  clearJobs
} from './jobs.actions';

export const initialJobsState: JobsState = {
  jobs: [],
  loading: false,
  error: null
};

export const jobsReducer = createReducer(
  initialJobsState,

  // Load
  on(loadJobs, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loadJobsSuccess, (state, { jobs }) => ({
    ...state,
    jobs,
    loading: false,
    error: null
  })),

  on(loadJobsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Add
  on(addJob, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(addJobSuccess, (state, { job }) => ({
    ...state,
    jobs: [job, ...state.jobs],
    loading: false,
    error: null
  })),

  on(addJobFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update
  on(updateJob, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(updateJobSuccess, (state, { job }) => ({
    ...state,
    jobs: state.jobs.map(j => j.id === job.id ? { ...j, ...job } : j),
    loading: false,
    error: null
  })),

  on(updateJobFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete
  on(deleteJob, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(deleteJobSuccess, (state, { id }) => ({
    ...state,
    jobs: state.jobs.filter(j => j.id !== id),
    loading: false,
    error: null
  })),

  on(deleteJobFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear
  on(clearJobs, () => ({
    ...initialJobsState
  }))
);
