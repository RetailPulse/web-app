import {MessageModule} from 'primeng/message';

import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';


@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'], // Corrected from styleUrl to styleUrls
  imports: [MessageModule]
})
export class LoginFormComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.initializeAuth().then(() => {
      if (this.authService.isAuthenticated) {
        console.log("User is already authenticated.");
        let userRoles = this.authService.getUserRole();
        console.log("User roles: " + userRoles);
        if (userRoles.includes("ADMIN") || userRoles.includes("SUPER")) {
          console.log("Going to admin page");
          this.router.navigate(['/admin']);
        } else if (userRoles.includes("OPERATOR")) {
          this.router.navigate(['/operator']);
        }
      }
    });    
  }

  // Method to handle login action
  onLogin(): void {
    // Perform login logic here (e.g., authentication)
    console.log("Logging in...");
    this.authService.login();
  }

}
