import { Component, signal, inject, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { JobsService } from '@app/utils/services/jobs.service';
import { ToastService } from '@app/utils/services/toast.service';

@Component({
  selector: 'app-pdf-preview',
  templateUrl: './apply-preview.html',
  styleUrl: './apply-preview.scss'
})
export class ApplyPreviewComponent {
  @Input() cvData: any = null;
  @Input() coverLetterData: string = '';
  @Output() back = new EventEmitter<void>();

  private jobsService = inject(JobsService);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  private cvPreviewUrl = signal<SafeResourceUrl | null>(null);
  private clPreviewUrl = signal<SafeResourceUrl | null>(null);
  private loading = signal(false);

  // Getters for template access
  get cvPreviewUrl$() { return this.cvPreviewUrl; }
  get clPreviewUrl$() { return this.clPreviewUrl; }
  get loading$() { return this.loading; }

  async fetchPreview(type: 'cv' | 'cl') {
    if (this.loading()) return;

    this.loading.set(true);
    const data = type === 'cv' ? this.cvData : { coverLetter: this.coverLetterData };

    try {
      const html = await firstValueFrom(this.jobsService.fetchPreview(type, data));
      if (!html) throw new Error('No preview content returned');

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

      if (type === 'cv') {
        this.cvPreviewUrl.set(safeUrl);
      } else {
        this.clPreviewUrl.set(safeUrl);
      }
    } catch (error) {
      console.error(`Error fetching ${type} preview:`, error);
      this.toast.show(`Failed to fetch ${type === 'cv' ? 'CV' : 'Cover Letter'} preview`, 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async downloadPDF(type: 'cv' | 'cl') {
    this.loading.set(true);
    const data = type === 'cv' ? this.cvData : { coverLetter: this.coverLetterData };

    try {
      const blob = await firstValueFrom(this.jobsService.downloadPDF(type, data));
      if (!blob) throw new Error('No PDF content returned');

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = type === 'cv' ? 'cv-preview.pdf' : 'cover-letter-preview.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.toast.show(`${type === 'cv' ? 'CV' : 'Cover Letter'} PDF downloaded!`);
    } catch (error) {
      console.error(`Error downloading ${type} PDF:`, error);
      this.toast.show(`Failed to download ${type === 'cv' ? 'CV' : 'Cover Letter'} PDF`, 'error');
    } finally {
      this.loading.set(false);
    }
  }

  markAsApplied() {
    this.jobsService.updateField('status', 'Applied');
    this.toast.show('Application marked as applied!');
  }

  navigateBack() {
    this.back.emit();
  }
}