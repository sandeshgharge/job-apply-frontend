import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobsService, Job, JobStatus } from '../utils/services/jobs';
import { JobCountPipe } from '../utils/pipes/job-count.pipe';
import { ToastService } from '../utils/services/toast';

@Component({
  selector: 'app-job-tracker',
  imports: [FormsModule, JobCountPipe],
  templateUrl: './job-tracker.html',
  styleUrl: './job-tracker.scss'
})
export class JobTrackerComponent {
  private jobsService = inject(JobsService);
  private toast = inject(ToastService);

  jobs = computed(() => this.jobsService.jobs());
  statuses: JobStatus[] = ['Applied', '1st Interview', '2nd Interview', '3rd Interview', 'Offer', 'Rejected', 'Withdrawn'];

  filterStatus = signal<JobStatus | 'All'>('All');
  showModal = signal(false);
  editingJob = signal<Job | null>(null);
  sortField = signal<'appliedDate' | 'company' | 'status'>('appliedDate');
  sortDir = signal<'asc' | 'desc'>('desc');

  form = signal<Omit<Job, 'id'>>({
    company: '', role: '', location: '', appliedDate: new Date().toISOString().split('T')[0],
    status: 'Applied', notes: '', salary: '', contactName: '', jobUrl: ''
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
    this.form.set({ company: '', role: '', location: '', appliedDate: new Date().toISOString().split('T')[0], status: 'Applied', notes: '', salary: '', contactName: '', jobUrl: '' });
    this.showModal.set(true);
  }

  openEditModal(job: Job) {
    this.editingJob.set(job);
    this.form.set({ company: job.company, role: job.role, location: job.location, appliedDate: job.appliedDate, status: job.status, notes: job.notes ?? '', salary: job.salary ?? '', contactName: job.contactName ?? '', jobUrl: job.jobUrl ?? '' });
    this.showModal.set(true);
  }

  saveJob() {
    const editing = this.editingJob();
    if (editing) {
      this.jobsService.updateJob(editing.id, this.form());
      this.toast.show('Application updated!');
    } else {
      this.jobsService.addJob(this.form());
      this.toast.show('Application added!');
    }
    this.showModal.set(false);
  }

  deleteJob(id: string) {
    if (confirm('Delete this application?')) {
      this.jobsService.deleteJob(id);
      this.toast.show('Application deleted.', 'info');
    }
  }

  updateFormStatus(status: JobStatus) { this.form.update(f => ({ ...f, status })); }
  updateFormField(field: keyof Omit<Job,'id'>, value: string) { this.form.update(f => ({ ...f, [field]: value })); }

  quickStatusChange(id: string, status: JobStatus) {
    this.jobsService.updateJob(id, { status });
    this.toast.show(`Status updated to "${status}"`);
  }

  toggleSort(field: 'appliedDate' | 'company' | 'status') {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  statusColor(status: JobStatus): string {
    const map: Record<JobStatus, string> = {
      'Applied': 'blue', '1st Interview': 'amber', '2nd Interview': 'amber',
      '3rd Interview': 'amber', 'Offer': 'green', 'Rejected': 'red', 'Withdrawn': 'gray'
    };
    return map[status] ?? 'gray';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  sortIcon(field: string): string {
    if (this.sortField() !== field) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }
}
