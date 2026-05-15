import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast';
import { AuthService } from '../utils/services/auth';
import { ProfileInfo } from '../utils/entities/user';
import { Store } from '@ngrx/store';
import { selectProfileInfo } from '../utils/store/profile/profile.selector';
import { loadProfileInfo } from '../utils/store/profile/profile.actions';

const PROFILE_INFO_KEY = 'jad_profile_info';

@Component({
  selector: 'app-profile-info',
  imports: [FormsModule],
  templateUrl: './profile-info.html',
  styleUrl: './profile-info.scss',
})
export class ProfileInfoComponent {

  private toast = inject(ToastService);
  private store = inject(Store);

  constructor() {
    this.store.dispatch(loadProfileInfo());
  }

  profile: ProfileInfo = this.store.selectSignal(selectProfileInfo)() || {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    apiUrl: '',
    apiKey: ''
  };

  saveChanges(): void {
    console.log('Saving profile information:', this.profile);
    this.toast.show('Profile information saved');
  }

}
