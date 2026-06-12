import { inject, Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { selectUserID } from "../store/auth/auth.selectors";
import { ProfileInfo } from "../entities/user";
import { FileService } from "./file.service";
import { BackendApiService } from "./backend-service/backend-api-services";
import { environment } from "src/environments/environment";
import { firstValueFrom } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ProfileService {

    private backendApi = inject(BackendApiService);
    private store = inject(Store);

    userId = this.store.selectSignal(selectUserID);
    bucket = environment.PROFILE_ASSETS_BUCKET;
    fileService = inject(FileService);

    getProfile() {
        return firstValueFrom(
            this.backendApi.get<any>(`profile/${this.userId()}`)
        );
    }

    updateProfile(profileInfo: ProfileInfo) {
        return firstValueFrom(
            this.backendApi.put<any>(`profile/${this.userId()}`, profileInfo)
        );
    }

    /**
     * Uploads any base64 images to Supabase Storage, then saves the profile
     * with public URLs instead of raw data URLs.
     */
    async uploadImagesAndSave(profileInfo: ProfileInfo): Promise<ProfileInfo> {
        let updated = { ...profileInfo };

        // Upload profile image if it's a fresh base64 data URL
        if (updated.profileImageUrl && updated.profileImageUrl.startsWith('data:')) {
            const publicUrl = await this.fileService.uploadBase64Image(updated.profileImageUrl, 'profile-image', this.bucket);
            updated = { ...updated, profileImageUrl: publicUrl ?? '' };
        }

        // Upload signature image if it's a fresh base64 data URL
        if (updated.signatureImageUrl && updated.signatureImageUrl.startsWith('data:')) {
            const publicUrl = await this.fileService.uploadBase64Image(updated.signatureImageUrl, 'signature', this.bucket);
            updated = { ...updated, signatureImageUrl: publicUrl ?? '' };
        }

        // Persist the profile with public URLs to the DB
        const response = await this.updateProfile(updated);
        if (response?.error) {
            throw new Error(response.error.message ?? 'Profile update failed');
        }

        return updated;
    }

    getImageUrl(fileName: string, expiresIn = 3600): Promise<any> {
        return firstValueFrom(
            this.backendApi.get<any>(`profile/${this.userId()}/image-url?fileName=${encodeURIComponent(fileName)}&bucket=${encodeURIComponent(this.bucket)}&expiresIn=${expiresIn}`)
        ).then((data: any) => {
            return data?.signedUrl ?? null;
        }).catch((error: any) => {
            console.error(`[ProfileService] Failed to get signed URL for ${fileName}:`, error.message);
            return null;
        });
    }
}