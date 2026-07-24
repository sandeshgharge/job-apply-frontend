import { JobDetails } from '../../entities/job-details';
import { CoverLetterInfo } from '../../entities/cover-letter';
import { CVInfo } from '../../entities/cv';

export type WizardTabId = 'Fetch Job' | 'Cover Letter' | 'CV' | 'PDF Preview';

/**
 * LoadingMap: a map of unique loading keys to a human-readable i18n message key.
 * Used so multiple async operations can be tracked concurrently.
 * When an operation completes, its key is removed.
 */
export type LoadingMap = Record<string, string>;

export interface ApplyWizardState {
  /** The currently active wizard tab */
  currentTab: WizardTabId;

  /**
   * HashMap of concurrent loading operations.
   * Key = unique loading key (e.g. 'fetchJob', 'extractData', 'downloadCvPdf')
   * Value = i18n key string for the loading message (e.g. 'applyWizard.loadingFetchJob')
   */
  loadingFlags: LoadingMap;

  /** Job details parsed/fetched from job postings - replaces BehaviorSubject in JobsService */
  jobDetails: JobDetails | null;

  /** Draft Cover Letter info for the current application */
  coverLetterInfo: CoverLetterInfo | null;

  /** Draft CV data for the current application - replaces draftCV signal in CvService */
  cvDetails: CVInfo | null;

  /** General error message, if any */
  error: string | null;
}
