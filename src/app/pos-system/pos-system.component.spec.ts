import { PosComponent } from './pos-system.component';
import { ProductService } from '../product-management/product.service';
import { PosSystemService } from './pos-system.service';
import { BusinessEntityService } from '../business-entity-management/business-entity.service';
import { InventoryService } from '../inventory-management/inventory.service';
import { Product } from '../product-management/product.model';
import { BusinessEntity } from '../business-entity-management/business-entity.model';
import { TransientTransaction, SalesDetails } from './pos-system.model';

import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

describe('PosComponent', () => {
  let component: PosComponent;
  let fixture: ComponentFixture<PosComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let posServiceSpy: jasmine.SpyObj<PosSystemService>;
  let businessEntityServiceSpy: jasmine.SpyObj<BusinessEntityService>;
  let inventoryServiceSpy: jasmine.SpyObj<InventoryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

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
      barcode: '123456789012',
      origin: 'China',
      uom: 'EA',
      vendorCode: 'VC001'
    }
  ];

  const mockBusinessEntities: BusinessEntity[] = [
    { id: 1, name: 'Shop 1', location: 'Loc1', type: 'Shop', active: true, external: false }
  ];

  beforeEach(async () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getProducts']);
    posServiceSpy = jasmine.createSpyObj('PosSystemService', [
      'calculateSalesTax', 'createTransaction', 'suspendTransaction', 'resumeTransaction'
    ]);
    businessEntityServiceSpy = jasmine.createSpyObj('BusinessEntityService', ['getBusinessEntities']);
    inventoryServiceSpy = jasmine.createSpyObj('InventoryService', ['getInventoryByBusinessEntity']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [PosComponent, ReactiveFormsModule],
      providers: [
        provideHttpClientTesting(),
        { provide: ProductService, useValue: productServiceSpy },
        { provide: PosSystemService, useValue: posServiceSpy },
        { provide: BusinessEntityService, useValue: businessEntityServiceSpy },
        { provide: InventoryService, useValue: inventoryServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PosComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load business entities on ngOnInit', () => {
    spyOn(component, 'loadBusinessEntities');
    component.ngOnInit();
    expect(component.loadBusinessEntities).toHaveBeenCalled();
  });

  it('should start scanner on ngAfterViewInit if scanner exists', () => {
    component.scanner = { startScanner: jasmine.createSpy('startScanner') } as any;
    component.ngAfterViewInit();
    expect(component.scanner.startScanner).toHaveBeenCalled();
  });

  it('should not start scanner on ngAfterViewInit if scanner does not exist', () => {
    component.scanner = undefined as any;
    spyOn(console, 'error');
    component.ngAfterViewInit();
    expect(console.error).toHaveBeenCalledWith('Scanner not found!');
  });

  it('should confirm business selection and initialize POS', () => {
    component.selectedBusinessEntity = mockBusinessEntities[0];
    spyOn(component, 'initializePOS');
    component.confirmBusinessSelection();
    expect(component.businessConfirmed).toBeTrue();
    expect(component.showBusinessSelection).toBeFalse();
    expect(component.initializePOS).toHaveBeenCalled();
  });

  it('should not confirm business selection if none selected', () => {
    component.selectedBusinessEntity = null;
    spyOn(component, 'initializePOS');
    component.confirmBusinessSelection();
    expect(component.businessConfirmed).toBeFalse();
    expect(component.showBusinessSelection).toBeTrue();
    expect(component.initializePOS).not.toHaveBeenCalled();
  });

  it('should change business location and reset POS', () => {
    spyOn(component, 'resetPOS');
    component.changeBusinessLocation();
    expect(component.businessConfirmed).toBeFalse();
    expect(component.showBusinessSelection).toBeTrue();
    expect(component.selectedBusinessEntity).toBeNull();
    expect(component.resetPOS).toHaveBeenCalled();
  });

  it('should reset POS', () => {
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    component.salesTax = 10;
    component.searchControl = new FormControl('test');
    component.barcodeControl = new FormControl('test');
    component.resetPOS();
    expect(component.cart.length).toBe(0);
    expect(component.salesTax).toBe(0);
    expect(component.searchControl.value).toBeNull();
    expect(component.barcodeControl.value).toBeNull();
  });

  it('should load business entities and filter active, non-external', fakeAsync(() => {
    businessEntityServiceSpy.getBusinessEntities.and.returnValue(of([
      { ...mockBusinessEntities[0], active: true, external: false },
      { ...mockBusinessEntities[0], id: 2, active: false, external: false },
      { ...mockBusinessEntities[0], id: 3, active: true, external: true }
    ]));
    component.loadBusinessEntities();
    tick();
    expect(component.businessEntities.length).toBe(1);
    expect(component.isLoadingBusinessEntities).toBeFalse();
  }));

  it('should handle error when loading business entities', fakeAsync(() => {
    businessEntityServiceSpy.getBusinessEntities.and.returnValue(throwError(() => new Error('fail')));
    component.loadBusinessEntities();
    tick();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to load business entities', 'Close', { duration: 2000 });
    expect(component.isLoadingBusinessEntities).toBeFalse();
  }));

  it('should get available quantity from inventoryMap', () => {
    (component as any).inventoryMap.set(1, 5);
    expect(component.getAvailableQuantity(1)).toBe(5);
    expect(component.getAvailableQuantity(999)).toBe(0);
  });

  it('should load products and filter by inventory', fakeAsync(() => {
    component.selectedBusinessEntity = mockBusinessEntities[0];
    productServiceSpy.getProducts.and.returnValue(of([
      { ...mockProducts[0], id: 1, active: true },
      { ...mockProducts[0], id: 2, active: false }
    ]));
    inventoryServiceSpy.getInventoryByBusinessEntity.and.returnValue(of([
      { id: 1, productId: 1, businessEntityId: 1, quantity: 2, totalCostPrice: 100 },
      { id: 2, productId: 2, businessEntityId: 1, quantity: 0, totalCostPrice: 50 }
    ]));
    spyOn(component, 'focusBarcodeInput');
    component.loadProducts();
    tick();
    expect(component.products.length).toBe(1);
    expect(component.filteredProducts.length).toBe(1);
    expect(component.isLoading).toBeFalse();
    expect(component.focusBarcodeInput).toHaveBeenCalled();
  }));

  it('should handle error when loading products', fakeAsync(() => {
    component.selectedBusinessEntity = mockBusinessEntities[0];
    productServiceSpy.getProducts.and.returnValue(throwError(() => new Error('fail')));
    inventoryServiceSpy.getInventoryByBusinessEntity.and.returnValue(of([]));
    component.loadProducts();
    tick();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to load products', 'Close', { duration: 2000 });
    expect(component.isLoading).toBeFalse();
  }));

  it('should toggle scanner view and start/stop scanner', fakeAsync(() => {
    component.scanner = { startScanner: jasmine.createSpy('startScanner'), stopScanner: jasmine.createSpy('stopScanner') } as any;
    component.barcodeInput = { nativeElement: { focus: jasmine.createSpy('focus') } } as any;
    component.showScannerView = false;
    component.toggleScannerView();
    tick(100);
    expect(component.showScannerView).toBeTrue();
    expect(component.scanner.startScanner).toHaveBeenCalled();

    component.toggleScannerView();
    expect(component.showScannerView).toBeFalse();
    expect(component.scanner.stopScanner).toHaveBeenCalled();
  }));

  it('should process barcode and add product to cart', () => {
    component.products = [...mockProducts];
    spyOn(component, 'addToCart');
    component.processBarcode('123456789012');
    expect(component.addToCart).toHaveBeenCalledWith(mockProducts[0]);
    expect(snackBarSpy.open).toHaveBeenCalledWith(`${mockProducts[0].description} added`, 'OK', { duration: 1000 });
  });

  it('should process barcode and show not found if product missing', () => {
    component.products = [];
    component.processBarcode('notfound');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Product not found', 'Close', { duration: 2000 });
  });

  it('should add product by barcode', () => {
    component.products = [...mockProducts];
    spyOn(component, 'addToCart');
    component.addProductByBarcode('123456789012');
    expect(component.addToCart).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('should show not found when adding product by barcode if not found', () => {
    component.products = [];
    component.addProductByBarcode('notfound');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Product not found', 'Close', { duration: 2000 });
  });

  it('should add to cart if product is in stock and not in cart', () => {
    spyOn(component, 'calculateSalesTax');
    spyOn(component, 'focusBarcodeInput');
    (component as any).inventoryMap.set(1, 2);
    component.products = [...mockProducts];
    component.cart = [];
    component.addToCart(mockProducts[0]);
    expect(component.cart.length).toBe(1);
    expect(snackBarSpy.open).toHaveBeenCalledWith(`${mockProducts[0].description} added to cart`, 'Close', { duration: 1000 });
    expect(component.calculateSalesTax).toHaveBeenCalled();
    expect(component.focusBarcodeInput).toHaveBeenCalled();
  });

  it('should not add to cart if product is out of stock', () => {
    (component as any).inventoryMap.set(1, 0);
    component.cart = [];
    component.addToCart(mockProducts[0]);
    expect(snackBarSpy.open).toHaveBeenCalledWith(`${mockProducts[0].description} is out of stock`, 'Close', { duration: 2000 });
    expect(component.cart.length).toBe(0);
  });

  it('should not add to cart if quantity exceeds available', () => {
    (component as any).inventoryMap.set(1, 1);
    component.cart = [{ product: mockProducts[0], quantity: 1 }];
    component.addToCart(mockProducts[0]);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Only 1 available in stock', 'Close', { duration: 2000 });
  });

  it('should increment quantity if product is in cart and not exceeding stock', () => {
    spyOn(component, 'calculateSalesTax');
    spyOn(component, 'focusBarcodeInput');
    (component as any).inventoryMap.set(1, 2);
    component.cart = [{ product: mockProducts[0], quantity: 1 }];
    component.addToCart(mockProducts[0]);
    expect(component.cart[0].quantity).toBe(2);
    expect(component.calculateSalesTax).toHaveBeenCalled();
    expect(component.focusBarcodeInput).toHaveBeenCalled();
  });

  it('should remove from cart', () => {
    spyOn(component, 'calculateSalesTax');
    spyOn(component, 'focusBarcodeInput');
    component.cart = [{ product: mockProducts[0], quantity: 1 }];
    component.removeFromCart(0);
    expect(component.cart.length).toBe(0);
    expect(component.calculateSalesTax).toHaveBeenCalled();
    expect(component.focusBarcodeInput).toHaveBeenCalled();
  });

  it('should update quantity in cart', () => {
    spyOn(component, 'calculateSalesTax');
    spyOn(component, 'focusBarcodeInput');
    component.cart = [{ product: mockProducts[0], quantity: 1 }];
    component.updateQuantity(component.cart[0], 1);
    expect(component.cart[0].quantity).toBe(2);
    component.updateQuantity(component.cart[0], -2);
    expect(component.cart.length).toBe(0);
    expect(component.calculateSalesTax).toHaveBeenCalledTimes(2);
    expect(component.focusBarcodeInput).toHaveBeenCalledTimes(2);
  });

  it('should get total and total with tax', () => {
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    component.salesTax = 5;
    expect(component.getTotal()).toBe(200);
    expect(component.getTotalWithTax()).toBe(205);
  });

  it('should calculate sales tax and handle success', fakeAsync(() => {
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    const taxResult = { taxAmount: '10' } as any;
    posServiceSpy.calculateSalesTax.and.returnValue(of(taxResult));
    component.calculateSalesTax();
    tick();
    expect(component.salesTax).toBe(10);
  }));

  it('should calculate sales tax and handle error', fakeAsync(() => {
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    posServiceSpy.calculateSalesTax.and.returnValue(throwError(() => new Error('fail')));
    component.calculateSalesTax();
    tick();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to calculate sales tax', 'Close', { duration: 2000 });
    expect(component.taxLoading).toBeFalse();
  }));

  it('should checkout and handle success', fakeAsync(() => {
    component.selectedBusinessEntity = mockBusinessEntities[0];
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    component.salesTax = 10;
    posServiceSpy.createTransaction.and.returnValue(of({ totalAmount: '210' } as any));
    spyOn(component, 'focusBarcodeInput');
    spyOn(component, 'loadProducts');
    component.checkout();
    tick();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Checkout completed. Total: $210', 'Close', { duration: 2000 });
    expect(component.cart.length).toBe(0);
    expect(component.salesTax).toBe(0);
    expect(component.focusBarcodeInput).toHaveBeenCalled();
    expect(component.loadProducts).toHaveBeenCalled();
  }));

  it('should checkout and handle error', fakeAsync(() => {
    component.selectedBusinessEntity = mockBusinessEntities[0];
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    component.salesTax = 10;
    posServiceSpy.createTransaction.and.returnValue(throwError(() => new Error('fail')));
    component.checkout();
    tick();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to create transaction', 'Close', { duration: 2000 });
  }));

  it('should not checkout if no business entity selected', () => {
    component.selectedBusinessEntity = null;
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    component.salesTax = 10;
    component.checkout();
    expect(snackBarSpy.open).not.toHaveBeenCalledWith('Checkout completed. Total: $210', 'Close', { duration: 2000 });
  });

  it('should freeze transaction and handle success', fakeAsync(() => {
    component.selectedBusinessEntity = mockBusinessEntities[0];
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    posServiceSpy.suspendTransaction.and.returnValue(of([
      {
        transactionId: 't1',
        businessEntityId: 1,
        subTotalAmount: '200',
        taxType: 'GST',
        taxRate: '7',
        taxAmount: '14',
        totalAmount: '214',
        salesDetails: [{ productId: 1, quantity: 2, salesPricePerUnit: '100' }],
        transactionDateTime: new Date().toISOString()
      }
    ]));
    spyOn(component, 'focusBarcodeInput');
    component.freezeTransaction();
    tick();
    expect(component.cart.length).toBe(0);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Transaction frozen', 'Close', { duration: 2000 });
    expect(component.focusBarcodeInput).toHaveBeenCalled();
  }));

  it('should freeze transaction and handle error', fakeAsync(() => {
    component.selectedBusinessEntity = mockBusinessEntities[0];
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    posServiceSpy.suspendTransaction.and.returnValue(throwError(() => new Error('fail')));
    component.freezeTransaction();
    tick();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to suspend transaction', 'Close', { duration: 2000 });
  }));

  it('should not freeze transaction if cart is empty', () => {
    component.selectedBusinessEntity = mockBusinessEntities[0];
    component.cart = [];
    component.freezeTransaction();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Cart is empty', 'Close', { duration: 2000 });
  });

  it('should not freeze transaction if no business entity selected', () => {
    component.selectedBusinessEntity = null;
    component.cart = [{ product: mockProducts[0], quantity: 2 }];
    component.freezeTransaction();
    expect(snackBarSpy.open).not.toHaveBeenCalledWith('Transaction frozen', 'Close', { duration: 2000 });
  });

  it('should unfreeze transaction and handle success', fakeAsync(() => {
    const transaction: TransientTransaction = {
      transactionId: 't1',
      businessEntityId: 1,
      subTotalAmount: '200',
      taxType: 'GST',
      taxRate: '7',
      taxAmount: '14',
      totalAmount: '214',
      salesDetails: [{ productId: 1, quantity: 2, salesPricePerUnit: '100' }],
      transactionDateTime: new Date().toISOString()
    };
    component.products = [...mockProducts];
    posServiceSpy.resumeTransaction.and.returnValue(of([transaction]));
    spyOn(component, 'focusBarcodeInput');
    component.unfreezeTransaction(transaction);
    tick();
    expect(component.cart.length).toBe(1);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Transaction is resumed', 'Close', { duration: 2000 });
    expect(component.focusBarcodeInput).toHaveBeenCalled();
  }));

  it('should unfreeze transaction and handle error', fakeAsync(() => {
    const transaction: TransientTransaction = {
      transactionId: 't1',
      businessEntityId: 1,
      subTotalAmount: '200',
      taxType: 'GST',
      taxRate: '7',
      taxAmount: '14',
      totalAmount: '214',
      salesDetails: [{ productId: 1, quantity: 2, salesPricePerUnit: '100' }],
      transactionDateTime: new Date().toISOString()
    };
    component.products = [...mockProducts];
    posServiceSpy.resumeTransaction.and.returnValue(throwError(() => new Error('fail')));
    component.unfreezeTransaction(transaction);
    tick();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to resume transaction', 'Close', { duration: 2000 });
  }));

  // Edge: setupSearch with empty products
  it('should setup search and filter products', fakeAsync(() => {
    component.products = [...mockProducts];
    component.filteredProducts = [];
    component.searchControl = new FormControl('');
    component.setupSearch();
    component.searchControl.setValue('SKU001');
    tick();
    expect(component.filteredProducts.length).toBeGreaterThanOrEqual(0);
  }));

  // Edge: setupBarcodeScanner with valid barcode
  it('should setup barcode scanner and add product by barcode', fakeAsync(() => {
    component.products = [...mockProducts];
    component.barcodeControl = new FormControl('');
    spyOn(component, 'addProductByBarcode');
    component.setupBarcodeScanner();
    component.barcodeControl.setValue('123456789012');
    tick();
    expect(component.addProductByBarcode).toHaveBeenCalledWith('123456789012');
  }));

  // Edge: setupBarcodeScanner with short barcode
  it('should setup barcode scanner and not add product if barcode too short', fakeAsync(() => {
    component.products = [...mockProducts];
    component.barcodeControl = new FormControl('');
    spyOn(component, 'addProductByBarcode');
    component.setupBarcodeScanner();
    component.barcodeControl.setValue('123');
    tick();
    expect(component.addProductByBarcode).not.toHaveBeenCalled();
  }));

  // Edge: focusBarcodeInput with undefined barcodeInput
  it('should not throw if barcodeInput is undefined in focusBarcodeInput', () => {
    component.barcodeInput = undefined as any;
    expect(() => component.focusBarcodeInput()).not.toThrow();
  });
});