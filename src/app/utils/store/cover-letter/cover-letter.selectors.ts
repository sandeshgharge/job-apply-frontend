import { createFeatureSelector, createSelector } from "@ngrx/store";
import { CoverLetterState } from "./cover-letter.state";

export const selectCoverLetterState = createFeatureSelector<CoverLetterState>('coverLetter');

export const selectCoverLetterInfoList = createSelector(
    selectCoverLetterState,
    (state: CoverLetterState) => state.coverLetterInfoList
);

export const selectedCoverLetterVersion = createSelector(
    selectCoverLetterState,
    (state: CoverLetterState) => state.selectedVersion
);

export const selectCurrentCoverLetter = createSelector(
    selectCoverLetterState,
    (state: CoverLetterState) => state.coverLetterInfoList.find(cl => cl.version === state.selectedVersion) || null
);

export const selectCoverLetterLoading = createSelector(
    selectCoverLetterState,
    (state: CoverLetterState) => state.loading
);

export const selectCoverLetterError = createSelector(
    selectCoverLetterState,
    (state: CoverLetterState) => state.error
);
