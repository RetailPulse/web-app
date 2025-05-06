import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfirmationService } from 'primeng/api';
import { createMockAuthService } from '../mock/auth.service.mock';
import { AuthFacade } from '../services/auth.facade';

import { BusinessEntityManagementComponent } from './business-entity-management.component';
import { BusinessEntityService } from './business-entity.service';
import { of, throwError } from 'rxjs';
import { BusinessEntity } from './business-entity.model';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { Subject } from 'rxjs';

describe('BusinessEntityManagementComponent', () => {
  let component: BusinessEntityManagementComponent;
  let fixture: ComponentFixture<BusinessEntityManagementComponent>;
  let serviceSpy: jasmine.SpyObj<BusinessEntityService>;
  let confirmSpy: jasmine.SpyObj<ConfirmationService>;
  let requireConfirmation$: Subject<any>;

  const mockAuth = createMockAuthService();
  const mockEntities: BusinessEntity[] = [
    { id: 1, name: 'Entity One', location: 'Loc1', type: 'Shop', active: true, external: false },
    { id: 2, name: 'Entity Two', location: 'Loc2', type: 'Supplier', active: true, external: true }
  ];

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('BusinessEntityService', ['getBusinessEntities', 'createBusinessEntity', 'editUser', 'deleteBusinessEntity']);
    
    requireConfirmation$ = new Subject<any>();
    confirmSpy = jasmine.createSpyObj('ConfirmationService', ['confirm'], {
      requireConfirmation$: requireConfirmation$.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [
        BusinessEntityManagementComponent,
        NoopAnimationsModule,
        ConfirmDialogModule,
      ],
      providers: [
        provideHttpClientTesting(),
        { provide: BusinessEntityService, useValue: serviceSpy },
        { provide: ConfirmationService, useValue: confirmSpy },
        { provide: AuthFacade, useValue: mockAuth }
      ]
    }).compileComponents();

    // Default stub so constructor subscription always has an observable
    serviceSpy.getBusinessEntities.and.returnValue(of(mockEntities));
    fixture = TestBed.createComponent(BusinessEntityManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('loads entities on init success', fakeAsync(() => {
      // Stub before change detection
      serviceSpy.getBusinessEntities.and.returnValue(of(mockEntities));
      fixture.detectChanges();
      tick();

      expect(component.isLoading()).toBeFalse();
      expect(component.businessEntities()).toEqual(mockEntities);
      expect(component.filteredBusinessEntities()).toEqual(mockEntities);
    }));
    
    it('handles init error', fakeAsync(() => {
      serviceSpy.getBusinessEntities.and.returnValue(throwError(() => new Error('fail')));

      const localFixture = TestBed.createComponent(BusinessEntityManagementComponent);
      const localComp = localFixture.componentInstance;
      localFixture.detectChanges();
      tick();

      expect(localComp.isLoading()).toBeFalse();
      expect(localComp.error_msg()).toContain('Failed to load');
    }));
  });

  describe('Filtering', () => {
    beforeEach(fakeAsync(() => {
      serviceSpy.getBusinessEntities.and.returnValue(of(mockEntities));
      fixture.detectChanges();
      tick();
    }));

    it('filters by name', () => {
      const event = { target: { value: 'one' } } as any;
      component.filterBusinessEntity(event);
      expect(component.filteredBusinessEntities().length).toBe(1);
      expect(component.filteredBusinessEntities()[0].name).toBe('Entity One');
    });

    it('resets filter with empty term', () => {
      const event = { target: { value: '' } } as any;
      component.filterBusinessEntity(event);
      expect(component.filteredBusinessEntities()).toEqual(mockEntities);
    });

    it('handles missing event target gracefully', () => {
      expect(() => component.filterBusinessEntity({} as any)).not.toThrow();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('new form invalid when empty', () => {
      component.newBusinessEntityForm.setValue({ ctlName: '', ctlLocation: '', ctlType: '', ctlExternal: 'false' });
      component.newBusinessEntityForm.markAllAsTouched();
      expect(component.newBusinessEntityForm.invalid).toBeTrue();
      expect(component.isFieldInvalid(component.newBusinessEntityForm, 'ctlName')).toBeTrue();
    });

    it('new form valid when filled', () => {
      component.newBusinessEntityForm.setValue({ ctlName: 'A', ctlLocation: 'B', ctlType: 'Shop', ctlExternal: 'true' });
      expect(component.newBusinessEntityForm.valid).toBeTrue();
    });
  });

  describe('Dialogs and CRUD', () => {
    beforeEach(fakeAsync(() => {
      serviceSpy.getBusinessEntities.and.returnValue(of(mockEntities));
      fixture.detectChanges();
      tick();
    }));

    it('opens new dialog', () => {
      component.showNewBusinessEnityDialog();
      expect(component.newDialog_visible()).toBeTrue();
      expect(component.newBusinessEntityForm.pristine).toBeTrue();
    });

    it('creates entity on confirm', fakeAsync(() => {
      const newEntity: BusinessEntity = { id: 3, name: 'New', location: 'L', type: 'Shop', active: true, external: false };
      serviceSpy.createBusinessEntity.and.returnValue(of(newEntity));

      component.newBusinessEntityForm.setValue({ ctlName: 'New', ctlLocation: 'L', ctlType: 'Shop', ctlExternal: 'false' });
      (confirmSpy.confirm as jasmine.Spy).and.callFake(opts => opts.accept());

      component.confirmNewBusinessEntity();
      tick();

      expect(serviceSpy.createBusinessEntity).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'New', location: 'L' }));
      expect(component.businessEntities().length).toBe(3);
      expect(component.success_msg()).toContain('registered');
    }));

    it('handles create error', fakeAsync(() => {
      serviceSpy.createBusinessEntity.and.returnValue(throwError(() => new Error('err')));
      component.newBusinessEntityForm.setValue({ ctlName: 'New', ctlLocation: 'L', ctlType: 'Shop', ctlExternal: 'false' });
      (confirmSpy.confirm as jasmine.Spy).and.callFake(opts => opts.accept());

      component.confirmNewBusinessEntity();
      tick();
      expect(component.newDialog_error_msg()).toContain('Failed to register');
    }));

    it('edits entity', fakeAsync(() => {
      const updated = { ...mockEntities[0], name: 'Updated' };
      serviceSpy.editUser.and.returnValue(of(updated));

      component.showEditBusinessEntityForm(mockEntities[0]);
      component.editBusinessEntityForm.patchValue({ ctlName: 'Updated' });
      (confirmSpy.confirm as jasmine.Spy).and.callFake(opts => opts.accept());

      component.confirmEditBusinessEntity();
      tick();
      expect(serviceSpy.editUser).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Updated' }));
      expect(component.businessEntities()[0].name).toBe('Updated');
      expect(component.success_msg()).toContain('edited');
    }));

    it('deletes entity', fakeAsync(() => {
      serviceSpy.deleteBusinessEntity.and.returnValue(of(undefined));
      (confirmSpy.confirm as jasmine.Spy).and.callFake(opts => opts.accept());

      component.confirmDeleteBusinessEntity(mockEntities[0]);
      tick();
      expect(serviceSpy.deleteBusinessEntity).toHaveBeenCalledWith(1);
      expect(component.businessEntities().length).toBe(1);
      expect(component.success_msg()).toContain('deleted');
    }));

    it('handles delete error', fakeAsync(() => {
      serviceSpy.deleteBusinessEntity.and.returnValue(throwError(() => new Error('delErr')));
      (confirmSpy.confirm as jasmine.Spy).and.callFake(opts => opts.accept());

      component.confirmDeleteBusinessEntity(mockEntities[0]);
      tick();
    }));
  });

  describe('Edge and Error Cases', () => {
    it('should set error_msg when confirmNewBusinessEntity is rejected', () => {
      component.newBusinessEntityForm.setValue({ ctlName: 'X', ctlLocation: 'Y', ctlType: 'Shop', ctlExternal: 'false' });
      (confirmSpy.confirm as jasmine.Spy).and.callFake(opts => opts.reject());
      component.confirmNewBusinessEntity();
      expect(component.error_msg()).toContain('Save Business Entity canceled.');
    });

    it('should set error_msg when confirmEditBusinessEntity is rejected', () => {
      component.editBusinessEntityForm.setValue({ ctlId: '1', ctlName: 'X', ctlLocation: 'Y', ctlType: 'Shop', ctlExternal: 'false' });
      (confirmSpy.confirm as jasmine.Spy).and.callFake(opts => opts.reject());
      component.confirmEditBusinessEntity();
      expect(component.error_msg()).toContain('Edit canceled.');
    });

    it('should set error_msg when confirmDeleteBusinessEntity is rejected', () => {
      (confirmSpy.confirm as jasmine.Spy).and.callFake(opts => opts.reject());
      component.confirmDeleteBusinessEntity(mockEntities[0]);
      expect(component.error_msg()).toContain('Deletion canceled.');
    });

    it('should handle error in deleteBusinessEntity and set newDialog_error_msg', fakeAsync(() => {
      serviceSpy.deleteBusinessEntity.and.returnValue(throwError(() => 'delete error'));
      component.deleteBusinessEntity(mockEntities[0]);
      tick();
      expect(component.newDialog_error_msg()).toBe('delete error');
    }));

    it('should handle error in editBusinessEntity and set editDialog_error_msg', fakeAsync(() => {
      serviceSpy.editUser.and.returnValue(throwError(() => 'edit error'));
      component.selectedBusinessEntity.set(mockEntities[0]);
      component.editBusinessEntityForm.setValue({
        ctlId: '1',
        ctlName: 'Updated',
        ctlLocation: 'Loc1',
        ctlType: 'Shop',
        ctlExternal: 'false'
      });
      component.editBusinessEntity();
      tick();
      expect(component.editDialog_error_msg()).toBe('edit error');
    }));

    it('should handle error in registerNewBusinessEntity and set newDialog_error_msg', fakeAsync(() => {
      serviceSpy.createBusinessEntity.and.returnValue(throwError(() => 'create error'));
      component.newBusinessEntityForm.setValue({
        ctlName: 'New',
        ctlLocation: 'Loc',
        ctlType: 'Shop',
        ctlExternal: 'false'
      });
      component.registerNewBusinessEntity();
      tick();
      expect(component.newDialog_error_msg()).toBe('Failed to register new Business Entity. Please try again later.');
    }));

    it('should not throw if showEditBusinessEntityForm is called with null', () => {
      expect(() => component.showEditBusinessEntityForm(null as any)).not.toThrow();
    });

    it('should not throw if editBusinessEntity is called with no selected entity', () => {
      component.selectedBusinessEntity.set(null);
      expect(() => component.editBusinessEntity()).not.toThrow();
    });

    it('should reset messages', () => {
      component.error_msg.set('err');
      component.success_msg.set('ok');
      component.newDialog_error_msg.set('err2');
      component.editDialog_error_msg.set('err3');
      component.resetMessages();
      expect(component.error_msg()).toBeNull();
      expect(component.success_msg()).toBeNull();
      expect(component.newDialog_error_msg()).toBeNull();
      expect(component.editDialog_error_msg()).toBeNull();
    });

    it('should return false for isFieldInvalid if control does not exist', () => {
      expect(component.isFieldInvalid(component.newBusinessEntityForm, 'notAField')).toBeFalse();
    });

    it('should return true for isFieldInvalid if control is invalid and touched', () => {
      const form = component.newBusinessEntityForm;
      const control = form.get('ctlName');
      control?.markAsTouched();
      control?.setValue('');
      expect(component.isFieldInvalid(form, 'ctlName')).toBeTrue();
    });
  });
});
