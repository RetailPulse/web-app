import { SidebarComponent } from '../sidebar/sidebar.component';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {apiConfig} from '../../environments/environment';
import { AuthFacade } from '../services/auth.facade';
@Component({
  selector: 'admin-page',
  imports: [
    RouterModule,
    SidebarComponent,
  ],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.css',
  standalone: true
})
export class AdminPageComponent {

  // public helloResponse: Signal<string> = (inputStr: string) => {return inputStr;};

  constructor(
    private router: Router,
    private authService: AuthFacade,
    private http: HttpClient
  ) {

    console.log('Token: ' + this.authService.getAccessToken());
    console.log('Decoded Token: ' + this.authService.getDecodedToken());
    if (!this.authService.isAuthenticated) {
      console.log("User is not authenticated. Going back to login page.");
      this.router.navigate(['/login']);
    }
    else {
      console.log("User is authenticated as admin. Staying in admin page.");
    }
  }

  // Method to handle test calling an endpoint from backend.
  onClick(): void {
    const apiUrl = apiConfig.backend_api_url + 'hello';
    console.log('Calling API:', apiUrl);
    this.http.get(apiUrl).subscribe({
      next: (response) => {
        console.log('Response:', response);
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }
}
