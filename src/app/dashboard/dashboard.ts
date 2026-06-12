import { Component, inject, computed } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { JobsService } from '../utils/services/jobs.service';
import { JobStatus } from '../utils/entities/job-details';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../utils/store/auth/auth.selectors';

@Component({
  selector: 'app-dashboard',
  imports: [TitleCasePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  private jobsService = inject(JobsService);
  private store = inject(Store);

  stats = computed(() => this.jobsService.getStats());
  jobs = computed(() => this.jobsService.jobs());

  user=this.store.selectSignal(selectCurrentUser)();

  upcomingInterviews = computed(() =>
    this.jobsService.jobs().filter(j => j.status?.includes('Interview')).slice(0, 5)
  );

  recentActivity = computed(() =>
    [...this.jobsService.jobs()]
      .sort((a, b) => new Date(b.appliedDate ?? '').getTime() - new Date(a.appliedDate ?? '').getTime())
      .slice(0, 5)
  );

  statusColor(status: JobStatus | undefined): string {
    const map: Record<JobStatus, string> = {
      'Open': 'lightgray', 'Applied': 'blue', '1st Interview': 'amber', '2nd Interview': 'amber',
      '3rd Interview': 'amber', 'Offer': 'green', 'Rejected': 'red', 'Withdrawn': 'gray'
    };
    return status? map[status] : 'gray';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  pipelineData = computed(() => {
    const s = this.jobsService.getStats();
    return [
      { label: 'Applied', count: s.total, color: '#3b82f6' },
      { label: 'Interviews', count: s.interviews, color: '#f59e0b' },
      { label: 'Offers', count: s.offers, color: '#10b981' },
      { label: 'Rejected', count: s.rejected, color: '#ef4444' }
    ];
  });

  barHeight(count: number): number {
    const total = this.stats().total;
    if (!total) return 0;
    return Math.round((count / total) * 100);
  }
}
