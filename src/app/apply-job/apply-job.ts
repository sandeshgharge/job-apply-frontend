import { Component, signal, inject, ViewChild, AfterViewInit } from '@angular/core';
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

const SKILL_CATEGORIES = [
  'Programming Languages', 'Language Frameworks', 'Databases',
  'Monitoring Tools', 'DevOps Tools', 'Cloud Platforms', 'Other Skills',
];

const CAT_ICONS: Record<string, string> = {
  'Programming Languages': '⌨', 'Language Frameworks': '⚙',
  'Databases': '◫', 'Monitoring Tools': '◉',
  'DevOps Tools': '⬡', 'Cloud Platforms': '☁', 'Other Skills': '◆',
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

  // ViewChild references to access child component data
  @ViewChild('cvBuilder') cvBuilder!: CvBuilderComponent;
  @ViewChild('coverLetter') coverLetterComponent!: CoverLetterComponent;
  @ViewChild(ApplyPreviewComponent) applyPreviewComponent!: ApplyPreviewComponent;

  loading = signal(false);

  ngAfterViewInit() {
    // ViewChild is available after view initialization
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

  tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'Fetch Job', label: 'Fetch Job', icon: '📥' },
    { id: 'Cover Letter', label: 'Cover Letter', icon: '📝' },
    { id: 'CV', label: 'CV', icon: '📄' },
    { id: 'PDF Preview', label: 'Preview', icon: '👁️' },
  ];

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

  // Mark application as applied
  async markAsApplied() {
    this.applyLoading.set(true);
    try {
      if (this.applyPreviewComponent) {
        await this.applyPreviewComponent.applyAndSave();
      } else {
        // Fallback
        this.jobsService.updateField('status', 'Applied');
        this.toast.show('Application marked as applied locally.');
      }
    } finally {
      this.applyLoading.set(false);
    }
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
        this.toast.show('Job description loaded! Extracting details...');
      },
      error: err => {
        console.error('Error fetching job description:', err);
        this.toast.show('Failed to load job description', 'error');
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
          const now = new Date();
          const appliedDate = [
            String(now.getDate()).padStart(2, '0'),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getFullYear())
          ].join('-');

          this.jobsService.setJobDetails({
            ...details,
            jobDescription: this.jobDescription(),
            appliedDate
          });
          this.toast.show('Data extracted for cover letter!');

        },
        error: err => {
          console.error(err);
        }
      }).add(() => {
        this.parseLoading.set(false);
      });
  }
  applyJob() {
  }

}

// NOTE: CvBuilderComponent is imported via apply-job template for Step 3
