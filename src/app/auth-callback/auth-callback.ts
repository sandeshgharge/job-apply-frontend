import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '@app/utils/supabase/client';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.scss',
})
export class AuthCallback {

  constructor(
    private router: Router
  ) {}

  async ngOnInit() {

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      this.router.navigate(['/login']);
      return;
    }

    const { data: profile } = await supabase
      .from('user_details')
      .select()
      .eq('id', session.user.id)
      .single();

      console.log('User profile:', profile);

    if (!profile?.onboarding_completed) {
      this.router.navigate(['/set-password']);
    } else {
      this.router.navigate(['/dashboard']);
    }

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}
