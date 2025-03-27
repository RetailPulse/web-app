import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputText } from "primeng/inputtext";
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { RadioButtonModule } from 'primeng/radiobutton';
import Fuse from 'fuse.js';

import { BusinessEntity, BusinessEntityType } from './business-entity.model';
import { BusinessEntityService } from './business-entity.service';

@Component({
  selector: 'app-business-entity-management',
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
  templateUrl: './business-entity-management.component.html',
  styleUrl: './business-entity-management.component.css'
})
export class BusinessEntityManagementComponent {

  private businessEntityService = inject(BusinessEntityService);
  private formBuilder = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);

  businessEntities = signal<BusinessEntity[]>([]);
  filteredBusinessEntities = signal<BusinessEntity[]>([]);
  isLoading = signal(true);
  error_msg = signal<string | null>(null);
  success_msg = signal<string | null>(null);

  newBusinessEntityForm: FormGroup;
  newDialog_visible = signal(false);
  newDialog_error_msg = signal<string | null>(null);

  selectedBusinessEntity = signal<BusinessEntity | null>(null);
  editBusinessEntityForm: FormGroup;
  editDialog_visible = signal(false);
  editDialog_error_msg = signal<string | null>(null);

  entityTypes = BusinessEntityType;

  constructor() {
    // Populate the users list
    this.businessEntityService.getBusinessEntities().subscribe({
      next: (data: BusinessEntity[]) => {
        console.log('Business Entities:', data);
        this.businessEntities.set(data.filter(businessEntity => businessEntity.active == true));
        this.filteredBusinessEntities.set(data.filter(businessEntity => businessEntity.active == true));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error_msg.set('Failed to load business entities. Please try again later.');
        this.isLoading.set(false);
        console.error('Error fetching business entities:', err);
      }
    });

    // Initialize the New User Form
    this.newBusinessEntityForm = this.formBuilder.group({      
      ctlName: ['', Validators.required],
      ctlLocation: ['', [Validators.required]],      
      ctlType: ['', Validators.required],
      ctlExternal: ['', Validators.required],
    });

    // Initialize the Edit User Form
    this.editBusinessEntityForm = this.formBuilder.group({
      ctlId: ['', Validators.required],
      ctlName: ['', Validators.required],
      ctlLocation: ['', [Validators.required]],      
      ctlType: ['', Validators.required],
      ctlExternal: ['', Validators.required],
    });

    this.editBusinessEntityForm.get('ctlId')?.disable();
  }

  resetMessages(): void {
    this.error_msg.set(null);
    this.success_msg.set(null);
    this.newDialog_error_msg.set(null);
  }

  filterBusinessEntity(event: Event): void {
    console.log('Filtering Business Entities');
    this.resetMessages();
    
    if (!event.target) {
      return;
    }

    const inputElement = event.target as HTMLInputElement;
    const term = inputElement.value.trim().toLowerCase();

    if (!term || term === '') {
      this.filteredBusinessEntities.set(this.businessEntities());
      return;
    }
    
    let fuse = new Fuse(this.businessEntities(), {
      keys: ['name', 'location', 'type'],
      threshold: 0.3
    })

    const results = fuse.search(term);
    this.filteredBusinessEntities.set(results.map(result => result.item));
  }
  
  isFieldInvalid(currForm: FormGroup, fieldName: string): boolean | undefined{
    const control = currForm.get(fieldName);

    const blnValid = control?.invalid && (control?.touched || control?.dirty);

    if (blnValid === undefined){
      return false;
    }

    return blnValid;
  }

  showNewBusinessEnityDialog(): void {
    this.resetMessages();
    console.log('Form State:', this.newBusinessEntityForm);
    this.newBusinessEntityForm.reset();
    this.newDialog_visible.set(true);
  }
 
  confirmNewBusinessEntity(): void {
    this.resetMessages();
    this.confirmationService.confirm({
      message: 'Are you sure you want to register new business entity: <strong>' + this.newBusinessEntityForm.value.ctlName + '</strong>?',
      header: 'Confirm Registration',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // User confirmed, proceed with deletion
        this.registerNewBusinessEntity();
      },
      reject: () => {
        // User rejected, do nothing
        this.error_msg.set('Deletion canceled.');
        console.log('Deletion canceled.');
      }
    });
  }

  registerNewBusinessEntity(): void {
    this.resetMessages();

    if (this.newBusinessEntityForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      this.newBusinessEntityForm.markAllAsTouched();
      this.newDialog_error_msg.set('Please fill in all required fields');
      console.error('Form is invalid:', this.newBusinessEntityForm.errors);
      return;
    }

    const newBusinessEntity: BusinessEntity = {
      id: -1,
      name: this.newBusinessEntityForm.value.ctlName,
      location: this.newBusinessEntityForm.value.ctlLocation,
      external: this.newBusinessEntityForm.value.ctlExternal=== 'true', 
      type: this.newBusinessEntityForm.value.ctlType,
      active: true,
    };

    this.businessEntityService.createBusinessEntity(newBusinessEntity).subscribe({
      next: (data: BusinessEntity) => {
        this.success_msg.set('Business Entity registered successfully.');
        this.businessEntities.set([...this.businessEntities(), data]);
        this.filteredBusinessEntities.set([...this.filteredBusinessEntities(), data]);
        this.newDialog_visible.set(false);
      },
      error: (err) => {
        this.newDialog_error_msg.set('Failed to register new Business Entity. Please try again later.');
        console.error('Error registering new Business Entity:', err);
      }
    });
  }

  confirmDeleteBusinessEntity(deletedBusinessEntity: BusinessEntity){
    this.resetMessages();
    this.confirmationService.confirm({
      message: 'Are you sure to delete business entity: <strong>' + deletedBusinessEntity.name + '</strong>?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // User confirmed, proceed with deletion
        this.deleteBusinessEntity(deletedBusinessEntity);
      },
      reject: () => {
        // User rejected, do nothing
        this.error_msg.set('Deletion canceled.');
        console.log('Deletion canceled.');
      }
    });
  }

  deleteBusinessEntity(deletedBusinessEntity: BusinessEntity): void {
    this.resetMessages();
    console.log(`Deleting Business Entity ${deletedBusinessEntity.name}`);
    this.businessEntityService.deleteBusinessEntity(deletedBusinessEntity.id).subscribe({
      next: () => {
        console.log('Business Entity deleted:', deletedBusinessEntity.name);
        this.businessEntities.update((currentBusinessEntities) =>
          currentBusinessEntities.filter((businessEntity) => businessEntity.id !== deletedBusinessEntity.id)
        );
        this.filteredBusinessEntities.set([...this.businessEntities()]);        
        this.newDialog_visible.set(false);
        this.success_msg.set('Business Entity ' + deletedBusinessEntity.name + ' was successfully deleted');
      },
      error: (err) => {
        this.newDialog_error_msg.set(err);
        console.error(err);
      },
    });
  }

  showEditBusinessEntityForm(businessEntity: BusinessEntity): void {
    this.selectedBusinessEntity.set(businessEntity);
    this.resetMessages();
    this.editBusinessEntityForm.reset();
    this.editDialog_visible.set(true);

    // Populate the form with the user's data
    this.editBusinessEntityForm.patchValue({
      ctlId: businessEntity.id,
      ctlName: businessEntity.name,
      ctlLocation: businessEntity.location,
      ctlType: businessEntity.type,
      ctlExternal: businessEntity.external,
    });
  }

  confirmEditBusinessEntity(): void {
    this.resetMessages();
    this.confirmationService.confirm({
      message: 'Are you sure you want to edit business entity: <strong>' + this.editBusinessEntityForm.value.ctlName + '</strong>?',
      header: 'Confirm Edit',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // User confirmed, proceed with edit
        this.editBusinessEntity();
      },
      reject: () => {
        // User rejected, do nothing
        this.error_msg.set('Edit canceled.');
        console.log('Edit canceled.');
      }
    });
  }

  editBusinessEntity(): void {
    this.resetMessages();
    console.log('Editing Business Entity');

    const editedBusinessEntity: BusinessEntity = {
      id: this.selectedBusinessEntity()?.id || 0,
      name: this.editBusinessEntityForm.value.ctlName,
      location: this.editBusinessEntityForm.value.ctlLocation,      
      type: this.editBusinessEntityForm.value.ctlType,
      external: this.newBusinessEntityForm.value.ctlExternal=== 'true', 
      active: true
    };

    this.businessEntityService.editUser(editedBusinessEntity).subscribe({
      next: (updatedBusinessEntity: BusinessEntity) => {
        console.log('Business Enitity edited:', updatedBusinessEntity);
        this.businessEntities.update((currentBusinessEntity) =>
          currentBusinessEntity.map((businessEntity) =>
            businessEntity.id === updatedBusinessEntity.id ? updatedBusinessEntity : businessEntity
          )
        );
        this.filteredBusinessEntities.set([...this.businessEntities()]);        
        this.editDialog_visible.set(false);
        this.success_msg.set('Business Entity ' + updatedBusinessEntity.name + ' was successfully edited');
      },
      
      error: (err) => {
        this.editDialog_error_msg.set(err);
        console.error(err);
      },
    });
  }
}
