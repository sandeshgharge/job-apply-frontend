import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { autoLogin, changePassword, login, loginFailure, loginSuccess, logout } from "./auth.actions";
import { AuthService } from "../../services/auth";
import { catchError, map, mergeMap, of, switchMap, tap } from "rxjs";
import { User } from "../../entities/user";
import { Router } from "@angular/router";


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
                console.log("Attempting login with email:", email);
                return this.authService.login(email, password).pipe(

                    switchMap(response => {
                        console.log("Login response received:", response);
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
                console.log("Login successful for user:", user, "with token:", token);
            })
        ), { dispatch: false }
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
            tap(() => {
                const stored = sessionStorage.getItem('user');
                if (stored) {
                    const user = JSON.parse(stored);
                    console.log("Auto-login successful for user:", user);
                    return loginSuccess({ user, token: "abc123" });
                } else {
                    console.log("No user found for auto-login");
                    return logout();
                }
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