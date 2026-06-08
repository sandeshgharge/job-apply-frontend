import { Actions, createEffect, ofType } from "@ngrx/effects";
import { loadProfileInfo, loadProfileInfoFailure, loadProfileInfoSuccess, updateProfileInfo } from "./profile.actions";
import { catchError, from, map, of, switchMap } from "rxjs";
import { inject, Injectable } from "@angular/core";
import { ProfileService } from "../../services/profile.service";
import { FileService } from "../../services/file.service";
import { ProfileInfo } from "../../entities/user";


@Injectable()
export class ProfileEffects {
    private actions$ = inject(Actions);
    private profileService = inject(ProfileService);
    private fileService = inject(FileService);

    loadProfileInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadProfileInfo),
            switchMap(() =>
                from(this.profileService.getProfile()).pipe(
                    map(response => {
                        if (response.error) {
                            console.log('Error loading profile:', response.error);
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
                    map(updatedProfile =>
                        loadProfileInfoSuccess({ profileInfo: updatedProfile })
                    ),
                    catchError((error: any) =>
                        of(loadProfileInfoFailure({ error: error?.message ?? "Profile update failed" }))
                    )
                )
            )
        )
    );
}
