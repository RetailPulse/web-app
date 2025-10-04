import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

if (environment.useRuntimeConfig) {
  fetch('/assets/runtime-config.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load runtime config: ${response.statusText}`);
      }
      return response.json();
    })
    .then((config) => {
      window['runtimeConfig'] = config;

      bootstrapApplication(AppComponent, appConfig)
        .catch((err) => console.error('Bootstrap error:', err));
    })
    .catch((err) => {
      console.error('Runtime config load error:', err);
      // Optionally show fallback UI or redirect
    });
} else {
  console.warn('Runtime config disabled. Using static environment.ts values.');
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error('Bootstrap error:', err));
}
