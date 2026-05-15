import { ActionReducerMap } from '@ngrx/store';
import { AppState } from './app.state';
import { authReducer } from './auth/auth.reducer';
import { profileReducer } from './profile/profile.reducer';

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  profile: profileReducer
};