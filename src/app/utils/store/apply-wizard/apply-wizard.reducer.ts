import { createReducer, on } from '@ngrx/store';
import { ApplyWizardState } from './apply-wizard.state';
import { JobDetails } from '../../entities/job-details';
import {
  setWizardTab,
  addLoadingFlag,
  removeLoadingFlag,
  clearAllLoadingFlags,
  setJobUrl,
  setJobDescription,
  fetchJobFromUrl,
  fetchJobFromUrlSuccess,
  fetchJobFromUrlFailure,
  extractJobDetails,
  extractJobDetailsSuccess,
  extractJobDetailsFailure,
  setJobDetails,
  updateJobDetailsField,
  resetJobDetails,
  setCoverLetterInfo,
  clearCoverLetterInfo,
  setCvDetails,
  clearCvDetails,
  resetWizard
} from './apply-wizard.actions';

export const initialApplyWizardState: ApplyWizardState = {
  currentTab: 'Fetch Job',
  loadingFlags: {},
  jobDetails: null,
  coverLetterInfo: null,
  cvDetails: null,
  error: null
};

export const applyWizardReducer = createReducer(
  initialApplyWizardState,

  // ─── Tab Navigation ───────────────────────────────────────────────────
  on(setWizardTab, (state, { tab }) => ({
    ...state,
    currentTab: tab
  })),

  // ─── Loading Flags ────────────────────────────────────────────────────
  on(addLoadingFlag, (state, { key, messageKey }) => ({
    ...state,
    loadingFlags: { ...state.loadingFlags, [key]: messageKey }
  })),

  on(removeLoadingFlag, (state, { key }) => {
    const { [key]: _removed, ...rest } = state.loadingFlags;
    return { ...state, loadingFlags: rest };
  }),

  on(clearAllLoadingFlags, (state) => ({
    ...state,
    loadingFlags: {}
  })),

  // ─── Job URL & Description ─────────────────────────────────────────────
  on(setJobUrl, (state, { url }) => ({
    ...state,
    jobDetails: { ...state.jobDetails, jobUrl: url } as JobDetails
  })),
  on(setJobDescription, (state, { description }) => ({
    ...state,
    jobDetails: { ...state.jobDetails, jobDescription: description } as JobDetails
  })),

  // ─── Fetch Job From URL ────────────────────────────────────────────────
  on(fetchJobFromUrl, (state) => ({
    ...state,
    error: null
  })),

  on(fetchJobFromUrlSuccess, (state, { url, description }) => ({
    ...state,
    jobDetails: {
      ...state.jobDetails,
      jobUrl: url,
      jobDescription: description
    } as JobDetails,
    error: null
  })),

  on(fetchJobFromUrlFailure, (state, { error }) => ({
    ...state,
    error
  })),

  // ─── Extract Job Details ───────────────────────────────────────────────
  on(extractJobDetails, (state) => ({
    ...state,
    error: null
  })),

  on(extractJobDetailsSuccess, (state, { jobDetails }) => ({
    ...state,
    jobDetails: {
      ...jobDetails,
      jobUrl: jobDetails.jobUrl || state.jobDetails?.jobUrl,
      jobDescription: jobDetails.jobDescription || state.jobDetails?.jobDescription
    } as JobDetails,
    error: null
  })),

  on(extractJobDetailsFailure, (state, { error }) => ({
    ...state,
    error
  })),

  // ─── Job Details ──────────────────────────────────────────────────────
  on(setJobDetails, (state, { jobDetails }) => ({
    ...state,
    jobDetails: {
      ...jobDetails,
      jobUrl: jobDetails.jobUrl || state.jobDetails?.jobUrl,
      jobDescription: jobDetails.jobDescription || state.jobDetails?.jobDescription
    } as JobDetails
  })),

  on(updateJobDetailsField, (state, { key, value }) => ({
    ...state,
    jobDetails: {
      ...state.jobDetails,
      [key]: value
    } as JobDetails
  })),

  on(resetJobDetails, (state) => ({
    ...state,
    jobDetails: null
  })),

  // ─── Cover Letter Info ─────────────────────────────────────────────
  on(setCoverLetterInfo, (state, { coverLetterInfo }) => ({
    ...state,
    coverLetterInfo
  })),

  on(clearCoverLetterInfo, (state) => ({
    ...state,
    coverLetterInfo: null
  })),

  // ─── CV Details ───────────────────────────────────────────────────────
  on(setCvDetails, (state, { cvDetails }) => ({
    ...state,
    cvDetails
  })),

  on(clearCvDetails, (state) => ({
    ...state,
    cvDetails: null
  })),

  // ─── Reset ────────────────────────────────────────────────────────────
  on(resetWizard, () => ({ ...initialApplyWizardState }))
);
