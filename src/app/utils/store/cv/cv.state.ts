import { CVInfo } from "../../entities/cv";

export interface CVState {
    cvInfoList: CVInfo[];
    selectedVersion: number;
    loading: boolean;
    error: string | null;
}
