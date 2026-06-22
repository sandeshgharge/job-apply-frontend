import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast.service';
import { ProfileInfo } from '../utils/entities/user';
import { Store } from '@ngrx/store';
import { selectProfileInfo } from '../utils/store/profile/profile.selector';
import { updateProfileInfo } from '../utils/store/profile/profile.actions';
import { ProfileService } from '@app/utils/services/profile.service';
import { TranslationService } from '@app/utils/services/translation/translation.service';

@Component({
  selector: 'app-profile-info',
  imports: [FormsModule],
  templateUrl: './profile-info.html',
  styleUrl: './profile-info.scss',
})
export class ProfileInfoComponent implements OnInit {

  private toast = inject(ToastService);
  private profileService = inject(ProfileService);
  private store = inject(Store);
  public translate = inject(TranslationService);

  profileImageUrl = signal<string>('');
  signatureImageUrl = signal<string>('');

  constructor() {
    effect(() => {
      const tempProfile = this.profileFromStore();
      if (tempProfile) {
        this.profile.set(tempProfile)
      }
    })
  }

  ngOnInit(): void {
    this.profileService.getImageUrl('profile-image').then(url => {
      if (url) {
        this.profileImageUrl.set(url);
      }
    });
    this.profileService.getImageUrl('signature').then(url => {
      if (url) {
        this.signatureImageUrl.set(url);
      }
    });
  }

  profileFromStore = this.store.selectSignal(selectProfileInfo);
  profile = signal<ProfileInfo>({
    id: '',
    firstName: '',
    lastName: '',
    location: '',
    email: '',
    agentApiUrl: '',
    agentApiKey: '',
    modelName: '',
    profileImageUrl: '',
    signatureImageUrl: ''
  });

  isDirty = signal(false);
  imageChanged = signal(false);

  onFieldChange(field: keyof ProfileInfo, value: string): void {
    this.profile.update(p => ({ ...p, [field]: value }));
    this.isDirty.set(true);
  }

  onImageSelected(field: 'profileImageUrl' | 'signatureImageUrl', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.toast.show(this.translate.t().profile.toastValidImage, 'error');
      return;
    }

    // Validate file size (max 1MB)
    const maxSize = 1024 * 1024;
    if (file.size > maxSize) {
      this.toast.show(this.translate.t().profile.toastImageSize, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      //this.profile.update(p => ({ ...p, [field]: dataUrl }));
      if (field === 'profileImageUrl') {
        this.profileImageUrl.set(dataUrl);
      } else {
        this.signatureImageUrl.set(dataUrl);
      }
      this.isDirty.set(true);
      this.imageChanged.set(true);
    };
    reader.readAsDataURL(file);
  }

  saveChanges(): void {
    if (!this.isDirty())
      return

    if(this.imageChanged()) {
      this.profile.update(p => ({
        ...p,
        profileImageUrl: this.profileImageUrl(),
        signatureImageUrl: this.signatureImageUrl()
      }));
    }

    this.store.dispatch(updateProfileInfo({ profileInfo: this.profile() }));
    this.isDirty.set(false);
    this.imageChanged.set(false);

  }

}
