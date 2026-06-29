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
import { addJob } from '@app/utils/store/jobs/jobs.actions';
import { TranslationService } from '@app/utils/services/translation/translation.service';

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
  public translate = inject(TranslationService);
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
    const data = type === 'cv' ? this.cvInfo().cvData : this.coverLetterData;

    try {
      const html = await firstValueFrom(this.jobsService.fetchPreview(type, data, this.profileInfo()?.id));
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
      this.toast.show(type === 'cv' ? this.translate.t().applyPreview.toastFailPreviewCv : this.translate.t().applyPreview.toastFailPreviewCl, 'error');
      this.toast.show(this.translate.t().applyPreview.toastMissingFields, 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async downloadPDF(type: 'cv' | 'cl') {
    this.loading.set(true);
    const data = type === 'cv' ? this.cvHtml() : this.clHtml();

    const name = [this.profileInfo()?.firstName,this.profileInfo()?.lastName].join("_");

    try {
      const blob = await firstValueFrom(this.jobsService.downloadPDF(type, { html : data }));
      if (!blob) throw new Error('No PDF content returned');

      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = type === 'cv' ? [name, "CV.pdf"].join("_") : [name, "CoverLetter.pdf"].join("_");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      this.toast.show(type === 'cv' ? this.translate.t().applyPreview.toastDownloadedCv : this.translate.t().applyPreview.toastDownloadedCl);
    } catch (error) {
      console.error(`Error downloading ${type} PDF:`, error);
      this.toast.show(type === 'cv' ? this.translate.t().applyPreview.toastFailDownloadCv : this.translate.t().applyPreview.toastFailDownloadCl, 'error');
    } finally {
      this.loading.set(false);
    }
  }
}