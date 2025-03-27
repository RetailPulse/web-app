import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InventoryModalComponent } from './inventory-modal.component';
import { ProductService } from '../product-management/product.service';
import { BusinessEntityService } from '../business-entity-management/business-entity.service';
import { InventoryModalService } from './inventory-modal.service';

describe('InventoryModalComponent', () => {
  let component: InventoryModalComponent;
  let fixture: ComponentFixture<InventoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InventoryModalComponent],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { isModalOpen: true } },
        ProductService,
        BusinessEntityService,
        InventoryModalService
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.importForm).toBeDefined();
    expect(component.importForm.controls['sourceBusinessEntity']).toBeDefined();
    expect(component.importForm.controls['destinationBusinessEntity']).toBeDefined();
  });

  it('should load all components', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('mat-form-field')).toBeTruthy();
    expect(compiled.querySelector('mat-select')).toBeTruthy();
    expect(compiled.querySelector('mat-checkbox')).toBeTruthy();
    expect(compiled.querySelector('mat-table')).toBeTruthy();
  });
});
