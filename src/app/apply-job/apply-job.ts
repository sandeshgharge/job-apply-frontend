import { Component, signal, inject, ViewChild, AfterViewInit, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CvBuilderComponent } from '@app/cv-builder/cv-builder';
import { ToastService } from '@app/utils/services/toast.service';
import { JobsService } from '@app/utils/services/jobs.service';
import { CoverLetterComponent } from '@app/cl-builder/cl-builder'
import { JobDetails, SkillGroup } from '@app/utils/entities/job-details';
import { Store } from '@ngrx/store';
import { ApplyPreviewComponent } from '../apply-preview/apply-preview';
import { CoverLetterDocInfo, defaultcl } from '@app/utils/entities/cover-letter';
import { CvData } from '@app/utils/entities/cv';
import { applyJob } from '@app/utils/store/jobs/jobs.actions';
import { TranslationService } from '@app/utils/services/translation/translation.service';
import { TourService } from '@app/utils/services/tour.service';

const SKILL_CATEGORIES = [
  'Frontend', 'Backend', 'DevOps'
];

const CAT_ICONS: Record<string, string> = {
  Frontend: '🌐',
  Backend: '🧠',
  DevOps: '⚙️',
};

type TabId = 'Fetch Job' | 'Cover Letter' | 'CV' | 'PDF Preview';

@Component({
  selector: 'app-apply-job',
  imports: [FormsModule, CvBuilderComponent, CoverLetterComponent, ApplyPreviewComponent],
  templateUrl: './apply-job.html',
  styleUrl: './apply-job.scss'
})
export class ApplyJobComponent {
  private toast = inject(ToastService);
  private jobsService = inject(JobsService);
  private store = inject(Store);
  public translate = inject(TranslationService);
  public tourService = inject(TourService);

  // ViewChild references to access child component data
  @ViewChild('cvBuilder') cvBuilder!: CvBuilderComponent;
  @ViewChild('coverLetter') coverLetterComponent!: CoverLetterComponent;

  constructor() {
    // Drive the apply-job sub-tab from the tour when the tour requests a switch
    effect(() => {
      const desired = this.tourService.desiredApplyTab();
      if (desired) this.activeTab.set(desired);
    });
  }

  // Extract CV data from CV builder component
  getCvData(): any {
    if (this.cvBuilder) {
      return this.cvBuilder.cv();
    }
    return null;
  }

  // Extract cover letter data from cover letter component
  getCoverLetterData(): CoverLetterDocInfo {
    return this.coverLetterComponent.meta();
  }

  activeTab = signal<TabId>('Fetch Job');

  tabs = computed<{ id: TabId; label: string; icon: string }[]>(() => [
    { id: 'Fetch Job', label: this.translate.t().applyWizard.stepFetch, icon: '📥' },
    { id: 'Cover Letter', label: this.translate.t().applyWizard.stepCl, icon: '📝' },
    { id: 'CV', label: this.translate.t().applyWizard.stepCv, icon: '📄' },
    { id: 'PDF Preview', label: this.translate.t().applyWizard.stepPreview, icon: '👁️' },
  ]);

  // Data for PDF preview
  cvPreviewData = signal<CvData | null>(null);
  coverLetterPreviewData = signal<CoverLetterDocInfo | null>(null);

  setTab(tab: TabId) {
    // Extract data for preview when navigating to preview tab
    if (tab === 'PDF Preview') {
      this.extractPreviewData();
    }
    this.activeTab.set(tab);
  }

  // Extract data from child components for PDF preview
  extractPreviewData() {
    this.cvPreviewData.set(this.getCvData());
    this.coverLetterPreviewData.set(this.getCoverLetterData());
  }

  async markAsApplied() {
    this.store.dispatch(applyJob());
  }


  // Step 1
  jobUrl = signal('');
  jobDescription = signal<string>('');
  fetchLoading = signal(false);

  parseLoading = signal(false);

  // Step 2
  skillGroups = signal<SkillGroup[]>(SKILL_CATEGORIES.map(c => ({ category: c, skills: [] })));
  newSkills: Record<string, string> = {};

  generatingFull = signal(false);
  previewMode = signal(false);
  applyLoading = signal(false);


  categoryIcon(cat: string): string { return CAT_ICONS[cat] ?? '◆'; }

  // ── Step 1 ─────────────────────────────────────────────────────
  fetchJob() {
    const url = this.jobUrl().trim();
    if (!url) return;
    this.fetchLoading.set(true);
    this.jobsService.extractJobDescription(url).subscribe({
      next: desc => {
        this.jobDescription.set(desc.description);
        this.jobUrl.set(desc.url);
        this.toast.show(this.translate.t().applyWizard.toastJobLoaded);
      },
      error: err => {
        console.error('Error fetching job description:', err);
        this.toast.show(this.translate.t().applyWizard.toastFetchFailed, 'error');
        this.fetchLoading.set(false);
      },
      complete: () => {
        this.fetchLoading.set(false);
      }
    });
  }

  extractDataForCoverLetter() {
    if (!this.jobDescription().trim()) {
      return;
    }

    this.parseLoading.set(true);

    this.jobsService.extractJobDetails(this.jobDescription())
      .subscribe({
        next: details => {
          console.log(details)
          const appliedDate = new Date().toISOString().split('T')[0];

          this.jobsService.setJobDetails({
            ...details,
            jobDescription: this.jobDescription(),
            appliedDate
          });
          this.toast.show(this.translate.t().applyWizard.toastDataExtracted);

        },
        error: err => {
          console.error(err);
        }
      }).add(() => {
        this.parseLoading.set(false);
      });
  }

  updatejobDescription(value: string) {
    this.jobDescription.set(value);
    this.jobsService.updateField('jobDescription', value);
  }

}

// NOTE: CvBuilderComponent is imported via apply-job template for Step 3
