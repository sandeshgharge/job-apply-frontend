import { Actions, createEffect, ofType } from "@ngrx/effects";
import {
    loadCoverLetterInfo,
    loadCoverLetterInfoFailure,
    loadCoverLetterInfoSuccess,
    saveNewCoverLetterInfo,
    saveNewCoverLetterInfoFailure,
    saveNewCoverLetterInfoSuccess,
    updateCoverLetterInfo,
    updateCoverLetterInfoFailure,
    updateCoverLetterInfoSuccess
} from "./cover-letter.actions";
import { catchError, map, of, switchMap } from "rxjs";
import { inject, Injectable } from "@angular/core";
import { CLService } from "../../services/cl.service";
import { ToastService } from "../../services/toast.service";
import { loadProfileInfoSuccess } from "../profile/profile.actions";


@Injectable()
export class CoverLetterEffects {
    private actions$ = inject(Actions);
    private clService = inject(CLService);
    private toast = inject(ToastService);

    /**
    loadCoverLetterOnProfileLoad$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadProfileInfoSuccess),
            map(({ profileInfo }) =>
                loadCoverLetterInfo({ userId: profileInfo.id })
            )
        )
    );
    */

    loadCoverLetterInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadCoverLetterInfo),
            switchMap(({ userId }) =>
                this.clService.getCoverLetters(userId).pipe(
                    map(res =>
                        loadCoverLetterInfoSuccess({ coverLetterInfoList: res })
                    ),
                    catchError((error: any) =>
                        of(loadCoverLetterInfoFailure({ error: error?.message ?? 'Cover Letter load failed' }))
                    )
                )
            )
        )
    );

    updateCoverLetterInfo$ = createEffect(
        () => this.actions$.pipe(
            ofType(updateCoverLetterInfo),
            switchMap(({ coverLetterInfo }) => {
                if (coverLetterInfo.id) {
                    return this.clService.saveCoverLetter(coverLetterInfo).pipe(
                        map(res => {
                            this.toast.show("Cover Letter Updated!");
                            return updateCoverLetterInfoSuccess({ coverLetterInfo: res });
                        }),
                        catchError((error: any) => {
                            this.toast.show(error?.message ?? 'Cover Letter update failed', 'error');
                            return of(updateCoverLetterInfoFailure({ error: error?.message ?? 'Cover Letter update failed' }));
                        })
                    );
                }

                this.toast.show("Id is missing.", 'error');
                return of(updateCoverLetterInfoFailure({ error: 'Id is missing.' }));
            })
        )
    );

    saveNewCoverLetter$ = createEffect(() =>
        this.actions$.pipe(
            ofType(saveNewCoverLetterInfo),
            switchMap(({ coverLetterInfo }) =>
                this.clService.saveAsCoverLetter(coverLetterInfo).pipe(
                    map(res =>
                        saveNewCoverLetterInfoSuccess({ coverLetterInfo: res })
                    ),
                    catchError((error: any) =>
                        of(saveNewCoverLetterInfoFailure({ error: error?.message ?? 'Cover Letter save failed' }))
                    )
                )
            )
        )
    );
}
