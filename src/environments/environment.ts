import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8081', // Update with your authorization server URL
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
  backend_api_url: 'http://localhost:8085/',
  user_api_url: 'http://localhost:8083/'
};

export const environment = {
  production: false,
  authEnabled: true,
  devModeUser: 'superadmin',
  devModeRole: 'ADMIN' //'OPERATOR' //
};
