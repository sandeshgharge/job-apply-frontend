import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ProfileInfoState } from "./profile.state";

export const selectProfileState = createFeatureSelector<ProfileInfoState>('profile');

export const selectProfileImageUrl = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo?.profileImageUrl
)

export const selectProfileInfo = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo
);

export const profileLocation = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo?.location
)

export const selectProfileLoading = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.loading
);

export const selectProfileError = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.error
);

export const selectProfileRole = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo?.role
);

export const selectProfileUseDefaultApi = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo?.useDefaultApi
);

export const selectProfileApiUrl = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo?.agentApiUrl
);

export const selectProfileApiKey = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo?.agentApiKey
);

export const selectProfileModelName = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo?.modelName
);