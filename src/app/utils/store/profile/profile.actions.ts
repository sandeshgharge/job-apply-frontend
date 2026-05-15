import { createAction, props } from "@ngrx/store";


export const loadProfileInfo = createAction(
    '[Profile] Load Profile Info'
);

export const loadProfileInfoSuccess = createAction(
    '[Profile] Load Profile Info Success',
    props<{ profileInfo: any }>()
);

export const loadProfileInfoFailure = createAction(
    '[Profile] Load Profile Info Failure',
    props<{ error: string }>()
);

export const updateProfileInfo = createAction(
    '[Profile] Update Profile Info',
    props<{ profileInfo: any }>()
);

export const clearProfileInfo = createAction(
    '[Profile] Clear Profile Info'
);

export const loadCVInfo = createAction(
    '[Profile] Load CV Info',
    props<{ cvInfo: any }>()
);

export const updateCVInfo = createAction(
    '[Profile] Update CV Info',
    props<{ cvInfo: any }>()
);

export const saveNewCVInfo = createAction(
    '[Profile] Save New CV Info',
    props<{ cvInfo: any }>()
);

export const loadCoverLetterInfo = createAction(
    '[Profile] Load Cover Letter Info',
    props<{ coverLetterInfo: any }>()
);

export const updateCoverLetterInfo = createAction(
    '[Profile] Update Cover Letter Info',
    props<{ coverLetterInfo: any }>()
);

export const saveNewCoverLetterInfo = createAction(
    '[Profile] Save New Cover Letter Info',
    props<{ coverLetterInfo: any }>()
);