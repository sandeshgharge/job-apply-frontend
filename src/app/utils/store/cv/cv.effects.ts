import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { catchError, map, of, switchMap } from "rxjs";
import { CvService } from "../../services/cv.service";
import { ToastService } from "../../services/toast.service";
import { loadProfileInfoSuccess } from "../profile/profile.actions";
import {
    loadCVInfo,
    loadCVInfoFailure,
    loadCVInfoSuccess,
    saveNewCVInfo,
    saveNewCVInfoFailure,
    saveNewCVInfoSuccess,
    updateCVInfo,
    updateCVInfoFailure,
    updateCVInfoSuccess
} from "./cv.actions";

@Injectable()
export class CVEffects {
    private actions$ = inject(Actions);
    private cvService = inject(CvService);
    private toast = inject(ToastService);

    /**
         loadCVOnProfileLoad$ = createEffect(() =>
            this.actions$.pipe(
                ofType(loadProfileInfoSuccess),
                map(({ profileInfo }) => loadCVInfo({ userId: profileInfo.id }))
            )
        );
     
     */

    loadCVInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadCVInfo),
            switchMap(({ userId }) =>
                this.cvService.getCVs(userId).pipe(
                    map(res =>
                        loadCVInfoSuccess({ cvInfoList: res })
                    ),
                    catchError((error: any) =>
                        of(loadCVInfoFailure({ error: error?.message ?? 'CV load failed' }))
                    )
                )
            )
        )
    );

    updateCVInfo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateCVInfo),
            switchMap(({ cvInfo }) => {
                if (cvInfo.id) {
                    return this.cvService.saveCV(cvInfo).pipe(
                        map(res => {
                            this.toast.show("CV Updated!");
                            return updateCVInfoSuccess({ cvInfo: res });
                        }),
                        catchError((error: any) => {
                            this.toast.show(error?.message ?? 'CV update failed', 'error');
                            return of(updateCVInfoFailure({ error: error?.message ?? 'CV update failed' }));
                        })
                    );
                }

                this.toast.show("Id is missing.", 'error');
                return of(updateCVInfoFailure({ error: 'Id is missing.' }));
            })
        )
    );

    saveNewCV$ = createEffect(() =>
        this.actions$.pipe(
            ofType(saveNewCVInfo),
            switchMap(({ cvInfo }) =>
                this.cvService.saveAsCV(cvInfo).pipe(
                    map(res =>
                        saveNewCVInfoSuccess({ cvInfo: res })
                    ),
                    catchError((error: any) =>
                        of(saveNewCVInfoFailure({ error: error?.message ?? 'CV save failed' }))
                    )
                )
            )
        )
    );
}
