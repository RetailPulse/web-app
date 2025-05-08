import { InventoryModalComponent } from './inventory-modal.component';
import { ProductService } from '../product-management/product.service';
import { BusinessEntityService } from '../business-entity-management/business-entity.service';
import { InventoryModalService } from './inventory-modal.service';
import { Product } from '../product-management/product.model';
import { BusinessEntity } from '../business-entity-management/business-entity.model';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('InventoryModalComponent', () => {
  let component: InventoryModalComponent;
  let fixture: ComponentFixture<InventoryModalComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockBusinessEntityService: jasmine.SpyObj<BusinessEntityService>;
  let mockInventoryModalService: jasmine.SpyObj<InventoryModalService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<InventoryModalComponent>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockProducts: Product[] = [
    {
      id: 1,
      sku: 'SKU001',
      brand: 'Brand A',
      category: 'Electronics',
      subcategory: 'Mobile',
      description: 'Product 1',
      rrp: 100,
      active: true,
      barcode: '123',
      origin: 'China',
      uom: 'EA',
      vendorCode: 'VC001'
    }
  ];

  const mockStores: BusinessEntity[] = [
    {
      id: 1,
      name: 'Waterway Point',
      location: 'Punggol',
      type: 'Shop',
      active: true,
      external: false
    },
    {
      id: 2,
      name: 'Central',
      location: 'HQ',
      type: 'CentralInventory',
      active: true,
      external: false
    }
  ];

  beforeEach(async () => {
    mockProductService = jasmine.createSpyObj('ProductService', ['getProducts']);
    mockBusinessEntityService = jasmine.createSpyObj('BusinessEntityService', ['getBusinessEntities']);
    mockInventoryModalService = jasmine.createSpyObj('InventoryModalService', ['createInventoryTransaction']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        InventoryModalComponent,
        ReactiveFormsModule
      ],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: BusinessEntityService, useValue: mockBusinessEntityService },
        { provide: InventoryModalService, useValue: mockInventoryModalService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { isModalOpen: true } },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize data on ngOnInit', () => {
    spyOn(component as any, 'initializeData');
    component.ngOnInit();
    expect((component as any).initializeData).toHaveBeenCalled();
  });

  it('should load products and filter only active', () => {
    mockProductService.getProducts.and.returnValue(of([
      { ...mockProducts[0], active: false },
      { ...mockProducts[0], id: 2, active: true }
    ]));
    component.loadProducts();
    expect(component.products.length).toBe(1);
    expect(component.filteredProducts.length).toBe(1);
    expect(component.products[0].active).toBeTrue();
  });

  it('should load stores', () => {
    mockBusinessEntityService.getBusinessEntities.and.returnValue(of(mockStores));
    component.loadStores();
    expect(component.stores.length).toBe(2);
  });

  it('should filter products by search term', () => {
    component.products = [...mockProducts];
    component.searchTerm = 'SKU001';
    component.filterProducts();
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].sku).toBe('SKU001');
  });

  it('should reset filteredProducts if search term is empty', () => {
    component.products = [...mockProducts];
    component.searchTerm = '';
    component.filterProducts();
    expect(component.filteredProducts.length).toBe(component.products.length);
  });

  it('should initialize product controls', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    expect(component.productQuantities.length).toBe(1);
    expect(component.quantityTouched.length).toBe(1);
  });

  it('should get product quantity control', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    expect(component.getProductQuantityControl(0)).toBeTruthy();
  });

  it('should mark quantity as touched', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    component.markQuantityAsTouched(0);
    expect(component.quantityTouched[0]).toBeTrue();
  });

  it('should show quantity error if touched and invalid', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    component.markQuantityAsTouched(0);
    component.getProductQuantityControl(0).setValue(0);
    expect(component.shouldShowQuantityError(0)).toBeTrue();
  });

  it('should return correct error message for required', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    component.getProductQuantityControl(0).setValue('');
    component.markQuantityAsTouched(0);
    expect(component.getQuantityErrorMessage(0)).toBe('Required');
  });

  it('should return correct error message for min', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    component.getProductQuantityControl(0).setValue(0);
    component.markQuantityAsTouched(0);
    expect(component.getQuantityErrorMessage(0)).toBe('Must be positive!');
  });

  it('should toggle product selection', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    component.toggleProduct(mockProducts[0]);
    expect(component.selection.isSelected(mockProducts[0])).toBeTrue();
    component.toggleProduct(mockProducts[0]);
    expect(component.selection.isSelected(mockProducts[0])).toBeFalse();
  });

  it('should toggle all products', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    component.toggleAllProducts();
    expect(component.selection.selected.length).toBe(component.filteredProducts.length);
    component.toggleAllProducts();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should not submit if form is invalid', () => {
    spyOn(component.importForm, 'markAllAsTouched');
    component.selection.clear();
    component.importForm.get('sourceBusinessEntity')?.setValue(null);
    component.submit();
    expect(component.importForm.markAllAsTouched).toHaveBeenCalled();
    expect(mockInventoryModalService.createInventoryTransaction).not.toHaveBeenCalled();
  });

  it('should submit and call createInventoryTransaction on valid form', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    component.selection.select(mockProducts[0]);
    component.importForm.get('sourceBusinessEntity')?.setValue(1);
    component.importForm.get('destinationBusinessEntity')?.setValue(2);
    mockInventoryModalService.createInventoryTransaction.and.returnValue(of('success'));
    component.submit();
    expect(mockInventoryModalService.createInventoryTransaction).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith('success');
    expect(mockSnackBar.open).toHaveBeenCalledWith('Inventory allocated successfully!', 'Close', jasmine.any(Object));
  });

  it('should show error notification on submit error', () => {
    component.filteredProducts = [...mockProducts];
    component.initProductControls();
    component.selection.select(mockProducts[0]);
    component.importForm.get('sourceBusinessEntity')?.setValue(1);
    component.importForm.get('destinationBusinessEntity')?.setValue(2);
    mockInventoryModalService.createInventoryTransaction.and.returnValue(throwError(() => new Error('fail')));
    component.submit();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to allocate inventory. Please try again.', 'Close', jasmine.any(Object));
  });

  it('should set error on duplicate entities', () => {
    component.importForm.get('sourceBusinessEntity')?.setValue(1);
    component.importForm.get('destinationBusinessEntity')?.setValue(1);
    component.onBusinessEntitySelected(1);
    expect(component.importForm.get('destinationBusinessEntity')?.hasError('duplicateEntities')).toBeTrue();
  });

  it('should clear error if entities are not duplicate', () => {
    component.importForm.get('sourceBusinessEntity')?.setValue(1);
    component.importForm.get('destinationBusinessEntity')?.setValue(2);
    component.onBusinessEntitySelected(2);
    expect(component.importForm.get('destinationBusinessEntity')?.hasError('duplicateEntities')).toBeFalse();
  });

  it('should close the dialog', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
    expect(component.data.isModalOpen).toBeFalse();
  });
});