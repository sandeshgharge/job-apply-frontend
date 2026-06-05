import { createFeatureSelector, createSelector } from "@ngrx/store";
import { CVState } from "./cv.state";

export const selectCVState = createFeatureSelector<CVState>('cv');

export const selectCVInfoList = createSelector(
    selectCVState,
    (state: CVState) => state.cvInfoList
);

export const selectedCVVersion = createSelector(
    selectCVState,
    (state: CVState) => state.selectedVersion
);

export const selectCurrentCV = createSelector(
    selectCVState,
    (state: CVState) => state.cvInfoList.find(cv => cv.version === state.selectedVersion) || null
);

export const selectCVLoading = createSelector(
    selectCVState,
    (state: CVState) => state.loading
);

export const selectCVError = createSelector(
    selectCVState,
    (state: CVState) => state.error
);