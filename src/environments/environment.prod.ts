import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8080', // Update with your authorization server URL
  redirectUri: window.location.origin,
  clientId: 'client',
  responseType: 'code',
  scope: 'openid', // Update based on your requirements
  showDebugInformation: true
};