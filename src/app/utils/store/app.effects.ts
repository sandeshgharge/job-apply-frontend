import { AuthEffects } from "./auth/auth.effects";
import { CVEffects } from "./cv/cv.effects";
import { CoverLetterEffects } from "./cover-letter/cover-letter.effects";
import { ProfileEffects } from "./profile/profile.effects";
import { JobsEffects } from "./jobs/jobs.effects";

export const effects = [
    AuthEffects,
    ProfileEffects,
    CVEffects,
    CoverLetterEffects,
    JobsEffects
];