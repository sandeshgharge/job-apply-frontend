import { createReducer, on } from "@ngrx/store";
import { ProfileInfoState } from "./profile.state";
import { clearProfileInfo, loadProfileInfo, loadProfileInfoFailure, loadProfileInfoSuccess, updateProfileInfo, createAgentSuccess, updateAgentSuccess, updateSelectedAgentId } from "./profile.actions";

export const initialProfileState: ProfileInfoState = {
    profileInfo: null,
    loading: false,
    error: null
};

export const profileReducer = createReducer(
    initialProfileState,

    on(loadProfileInfo, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(loadProfileInfoSuccess, (state, { profileInfo }) => ({
        ...state,
        profileInfo,
        loading: false,
        error: null
    })),

    on(loadProfileInfoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    on(updateProfileInfo, (state, { profileInfo }) => ({
        ...state,
        profileInfo: { ...state.profileInfo, ...profileInfo }
    })),

    on(updateSelectedAgentId, (state, { selectedAgentId }) => ({
        ...state,
        profileInfo: state.profileInfo ? { ...state.profileInfo, selectedAgentId } : null
    })),

    on(clearProfileInfo, () => ({
        ...initialProfileState
    })),

    on(createAgentSuccess, (state, { agent }) => {
        if (!state.profileInfo) return state;
        const currentAgents = state.profileInfo.userApiAgents || [];
        return {
            ...state,
            profileInfo: {
                ...state.profileInfo,
                userApiAgents: [...currentAgents, agent],
                // Automatically select the newly created agent
                selectedAgentId: agent.id ?? state.profileInfo.selectedAgentId
            }
        };
    }),

    on(updateAgentSuccess, (state, { agent }) => {
        if (!state.profileInfo) return state;
        const currentAgents = state.profileInfo.userApiAgents || [];
        return {
            ...state,
            profileInfo: {
                ...state.profileInfo,
                userApiAgents: currentAgents.map(a => a.id === agent.id ? agent : a)
            }
        };
    })
);
