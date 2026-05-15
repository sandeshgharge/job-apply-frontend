import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../utils/services/auth';
import { DashboardComponent } from '../dashboard/dashboard';
import { ApplyJobComponent } from '../apply-job/apply-job';
import { JobTrackerComponent } from '../job-tracker/job-tracker';
import { ToastComponent } from '../toast/toast';
import { Store } from '@ngrx/store';
import { logout } from '../utils/store/auth/auth.actions';
import { ProfileInfoComponent } from "../profile-info/profile-info";

type TabId = 'dashboard' | 'apply-job' | 'job-tracker' | 'profile';

@Component({
  selector: 'app-home',
  imports: [DashboardComponent, ApplyJobComponent, JobTrackerComponent, ToastComponent, ProfileInfoComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  private auth = inject(AuthService);
  private store = inject(Store);

  activeTab = signal<TabId>('dashboard');

  tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'dashboard',  label: 'Home',       icon: '⊞' },
    { id: 'apply-job',  label: 'Apply Job',  icon: '✦' },
    { id: 'job-tracker', label: 'My Jobs',   icon: '◈' },
    { id: 'profile',    label: 'Profile',    icon: '⚙' },
  ];

  user =  this.auth.getUser();
  logout() { this.store.dispatch(logout()); }
  setTab(tab: TabId) { this.activeTab.set(tab); }
}
