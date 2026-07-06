import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { autoLogin, changePassword, login, loginFailure, loginSuccess, logout } from "./auth.actions";
import { AuthService } from "../../services/auth.service";
import { TourService } from "../../services/tour.service";
import { catchError, from, map, mergeMap, of, switchMap, tap } from "rxjs";
import { ProfileInfo, User } from "../../entities/user";
import { Router } from "@angular/router";
import { loadProfileInfo, loadProfileInfoSuccess } from "../profile/profile.actions";
import { loadCoverLetterInfo } from "../cover-letter/cover-letter.actions";
import { loadCVInfo } from "../cv/cv.actions";


@Injectable()
export class AuthEffects {
    [x: string]: any;
    constructor(private authService: AuthService) { }

    private actions$ = inject(Actions);
    private router = inject(Router);
    private tourService = inject(TourService);

    /** True only during a fresh interactive login — cleared after tour check */
    private isFreshLogin = false;

    login$ = createEffect(() =>
        this.actions$.pipe(
            ofType(login),
            tap(() => {
                this.isFreshLogin = true;
            }),
            switchMap(({ email, password }) => {
                return this.authService.login(email, password).pipe(

                    switchMap(response => {
                        const userEmail = response.user?.email || email;
                        const id = response.user?.id || '';
                        const profile_info = response.profile_info;
                        let name = userEmail.split('@')[0].replace(/[._]/g, ' ');
                        if (profile_info?.firstName && profile_info?.lastName) {
                            name = profile_info.firstName + ' ' + profile_info.lastName;
                        }
                        return of(

                            loadProfileInfoSuccess({ profileInfo: profile_info }),
                            loginSuccess({
                                user: { email: userEmail, name, id },
                                token: response.access_token || '',
                                refresh_token: response.refresh_token || '',
                                redirect: true
                            })

                        );
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
            switchMap(({ user, token, refresh_token, redirect }) => {
                // Here you can perform side effects like navigation or showing a success message
                sessionStorage.setItem('user', JSON.stringify(user));
                sessionStorage.setItem('access_token', token);
                sessionStorage.setItem('refresh_token', refresh_token);

                if (redirect !== false) {
                    this.router.navigate(['/home']);
                }
                return of(
                    loadCoverLetterInfo({ userId: user.id }),
                    loadCVInfo({ userId: user.id })
                )
            })

        )
    );

    loginFailure$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loginFailure),
            tap(({ error }) => {
                this.isFreshLogin = false; // reset flag
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
                this.isFreshLogin = false; // reset flag
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('access_token');
                sessionStorage.removeItem('refresh_token');
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
                        return of(
                            loginSuccess({ user, token, refresh_token: sessionStorage.getItem('refresh_token') || '', redirect: false }),
                            loadProfileInfo()
                        );
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
    );

    /**
     * Starts the onboarding tour when a guest user completes a fresh interactive
     * login. Does NOT trigger on autoLogin (page refresh).
     */
    tourStart$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadProfileInfoSuccess),
            tap(({ profileInfo }) => {
                if (profileInfo?.role === 'guest' && this.isFreshLogin) {
                    this.isFreshLogin = false; // consume the flag
                    // Slight delay to allow navigation + HomeComponent to initialise
                    setTimeout(() => this.tourService.startTour(), 600);
                }
            })
        ), { dispatch: false }
    );
}