import { Component, inject, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAuthLoading } from '@app/utils/store/auth/auth.selectors';
import { selectProfileLoading } from '@app/utils/store/profile/profile.selector';
import { selectCVLoading } from '@app/utils/store/cv/cv.selectors';
import { selectCoverLetterLoading } from '@app/utils/store/cover-letter/cover-letter.selectors';
import { selectJobsLoading } from '@app/utils/store/jobs/jobs.selectors';

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

  // NgRx loading selectors converted to signals
  private authLoading = this.store.selectSignal(selectAuthLoading);
  private profileLoading = this.store.selectSignal(selectProfileLoading);
  private cvLoading = this.store.selectSignal(selectCVLoading);
  private coverLetterLoading = this.store.selectSignal(selectCoverLetterLoading);
  private jobsLoading = this.store.selectSignal(selectJobsLoading);

  // Whether any loading is active
  isAnyLoading = computed(() =>
    this.authLoading() ||
    this.profileLoading() ||
    this.cvLoading() ||
    this.coverLetterLoading() ||
    this.jobsLoading()
  );

  // Individual status items for display
  statusItems = computed<StatusItem[]>(() => {
    const items: StatusItem[] = [];

    if (this.authLoading()) {
      items.push({ label: 'Authenticating', icon: '🔐', active: true });
    }
    if (this.profileLoading()) {
      items.push({ label: 'Loading Profile', icon: '👤', active: true });
    }
    if (this.cvLoading()) {
      items.push({ label: 'Syncing CV', icon: '📄', active: true });
    }
    if (this.coverLetterLoading()) {
      items.push({ label: 'Syncing Cover Letter', icon: '✉️', active: true });
    }
    if (this.jobsLoading()) {
      items.push({ label: 'Loading Jobs', icon: '💼', active: true });
    }

    return items;
  });
}
