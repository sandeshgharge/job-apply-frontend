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

export const selectActiveAgent = createSelector(
    selectProfileState,
    (state: ProfileInfoState) => state.profileInfo?.userApiAgents?.find(a => a.id === state.profileInfo?.selectedAgentId)
);

export const selectProfileApiUrl = createSelector(
    selectActiveAgent,
    (agent) => agent?.agentApiUrl
);

export const selectProfileApiKey = createSelector(
    selectActiveAgent,
    (agent) => agent?.agentApiKey
);

export const selectProfileModelName = createSelector(
    selectActiveAgent,
    (agent) => agent?.modelName
);