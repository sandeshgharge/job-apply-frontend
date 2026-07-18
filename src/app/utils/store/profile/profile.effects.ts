import { Actions, createEffect, ofType } from "@ngrx/effects";
import { clearProfileInfo, loadProfileInfo, loadProfileInfoFailure, loadProfileInfoSuccess, updateProfileInfo, createAgent, createAgentSuccess, createAgentFailure, updateAgent, updateAgentSuccess, updateAgentFailure } from "./profile.actions";
import { catchError, from, map, of, switchMap } from "rxjs";
import { inject, Injectable } from "@angular/core";
import { ProfileService } from "../../services/profile.service";
import { AgentsService } from "../../services/agents.service";
import { ProfileInfo } from "../../entities/user";
import { ToastService } from "@app/utils/services/toast.service";
import { loginSuccess } from "../auth/auth.actions";
import { AuthService } from "@app/utils/services/auth.service";


@Injectable()
export class ProfileEffects {
    private actions$ = inject(Actions);
    private profileService = inject(ProfileService);
    private agentsService = inject(AgentsService);
    private toastService = inject(ToastService);

    loadProfileInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadProfileInfo),
            switchMap(() =>
                from(this.profileService.getProfile()).pipe(
                    map(response => {
                        if (response.error) {
                            this.toastService.show('Failed to load profile information : ' + response.error.message, 'error');
                            return loadProfileInfoFailure({ error: response.error.message ?? "Profile load failed" })
                        }
                        return loadProfileInfoSuccess({ profileInfo: response as ProfileInfo });
                    }),
                    catchError((error: any) =>
                        of(loadProfileInfoFailure({ error: error?.message ?? "Profile load failed" }))
                    )
                )
            )
        )
    );

    updateProfileInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateProfileInfo),
            switchMap(({ profileInfo }) =>
                from(this.profileService.uploadImagesAndSave(profileInfo)).pipe(
                    map(updatedProfile => {
                        this.toastService.show('Profile information updated!');
                        return loadProfileInfoSuccess({ profileInfo: updatedProfile })
                    }
                    ),
                    catchError((error: any) =>
                        of(loadProfileInfoFailure({ error: error?.message ?? "Profile update failed" }))
                    )
                )
            )
        )
    );

    createAgent$ = createEffect(() =>
        this.actions$.pipe(
            ofType(createAgent),
            switchMap(({ agent }) =>
                from(this.agentsService.createAgent(agent)).pipe(
                    map(response => {
                        this.toastService.show('Agent created successfully!');
                        // Assuming backend returns the created agent in response.data or response
                        const newAgent = response.data ? response.data[0] : response;
                        return createAgentSuccess({ agent: newAgent });
                    }),
                    catchError((error: any) => {
                        this.toastService.show('Failed to create agent', 'error');
                        return of(createAgentFailure({ error: error?.message ?? "Agent creation failed" }));
                    })
                )
            )
        )
    );

    updateAgent$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateAgent),
            switchMap(({ id, agent }) =>
                this.agentsService.updateAgent(id, agent).pipe(
                    map(response => {
                        this.toastService.show('Agent updated successfully!');
                        // Assuming backend returns the updated agent
                        return updateAgentSuccess({ agent: {id, ...agent} });
                    }),
                    catchError((error: any) => {
                        this.toastService.show('Failed to update agent', 'error');
                        return of(updateAgentFailure({ error: error?.message ?? "Agent update failed" }));
                    })
                )
            )
        )
    );
}

