import { Component, inject, computed } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { JobStatus } from '../utils/entities/job-details';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../utils/store/auth/auth.selectors';
import {
  selectAllJobs,
  selectJobsStats,
  selectUpcomingInterviews,
  selectRecentActivity,
  selectJobsLoading
} from '../utils/store/jobs/jobs.selectors';
import { TranslationService } from '../utils/services/translation/translation.service';

@Component({
  selector: 'app-dashboard',
  imports: [TitleCasePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  private store = inject(Store);
  public translate = inject(TranslationService);

  stats = this.store.selectSignal(selectJobsStats);
  jobs = this.store.selectSignal(selectAllJobs);
  jobsLoading = this.store.selectSignal(selectJobsLoading);

  user=this.store.selectSignal(selectCurrentUser)();

  upcomingInterviews = this.store.selectSignal(selectUpcomingInterviews);
  recentActivity = this.store.selectSignal(selectRecentActivity);

  statusColor(status: JobStatus | undefined): string {
    const map: Record<JobStatus, string> = {
      'Open': 'lightgray', 'Applied': 'blue', '1st Interview': 'amber', '2nd Interview': 'amber',
      '3rd Interview': 'amber', 'Offer': 'green', 'Rejected': 'red', 'Withdrawn': 'gray'
    };
    return status? map[status] : 'gray';
  }

  translateStatus(status: JobStatus | string | undefined): string {
    if (!status) return '';
    const keyMap: Record<string, string> = {
      'Open': 'open',
      'Applied': 'applied',
      '1st Interview': 'interview1',
      '2nd Interview': 'interview2',
      '3rd Interview': 'interview3',
      'Offer': 'offer',
      'Rejected': 'rejected',
      'Withdrawn': 'withdrawn'
    };
    const key = keyMap[status];
    return key ? (this.translate.t().statuses as any)[key] || status : status;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  pipelineData = computed(() => {
    const s = this.stats();
    return [
      { label: this.translate.t().statuses.applied, count: s.total, color: '#3b82f6' },
      { label: this.translate.t().statuses.interviews, count: s.interviews, color: '#f59e0b' },
      { label: this.translate.t().statuses.offers, count: s.offers, color: '#10b981' },
      { label: this.translate.t().statuses.rejected, count: s.rejected ?? 0, color: '#ef4444' }
    ];
  });

  barHeight(count: number): number {
    const total = this.stats().total;
    if (!total) return 0;
    return Math.round((count / total) * 100);
  }
}
