import { AuthState } from './auth/auth.state';
import { ProfileInfoState } from './profile/profile.state';

export interface AppState {
  auth: AuthState;
  profile: ProfileInfoState
}