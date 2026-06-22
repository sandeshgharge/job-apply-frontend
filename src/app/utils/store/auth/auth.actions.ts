import { createAction, props } from '@ngrx/store';
import { User } from '@app/utils/entities/user';

export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string; redirect?: boolean }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const changePassword = createAction(
  '[Auth] Change Password', 
  props<{ password:string }>()
);

export const logout = createAction('[Auth] Logout');

export const autoLogin = createAction('[Auth] Auto Login');