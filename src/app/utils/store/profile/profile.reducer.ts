import { createReducer, on } from "@ngrx/store";
import { ProfileInfo } from "../../entities/user";
import { ProfileInfoState } from "./profile.state";
import { loadProfileInfo, loadProfileInfoFailure, loadProfileInfoSuccess } from "./profile.actions";

export const initialProfileState : ProfileInfoState = {
    profileInfo: null,
    cvInfo: null,
    coverLetterInfo: null,
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
        loading: false
    })),

    on(loadProfileInfoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    }))
);
