import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobCountPipe } from '../utils/pipes/job-count.pipe';
import { JobDetails, JobStatus } from '../utils/entities/job-details';
import { Store } from '@ngrx/store';
import { selectAllJobs, selectJobsLoading } from '../utils/store/jobs/jobs.selectors';
import { addJob, updateJob, deleteJob } from '../utils/store/jobs/jobs.actions';
import { TranslationService } from '../utils/services/translation/translation.service';

@Component({
  selector: 'app-job-tracker',
  imports: [FormsModule, JobCountPipe],
  templateUrl: './job-tracker.html',
  styleUrl: './job-tracker.scss'
})
export class JobTrackerComponent {
  private store = inject(Store);
  public translate = inject(TranslationService);

  jobs = this.store.selectSignal(selectAllJobs);
  jobsLoading = this.store.selectSignal(selectJobsLoading);
  statuses: JobStatus[] = ['Applied', '1st Interview', '2nd Interview', '3rd Interview', 'Offer', 'Rejected', 'Withdrawn'];

  filterStatus = signal<JobStatus | 'All'>('All');
  showModal = signal(false);
  editingJob = signal<JobDetails | null>(null);
  sortField = signal<'appliedDate' | 'companyName' | 'status'>('appliedDate');
  sortDir = signal<'asc' | 'desc'>('desc');

  form = signal<Omit<JobDetails, 'id'>>({
    companyName: '', role: '', companyLocation: '', appliedDate: new Date().toISOString().split('T')[0],
    status: 'Applied', notes: '', salary: '', contactName: '', jobUrl: '', jobDescription: ''
  });

  filteredJobs = computed(() => {
    const f = this.filterStatus();
    const list = f === 'All' ? this.jobs() : this.jobs().filter(j => j.status === f);
    const field = this.sortField();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[field] ?? '', bv = b[field] ?? '';
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  });

  openAddModal() {
    this.editingJob.set(null);
    this.form.set({ companyName: '', role: '', companyLocation: '', appliedDate: new Date().toISOString().split('T')[0], status: 'Applied', notes: '', salary: '', contactName: '', jobUrl: '', jobDescription: '' });
    this.showModal.set(true);
  }

  openEditModal(job: JobDetails) {
    this.editingJob.set(job);
    const normalizedDate = job.appliedDate ? new Date(job.appliedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    this.form.set({ companyName: job.companyName, role: job.role, companyLocation: job.companyLocation, appliedDate: normalizedDate, status: job.status, notes: job.notes ?? '', salary: job.salary ?? '', contactName: job.contactName ?? '', jobUrl: job.jobUrl ?? '', jobDescription: job.jobDescription ?? '' });
    this.showModal.set(true);
  }

  saveJob() {
    const editing = this.editingJob();
    if (editing) {
      this.store.dispatch(updateJob({ id: editing.id ?? '', changes: this.form() }));
    } else {
      this.store.dispatch(addJob({ job: this.form() }));
    }
    this.showModal.set(false);
  }

  deleteJobById(id: string) {
    if (confirm(this.translate.t().jobTracker.deleteConfirm)) {
      this.store.dispatch(deleteJob({ id }));
    }
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

  updateFormStatus(status: JobStatus) { this.form.update(f => ({ ...f, status })); }
  updateFormField(field: keyof Omit<JobDetails,'id'>, value: string) { this.form.update(f => ({ ...f, [field]: value })); }

  quickStatusChange(id: string, status: JobStatus) {
    this.store.dispatch(updateJob({ id, changes: { status } }));
  }

  toggleSort(field: 'appliedDate' | 'companyName' | 'status') {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

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

  sortIcon(field: string): string {
    if (this.sortField() !== field) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }
}
