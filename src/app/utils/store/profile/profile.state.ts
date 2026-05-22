import { CoverLetterInfo } from "../../entities/cover-letter";
import { CVInfo } from "../../entities/cv";
import { ProfileInfo } from "../../entities/user";

export interface ProfileInfoState {
    profileInfo: ProfileInfo | null;
    cvInfoList: CVInfo [];
    coverLetterInfoList: CoverLetterInfo [];
    loading: boolean;
    error: string | null;
}