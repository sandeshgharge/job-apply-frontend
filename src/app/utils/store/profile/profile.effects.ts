import { Actions, createEffect, ofType } from "@ngrx/effects";
import { loadCoverLetterInfo, loadProfileInfo, loadProfileInfoFailure, loadProfileInfoSuccess } from "./profile.actions";
import { catchError, from, map, of, switchMap } from "rxjs";
import { inject, Injectable } from "@angular/core";
import { ProfileService } from "../../services/profile";


@Injectable()
export class ProfileEffects {
    constructor(private profileService: ProfileService) { }
    private actions$ = inject(Actions);

    loadProfileInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadProfileInfo),
            switchMap(() =>
                from(this.profileService.getProfile()).pipe(
                    map(profile => {
                        console.log('Profile loaded successfully:', profile);
                        return loadProfileInfoSuccess({ profileInfo: profile });
                    }),
                    catchError((error: any) =>
                        of(loadProfileInfoFailure({ error: error?.message ?? "Profile load failed" }))
                    )
                )
            )
        )
    );

}
