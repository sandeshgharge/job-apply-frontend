import { createAction, props } from "@ngrx/store";
import { CoverLetterInfo } from "../../entities/cover-letter";

/**
 * Cover Letter Actions
 */
export const loadCoverLetterInfo = createAction(
    '[Cover Letter] Load Cover Letter Info',
    props<{ userId: string }>()
);

export const loadCoverLetterInfoSuccess = createAction(
    '[Cover Letter] Load Cover Letter Info Success',
    props<{ coverLetterInfoList: CoverLetterInfo[] }>()
);

export const loadCoverLetterInfoFailure = createAction(
    '[Cover Letter] Load Cover Letter Info Failure',
    props<{ error: string }>()
);

export const updateCoverLetterInfo = createAction(
    '[Cover Letter] Update Cover Letter Info',
    props<{ coverLetterInfo: CoverLetterInfo }>()
);

export const updateCoverLetterInfoSuccess = createAction(
    '[Cover Letter] Update Cover Letter Info Success',
    props<{ coverLetterInfo: CoverLetterInfo }>()
);

export const updateCoverLetterInfoFailure = createAction(
    '[Cover Letter] Update Cover Letter Info Failure',
    props<{ error: string }>()
);

export const saveNewCoverLetterInfo = createAction(
    '[Cover Letter] Save New Cover Letter Info',
    props<{ coverLetterInfo: CoverLetterInfo }>()
);

export const saveNewCoverLetterInfoSuccess = createAction(
    '[Cover Letter] Save New Cover Letter Info Success',
    props<{ coverLetterInfo: CoverLetterInfo }>()
);

export const saveNewCoverLetterInfoFailure = createAction(
    '[Cover Letter] Save New Cover Letter Info Failure',
    props<{ error: string }>()
);

export const selectCoverLetterVersion = createAction(
    '[Cover Letter] Select Cover Letter Version',
    props<{ version: string }>()
);
