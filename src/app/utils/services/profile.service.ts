import { inject, Injectable } from "@angular/core";
import { supabase } from "../supabase/client";
import { Store } from "@ngrx/store";
import { HttpClient } from "@angular/common/http";
import { selectUserID } from "../store/auth/auth.selectors";
import { catchError, from, map } from "rxjs";
import { mapProfileDtoToProfile, mapProfileToProfileDto } from "../supabase/mapper";
import { ProfileInfo } from "../entities/user";
import { ProfileDTO } from "../supabase/dto";
import { FileService } from "./file.service";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class ProfileService {

    constructor(private http: HttpClient) { }
    private store = inject(Store);

    userId = this.store.selectSignal(selectUserID);
    bucket = environment.PROFILE_ASSETS_BUCKET;
    fileService = inject(FileService);

    getProfile() {
        return supabase
            .from('user_details')
            .select()
            .eq('id', this.userId())
            .single()
    }

    updateProfile(profileInfo: ProfileDTO) {
        return supabase
            .from('user_details')
            .update({
                ...profileInfo
            })
            .eq('id', this.userId())
    }

    /**
     * Uploads any base64 images to Supabase Storage, then saves the profile
     * with public URLs instead of raw data URLs.
     */
    async uploadImagesAndSave(profileInfo: ProfileInfo): Promise<ProfileInfo> {
        let updated = { ...profileInfo };

        // Upload profile image if it's a fresh base64 data URL
        if (updated.profileImageUrl && updated.profileImageUrl.startsWith('data:')) {
            const publicUrl = await this.fileService.uploadProfileImage(this.bucket, updated.profileImageUrl);
            updated = { ...updated, profileImageUrl: publicUrl ?? '' };
        }

        // Upload signature image if it's a fresh base64 data URL
        if (updated.signatureImageUrl && updated.signatureImageUrl.startsWith('data:')) {
            const publicUrl = await this.fileService.uploadSignatureImage(this.bucket, updated.signatureImageUrl);
            updated = { ...updated, signatureImageUrl: publicUrl ?? '' };
        }

        // Persist the profile with public URLs to the DB
        const response = await this.updateProfile(mapProfileToProfileDto(updated));
        if (response.error) {
            throw new Error(response.error.message ?? 'Profile update failed');
        }

        return updated;
    }

    getImageUrl(fileName: string, expiresIn = 3600): Promise<any> {
    return supabase.storage
        .from(this.bucket)
        .createSignedUrl(`${this.userId()}/${fileName}`, expiresIn)
        .then(({ data, error }) => {
          if (error) {
            console.error(`[FileService] Failed to get signed URL for ${fileName}:`, error.message);
            return null;
          }
          return data?.signedUrl ?? null;
        });
  }
}