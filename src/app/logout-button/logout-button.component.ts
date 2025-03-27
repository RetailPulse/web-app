import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'logout-button',
  imports: [],
  templateUrl: './logout-button.component.html',
  styleUrl: './logout-button.component.css'
})
export class LogoutButtonComponent {

  constructor(private router:Router, private authService: AuthService) { }

  // Method to handle login action
  onLogout(): void {
    // Perform login logic here (e.g., authentication)
    console.log("Logging out...");

    if (this.authService.isAuthenticated) {
      this.authService.logout();
    }

    this.router.navigate(['/login']);
  }
}
