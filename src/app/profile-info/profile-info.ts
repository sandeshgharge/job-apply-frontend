import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast.service';
import { ProfileInfo } from '../utils/entities/user';
import { Store } from '@ngrx/store';
import { selectProfileInfo } from '../utils/store/profile/profile.selector';
import { loadProfileInfo, updateProfileInfo } from '../utils/store/profile/profile.actions';

@Component({
  selector: 'app-profile-info',
  imports: [FormsModule],
  templateUrl: './profile-info.html',
  styleUrl: './profile-info.scss',
})
export class ProfileInfoComponent implements OnInit {

  private toast = inject(ToastService);
  private store = inject(Store);

  constructor() {
    effect(() => {
      const tempProfile = this.profileFromStore();
      console.log("Profile", tempProfile)
      if(tempProfile){
        this.profile.set(tempProfile)
      }
    })
  }

  ngOnInit(): void {
    if(this.profileFromStore()?.id)
      return
    this.store.dispatch(loadProfileInfo());
  }

  profileFromStore = this.store.selectSignal(selectProfileInfo);
  profile= signal<ProfileInfo>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    apiUrl: '',
    apiKey: ''
  });

  isDirty = signal(false);

  onFieldChange(field: keyof ProfileInfo, value: string): void {
    this.profile.update(p => ({ ...p, [field]: value }));
    this.isDirty.set(true);
  }

  saveChanges(): void {
    if(!this.isDirty())
      return
    this.store.dispatch(updateProfileInfo({ profileInfo: this.profile() }));
    this.isDirty.set(false);
    this.toast.show('Profile information saved');
  }


}
