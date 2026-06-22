import { Component, signal, inject } from '@angular/core';
import { DashboardComponent } from '@app/dashboard/dashboard';
import { ApplyJobComponent } from '@app/apply-job/apply-job';
import { JobTrackerComponent } from '@app/job-tracker/job-tracker';
import { ToastComponent } from '@app/toast/toast';
import { Store } from '@ngrx/store';
import { logout } from '@app/utils/store/auth/auth.actions';
import { ProfileInfoComponent } from "@app/profile-info/profile-info";
import { StatusBarComponent } from '@app/status-bar/status-bar';
import { selectCurrentUser } from '@app/utils/store/auth/auth.selectors';
import { ThemeService } from '@app/utils/services/theme.service';

type TabId = 'dashboard' | 'apply-job' | 'job-tracker' | 'profile';

@Component({
  selector: 'app-home',
  imports: [DashboardComponent, ApplyJobComponent, JobTrackerComponent, ToastComponent, ProfileInfoComponent, StatusBarComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  private store = inject(Store);
  public themeService = inject(ThemeService);


  activeTab = signal<TabId>('dashboard');

  tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'dashboard',  label: 'Home',       icon: '⊞' },
    { id: 'apply-job',  label: 'Apply Job',  icon: '✦' },
    { id: 'job-tracker', label: 'My Jobs',   icon: '◈' },
    { id: 'profile',    label: 'Profile',    icon: '⚙' },
  ];

  user =  this.store.selectSignal(selectCurrentUser)();
  
  logout() { this.store.dispatch(logout()); }
  setTab(tab: TabId) { this.activeTab.set(tab); }
}
