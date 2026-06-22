import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { reducers } from './utils/store/app.reducer';
import { effects } from './utils/store/app.effects';
import { autoLogin } from './utils/store/auth/auth.actions';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideStore(reducers), 
    provideEffects(effects),
    provideHttpClient(),
    provideAppInitializer(() => {
      const store = inject(Store);  // ← inject directly inside the factory
      console.log("Initializing authentication...");
      return store.dispatch(autoLogin());
    }),
  ],
};