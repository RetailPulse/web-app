import {authInterceptor} from "./interceptors/auth.interceptor";

import {OAuthModule} from 'angular-oauth2-oidc';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
// import { provideBrowserGlobalErrorListeners } from '@angular/platform-browser';
import {ApplicationConfig, provideZoneChangeDetection, importProvidersFrom,} from '@angular/core'; //provideZonelessChangeDetection, 
import {provideRouter} from '@angular/router'; //, withDebugTracing
import {routes} from './app.routes';

import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import {ConfirmationService} from 'primeng/api';
import {RetailPulsePreset} from './app.preset';

import { LOAD_WASM } from 'ngx-scanner-qrcode';

export const appConfig: ApplicationConfig = {
  providers: [
    ConfirmationService,
    provideZoneChangeDetection({eventCoalescing: true}), //commented out due to adding of ZonelessChangeDetection.
    provideRouter(routes), //, withDebugTracing()
    provideAnimations(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: RetailPulsePreset,
        options: {
          darkModeSelector: 'none'
        }
      }
    }),
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
    // provideBrowserGlobalErrorListeners(), //Added by Tun Tun
    // provideZonelessChangeDetection(), //Added by Tun Tun
    importProvidersFrom(OAuthModule.forRoot()),
    { provide: LOAD_WASM, useValue: '/wasm/ngx-scanner-qrcode.wasm' },
  ]
};
