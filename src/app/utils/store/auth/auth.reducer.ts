import { createReducer, on } from "@ngrx/store";
import { AuthState } from "./auth.state";
import { login, loginFailure, loginSuccess, logout } from "./auth.actions";

export const initialAuthState: AuthState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false
};

export const authReducer = createReducer(
    initialAuthState,
    on(login, state => ({ ...state, loading: true, error: null })),

    on(loginSuccess, (state, { user, token }) => ({
        ...state,
        user,
        token,
        loading: false,
        isAuthenticated: true
    })),

    on(loginFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error,
        isAuthenticated: false
    })),

    on(logout, state => ({
        ...state,
        user: null,
        token: null,
        isAuthenticated: false
    }))
);