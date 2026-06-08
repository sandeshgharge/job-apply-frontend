import { Component, signal, inject, Input, effect } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { JobsService } from '@app/utils/services/jobs.service';
import { ToastService } from '@app/utils/services/toast.service';
import { CoverLetterDocInfo } from '@app/utils/entities/cover-letter';
import { CLService } from '@app/utils/services/cl.service';
import { Store } from '@ngrx/store';
import { selectProfileInfo } from '@app/utils/store/profile/profile.selector';
import { CvService } from '@app/utils/services/cv.service';

@Component({
  selector: 'app-pdf-preview',
  templateUrl: './apply-preview.html',
  styleUrl: './apply-preview.scss'
})
export class ApplyPreviewComponent {
  

  private jobsService = inject(JobsService);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  private clService = inject(CLService);
  private cvService = inject(CvService);
  private cvPreviewUrl = signal<SafeResourceUrl | null>(null);
  private clPreviewUrl = signal<SafeResourceUrl | null>(null);

  private clHtml = signal<string>('');
  private cvHtml = signal<string>('');
  private loading = signal(false);
  private store = inject(Store);

  profileInfo = this.store.selectSignal(selectProfileInfo);
  cvInfo = this.cvService.draftCV;

  coverLetterData: CoverLetterDocInfo = {
    applicantName: this.profileInfo()?.firstName + ' ' + this.profileInfo()?.lastName || '',
    applicantLocation: this.profileInfo()?.location || '',
    applicantEmail: this.profileInfo()?.email || '',
    companyName: '',
    companyLocation: '',
    contactName: '',
    date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }),
    role: '',
    paragraphs: [],
    signUrl: ''
  };

  

  constructor() {
    this.jobsService.jobDetails$.subscribe((j) => {
      if (j) {
        this.coverLetterData.companyName = j.companyName || '';
        this.coverLetterData.companyLocation = j.companyLocation || '';
        this.coverLetterData.role = j.role || '';
        this.coverLetterData.contactName = j.contactName || 'Hiring Manager';
      }
    });

    effect(() => {
      const cl = this.clService.draftCoverLetter();
      if (cl && cl.clData && cl.clData.sectionPrompts) {
        this.coverLetterData.paragraphs = cl.clData.sectionPrompts.map(s => s.content.trim()).filter(p => p.length > 0);
      }
    });
  }

  // Getters for template access
  get cvPreviewUrl$() { return this.cvPreviewUrl; }
  get clPreviewUrl$() { return this.clPreviewUrl; }
  get loading$() { return this.loading; }

  async fetchPreview(type: 'cv' | 'cl') {
    if (this.loading()) return;

    this.loading.set(true);
    console.log(`Fetching ${type} preview with data:`, type === 'cv' ? this.cvInfo().cvData : this.coverLetterData);
    const data = type === 'cv' ? this.cvInfo().cvData : this.coverLetterData;

    try {
      const html = await firstValueFrom(this.jobsService.fetchPreview(type, data));
      if (!html) throw new Error('No preview content returned');
      this.clHtml.set(type === 'cl' ? html : this.clHtml());
      this.cvHtml.set(type === 'cv' ? html : this.cvHtml());
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
      this.toast.show(`Please check for missing fields.`, 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async downloadPDF(type: 'cv' | 'cl') {
    this.loading.set(true);
    const data = type === 'cv' ? this.cvHtml() : this.clHtml();

    try {
      const blob = await firstValueFrom(this.jobsService.downloadPDF(type, { html : data }));
      if (!blob) throw new Error('No PDF content returned');

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = type === 'cv' ? 'cv-preview.pdf' : 'cover-letter-preview.pdf';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(link.href, '_blank');
      });
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

  async applyAndSave() {
    this.loading.set(true);
    try {
      // Ensure we have the HTML before saving
      if (!this.cvHtml()) {
        await this.fetchPreview('cv');
      }
      if (!this.clHtml()) {
        await this.fetchPreview('cl');
      }

      await this.jobsService.applyAndSaveJob(this.cvHtml(), this.clHtml());
      this.toast.show('Application successfully saved to database!');
    } catch (error: any) {
      console.error('Failed to save application:', error);
      this.toast.show(error?.message || 'Failed to save application. Please try again.', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}