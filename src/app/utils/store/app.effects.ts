import { FunctionalEffect } from "@ngrx/effects";
import { AuthEffects } from "./auth/auth.effects";
import { ProfileEffects } from "./profile/profile.effects";

export const effects  = [
    AuthEffects,
    ProfileEffects
];