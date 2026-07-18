import { Component, inject, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAuthLoading } from '@app/utils/store/auth/auth.selectors';
import { selectProfileLoading } from '@app/utils/store/profile/profile.selector';
import { selectCVLoading } from '@app/utils/store/cv/cv.selectors';
import { selectCoverLetterLoading } from '@app/utils/store/cover-letter/cover-letter.selectors';
import { selectJobsLoading } from '@app/utils/store/jobs/jobs.selectors';
import { selectLoadingMessages } from '@app/utils/store/apply-wizard/apply-wizard.selectors';
import { TranslationService } from '../utils/services/translation/translation.service';

interface StatusItem {
  label: string;
  icon: string;
  active: boolean;
}

@Component({
  selector: 'app-status-bar',
  imports: [],
  templateUrl: './status-bar.html',
  styleUrl: './status-bar.scss'
})
export class StatusBarComponent {
  private store = inject(Store);
  public translate = inject(TranslationService);

  // NgRx loading selectors converted to signals
  private authLoading = this.store.selectSignal(selectAuthLoading);
  private profileLoading = this.store.selectSignal(selectProfileLoading);
  private cvLoading = this.store.selectSignal(selectCVLoading);
  private coverLetterLoading = this.store.selectSignal(selectCoverLetterLoading);
  private jobsLoading = this.store.selectSignal(selectJobsLoading);
  private wizardLoadingMessages = this.store.selectSignal(selectLoadingMessages);

  // Whether any loading is active
  isAnyLoading = computed(() =>
    this.authLoading() ||
    this.profileLoading() ||
    this.cvLoading() ||
    this.coverLetterLoading() ||
    this.jobsLoading() ||
    this.wizardLoadingMessages().length > 0
  );

  // Individual status items for display
  statusItems = computed<StatusItem[]>(() => {
    const items: StatusItem[] = [];
    const t = this.translate.t().statusBar;

    if (this.authLoading()) {
      items.push({ label: t.authenticating, icon: '🔐', active: true });
    }
    if (this.profileLoading()) {
      items.push({ label: t.loadingProfile, icon: '👤', active: true });
    }
    if (this.cvLoading()) {
      items.push({ label: t.syncingCv, icon: '📄', active: true });
    }
    if (this.coverLetterLoading()) {
      items.push({ label: t.syncingCl, icon: '✉️', active: true });
    }
    if (this.jobsLoading()) {
      items.push({ label: t.loadingJobs, icon: '💼', active: true });
    }

    const wizardMessages = this.wizardLoadingMessages();
    const fullT = this.translate.t() as any;
    wizardMessages.forEach(msgKey => {
      const parts = msgKey.split('.');
      let translated = fullT;
      for (const p of parts) {
        if (translated && translated[p]) {
          translated = translated[p];
        } else {
          translated = msgKey;
          break;
        }
      }
      items.push({ label: typeof translated === 'string' ? translated : msgKey, icon: '⏳', active: true });
    });

    return items;
  });
}
