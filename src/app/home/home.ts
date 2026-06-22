import { Component, signal, inject, computed } from '@angular/core';
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
import { TranslationService } from '@app/utils/services/translation/translation.service';

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
  public translate = inject(TranslationService);

  activeTab = signal<TabId>('dashboard');

  tabs = computed<{ id: TabId; label: string; icon: string }[]>(() => [
    { id: 'dashboard',  label: this.translate.t().navigation.home,       icon: '⊞' },
    { id: 'apply-job',  label: this.translate.t().navigation.applyJob,  icon: '✦' },
    { id: 'job-tracker', label: this.translate.t().navigation.myJobs,   icon: '◈' },
    { id: 'profile',    label: this.translate.t().navigation.profile,    icon: '⚙' },
  ]);

  user =  this.store.selectSignal(selectCurrentUser)();
  
  logout() { this.store.dispatch(logout()); }
  setTab(tab: TabId) { this.activeTab.set(tab); }
}
