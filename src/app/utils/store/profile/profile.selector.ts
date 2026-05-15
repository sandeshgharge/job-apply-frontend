import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ProfileInfoState } from "./profile.state";

export const selectProfileState = createFeatureSelector<ProfileInfoState>('profile');

export const selectProfileInfo = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo
);

export const selectCVInfo = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.cvInfo
);

export const selectCoverLetterInfo = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.coverLetterInfo
);

export const selectLoading = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.loading
);

export const selectError = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.error
);