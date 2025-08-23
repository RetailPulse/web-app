import { ProductManagementComponent } from './product-management.component';
import { ProductService } from './product.service';
import { Product } from './product.model';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

describe('ProductManagementComponent', () => {
  let component: ProductManagementComponent;
  let fixture: ComponentFixture<ProductManagementComponent>;
  let productService: jasmine.SpyObj<ProductService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let formBuilder: FormBuilder;

  const mockProducts: Product[] = [
    { id: 1, sku: 'SKU001', brand: 'Apple', category: 'Electronics', subcategory: 'Mobile', description: 'Product 1', rrp: 100, barcode: '123', origin: 'China', uom: 'EA', vendorCode: 'VC001', active: true },
    { id: 2, sku: 'SKU002', brand: 'Levis', category: 'Apparel', subcategory: 'Shirt', description: 'Product 2', rrp: 50, barcode: '456', origin: 'USA', uom: 'EA', vendorCode: 'VC002', active: false },
  ];

  beforeEach(() => {
    productService = jasmine.createSpyObj('ProductService', ['getProducts', 'createProduct', 'updateProduct', 'reverseProduct']);
    dialog = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule,
        MatIconModule,
        MatButtonModule,
        MatSlideToggleModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProductService, useValue: productService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        FormBuilder,
        { provide: ProductService, useValue: productService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductManagementComponent);
    component = fixture.componentInstance;
    productService.getProducts.and.returnValue(of(mockProducts));
    formBuilder = TestBed.inject(FormBuilder);
    fixture.detectChanges(); // ngOnInit is called here
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on initialization', () => {
    expect(component.products).toEqual(mockProducts);
    expect(component.filteredProducts).toEqual(mockProducts);
    expect(productService.getProducts).toHaveBeenCalled();
  });

  it('filterProducts should filter products based on search term', () => {

    component.searchTerm = 'Product 2';
    component.filterProducts();
    expect(component.filteredProducts[0].description).toBe('Product 2');

    component.searchTerm = '';
    component.filterProducts();
    expect(component.filteredProducts).toEqual(mockProducts);
  });

  it('openDialog should open the product dialog', () => {
    const mockTemplateRef = {};
    component.productDialogTemplate = mockTemplateRef as any;
    component.openDialog();
    expect(dialog.open).toHaveBeenCalledWith(mockTemplateRef, {
      width: '800px',
      disableClose: true
    });
  });

  it('createProduct should reset the form and open the dialog in create mode', () => {
    component.createProduct();
    expect(component.modalMode).toBe('create');
    expect(component.productForm.value.active).toBeTrue();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('editProduct should patch the form with product data and open the dialog in update mode', () => {
    const productToEdit = mockProducts[0];
    component.editProduct(productToEdit);
    expect(component.modalMode).toBe('update');
    expect(component.productForm.value).toEqual({
      id: productToEdit.id,
      brand: productToEdit.brand,
      category: productToEdit.category,
      subcategory: productToEdit.subcategory,
      description: productToEdit.description,
      rrp: productToEdit.rrp,
      barcode: productToEdit.barcode,
      origin: productToEdit.origin,
      uom: productToEdit.uom,
      vendorCode: productToEdit.vendorCode,
      active: true
    });
    expect(dialog.open).toHaveBeenCalled();
  });

  describe('saveProduct', () => {
    beforeEach(() => {
      component.productForm = formBuilder.group({
        id: [''],
        brand: ['Test Brand', Validators.required],
        category: ['Test Category', Validators.required],
        subcategory: [''],
        description: ['Test Description'],
        rrp: [10, [Validators.required, Validators.min(0)]],
        barcode: [''],
        origin: [''],
        uom: [''],
        vendorCode: [''],
        active: [true]
      });
    });

    it('should not save if the form is invalid', () => {
      component.productForm.controls['brand'].setValue('');
      component.saveProduct();
      expect(productService.createProduct).not.toHaveBeenCalled();
      expect(productService.updateProduct).not.toHaveBeenCalled();
    });

    describe('create mode', () => {
      it('should call createProduct service and update the list on success', () => {
        component.modalMode = 'create';
        const newProduct: Product = { id: '3', ...component.productForm.value };
        productService.createProduct.and.returnValue(of(newProduct));
        component.saveProduct();
        expect(productService.createProduct).toHaveBeenCalledWith(component.productForm.value);
        expect(component.products).toContain(newProduct);
        expect(component.filteredProducts).toContain(newProduct);
        expect(dialog.closeAll).toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith('Product created successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      });

      it('should call createProduct service and handle error', () => {
        component.modalMode = 'create';
        const error = new Error('Create error');
        productService.createProduct.and.returnValue(throwError(() => error));
        component.saveProduct();
        expect(productService.createProduct).toHaveBeenCalledWith(component.productForm.value);
        expect(snackBar.open).toHaveBeenCalledWith(`Error creating product: ${error.message}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      });
    });

    describe('update mode', () => {
      beforeEach(() => {
        component.modalMode = 'update';
        component.productForm.controls['id'].setValue('1');
      });

      it('should call reverseProduct service if reactivating an inactive product', () => {
        const inactiveProduct = { ...mockProducts[1], active: false, id: 2 };
        component.products = [...mockProducts];
        component.filteredProducts = [...mockProducts];
        component.productForm.patchValue({ id: 2, active: true });
        const reactivatedProduct: Product = { ...inactiveProduct, active: true };
        productService.reverseProduct.and.returnValue(of(reactivatedProduct));
        component.saveProduct();
        expect(productService.reverseProduct).toHaveBeenCalledWith(2);
        expect(productService.updateProduct).not.toHaveBeenCalled();
        expect(component.products.find(p => p.id === 2)?.active).toBeTrue();
        expect(component.filteredProducts.find(p => p.id === 2)?.active).toBeTrue();
        expect(snackBar.open).toHaveBeenCalledWith('Product reactivated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      });

      it('should handle error when reactivating a product', () => {
        component.products = [...mockProducts];
        component.filteredProducts = [...mockProducts];
        component.productForm.patchValue({ id: 2, active: true });
        const error = new Error('Reactivation error');
        productService.reverseProduct.and.returnValue(throwError(() => error));
        component.saveProduct();
        expect(productService.reverseProduct).toHaveBeenCalledWith(2);
        expect(snackBar.open).toHaveBeenCalledWith(`Error reactivating product: ${error.message}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      });
    });
  });

  describe('deleteProduct', () => {
    it('should call updateProduct to deactivate and update the list on confirmation', () => {
      const productToDelete = mockProducts[0];
      spyOn(window, 'confirm').and.returnValue(true);
      const updatedProduct: Product = { ...productToDelete, active: false };
      productService.updateProduct.and.returnValue(of(updatedProduct));
      component.deleteProduct(productToDelete);
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to deactivate this product?');
      expect(productService.updateProduct).toHaveBeenCalledWith(updatedProduct);
      expect(component.products.find(p => p.id === productToDelete.id)?.active).toBeFalse();
      expect(component.filteredProducts.find(p => p.id === productToDelete.id)?.active).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith('Product deactivated successfully', 'Close', {
        duration: 3000
      });
    });

    it('should not call updateProduct if cancellation is confirmed', () => {
      const productToDelete = mockProducts[0];
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteProduct(productToDelete);
      expect(productService.updateProduct).not.toHaveBeenCalled();
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('should handle error during deactivation', () => {
      const productToDelete = mockProducts[0];
      spyOn(window, 'confirm').and.returnValue(true);
      const error = new Error('Deactivation error');
      productService.updateProduct.and.returnValue(throwError(() => error));
      component.deleteProduct(productToDelete);
      expect(snackBar.open).toHaveBeenCalledWith('Error deactivating product', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    });
  });

  it('should handle error when loading products', () => {
    productService.getProducts.and.returnValue(throwError(() => new Error('Load error')));
    component.loadProducts();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeNull();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to load products: Load error', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  });

  it('should handle empty search term in filterProducts', () => {
    component.products = [...mockProducts];
    component.searchTerm = '   ';
    component.filterProducts();
    expect(component.filteredProducts).toEqual(mockProducts);
  });

  it('should handle no matches in filterProducts', () => {
    component.products = [...mockProducts];
    component.searchTerm = 'NonExistentBrand';
    component.filterProducts();
    expect(component.filteredProducts.length).toBe(0);
  });

  it('should not open dialog if productDialogTemplate is undefined', () => {
    component.productDialogTemplate = undefined as any;
    expect(() => component.openDialog()).not.toThrow();
  });

  it('should patch form with inactive product in editProduct', () => {
    const inactiveProduct = { ...mockProducts[1], active: false };
    component.editProduct(inactiveProduct);
    expect(component.productForm.value.active).toBeFalse();
    expect(component.modalMode).toBe('update');
    expect(dialog.open).toHaveBeenCalled();
  });

  it('should not save product if form is invalid', () => {
    component.productForm.controls['brand'].setValue('');
    component.saveProduct();
    expect(productService.createProduct).not.toHaveBeenCalled();
    expect(productService.updateProduct).not.toHaveBeenCalled();
    expect(productService.reverseProduct).not.toHaveBeenCalled();
  });

  it('should call updateProduct service and update the list on success (update mode)', () => {
    component.modalMode = 'update';
    component.productForm.patchValue({ id: 1, active: true });
    const updatedProduct: Product = { ...mockProducts[0], brand: 'Updated Brand' };
    productService.updateProduct.and.returnValue(of(updatedProduct));
    component.productForm.patchValue(updatedProduct);
    component.saveProduct();
    expect(productService.updateProduct).toHaveBeenCalledWith(jasmine.objectContaining({ id: 1 }));
    expect(component.products.find(p => p.id === 1)?.brand).toBe('Updated Brand');
    expect(component.filteredProducts.find(p => p.id === 1)?.brand).toBe('Updated Brand');
    expect(dialog.closeAll).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Product updated successfully', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  });

  it('should not call updateProduct if delete is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteProduct(mockProducts[0]);
    expect(productService.updateProduct).not.toHaveBeenCalled();
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('should handle error in deleteProduct', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    productService.updateProduct.and.returnValue(throwError(() => new Error('Delete error')));
    component.deleteProduct(mockProducts[0]);
    expect(snackBar.open).toHaveBeenCalledWith('Error deactivating product', 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  });

  it('should update arrays correctly when deleting a product', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const updatedProduct: Product = { ...mockProducts[0], active: false };
    productService.updateProduct.and.returnValue(of(updatedProduct));
    component.deleteProduct(mockProducts[0]);
    expect(component.products.find(p => p.id === mockProducts[0].id)?.active).toBeFalse();
    expect(component.filteredProducts.find(p => p.id === mockProducts[0].id)?.active).toBeFalse();
  });
});
