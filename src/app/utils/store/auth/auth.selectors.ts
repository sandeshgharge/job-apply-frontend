import { createFeatureSelector, createSelector } from "@ngrx/store";
import { AuthState } from "./auth.state";

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(
    selectAuthState,
    (state: AuthState) => state.user
);

export const selectCurrentUserName = createSelector(
    selectCurrentUser,
    (user) => user?.name ?? ''
);

export const selectIsAuthenticated = createSelector(
    selectAuthState,
    (state: AuthState) => state.isAuthenticated
);

export const selectAuthLoading = createSelector(
    selectAuthState,
    (state: AuthState) => state.loading
);

export const selectAuthError = createSelector(
    selectAuthState,
    (state: AuthState) => state.error
);

export const selectUserID = createSelector(
    selectCurrentUser,
    (user) => user?.id ?? ''
);