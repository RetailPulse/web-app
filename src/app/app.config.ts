import {authInterceptor} from "./interceptors/auth.interceptor";

import {OAuthModule} from 'angular-oauth2-oidc';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {ApplicationConfig, provideZoneChangeDetection, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router'; //, withDebugTracing
import {routes} from './app.routes';

import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import {ConfirmationService} from 'primeng/api';
import {RetailPulsePreset} from './app.preset';

export const appConfig: ApplicationConfig = {
  providers: [
    ConfirmationService,
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes), //, withDebugTracing()
    provideAnimations(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: RetailPulsePreset,
        options: {
          darkModeSelector: false || 'none'
        }
      }
    }),
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
    importProvidersFrom(OAuthModule.forRoot())
  ]
};
