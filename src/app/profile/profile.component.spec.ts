import { ProfileComponent } from './profile.component';
import { AuthFacade } from '../services/auth.facade';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfirmationService } from 'primeng/api';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockAuthService: jasmine.SpyObj<AuthFacade>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'pw',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['ADMIN'],
    isEnabled: true
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthFacade', ['getUsername']);
    mockUserService = jasmine.createSpyObj('UserService', ['getUserByUsername', 'changePassword']);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    mockAuthService.getUsername.and.returnValue('testuser');
    mockUserService.getUserByUsername.and.returnValue(of(mockUser));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch user profile on construction', () => {
    expect(mockUserService.getUserByUsername).toHaveBeenCalledWith('testuser');
    expect(component.myProfile()).toEqual(mockUser);
    expect(component.isLoading()).toBeFalse();
  });

  it('should set error_msg if getUserByUsername fails', fakeAsync(() => {
    mockUserService.getUserByUsername.and.returnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    tick();
    expect(component.error_msg()).toBe('Failed to load users. Please try again later.');
    expect(component.isLoading()).toBeFalse();
  }));

  it('should reset all messages', () => {
    component.error_msg.set('err');
    component.success_msg.set('succ');
    component.changePassword_error_msg.set('pwderr');
    component.resetMessages();
    expect(component.error_msg()).toBeNull();
    expect(component.success_msg()).toBeNull();
    expect(component.changePassword_error_msg()).toBeNull();
  });

  it('should get first role if present', () => {
    component.myProfile.set({ ...mockUser, roles: ['ADMIN', 'USER'] });
    expect(component.getFirstRole()).toBe('ADMIN');
  });

  it('should show change password dialog and reset messages', () => {
    spyOn(component, 'resetMessages');
    spyOn(component.changePasswordForm, 'reset');
    component.onChangePassword();
    expect(component.resetMessages).toHaveBeenCalled();
    expect(component.changePasswordForm.reset).toHaveBeenCalled();
    expect(component.changePassword_visible()).toBeTrue();
  });

  it('should call confirmationService.confirm on confirmChangePassword', () => {
    spyOn(component, 'resetMessages');
    component.confirmChangePassword();
    expect(component.resetMessages).toHaveBeenCalled();
    expect(mockConfirmationService.confirm).toHaveBeenCalled();
  });

  it('should call changePassword on confirmation accept', () => {
    spyOn(component, 'changePassword');
    mockConfirmationService.confirm.and.callFake((options: any) => options.accept());
    component.confirmChangePassword();
    expect(component.changePassword).toHaveBeenCalled();
  });

  it('should set error_msg on confirmation reject', () => {
    mockConfirmationService.confirm.and.callFake((options: any) => options.reject());
    spyOn(console, 'log');
    component.confirmChangePassword();
    expect(component.error_msg()).toBe('Change Password Canceled.');
    expect(console.log).toHaveBeenCalledWith('Deletion canceled.');
  });

  it('should change password and handle success', fakeAsync(() => {
    component.myProfile.set(mockUser);
    component.changePasswordForm.get('ctlOldPassword')?.setValue('old');
    component.changePasswordForm.get('ctlNewPassword')?.setValue('newPassword1');
    // Add this line to mock the return value:
    mockUserService.changePassword.and.returnValue(of(void 0));
    component.changePassword();
    tick();
    expect(component.success_msg()).toBe('Password changed successfully.');
    expect(component.changePassword_visible()).toBeFalse();
  }));

  it('should change password and handle error', fakeAsync(() => {
    component.myProfile.set(mockUser);
    component.changePasswordForm.get('ctlOldPassword')?.setValue('old');
    component.changePasswordForm.get('ctlNewPassword')?.setValue('newPassword1');
    mockUserService.changePassword.and.returnValue(throwError(() => new Error('fail')));
    spyOn(console, 'error');
    component.changePassword();
    tick();
    expect(component.changePassword_error_msg()).toBe('Failed to change password. Please try again.');
    expect(console.error).toHaveBeenCalled();
  }));

  it('should set error if user id is null in changePassword', () => {
    component.myProfile.set(null);
    component.changePasswordForm.get('ctlOldPassword')?.setValue('old');
    component.changePasswordForm.get('ctlNewPassword')?.setValue('newPassword1');
    component.changePassword();
    expect(component.changePassword_error_msg()).toBe('Failed to change password. User Id is null.');
  });

  // Edge: changePasswordForm with missing controls
  it('should not throw if changePasswordForm controls are missing', () => {
    component.changePasswordForm.removeControl('ctlOldPassword');
    component.changePasswordForm.removeControl('ctlNewPassword');
    expect(() => component.changePassword()).not.toThrow();
  });
});