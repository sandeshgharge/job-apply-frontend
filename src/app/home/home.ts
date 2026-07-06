import { Component, signal, inject, computed, OnInit, effect } from '@angular/core';
import { DashboardComponent } from '@app/dashboard/dashboard';
import { ApplyJobComponent } from '@app/apply-job/apply-job';
import { JobTrackerComponent } from '@app/job-tracker/job-tracker';
import { ToastComponent } from '@app/toast/toast';
import { Store } from '@ngrx/store';
import { logout } from '@app/utils/store/auth/auth.actions';
import { ProfileInfoComponent } from "@app/profile-info/profile-info";
import { StatusBarComponent } from '@app/status-bar/status-bar';
import { selectCurrentUser } from '@app/utils/store/auth/auth.selectors';
import { selectProfileRole } from '@app/utils/store/profile/profile.selector';
import { ThemeService } from '@app/utils/services/theme.service';
import { TranslationService } from '@app/utils/services/translation/translation.service';
import { TourService } from '@app/utils/services/tour.service';
import { TourOverlayComponent } from '@app/tour/tour-overlay';
import { ActivatedRoute } from '@angular/router';
import { NameLogo } from "@app/name-logo/name-logo";

type TabId = 'dashboard' | 'apply-job' | 'job-tracker' | 'profile';

@Component({
  selector: 'app-home',
  imports: [NameLogo, DashboardComponent, ApplyJobComponent, JobTrackerComponent, ToastComponent, ProfileInfoComponent, StatusBarComponent, TourOverlayComponent, NameLogo],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  private store = inject(Store);
  public themeService = inject(ThemeService);
  public translate = inject(TranslationService);
  private route = inject(ActivatedRoute);
  public tourService = inject(TourService);

  activeTab = signal<TabId>('dashboard');

  constructor() {
    // Drive the active tab from the tour when the tour requests a tab switch
    effect(() => {
      const desired = this.tourService.desiredHomeTab();
      if (desired) this.activeTab.set(desired);
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as TabId;
      if (tab && ['dashboard', 'apply-job', 'job-tracker', 'profile'].includes(tab)) {
        this.activeTab.set(tab);
      }
    });
  }

  tabs = computed<{ id: TabId; label: string; icon: string }[]>(() => [
    { id: 'dashboard',  label: this.translate.t().navigation.home,       icon: '⊞' },
    { id: 'apply-job',  label: this.translate.t().navigation.applyJob,  icon: '✦' },
    { id: 'job-tracker', label: this.translate.t().navigation.myJobs,   icon: '◈' },
    { id: 'profile',    label: this.translate.t().navigation.profile,    icon: '⚙' },
  ]);

  user =  this.store.selectSignal(selectCurrentUser)();
  isGuest = this.store.selectSignal(selectProfileRole);
  
  logout() { this.store.dispatch(logout()); }
  setTab(tab: TabId) { this.activeTab.set(tab); }
}
