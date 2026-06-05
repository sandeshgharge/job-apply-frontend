import { CoverLetterInfo } from "../../entities/cover-letter";

export interface CoverLetterState {
    coverLetterInfoList: CoverLetterInfo[];
    selectedVersion: string;
    loading: boolean;
    error: string | null;
}
