import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductManagementComponent } from './product-management.component';
import { ProductService } from './product.service';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { Product } from './product.model';
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
    { id: 1, sku: 'SKU001', brand: 'Brand A', category: 'Electronics', subcategory: 'Mobile', description: 'Product 1', rrp: 100, barcode: '123', origin: 'China', uom: 'EA', vendorCode: 'VC001', active: true },
    { id: 2, sku: 'SKU002', brand: 'Brand B', category: 'Apparel', subcategory: 'Shirt', description: 'Product 2', rrp: 50, barcode: '456', origin: 'USA', uom: 'EA', vendorCode: 'VC002', active: false },
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
    component.searchTerm = 'Brand A';
    component.filterProducts();
    expect(component.filteredProducts[0].brand).toBe('Brand A');

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

      // it('should call updateProduct service and update the list on success', () => {
      //   const updatedProduct: Product = { id: 1, ...component.productForm.value };
      //   productService.updateProduct.and.returnValue(of(updatedProduct));
      //   component.saveProduct();
      //   expect(productService.updateProduct).toHaveBeenCalledWith(component.productForm.value);
      //   const updatedInList = component.products.find(p => p.id === 1);
      //   expect(updatedInList).toEqual(updatedProduct);
      //   expect(component.filteredProducts.find(p => p.id === 1)).toEqual(updatedProduct);
      //   expect(dialog.closeAll).toHaveBeenCalled();
      //   expect(snackBar.open).toHaveBeenCalledWith('Product updated successfully', 'Close', {
      //     duration: 3000,
      //     panelClass: ['success-snackbar']
      //   });
      // });
      //
      // it('should call updateProduct service and handle error', () => {
      //   const error = new Error('Update error');
      //   productService.updateProduct.and.returnValue(throwError(() => error));
      //   component.saveProduct();
      //   expect(productService.updateProduct).toHaveBeenCalledWith(component.productForm.value);
      //   expect(snackBar.open).toHaveBeenCalledWith(`Error updating product: ${error.message}`, 'Close', {
      //     duration: 5000,
      //     panelClass: ['error-snackbar']
      //   });
      // });

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
});
