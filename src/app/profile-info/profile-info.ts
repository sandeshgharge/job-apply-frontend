import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../utils/services/storage';
import { ToastService } from '../utils/services/toast';
import { AuthService } from '../utils/services/auth';

interface ProfileInfoConfig {
  firstName: string;
  lastName: string;
  email: string;
  apiUrl: string;
  apiKey: string;
}

const PROFILE_INFO_KEY = 'jad_profile_info';

@Component({
  selector: 'app-profile-info',
  imports: [FormsModule],
  templateUrl: './profile-info.html',
  styleUrl: './profile-info.scss',
})
export class ProfileInfo {
  private storage = inject(StorageService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  profile: ProfileInfoConfig = this.buildInitialProfile();

  saveChanges(): void {
    this.storage.set(PROFILE_INFO_KEY, this.profile);
    this.toast.show('Profile information saved');
  }

  private buildInitialProfile(): ProfileInfoConfig {
    const saved = this.storage.get<Partial<ProfileInfoConfig> | null>(PROFILE_INFO_KEY, null);
    const user = this.auth.getUser();
    const fullName = user?.name?.trim() ?? '';
    const [firstName = '', ...rest] = fullName.split(' ');

    return {
      firstName: saved?.firstName ?? firstName,
      lastName: saved?.lastName ?? rest.join(' '),
      email: saved?.email ?? user()?.email ?? '',
      apiUrl: saved?.apiUrl ?? '',
      apiKey: saved?.apiKey ?? ''
    };
  }
}
