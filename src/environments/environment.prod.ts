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
  user_api_url: 'http://svc-rp-user:8082/',
  business_entity_api_url: 'http://svc-rp-businessentity:8083/',
  inventory_api_url: 'http://svc-rp-inventory:8084/',
  sales_api_url: 'http://svc-rp-sales:8085/',
  report_api_url: 'http://svc-rp-report:8086/'
};

export const environment = {
  production: true,
  authEnabled: true,
  devModeUser: 'superadmin',
  devModeRole: 'ADMIN', //'OPERATOR', //
  defaultPassword: 'password1'
};
