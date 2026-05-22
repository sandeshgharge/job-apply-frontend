import { Actions, createEffect, ofType } from "@ngrx/effects";
import { loadCoverLetterInfo, loadCoverLetterInfoSuccess, loadCVInfo, loadCVInfoSuccess, loadProfileInfo, loadProfileInfoFailure, loadProfileInfoSuccess, saveNewCoverLetterInfo, saveNewCoverLetterInfoSuccess, saveNewCVInfo, saveNewCVInfoSuccess, updateCoverLetterInfo, updateCVInfo, updateCVInfoSuccess, updateProfileInfo } from "./profile.actions";
import { catchError, from, map, mergeMap, of, switchMap, tap } from "rxjs";
import { inject, Injectable } from "@angular/core";
import { ProfileService } from "../../services/profile.service";
import { mapProfileDtoToProfile, mapProfileToProfileDto } from "../../supabase/mapper";
import { CLService } from "../../services/cl.service";
import { CvService } from "../../services/cv.service";
import { ToastService } from "../../services/toast.service";


@Injectable()
export class ProfileEffects {
    constructor(private profileService: ProfileService, private clService: CLService, private cvService: CvService, private toast: ToastService
    ) { }
    private actions$ = inject(Actions);

    loadProfileInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadProfileInfo),
            switchMap(() =>
                from(this.profileService.getProfile()).pipe(
                    map(response => {
                        if (response.error) {
                            return loadProfileInfoFailure({ error: response.error.message ?? "Profile load failed" })
                        }
                        console.log('Profile loaded successfully:', response);
                        return loadProfileInfoSuccess({ profileInfo: mapProfileDtoToProfile(response.data) });
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
                        return loadProfileInfoSuccess({ profileInfo: profileInfo })
                    }),
                    catchError((error: any) =>
                        of(loadProfileInfoFailure({ error: error?.message ?? "Profile update failed" }))
                    )
                )
            )
        )
    );

    loadCVandCoverLetterInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadProfileInfoSuccess),
            mergeMap(({ profileInfo }) => {
                const userId = profileInfo.id;
                return [
                    loadCVInfo({ userId: userId }),
                    loadCoverLetterInfo({ userId: userId })
                ]
            }
            )
        ))

    loadCVInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadCVInfo),
            switchMap(({ userId }) =>
                this.cvService.getCVs(userId).pipe(
                    map(res =>
                        loadCVInfoSuccess({ cvInfoList: res })
                    )
                )
            ))
    );

    updateCVInfo$ = createEffect(
        () => this.actions$.pipe(
            ofType(updateCVInfo),
            switchMap(({ cvInfo }) => {
                if (cvInfo.id) {
                    return this.cvService.saveCV(cvInfo).pipe(
                        map(res => {
                            updateCVInfoSuccess({ cvInfo: res })
                            this.toast.show("CV Updated!");
                        }),
                        catchError((error: any) => {
                            this.toast.show(error?.message ?? 'CV update failed', 'error');
                            return of(void 0);
                        })
                    );
                }

                this.toast.show("Id is missing.", 'error');
                return of(void 0);
            })
        ),
        { dispatch: false }
    );

    saveNewCV$ = createEffect(() =>
        this.actions$.pipe(
            ofType(saveNewCVInfo),
            switchMap(({ cvInfo }) =>
                this.cvService.saveAsCV(cvInfo).pipe(
                    map(res =>
                        saveNewCVInfoSuccess({ cvInfo: res })
                    )
                )
            )
        ));

    loadCLInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadCoverLetterInfo),
            switchMap(({ userId }) =>
                this.clService.getCoverLetters(userId).pipe(
                    map(res =>
                        loadCoverLetterInfoSuccess({ coverLetterInfoList: res })
                    )
                )
            ))
    );

    updateCLInfo$ = createEffect(
        () => this.actions$.pipe(
            ofType(updateCoverLetterInfo),
            switchMap(({ coverLetterInfo }) => {
                if (coverLetterInfo.id) {
                    return this.clService.saveCoverLetter(coverLetterInfo).pipe(
                        tap(() => this.toast.show("Cover Letter Updated!")),
                        catchError((error: any) => {
                            this.toast.show(error?.message ?? 'Cover Letter update failed', 'error');
                            return of(void 0);
                        })
                    );
                }

                this.toast.show("Id is missing.", 'error');
                return of(void 0);
            })
        ),
        { dispatch: false }
    );

    saveNewCL$ = createEffect(() =>
        this.actions$.pipe(
            ofType(saveNewCoverLetterInfo),
            switchMap(({ coverLetterInfo }) =>
                this.clService.saveAsCoverLetter(coverLetterInfo).pipe(
                    map(res =>
                        saveNewCoverLetterInfoSuccess({ coverLetterInfo: res })
                    )
                )
            )
        ));

}
