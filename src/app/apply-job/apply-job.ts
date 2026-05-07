import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CvBuilderComponent } from '../cv-builder/cv-builder';
import { ToastService } from '../utils/services/toast';
import { JobsService } from '../utils/services/jobs';
import { CoverLetterComponent } from "../cover-letter/cover-letter";
import { JobDetails, SkillGroup } from '../utils/entities/job-details';
import { Store } from '@ngrx/store';
import { selectCurrentUserLocation, selectCurrentUserName } from '../utils/store/auth/auth.selectors';

const SKILL_CATEGORIES = [
  'Programming Languages','Language Frameworks','Databases',
  'Monitoring Tools','DevOps Tools','Cloud Platforms','Other Skills',
];

const CAT_ICONS: Record<string, string> = {
  'Programming Languages': '⌨', 'Language Frameworks': '⚙',
  'Databases': '◫', 'Monitoring Tools': '◉',
  'DevOps Tools': '⬡', 'Cloud Platforms': '☁', 'Other Skills': '◆',
};

@Component({
  selector: 'app-apply-job',
  imports: [FormsModule, CvBuilderComponent, CoverLetterComponent],
  templateUrl: './apply-job.html',
  styleUrl: './apply-job.scss'
})
export class ApplyJobComponent {
  private toast = inject(ToastService);
  private jobsService = inject(JobsService);
  private store = inject(Store);

  step = signal(1);
  loading = signal(false);

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

  extractJobDetails() {
    if (!this.jobDescription().trim()) { this.toast.show('Please enter a job description first.', 'error'); return; }
    this.parseLoading.set(true);
    this.jobsService.extractJobDetails(this.jobDescription()).subscribe({
      next: details => {
        console.log('Extracted job details:', details);
        //this.jobDetails.update(j => ({ ...j, ...details }));
        this.toast.show('Job details extracted! You can edit them if needed.');
      },
      error: err => {
        console.error('Error extracting job details:', err);
        this.toast.show('Failed to extract job details', 'error');
      }
    }).add(() => {
      this.parseLoading.set(false);
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
        this.jobsService.setJobDetails(details);
        this.toast.show('Data extracted for cover letter!');
        this.goToStep(2);
      },
      error: err => {
        console.error(err);
      }
    });
  }

  goToStep(val: number) {
    this.step.set(val);
  }

  applyJob() {
  }

}

// NOTE: CvBuilderComponent is imported via apply-job template for Step 3
