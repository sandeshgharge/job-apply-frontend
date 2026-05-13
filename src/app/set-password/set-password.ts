import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ToastService } from '../utils/services/toast';
import { changePassword } from '../utils/store/auth/auth.actions';

export interface PasswordForm {
  newPassword:     string;
  repeatPassword:  string;
}

export interface PasswordStrength {
  score:  number;   // 0–4
  label:  string;
  color:  string;
}

@Component({
  selector: 'app-set-password',
  imports: [FormsModule],
  templateUrl: './set-password.html',
  styleUrl:    './set-password.scss'
})
export class SetPassword {
  private store = inject(Store);
  private toast = inject(ToastService);

  form = signal<PasswordForm>({
    newPassword:     '',
    repeatPassword:  ''
  });

  // Toggle visibility per field
  showCurrent = signal(false);
  showNew     = signal(false);
  showRepeat  = signal(false);

  submitted = signal(false);
  loading   = signal(false);

  // ── Validation ─────────────────────────────────────────────────

  errors = computed(() => {
    const f   = this.form();
    const out: Record<string, string> = {};

    if (!f.newPassword)
      out['newPassword'] = 'New password is required.';
    else if (f.newPassword.length < 8)
      out['newPassword'] = 'Must be at least 8 characters.';
    else if (!/[A-Z]/.test(f.newPassword))
      out['newPassword'] = 'Must contain at least one uppercase letter.';
    else if (!/[0-9]/.test(f.newPassword))
      out['newPassword'] = 'Must contain at least one number.';


    if (!f.repeatPassword)
      out['repeatPassword'] = 'Please repeat your new password.';
    else if (f.newPassword && f.repeatPassword !== f.newPassword)
      out['repeatPassword'] = 'Passwords do not match.';

    return out;
  });

  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // ── Password strength ──────────────────────────────────────────

  strength = computed<PasswordStrength>(() => {
    const p = this.form().newPassword;
    if (!p) return { score: 0, label: '', color: '' };

    let score = 0;
    if (p.length >= 8)                        score++;
    if (p.length >= 12)                       score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p))  score++;
    if (/[0-9]/.test(p))                      score++;
    if (/[^A-Za-z0-9]/.test(p))              score++;

    const map: PasswordStrength[] = [
      { score: 0, label: '',          color: '' },
      { score: 1, label: 'Weak',      color: '#ef4444' },
      { score: 2, label: 'Fair',      color: '#f59e0b' },
      { score: 3, label: 'Good',      color: '#3b82f6' },
      { score: 4, label: 'Strong',    color: '#10b981' },
      { score: 5, label: 'Very Strong', color: '#059669' },
    ];

    return map[score] ?? map[0];
  });

  // ── Field update ───────────────────────────────────────────────

  update(field: keyof PasswordForm, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  // ── Submit ─────────────────────────────────────────────────────

  onSubmit() {
    this.submitted.set(true);
    if (!this.isValid()) return;

    this.loading.set(true);

    this.store.dispatch(changePassword({
      password: this.form().newPassword
    }));

    // Loading and success/failure is handled by the effect.
    // Reset loading here as a fallback — ideally driven by store state.
    // Replace with selectSignal(selectPasswordLoading) if wired to store.
    setTimeout(() => this.loading.set(false), 800);
  }

  reset() {
    this.form.set({ newPassword: '', repeatPassword: '' });
    this.submitted.set(false);
    this.showCurrent.set(false);
    this.showNew.set(false);
    this.showRepeat.set(false);
  }

  // Show error only after first submit attempt
  showError(field: string): string | null {
    return this.submitted() ? (this.errors()[field] ?? null) : null;
  }
}