import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApplyWizardState } from './apply-wizard.state';
import { selectProfileInfo } from '../profile/profile.selector';
import { CoverLetterDocInfo } from '../../entities/cover-letter';

export const selectApplyWizardState = createFeatureSelector<ApplyWizardState>('applyWizard');

export const selectCurrentTab = createSelector(
  selectApplyWizardState,
  (state) => state.currentTab
);

export const selectLoadingFlags = createSelector(
  selectApplyWizardState,
  (state) => state.loadingFlags
);

/** Returns true if ANY loading operation is in progress */
export const selectIsAnyLoading = createSelector(
  selectLoadingFlags,
  (flags) => Object.keys(flags).length > 0
);

/** Returns an array of loading message i18n keys (for display) */
export const selectLoadingMessages = createSelector(
  selectLoadingFlags,
  (flags) => Object.values(flags)
);

export const selectJobDetails = createSelector(
  selectApplyWizardState,
  (state) => state.jobDetails
);

export const selectCoverLetterInfo = createSelector(
  selectApplyWizardState,
  (state) => state.coverLetterInfo
);

export const selectCoverLetterDetails = createSelector(
  selectCoverLetterInfo,
  selectJobDetails,
  selectProfileInfo,
  (info, job, profile): CoverLetterDocInfo => ({
    applicantName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : '',
    applicantLocation: profile?.location || '',
    applicantEmail: profile?.email || '',
    companyName: job?.companyName || '',
    companyLocation: job?.companyLocation || '',
    contactName: job?.contactName || 'Hiring Manager',
    date: job?.appliedDate ? new Date(job.appliedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }),
    role: job?.role || '',
    paragraphs: info?.clData?.sectionPrompts ? info.clData.sectionPrompts.map(s => s.content) : [],
    signUrl: ''
  })
);

export const selectCvDetails = createSelector(
  selectApplyWizardState,
  (state) => state.cvDetails
);

export const selectJobUrl = createSelector(
  selectJobDetails,
  (jobDetails) => jobDetails?.jobUrl ?? ''
);

export const selectJobDescription = createSelector(
  selectJobDetails,
  (jobDetails) => jobDetails?.jobDescription ?? ''
);

export const selectWizardError = createSelector(
  selectApplyWizardState,
  (state) => state.error
);

/** Convenience: is a specific loading key active? */
export const selectIsLoadingKey = (key: string) => createSelector(
  selectLoadingFlags,
  (flags) => key in flags
);
