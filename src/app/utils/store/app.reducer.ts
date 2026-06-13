import { ActionReducerMap } from '@ngrx/store';
import { AppState } from './app.state';
import { authReducer } from './auth/auth.reducer';
import { cvReducer } from './cv/cv.reducer';
import { coverLetterReducer } from './cover-letter/cover-letter.reducer';
import { profileReducer } from './profile/profile.reducer';
import { jobsReducer } from './jobs/jobs.reducer';

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  profile: profileReducer,
  cv: cvReducer,
  coverLetter: coverLetterReducer,
  jobs: jobsReducer
};