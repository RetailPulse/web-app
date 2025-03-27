import { Component, signal, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputText } from "primeng/inputtext";
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { RadioButtonModule } from 'primeng/radiobutton';
import Fuse from 'fuse.js';

import {User, UserRoles} from '../models/user.model';
import {UserService} from '../services/user.service';


@Component({
  selector: 'app-user-management',
  imports: [
    ReactiveFormsModule,
    ConfirmDialogModule,
    TableModule,
    TagModule,
    FormsModule,
    InputText,
    ButtonModule,
    DialogModule,
    SelectModule,
    RadioButtonModule,
    CommonModule
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})

export class UserManagementComponent {

  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  isLoading = signal(true);
  error_msg = signal<string | null>(null);
  success_msg = signal<string | null>(null);

  newUserForm: FormGroup;
  newDialog_visible = signal(false);
  newDialog_error_msg = signal<string | null>(null);

  selectedUser = signal<User | null>(null);
  editUserForm: FormGroup;
  editDialog_visible = signal(false);
  editDialog_error_msg = signal<string | null>(null);

  userRoles = UserRoles;

  constructor() {

    // Populate the users list
    this.userService.getUsers().subscribe({
      next: (data: User[]) => {
        this.users.set(data);
        this.filteredUsers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error_msg.set('Failed to load users. Please try again later.');
        this.isLoading.set(false);
        console.error('Error fetching users:', err);
      }
    });

    // Initialize the New User Form
    this.newUserForm = this.formBuilder.group({
      ctlUsername: ['', Validators.required],
      ctlName: ['', Validators.required],
      ctlEmail: ['', [Validators.required, Validators.email]],
      ctlRole: ['', Validators.required],
    });

    // Initialize the Edit User Form
    this.editUserForm = this.formBuilder.group({
      ctlUsername: ['', Validators.required],
      ctlName: ['', Validators.required],
      ctlEmail: ['', [Validators.required, Validators.email]],
      ctlRole: ['', Validators.required],
      ctlStatus: ['', Validators.required],
    });

    this.editUserForm.get('ctlUsername')?.disable();
  }

  resetMessages(): void {
    this.error_msg.set(null);
    this.success_msg.set(null);
    this.newDialog_error_msg.set(null);
  }

  filterUsers(event: Event): void {
    console.log('Filtering users');
    this.resetMessages();
    
    if (!event.target) {
      return;
    }

    const inputElement = event.target as HTMLInputElement;
    const term = inputElement.value.trim().toLowerCase();

    if (!term || term === '') {
      this.filteredUsers.set(this.users());
      return;
    }
    
    let fuse = new Fuse(this.users(), {
      keys: ['name', 'username', 'email'],
      threshold: 0.3
    })

    const results = fuse.search(term);
    this.filteredUsers.set(results.map(result => result.item));
  }

  isFieldInvalid(currForm: FormGroup, fieldName: string): boolean | undefined{
    const control = currForm.get(fieldName);

    const blnValid = control?.invalid && (control?.touched || control?.dirty);

    if (blnValid === undefined){
      return false;
    }

    return blnValid;
  }

  showNewUserDialog(): void {
    this.resetMessages();
    this.newUserForm.reset();
    this.newDialog_visible.set(true);
  }

  confirmRegisterUser(): void {
    this.resetMessages();
    this.confirmationService.confirm({
      message: 'Are you sure you want to register new user: <strong>' + this.newUserForm.value.ctlUsername + '</strong>?',
      header: 'Confirm Registration',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // User confirmed, proceed with deletion
        this.registerNewUser();
      },
      reject: () => {
        // User rejected, do nothing
        this.error_msg.set('Deletion canceled.');
        console.log('Deletion canceled.');
      }
    });
  }

  registerNewUser(): void {
    this.resetMessages();

    if (this.newUserForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      this.newUserForm.markAllAsTouched();
      this.newDialog_error_msg.set('Please fill in all required fields');
      console.error('Form is invalid:', this.newUserForm.errors);
      return;
    }

    const newUser: User = {
      id: 0,
      username: this.newUserForm.value.ctlUsername,
      password: 'password1', // Default password
      email: this.newUserForm.value.ctlEmail,
      name: this.newUserForm.value.ctlName,
      roles: [this.newUserForm.value.ctlRole],
      isEnabled: true
    };
    
    console.log('Saving new user:', newUser);    
    this.userService.createUser(newUser).subscribe({
      next: (createdUser: User) => {
        console.log('User created:', createdUser);
        this.users.set([...this.users(), createdUser]);
        this.filteredUsers.set([...this.users()]);        
        this.newDialog_visible.set(false);
        this.success_msg.set('User ' + createdUser.username + ' was successfully registered');
      },
      error: (err) => {
        this.newDialog_error_msg.set(err);
        console.error(err);
      },
    });
  }

  // confirmResetPassword(selectedUser: User): void {
  //   this.resetMessages();
  //   this.confirmationService.confirm({
  //     message: 'Are you sure to reset password for user: <strong>' + selectedUser.username + '</strong>?',
  //     header: 'Confirm Reset Password',
  //     icon: 'pi pi-exclamation-triangle',
  //     accept: () => {
  //       // User confirmed, proceed with deletion
  //       console.log('Resetting password for user:', selectedUser.username);
  //     },
  //     reject: () => {
  //       // User rejected, do nothing
  //       this.error_msg.set('Reset Password canceled.');
  //       console.log('Reset Password canceled.');
  //     }
  //   });
  // }

  // resetPassword(selectedUser: User): void {
  //   this.resetMessages();   
  // }

  confirmDeleteUser(deletedUser: User): void {
    this.resetMessages();
    this.confirmationService.confirm({
      message: 'Are you sure to delete user: <strong>' + deletedUser.username + '</strong>?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // User confirmed, proceed with deletion
        this.deleteUser(deletedUser);
      },
      reject: () => {
        // User rejected, do nothing
        this.error_msg.set('Deletion canceled.');
        console.log('Deletion canceled.');
      }
    });
  }

  deleteUser(deletedUser: User): void {
    this.resetMessages();
    console.log(`Deleting user ${deletedUser.name}`);
    this.userService.deleteUser(deletedUser.id).subscribe({
      next: () => {
        console.log('User deleted:', deletedUser.username);
        this.users.update((currentUsers) =>
          currentUsers.filter((user) => user.id !== deletedUser.id)
        );
        this.filteredUsers.set([...this.users()]);        
        this.newDialog_visible.set(false);
        this.success_msg.set('User ' + deletedUser.username + ' was successfully deleted');
      },
      error: (err) => {
        this.newDialog_error_msg.set(err);
        console.error(err);
      },
    });
  }

  showEditUserForm(user: User): void {
    this.selectedUser.set(user);
    this.resetMessages();
    this.editUserForm.reset();
    this.editDialog_visible.set(true);

    // Populate the form with the user's data
    this.editUserForm.patchValue({
      ctlUsername: user.username,
      ctlName: user.name,
      ctlEmail: user.email,
      ctlRole: user.roles[0] || '',
      ctlStatus: user.isEnabled ? 'true' : 'false',
    });
  }

  confirmEditUser(): void {
    this.resetMessages();
    this.confirmationService.confirm({
      message: 'Are you sure you want to edit user: <strong>' + this.editUserForm.value.ctlUsername + '</strong>?',
      header: 'Confirm Edit',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // User confirmed, proceed with edit
        this.editUser();
      },
      reject: () => {
        // User rejected, do nothing
        this.error_msg.set('Edit canceled.');
        console.log('Edit canceled.');
      }
    });
  }

  editUser(): void {
    this.resetMessages();
    console.log('Editing user');
    console.log('User State:', this.editUserForm.value.ctlStatus === 'true');

    const editedUser: User = {
      id: this.selectedUser()?.id || 0,
      username: this.editUserForm.value.ctlUsername,
      password: 'dummy', // not in used
      email: this.editUserForm.value.ctlEmail,
      name: this.editUserForm.value.ctlName,
      roles: [this.editUserForm.value.ctlRole],
      isEnabled: this.editUserForm.value.ctlStatus === 'true'
    };

    this.userService.editUser(editedUser).subscribe({
      next: (updatedUser: User) => {
        console.log('User edited:', updatedUser);
        this.users.update((currentUsers) =>
          currentUsers.map((user) =>
            user.id === updatedUser.id ? updatedUser : user
          )
        );
        this.filteredUsers.set([...this.users()]);        
        this.editDialog_visible.set(false);
        this.success_msg.set('User ' + updatedUser.username + ' was successfully edited');
      },
      error: (err) => {
        this.editDialog_error_msg.set(err);
        console.error(err);
      },
    });
  }
}
