import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { AuthEffects } from './utils/store/auth/auth.effects';
import { reducers } from './utils/store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideStore(reducers), 
    provideEffects([AuthEffects])
  ],
};
