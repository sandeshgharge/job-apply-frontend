import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../store/auth/auth.selectors';
import { Observable, firstValueFrom } from 'rxjs';
import { BackendApiService } from './backend-service/backend-api-services';
import { environment } from 'src/environments/environment';

/**
 * Service for uploading and managing files via the backend API.
 *
 * Uses the backend storage endpoints to store profile images and signatures.
 * Files are stored under a user-specific path: `{userId}/{folder}/{filename}`
 */
@Injectable({ providedIn: 'root' })
export class FileService {
  private backendApi = inject(BackendApiService);
  private http = inject(HttpClient);

  /**
   * Uploads a base64 data URL via the backend storage endpoint.
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

    // Convert base64 data URL to a Blob
    const blob = this.dataUrlToBlob(dataUrl);
    if (!blob) return null;

    // Build the storage path: userId/folder/fileName, omitting folder if not provided
    const filePath = [folder, fileName].filter(Boolean).join('/');

    // Build FormData for upload
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('bucket', bucket);
    formData.append('file_path', filePath);

    try {
      const token = sessionStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await firstValueFrom(
        this.http.post<{ public_url: string }>(
          `${environment.backendAiApiURL}storage/upload`,
          formData,
          { headers }
        )
      );
      console.log(`[FileService] Upload response for ${filePath}:`, response);
      return response?.public_url ?? null;
    } catch (error: any) {
      console.error(`[FileService] Upload failed for ${filePath}:`, error.message);
      return null;
    }
  }

  async uploadPDF(bucket: string, name: string, dataUrl: string): Promise<string | null> {
    return this.uploadBase64Image(dataUrl, name, bucket);
  }

  /**
   * Removes a file from storage via the backend API by its public URL.
   */
  async removeByUrl(bucket: string, publicUrl: string): Promise<boolean> {
    // Extract the path after the bucket name
    const bucketSegment = `/${bucket}/`;
    const idx = publicUrl.indexOf(bucketSegment);
    if (idx === -1) return false;

    const filePath = publicUrl.substring(idx + bucketSegment.length);

    try {
      await firstValueFrom(
        this.http.delete<any>(`${environment.backendAiApiURL}storage/remove`, {
          body: { bucket, file_path: filePath }
        })
      );
      return true;
    } catch (error: any) {
      console.error('[FileService] Remove failed:', error.message);
      return false;
    }
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
