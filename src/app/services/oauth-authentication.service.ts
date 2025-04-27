// oauth-authentication.service.ts
import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig, environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

export interface DecodedToken {
  roles: Array<string>;
  sub: string;
}

@Injectable({
  providedIn: 'root'
})
export class OAuthAuthenticationService {
  constructor(private router: Router, private oauthService: OAuthService) {
    this.oauthService.configure(authConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  public initializeAuth() {
    if (!environment.authEnabled) {
      console.log("Authentication is disabled. Using dummy token.");
      return Promise.resolve();
    }

    return this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      if (this.oauthService.hasValidAccessToken()) {
        console.log("Token: \r\n" + this.accessToken);
        // Removed navigateToAuthenticatedUser() from here
      } else {
        console.log('User is not logged in');
        this.router.navigate(['/login']);
      }
    }).catch(error => {
      console.log('Error during OAuth configuration', error);
      this.router.navigate(['/login']);
    });
  }

  login() {
    if (!environment.authEnabled) {
      console.log('Authentication is disabled');
      return;
    }
    this.oauthService.initCodeFlow();
  }

  logout() {
    if (!environment.authEnabled) {
      console.log('Authentication is disabled');
      return;
    }
    this.oauthService.logOut();
    this.router.navigate(['/login']); // Keep redirection here for now
  }

  get isAuthenticated(): boolean {
    if (!environment.authEnabled) {
      console.log('Authentication is disabled');
      return true;
    }
    return this.oauthService.hasValidAccessToken();
  }

  public getUserRole(): string[] {
    if (!environment.authEnabled) {
      return [environment.devModeRole.toUpperCase()];
    }

    if (!this.accessToken) {
      return ['UNAUTHORIZED'];
    }

    try {
      const decodedToken = jwtDecode<DecodedToken>(this.accessToken);
      return decodedToken.roles?.map(role => role.toUpperCase()) || ['UNAUTHORIZED'];
    } catch (error) {
      console.error('Error decoding token:', error);
      return ['UNAUTHORIZED'];
    }
  }

  public getUsername(): string {
    console.log('Casper Auth Mode: ' + environment.authEnabled);
    if (!environment.authEnabled) {
      return environment.devModeUser;
    }
    if (!this.accessToken) {
      return 'UNAUTHORIZED';
    }
    const decodedToken: DecodedToken = jwtDecode(this.accessToken);
    return decodedToken.sub;
  }

  get accessToken(): string {
    if (!environment.authEnabled) {
      return 'dummy-access-token';
    }
    return this.oauthService.getAccessToken();
  }

  getDecodedToken() {
    if (!environment.authEnabled) {
      console.log('Authentication is disabled');
      const dummyToken: DecodedToken = {
        roles: [environment.devModeRole],
        sub: environment.devModeUser
      };
      return dummyToken;
    }
    return jwtDecode(this.accessToken);
  }

}
