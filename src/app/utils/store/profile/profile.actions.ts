import { createAction, props } from "@ngrx/store";
import { ApiAgentInfo, ProfileInfo } from "../../entities/user";

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

export const updateSelectedAgentId = createAction(
    '[Profile] Update Selected Agent Id',
    props<{ selectedAgentId: string | null }>()
);

export const clearProfileInfo = createAction(
    '[Profile] Clear Profile Info'
);  

export const createAgent = createAction(
    '[Profile] Create Agent',
    props<{ agent: ApiAgentInfo }>()
);

export const createAgentSuccess = createAction(
    '[Profile] Create Agent Success',
    props<{ agent: ApiAgentInfo }>()
);

export const createAgentFailure = createAction(
    '[Profile] Create Agent Failure',
    props<{ error: string }>()
);

export const updateAgent = createAction(
    '[Profile] Update Agent',
    props<{ id: string, agent: Omit<ApiAgentInfo, 'id' | 'userId'> }>()
);

export const updateAgentSuccess = createAction(
    '[Profile] Update Agent Success',
    props<{ agent: ApiAgentInfo }>()
);

export const updateAgentFailure = createAction(
    '[Profile] Update Agent Failure',
    props<{ error: string }>()
);