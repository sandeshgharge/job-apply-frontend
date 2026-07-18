import { Component, effect, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast.service';
import { ProfileInfo, ApiAgentInfo } from '../utils/entities/user';
import { Store } from '@ngrx/store';
import { selectProfileInfo, selectActiveAgent } from '../utils/store/profile/profile.selector';
import { updateProfileInfo, updateSelectedAgentId, createAgent, updateAgent } from '../utils/store/profile/profile.actions';
import { ProfileService } from '@app/utils/services/profile.service';
import { TranslationService } from '@app/utils/services/translation/translation.service';
import { Router } from '@angular/router';

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
  private router = inject(Router);

  profileImageUrl = signal<string>('');
  signatureImageUrl = signal<string>('');

  @ViewChild('agentDialog') agentDialog!: ElementRef<HTMLDialogElement>;
  isEditMode = signal(false);
  agentForm = signal<ApiAgentInfo>({ name: '', isPublic: false, agentApiUrl: '', agentApiKey: '', modelName: '' });

  constructor() {
    effect(() => {
      const tempProfile = this.profileFromStore();
      if (tempProfile) {
        this.profile.set(tempProfile)
      }
    })
  }

  ngOnInit(): void {
    // Images are not loaded automatically on load.
  }

  loadProfileImage(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.profile().profileImageUrl) {
      this.toast.show(this.translate.t().profile.toastNoPhoto, 'info');
      return;
    }
    this.profileService.getImageUrl('profile-image').then(url => {
      if (url) {
        this.profileImageUrl.set(url);
      } else {
        this.toast.show(this.translate.t().profile.toastNoPhoto, 'info');
      }
    });
  }

  loadSignatureImage(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.profile().signatureImageUrl) {
      this.toast.show(this.translate.t().profile.toastNoSignature, 'info');
      return;
    }
    this.profileService.getImageUrl('signature').then(url => {
      if (url) {
        this.signatureImageUrl.set(url);
      } else {
        this.toast.show(this.translate.t().profile.toastNoSignature, 'info');
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
    selectedAgentId: null,
    userApiAgents: [],
    profileImageUrl: '',
    signatureImageUrl: '',
    role: 'guest',
    useDefaultApi: true
  });

  activeAgentStore = computed(this.store.selectSignal(selectActiveAgent));

  isDirty = signal(false);
  imageChanged = signal(false);

  onFieldChange<K extends keyof ProfileInfo>(field: K, value: ProfileInfo[K]): void {
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

  openSetPassword(): void {
    this.router.navigate(['/set-password']);
  }

  onAgentSelectionChange(newId: string | null): void {
    const agentId = newId === 'null' ? null : newId;
    this.profile.update(p => ({ ...p, selectedAgentId: agentId }));
    
    // Dispatch a local update so the activeAgentStore selector updates 
    // and instantly updates the preview fields without calling the backend.
    this.store.dispatch(updateSelectedAgentId({ selectedAgentId: agentId }));
    
    this.isDirty.set(true);
  }

  openAgentDialog(isEdit: boolean): void {
    this.isEditMode.set(isEdit);
    const selected = this.profile().userApiAgents?.find(a => a.id === this.profile().selectedAgentId);
    if (isEdit && selected) {
      this.agentForm.set({ ...selected });
    } else {
      this.agentForm.set({ name: '', isPublic: false, agentApiUrl: '', agentApiKey: '', modelName: '' });
    }
    this.agentDialog.nativeElement.showModal();
  }

  closeAgentDialog(): void {
    this.agentDialog.nativeElement.close();
  }

  saveAgentDetails(): void {
    const agent = { ...this.agentForm() };
    if (!agent.name) {
      this.toast.show('Agent name is required', 'error');
      return;
    }
    
    // Attach the userId for creating
    agent.userId = this.profile().id;

    if (this.isEditMode() && agent.id) {
      const { id, userId, ...updateData } = agent;
      this.store.dispatch(updateAgent({ id, agent: updateData }));
    } else {
      this.store.dispatch(createAgent({ agent }));
    }
    
    // Turn on dirty flag so user can click save after adding/editing
    this.isDirty.set(true);
    
    this.closeAgentDialog();
  }

}
