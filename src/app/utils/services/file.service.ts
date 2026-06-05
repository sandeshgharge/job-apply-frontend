import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { supabase } from '../supabase/client';
import { selectCurrentUser } from '../store/auth/auth.selectors';
import { Observable } from 'rxjs';

/**
 * Service for uploading and managing files in Supabase Storage.
 *
 * Uses the 'profile-assets' bucket to store profile images and signatures.
 * Files are stored under a user-specific path: `{userId}/{folder}/{filename}`
 */
@Injectable({ providedIn: 'root' })
export class FileService {
  private store = inject(Store);
  private userId = this.store.selectSignal(selectCurrentUser);

  /**
   * Uploads a base64 data URL to Supabase Storage.
   *
   * @param dataUrl  - The base64 data URL (e.g. from FileReader.readAsDataURL)
   * @param folder   - Sub-folder within the user's directory (e.g. 'profile-image', 'signature')
   * @param fileName - The target file name (e.g. 'avatar.png')
   * @returns The public URL of the uploaded file, or null on failure
   */
  async uploadBase64Image(
    dataUrl: string,
    fileName: string,
    bucket: string,
    folder?: string,
  ): Promise<string | null> {
    const userId = this.userId()?.id;
    if (!userId) return null;

    // Convert base64 data URL to a Blob
    const blob = this.dataUrlToBlob(dataUrl);
    if (!blob) return null;

    // Build the storage path: userId/folder/fileName, omitting folder if not provided
    const filePath = [userId, folder, fileName].filter(Boolean).join('/');

    // Upload with upsert so re-uploads overwrite the existing file
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        upsert: true,
        contentType: blob.type,
      });

    if (error) {
      console.error(`[FileService] Upload failed for ${filePath}:`, error.message);
      return null;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data?.publicUrl ?? null;
  }

  /**
   * Uploads a profile image and returns its public URL.
   */
  async uploadProfileImage(bucket: string, dataUrl: string): Promise<string | null> {
    const ext = this.getExtensionFromDataUrl(dataUrl);
    return this.uploadBase64Image(dataUrl, 'profile-image', bucket);
  }

  /**
   * Uploads a signature image and returns its public URL.
   */
  async uploadSignatureImage(bucket: string, dataUrl: string): Promise<string | null> {
    const ext = this.getExtensionFromDataUrl(dataUrl);
    return this.uploadBase64Image(dataUrl, 'signature', bucket);
  }

  /**
   * Removes a file from Supabase Storage by its public URL.
   */
  async removeByUrl(bucket: string, publicUrl: string): Promise<boolean> {
    // Extract the path after the bucket name
    const bucketSegment = `/${bucket}/`;
    const idx = publicUrl.indexOf(bucketSegment);
    if (idx === -1) return false;

    const filePath = publicUrl.substring(idx + bucketSegment.length);
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('[FileService] Remove failed:', error.message);
      return false;
    }
    return true;
  }

  // ── Private Helpers ──────────────────────────────────────────

  /**
   * Converts a base64 data URL string to a Blob.
   */
  private dataUrlToBlob(dataUrl: string): Blob | null {
    try {
      const [header, base64] = dataUrl.split(',');
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
      const byteString = atob(base64);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }

      return new Blob([uint8Array], { type: mime });
    } catch {
      console.error('[FileService] Failed to convert data URL to Blob');
      return null;
    }
  }

  /**
   * Extracts the file extension from a data URL's MIME type.
   */
  private getExtensionFromDataUrl(dataUrl: string): string {
    const mime = dataUrl.match(/data:(.*?);/)?.[1] ?? 'image/png';
    const sub = mime.split('/')[1] ?? 'png';
    // Normalize 'jpeg' to 'jpg'
    return sub === 'jpeg' ? 'jpg' : sub;
  }
}
