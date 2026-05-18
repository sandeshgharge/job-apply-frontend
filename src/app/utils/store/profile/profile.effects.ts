import { Actions, createEffect, ofType } from "@ngrx/effects";
import { loadCoverLetterInfo, loadProfileInfo, loadProfileInfoFailure, loadProfileInfoSuccess, updateProfileInfo } from "./profile.actions";
import { catchError, from, map, of, switchMap } from "rxjs";
import { inject, Injectable } from "@angular/core";
import { ProfileService } from "../../services/profile.service";
import { mapProfileDtoToProfile, mapProfileToProfileDto } from "../../supabase/mapper";


@Injectable()
export class ProfileEffects {
    constructor(private profileService: ProfileService) { }
    private actions$ = inject(Actions);

    loadProfileInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadProfileInfo),
            switchMap(() =>
                from(this.profileService.getProfile()).pipe(
                    map(response => {
                        if(response.error){
                            return loadProfileInfoFailure({error : response.error.message ?? "Profile load failed"})
                        }
                        console.log('Profile loaded successfully:', response);
                        return loadProfileInfoSuccess({profileInfo : mapProfileDtoToProfile(response.data)});
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
                from(
                    this.profileService.updateProfile(mapProfileToProfileDto(profileInfo))
                ).pipe(
                    map(response => {
                        console.log('Profile updated successfully:', response);
                        return loadProfileInfoSuccess({profileInfo : profileInfo})
                    }),
                    catchError((error: any) =>
                        of(loadProfileInfoFailure({ error: error?.message ?? "Profile update failed" }))
                    )
                )
            )
        )
    );

}
