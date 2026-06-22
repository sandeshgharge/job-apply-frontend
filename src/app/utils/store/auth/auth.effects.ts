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
                        const userEmail = response.user?.email || email;
                        const name = userEmail.split('@')[0].replace(/[._]/g, ' ');
                        const id = response.user?.id || '';
                        return of(loginSuccess({
                            user: { email: userEmail, name, id },
                            token: response.access_token || '',
                            redirect: true
                        }));
                    }),
                    catchError(error => {
                        return of(loginFailure({ error: error?.detail || "Login failed" }));
                    })
                );
            })
        )
    );

    loginSuccess$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loginSuccess),
            tap(({ user, token, redirect }) => {
                // Here you can perform side effects like navigation or showing a success message
                sessionStorage.setItem('user', JSON.stringify(user));
                sessionStorage.setItem('access_token', token);
                if (redirect !== false) {
                    this.router.navigate(['/home']);
                }
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
                console.log("Attempting auto-login from sessionStorage...");
                try {
                    const userStr = sessionStorage.getItem('user');
                    const token = sessionStorage.getItem('access_token');
                    
                    if (userStr && token) {
                        const user = JSON.parse(userStr);
                        console.log("Auto-login successful from sessionStorage");
                        return of(loginSuccess({ user, token, redirect: false }));
                    } else {
                        console.log("No session found in sessionStorage for auto-login");
                        return of(logout());
                    }
                } catch (error) {
                    console.error("Auto-login failed with error:", error);
                    return of(logout());
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
                    //this.router.navigate(['/login']);
                    return of(loginFailure({ error }));
                })
            ))
        )
    )
}