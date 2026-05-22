import { createAction, props } from "@ngrx/store";
import { ProfileInfo } from "../../entities/user";
import { CVInfo } from "../../entities/cv";
import { CoverLetterInfo } from "../../entities/cover-letter";

/**
 * Profile Info ACtions
 */
export const loadProfileInfo = createAction(
    '[Profile] Load Profile Info'
);

export const loadProfileInfoSuccess = createAction(
    '[Profile] Load Profile Info Success',
    props<{ profileInfo: ProfileInfo }>()
);

export const loadProfileInfoFailure = createAction(
    '[Profile] Load Profile Info Failure',
    props<{ error: string }>()
);

export const updateProfileInfo = createAction(
    '[Profile] Update Profile Info',
    props<{ profileInfo: ProfileInfo }>()
);

export const clearProfileInfo = createAction(
    '[Profile] Clear Profile Info'
);

/**
 * CV Actions
 */

export const loadCVInfo = createAction(
    '[Profile] Load CV Info',
    props<{ userId: string }>()
);

export const loadCVInfoSuccess = createAction(
    '[Profile] Load CV Info Success',
    props<{ cvInfoList : CVInfo []}>()
);

export const updateCVInfo = createAction(
    '[Profile] Update CV Info',
    props<{ cvInfo: CVInfo }>()
);

export const updateCVInfoSuccess = createAction(
    '[Profile] Update CV Info',
    props<{cvInfo : CVInfo}>()
)

export const saveNewCVInfo = createAction(
    '[Profile] Save New CV Info',
    props<{ cvInfo: CVInfo }>()
);

export const saveNewCVInfoSuccess = createAction(
    '[Profile] Save New CV Info Success',
    props<{ cvInfo: CVInfo }>()
);

/**
 * Cover Letter Actions
 */
export const loadCoverLetterInfo = createAction(
    '[Profile] Load Cover Letter Info',
    props<{ userId: string }>()
);

export const loadCoverLetterInfoSuccess = createAction(
    '[Profile] Load Cover Letter Info Success',
    props<{ coverLetterInfoList : CoverLetterInfo []}>()
);

export const updateCoverLetterInfo = createAction(
    '[Profile] Update Cover Letter Info',
    props<{ coverLetterInfo: CoverLetterInfo }>()
);

export const updateCoverLetterInfoSuccess = createAction(
    '[Profile] Update Cover Letter Info Success',
    props<{coverLetterInfo: CoverLetterInfo}>()
);

export const saveNewCoverLetterInfo = createAction(
    '[Profile] Save New Cover Letter Info',
    props<{ coverLetterInfo: CoverLetterInfo }>()
);

export const saveNewCoverLetterInfoSuccess = createAction(
    '[Profile] Save New Cover Letter Info Success',
    props<{ coverLetterInfo: CoverLetterInfo }>()
);