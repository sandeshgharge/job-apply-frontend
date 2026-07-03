import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/utils/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TranslationService } from '@app/utils/services/translation/translation.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.scss',
})
export class AuthCallback {

  private router = inject(Router);
  private http = inject(HttpClient);
  private readonly baseUrl = environment.backendAiApiURL;
  private authService = inject(AuthService);
  public translate = inject(TranslationService);

  error = signal<string | null>(null);

  async ngOnInit() {

    const params = new URLSearchParams(
      window.location.hash.substring(1)
    );

    const accessToken = params.get('access_token');

    if(accessToken)
      sessionStorage.setItem("access_token", accessToken);
    else if(params.get('error')){
      this.error.set("Token Expired");
      return;
    }

    const {
      data: { session }
    } = await this.authService.getSession();

    if (!session) {
      this.router.navigate(['/login']);
      return;
    }

    const profile = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl}profile/${session.user.id}`)
    );

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
