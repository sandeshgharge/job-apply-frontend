import { CoverLetterInfo } from "../../entities/cover-letter";
import { CVInfo } from "../../entities/cv";
import { ProfileInfo } from "../../entities/user";

export interface ProfileInfoState {
    profileInfo: ProfileInfo | null;
    cvInfo: CVInfo [] | null;
    coverLetterInfo: CoverLetterInfo [] | null;
    loading: boolean;
    error: string | null;
}