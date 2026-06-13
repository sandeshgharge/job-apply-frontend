import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, from } from 'rxjs';
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
  applyAndSaveJob
} from './jobs.actions';

@Injectable()
export class JobsEffects {
  private actions$ = inject(Actions);
  private jobsService = inject(JobsService);
  private toastService = inject(ToastService);

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
      switchMap(({ cvData, coverLetterData }) =>
        this.jobsService.applyAndSaveJob(cvData, coverLetterData).pipe(
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
            this.toastService.show('Application added!');
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
