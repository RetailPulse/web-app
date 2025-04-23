import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { InventoryModalComponent } from './inventory-modal.component';
import { ProductService } from '../product-management/product.service';
import { BusinessEntityService } from '../business-entity-management/business-entity.service';
import { InventoryModalService } from './inventory-modal.service';
import { of } from 'rxjs';

describe('InventoryModalComponent', () => {
  let component: InventoryModalComponent;
  let fixture: ComponentFixture<InventoryModalComponent>;
  let mockBusinessEntityService: jasmine.SpyObj<BusinessEntityService>;
  let mockInventoryModalService: jasmine.SpyObj<InventoryModalService>;

  beforeEach(async () => {
    mockBusinessEntityService = jasmine.createSpyObj('BusinessEntityService', ['getBusinessEntities']);
    mockInventoryModalService = jasmine.createSpyObj('InventoryModalService', ['getInventoryTransactions']);
    
    // Mock the service methods to return fake data
    mockBusinessEntityService.getBusinessEntities.and.returnValue(of([
      {
        id: 1,
        name: 'Waterway Point',
        location: 'Punggol',  
        type: 'Shop',
        active: true,
        external: false,
      },
    ]));

    await TestBed.configureTestingModule({      
      imports: [
        InventoryModalComponent, // Import the standalone component
        ReactiveFormsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { isModalOpen: true } },
        provideHttpClientTesting(),
        ProductService,
        { provide: BusinessEntityService, useValue: mockBusinessEntityService },
        { provide: InventoryModalService, useValue: mockInventoryModalService },
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
});
