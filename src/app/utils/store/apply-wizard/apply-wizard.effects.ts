import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, mergeMap, concat, tap } from 'rxjs';
import { JobsService } from '../../services/jobs.service';
import { ToastService } from '../../services/toast.service';
import { TranslationService } from '../../services/translation/translation.service';
import {
  fetchJobFromUrl,
  fetchJobFromUrlSuccess,
  fetchJobFromUrlFailure,
  extractJobDetails,
  extractJobDetailsSuccess,
  extractJobDetailsFailure,
  addLoadingFlag,
  removeLoadingFlag,
  setJobDetails
} from './apply-wizard.actions';

// Loading key constants — centralize for consistency
export const LOADING_KEYS = {
  FETCH_JOB: 'fetchJob',
  EXTRACT_DATA: 'extractData',
  DOWNLOAD_CV_PDF: 'downloadCvPdf',
  DOWNLOAD_CL_PDF: 'downloadClPdf',
  CV_PREVIEW: 'cvPreview',
  CL_PREVIEW: 'clPreview',
  APPLY_JOB: 'applyJob',
  SCRAPE_JOB: 'scrapeJob'
} as const;

@Injectable()
export class ApplyWizardEffects {
  private actions$ = inject(Actions);
  private jobsService = inject(JobsService);
  private toastService = inject(ToastService);
  private translate = inject(TranslationService);

  /** Effect: Fetch job description from URL */
  fetchJobFromUrl$ = createEffect(() =>
    this.actions$.pipe(
      ofType(fetchJobFromUrl),
      switchMap(({ url }) =>
        concat(
          of(addLoadingFlag({ key: LOADING_KEYS.SCRAPE_JOB, messageKey: 'applyWizard.loadingScrapeJob' })),
          this.jobsService.extractJobDescription(url).pipe(
            mergeMap(result => [
              removeLoadingFlag({ key: LOADING_KEYS.SCRAPE_JOB }),
              addLoadingFlag({ key: LOADING_KEYS.FETCH_JOB, messageKey: 'applyWizard.loadingFetchJob' }),
              fetchJobFromUrlSuccess({ url: result.url, description: result.description }),
              removeLoadingFlag({ key: LOADING_KEYS.FETCH_JOB })
            ]),
            catchError((error: any) => of(
              removeLoadingFlag({ key: LOADING_KEYS.SCRAPE_JOB }),
              removeLoadingFlag({ key: LOADING_KEYS.FETCH_JOB }),
              fetchJobFromUrlFailure({ error: error?.message ?? 'Failed to fetch job' })
            ))
          )
        )
      )
    )
  );

  /** Effect: Show toast on fetch failure */
  fetchJobFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(fetchJobFromUrlFailure),
      tap(() => {
        this.toastService.show(this.translate.t().applyWizard.toastFetchFailed, 'error');
      })
    ),
    { dispatch: false }
  );

  /** Effect: Show toast on fetch success */
  fetchJobSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(fetchJobFromUrlSuccess),
      tap(() => {
        this.toastService.show(this.translate.t().applyWizard.toastJobLoaded);
      })
    ),
    { dispatch: false }
  );

  /** Effect: AI extraction of job details */
  extractJobDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(extractJobDetails),
      switchMap(({ jobDescription }) =>
        concat(
          of(addLoadingFlag({ key: LOADING_KEYS.EXTRACT_DATA, messageKey: 'applyWizard.loadingExtractData' })),
          this.jobsService.extractJobDetails(jobDescription).pipe(
            mergeMap((details) => {
              const appliedDate = new Date().toISOString().split('T')[0];
              const jobDetails = { ...details, jobDescription, appliedDate };
              return [
                extractJobDetailsSuccess({ jobDetails }),
                setJobDetails({ jobDetails }),
                removeLoadingFlag({ key: LOADING_KEYS.EXTRACT_DATA })
              ];
            }),
            catchError((error: any) => {
              console.error(error)
              return of(
              removeLoadingFlag({ key: LOADING_KEYS.EXTRACT_DATA }),
              extractJobDetailsFailure({ error: error?.message ?? 'Extraction failed' })
            
            )}
          )
          )
        )
      )
    )
  );

  /** Effect: Show toast on extract success */
  extractSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(extractJobDetailsSuccess),
      tap(() => {
        this.toastService.show(this.translate.t().applyWizard.toastDataExtracted);
      })
    ),
    { dispatch: false }
  );

  /** Effect: Show toast on extract failure */
  extractFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(extractJobDetailsFailure),
      tap(() => {
        this.toastService.show(this.translate.t().applyWizard.toastExtractFailed, 'error');
      })
    ),
    { dispatch: false }
  );
}
