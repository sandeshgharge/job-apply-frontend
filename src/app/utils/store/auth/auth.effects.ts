import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { autoLogin, login, loginFailure, loginSuccess, logout } from "./auth.actions";
import { AuthService } from "../../services/auth";
import { mergeMap, of, switchMap, tap } from "rxjs";
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
                if (this.authService.login(email, password)) {
                    
                    return of(loginSuccess({ user: this.authService.getUser() as User, token: "abc123" }));
                } else {
                    return of(loginFailure({ error: "Invalid credentials" }));
                }
            })
        ), 
    );

    loginSuccess$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loginSuccess),
            tap(({ user }) => {
                // Here you can perform side effects like navigation or showing a success message
                sessionStorage.setItem('user', user ? JSON.stringify(user) : '');
                this.router.navigate(['/home']);
                console.log("Login successful for user:", user);
            })
        ), { dispatch: false }
    );

    loginFailure$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loginFailure),
            tap(({ error }) => {
                // Here you can perform side effects like showing an error message
                console.error("Login failed with error:", error);
                return [];
            }
            )
        ),{ dispatch: false }
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
}