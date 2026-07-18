import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, from, withLatestFrom, concat } from 'rxjs';
import { addLoadingFlag, removeLoadingFlag } from '../apply-wizard/apply-wizard.actions';
import { LOADING_KEYS } from '../apply-wizard/apply-wizard.effects';
import { JobsService } from '../../services/jobs.service';
import { ToastService } from '../../services/toast.service';
import { loginSuccess } from '../auth/auth.actions';
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
  applyAndSaveJob,
  applyJob
} from './jobs.actions';
import { Store } from '@ngrx/store';
import { selectJobDetails } from '../apply-wizard/apply-wizard.selectors';

@Injectable()
export class JobsEffects {
  private actions$ = inject(Actions);
  private jobsService = inject(JobsService);
  private toastService = inject(ToastService);
  private store = inject(Store);

  loadJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadJobs),
      switchMap(() =>
        this.jobsService.fetchJobs().pipe(
          map(jobs => loadJobsSuccess({ jobs })),
          catchError((error: any) => {
            this.toastService.show('Failed to load jobs: ' + (error?.message ?? 'Unknown error'), 'error');
            return of(loadJobsFailure({ error: error?.message ?? 'Failed to load jobs' }));
          })
        )
      )
    )
  );

  loadJobsOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      map(() => loadJobs())
    )
  );

  applyAndSaveJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(applyAndSaveJob),
      withLatestFrom(this.store.select(selectJobDetails)),
      switchMap(([{ cvData, coverLetterData }, jobDetails]) =>
        this.jobsService.applyAndSaveJob(cvData, coverLetterData, jobDetails).pipe(
          map((res) => {
            this.toastService.show('Application saved successfully!');
            return addJobSuccess({ job: res.jobObj });
          }),
          catchError((error: any) => {
            this.toastService.show('Failed to save job: ' + (error?.message ?? 'Unknown error'), 'error');
            return of({ type: '[Jobs] Save Job Failure', error: error?.message ?? 'Failed to save job' });
          })
        )
      )
    )
  );

  addJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addJob),
      switchMap(({ job }) =>
        this.jobsService.createJob(job).pipe(
          map(savedJob => {
            this.toastService.show('Application successfully saved to database!');
            return addJobSuccess({ job: savedJob });
          }),
          catchError((error: any) => {
            this.toastService.show('Failed to add job: ' + (error?.message ?? 'Unknown error'), 'error');
            return of(addJobFailure({ error: error?.message ?? 'Failed to add job' }));
          })
        )
      )
    )
  );

  applyJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(applyJob),
      withLatestFrom(this.store.select(selectJobDetails)),
      switchMap(([_, jobDetails]) =>
        concat(
          of(addLoadingFlag({ key: LOADING_KEYS.APPLY_JOB, messageKey: 'applyWizard.loadingApplyJob' })),
          this.jobsService.applyAndSaveJob(undefined, undefined, jobDetails).pipe(
            switchMap((savedJob) => {
              this.toastService.show('Application applied successfully!');
              const jobData = savedJob.jobObj ? savedJob.jobObj : savedJob;
              return of(
                removeLoadingFlag({ key: LOADING_KEYS.APPLY_JOB }),
                addJobSuccess({ job: jobData })
              );
            }),
            catchError((error: any) => {
              this.toastService.show('Failed to apply job: ' + (error?.message ?? 'Unknown error'), 'error');
              return of(
                removeLoadingFlag({ key: LOADING_KEYS.APPLY_JOB }),
                addJobFailure({ error: error?.message ?? 'Failed to apply job' })
              );
            })
          )
        )
      )
    )
  );

  updateJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateJob),
      switchMap(({ id, changes }) =>
        this.jobsService.updateJob(id, changes).pipe(
          map(updatedJob => {
            this.toastService.show('Application updated!');
            return updateJobSuccess({ job: updatedJob });
          }),
          catchError((error: any) => {
            this.toastService.show('Failed to update job: ' + (error?.message ?? 'Unknown error'), 'error');
            return of(updateJobFailure({ error: error?.message ?? 'Failed to update job' }));
          })
        )
      )
    )
  );

  deleteJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteJob),
      switchMap(({ id }) =>
        from(this.jobsService.deleteJob(id)).pipe(
          // handle the case where the service returns an Observable wrapped in a Promise
          switchMap((res: any) => (res && typeof res.subscribe === 'function' ? res : of(res))),
          map(() => {
            this.toastService.show('Application deleted.', 'info');
            return deleteJobSuccess({ id });
          }),
          catchError((error: any) => {
            this.toastService.show('Failed to delete job: ' + (error?.message ?? 'Unknown error'), 'error');
            return of(deleteJobFailure({ error: error?.message ?? 'Failed to delete job' }));
          })
        )
      )
    )
  );
}
