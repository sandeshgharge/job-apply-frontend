import { Component, signal, inject, ViewChild, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CvBuilderComponent } from '@app/cv-builder/cv-builder';
import { CoverLetterComponent } from '@app/cl-builder/cl-builder';
import { SkillGroup } from '@app/utils/entities/job-details';
import { Store } from '@ngrx/store';
import { ApplyPreviewComponent } from '../apply-preview/apply-preview';
import { applyJob } from '@app/utils/store/jobs/jobs.actions';
import { TranslationService } from '@app/utils/services/translation/translation.service';
import { TourService } from '@app/utils/services/tour.service';
import {
  setWizardTab,
  fetchJobFromUrl,
  extractJobDetails,
  setJobDescription,
  setJobUrl,
  updateJobDetailsField
} from '@app/utils/store/apply-wizard/apply-wizard.actions';
import {
  selectCurrentTab,
  selectJobUrl,
  selectJobDescription,
  selectIsLoadingKey,
  selectLoadingMessages
} from '@app/utils/store/apply-wizard/apply-wizard.selectors';
import { WizardTabId } from '@app/utils/store/apply-wizard/apply-wizard.state';

const SKILL_CATEGORIES = ['Frontend', 'Backend', 'DevOps'];
const CAT_ICONS: Record<string, string> = {
  Frontend: '🌐', Backend: '🧠', DevOps: '⚙️',
};

@Component({
  selector: 'app-apply-job',
  imports: [FormsModule, CvBuilderComponent, CoverLetterComponent, ApplyPreviewComponent],
  templateUrl: './apply-job.html',
  styleUrl: './apply-job.scss'
})
export class ApplyJobComponent {
  private store = inject(Store);
  public translate = inject(TranslationService);
  public tourService = inject(TourService);

  @ViewChild('cvBuilder') cvBuilder!: CvBuilderComponent;
  @ViewChild('coverLetter') coverLetterComponent!: CoverLetterComponent;

  // ─── Store-driven state ──────────────────────────────────────
  activeTab = this.store.selectSignal(selectCurrentTab);
  jobUrl = this.store.selectSignal(selectJobUrl);
  jobDescription = this.store.selectSignal(selectJobDescription);
  fetchJobLoading = this.store.selectSignal(selectIsLoadingKey('fetchJob'));
  scrapeJobLoading = this.store.selectSignal(selectIsLoadingKey('scrapeJob'));
  fetchLoading = computed(() => this.fetchJobLoading() || this.scrapeJobLoading());
  parseLoading = this.store.selectSignal(selectIsLoadingKey('extractData'));
  applyLoading = this.store.selectSignal(selectIsLoadingKey('applyJob'));
  loadingMessages = this.store.selectSignal(selectLoadingMessages);

  // ─── Local signals ───────────────────────────────────────────
  skillGroups = signal<SkillGroup[]>(SKILL_CATEGORIES.map(c => ({ category: c, skills: [] })));

  tabs = computed<{ id: WizardTabId; label: string; icon: string }[]>(() => [
    { id: 'Fetch Job', label: this.translate.t().applyWizard.stepFetch, icon: '📥' },
    { id: 'Cover Letter', label: this.translate.t().applyWizard.stepCl, icon: '📝' },
    { id: 'CV', label: this.translate.t().applyWizard.stepCv, icon: '📄' },
    { id: 'PDF Preview', label: this.translate.t().applyWizard.stepPreview, icon: '👁️' },
  ]);

  constructor() {
    // Drive the apply-job sub-tab from the tour when the tour requests a switch
    effect(() => {
      const desired = this.tourService.desiredApplyTab();
      if (desired) this.store.dispatch(setWizardTab({ tab: desired as WizardTabId }));
    });
  }

  categoryIcon(cat: string): string { return CAT_ICONS[cat] ?? '◆'; }

  setTab(tab: WizardTabId) {
    if (tab === 'PDF Preview') {
      this.syncPreviewDataToStore();
    }
    this.store.dispatch(setWizardTab({ tab }));
  }

  /** Push latest child component data into the store before showing PDF Preview */
  private syncPreviewDataToStore() {
    // Data is now sourced entirely from the NgRx store via selectors,
    // so no manual syncing is required before previewing.
  }

  // ─── Step 1 actions ──────────────────────────────────────────
  fetchJob() {
    const url = this.jobUrl().trim();
    if (!url) return;
    this.store.dispatch(fetchJobFromUrl({ url }));
  }

  extractDataForCoverLetter() {
    const desc = this.jobDescription().trim();
    if (!desc) return;
    this.store.dispatch(extractJobDetails({ jobDescription: desc }));
  }

  updateJobUrl(value: string) {
    this.store.dispatch(setJobUrl({ url: value }));
  }

  updateJobDescription(value: string) {
    this.store.dispatch(setJobDescription({ description: value }));
  }

  async markAsApplied() {
    this.store.dispatch(applyJob());
  }
}
