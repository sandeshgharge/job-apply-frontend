import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ProfileInfoState } from "./profile.state";

export const selectProfileState = createFeatureSelector<ProfileInfoState>('profile');

export const selectProfileInfo = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo
);

export const profileLocation = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo?.location
)

export const selectCVInfoList = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.cvInfoList
);

export const selectCoverLetterInfoList = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.coverLetterInfoList
);

export const selectLoading = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.loading
);

export const selectError = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.error
);