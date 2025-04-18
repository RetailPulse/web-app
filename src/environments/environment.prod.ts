import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'http://retailpulse.me:8081', // Update with your authorization server URL
  requireHttps: false,
  redirectUri: window.location.origin,
  clientId: 'client',
  responseType: 'code',
  scope: 'openid',
  useSilentRefresh: true,
  useHttpBasicAuth: false,
  disablePKCE: false,
  showDebugInformation: true
};

export const apiConfig = {
  backend_api_url: 'http://retailpulse.me:8085/',
  user_api_url: 'http://retailpulse.me:8083/'
};

export const environment = {
  production: true,
  authEnabled: true,
  devModeUser: 'superadmin',
  devModeRole: 'ADMIN' //'OPERATOR' //
};
