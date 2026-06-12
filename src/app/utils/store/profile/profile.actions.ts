import { createAction, props } from "@ngrx/store";
import { ProfileInfo } from "../../entities/user";

/**
 * Profile Info Actions
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