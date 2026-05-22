import { createReducer, on } from "@ngrx/store";
import { ProfileInfo } from "../../entities/user";
import { ProfileInfoState } from "./profile.state";
import { loadCoverLetterInfoSuccess, loadCVInfoSuccess, loadProfileInfo, loadProfileInfoFailure, loadProfileInfoSuccess, saveNewCoverLetterInfoSuccess, saveNewCVInfo, saveNewCVInfoSuccess, updateCoverLetterInfo, updateCoverLetterInfoSuccess, updateCVInfo, updateCVInfoSuccess, updateProfileInfo } from "./profile.actions";

export const initialProfileState : ProfileInfoState = {
    profileInfo: null,
    cvInfoList: [],
    coverLetterInfoList: [],
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

    on(loadCVInfoSuccess, (state, { cvInfoList }) => ({
        ...state,
        cvInfoList : cvInfoList
    })),

    on(updateCVInfo, (state, {cvInfo}) => ({
        ...state,
        loading: true
    })),

    on(updateCVInfoSuccess, (state, {cvInfo}) => ({
        ...state,
        cvInfoList: state.cvInfoList.map(cv => cv.id === cvInfo.id ? cvInfo : cv),
        loading: false
    })),

    on(saveNewCVInfoSuccess, (state, {cvInfo}) => ({
        ...state,
        cvInfoList: [...state.cvInfoList, cvInfo]
    })),

    on(loadCoverLetterInfoSuccess, (state, { coverLetterInfoList }) => ({
        ...state,
        coverLetterInfoList : coverLetterInfoList
    })),

    on(saveNewCoverLetterInfoSuccess, (state, { coverLetterInfo }) => ({
        ...state,
        coverLetterInfoList: [...state.coverLetterInfoList, coverLetterInfo]
    })),

    on(updateCoverLetterInfo, (state, {coverLetterInfo}) => ({
        ...state,
        loading: true
    })),

    on(updateCoverLetterInfoSuccess, (state, {coverLetterInfo}) => ({
        ...state,
        coverLetterInfo: state.coverLetterInfoList.map(cl => cl.id === coverLetterInfo.id ? coverLetterInfo : cl),
        loading: false
    })),

);
