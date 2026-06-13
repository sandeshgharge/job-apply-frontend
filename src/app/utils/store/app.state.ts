import { AuthState } from './auth/auth.state';
import { CVState } from './cv/cv.state';
import { CoverLetterState } from './cover-letter/cover-letter.state';
import { ProfileInfoState } from './profile/profile.state';
import { JobsState } from './jobs/jobs.state';

export interface AppState {
  auth: AuthState;
  profile: ProfileInfoState;
  cv: CVState;
  coverLetter: CoverLetterState;
  jobs: JobsState;
}