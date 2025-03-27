import { Component, signal, inject } from '@angular/core';

import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';


// Custom validator to check for at least one number in the password
function containsNumber(control: AbstractControl): { [key: string]: boolean } | null {
  const hasNumber = /\d/.test(control.value); // Regex to check for at least one digit
  return hasNumber ? null : { noNumber: true }; // Return error if no number is found
}

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ConfirmDialogModule,
    CardModule,
    PasswordModule,
    DialogModule,    
    ButtonModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);

  myProfile = signal<User| null>(null);

  isLoading = signal(true);
  error_msg = signal<string | null>(null);
  success_msg = signal<string | null>(null);

  changePasswordForm: FormGroup;
  changePassword_visible = signal(false);
  changePassword_error_msg = signal<string | null>(null);

  constructor() {    
    // Fetch the user profile
    const userName: string = this.authService.getUsername();
    this.userService.getUserByUsername(userName).subscribe({
      next: (data: User) => {
        this.myProfile.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error_msg.set('Failed to load users. Please try again later.');
        this.isLoading.set(false);
        console.error('Error fetching users:', err);
      }
    });

    // Initialize the Change Password Form
    this.changePasswordForm = this.formBuilder.group({
      ctlOldPassword: ['', Validators.required],
      ctlNewPassword: ['', 
        [
          Validators.required, 
          Validators.minLength(8),
          containsNumber // Custom validator to ensure at least one number
        ]
      ],
    });
  }

  resetMessages(): void {
    this.error_msg.set(null);
    this.success_msg.set(null);
    this.changePassword_error_msg.set(null);
  }

  getFirstRole(): string {
    const profile = this.myProfile();

    return profile?.roles?.[0] ?? 'No Role';
  }

  onChangePassword() {
    this.resetMessages();
    this.changePasswordForm.reset();
    this.changePassword_visible.set(true);
  }

  confirmChangePassword(): void {
    this.resetMessages();
    this.confirmationService.confirm({
      message: 'Are you sure you want to <strong>change</strong> your password?',
      header: 'Confirm Change Password',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // User confirmed, proceed with deletion
        this.changePassword();
      },
      reject: () => {
        // User rejected, do nothing
        this.error_msg.set('Change Password Canceled.');
        console.log('Deletion canceled.');
      }
    });
  }

  changePassword(): void {
    this.resetMessages();    
    const oldPassword: string = this.changePasswordForm.get('ctlOldPassword')?.value;
    const newPassword: string = this.changePasswordForm.get('ctlNewPassword')?.value;

    const userID = this.myProfile()?.id;

    if (userID) {
      this.userService.changePassword(userID, oldPassword, newPassword).subscribe({
        next: (data: any) => {
          this.success_msg.set('Password changed successfully.');
          this.changePassword_visible.set(false);
        },
        error: (err) => {
          this.changePassword_error_msg.set('Failed to change password. Please try again.');
          console.error('Error changing password:', err);
        }
      });
    }
    else{
      this.changePassword_error_msg.set('Failed to change password. User Id is null.');
    }
  }
}
