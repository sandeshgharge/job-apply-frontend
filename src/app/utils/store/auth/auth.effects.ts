import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { autoLogin, changePassword, login, loginFailure, loginSuccess, logout } from "./auth.actions";
import { AuthService } from "../../services/auth.service";
import { catchError, from, map, mergeMap, of, switchMap, tap } from "rxjs";
import { User } from "../../entities/user";
import { Router } from "@angular/router";
import { loadProfileInfo } from "../profile/profile.actions";


@Injectable()
export class AuthEffects {
    [x: string]: any;
    constructor(private authService: AuthService) { }

    private actions$ = inject(Actions);
    private router = inject(Router);

    login$ = createEffect(() =>
        this.actions$.pipe(
            ofType(login),
            switchMap(({ email, password }) => {
                return this.authService.login(email, password).pipe(

                    switchMap(response => {
                        const name = email.split('@')[0].replace(/[._]/g, ' ');
                        const id = response.data.user?.id || '';
                        return of(loginSuccess({
                            user: { email, name, id },
                            token: response.data.session?.access_token || ''
                        }));
                    }),
                    catchError(error =>
                        of(loginFailure({ error }))
                    )
                );
            })
        )
    );

    loginSuccess$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loginSuccess),
            tap(({ user, token }) => {
                // Here you can perform side effects like navigation or showing a success message
                this.router.navigate(['/home']);                
            })

        ), { dispatch: false }
    );

    loadProfileOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      map(() => loadProfileInfo())
    )
  );

    loginFailure$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loginFailure),
            tap(({ error }) => {
                // Here you can perform side effects like showing an error message
                console.error("Login failed with error:", error);
                this.router.navigate(['/login']);
                return [];
            }
            )
        ), { dispatch: false }
    );

    logout$ = createEffect(() =>
        this.actions$.pipe(
            ofType(logout),
            tap(() => {
                sessionStorage.removeItem('user');
                this.authService.logout();
                this.router.navigate(['/login']);
            }),

        ), { dispatch: false }
    );

    autoLogin$ = createEffect(() =>
        this.actions$.pipe(
            ofType(autoLogin),
            switchMap(() => {
                console.log("Attempting auto-login...");
                return from(this.authService.getSession()).pipe(
                    map(({ data: { session } }) => {
                        if (session) {
                            const user = { email: session.user.email || '', name: session.user.email?.split('@')[0].replace(/[._]/g, ' ') || '', id: session.user.id };
                            return loginSuccess({ user, token: session.access_token });
                        } else {
                            console.log("No session found for auto-login");
                            return logout(); // No session, ensure we're logged out
                        }
                    }),
                    catchError(error => {
                        console.error("Auto-login failed with error:", error);
                        return of(logout());
                    })
                );
            })
        )
    );

    changePassword$ = createEffect(() =>
        this.actions$.pipe(
            ofType(changePassword),
            switchMap(({ password }) => this.authService.setPassword(password).pipe(
                map((response) => {
                    console.log("Password change successful", response);
                    return logout(); // Log out after password change
                }),
                catchError(error => {
                    console.error("Password change failed with error:", error);
                    this.router.navigate(['/login']);
                    return of(loginFailure({ error }));
                })
            ))
        )
    )
}