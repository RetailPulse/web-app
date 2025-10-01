import {ProductService} from '../product-management/product.service';
import {Product} from '../product-management/product.model';
import {PosSystemService} from './pos-system.service';
import {BusinessEntityService} from "../business-entity-management/business-entity.service";
import {BusinessEntity} from "../business-entity-management/business-entity.model";
import {
  CartItem,
  SalesDetails,
  SalesTransactionRequest,
  SuspendedTransactionRequest,
  TaxResult,
  Transaction,
  TransientTransaction
} from './pos-system.model';

import {AfterViewInit, Component, DestroyRef, ElementRef, inject, OnInit, ViewChild, signal} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import Fuse from 'fuse.js';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import {forkJoin} from "rxjs";
import {HttpErrorResponse} from '@angular/common/http';
import {MatOption, MatSelect} from '@angular/material/select';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle
} from '@angular/material/card';
import {NgxScannerQRCodeAdapterComponent} from '../ngx-scannerqrcode-adapter/ngx-scannerqrcode-adapter.component';
import {InventoryService} from '../inventory-management/inventory.service';
import {PaymentDialogComponent} from '../payment-dialog/payment-dialog.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-pos-system',
  templateUrl: './pos-system.component.html',
  imports: [
    NgxScannerQRCodeAdapterComponent,
    MatFormField,
    MatIcon,
    ReactiveFormsModule,
    CurrencyPipe,
    MatMenu,
    MatMenuTrigger,
    CommonModule,
    MatLabel,
    MatIconButton,
    MatButton,
    MatMenuItem,
    MatInput,
    MatSelect,
    MatOption,
    MatProgressSpinner,
    MatCardActions,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardSubtitle,
    MatCardTitle,
    FormsModule,
  ],
  styleUrls: ['./pos-system.component.css']
})
export class PosComponent implements OnInit, AfterViewInit {
  searchControl = new FormControl('');
  barcodeControl = new FormControl('');
  products: Product[] = [];
  taxLoading: boolean = false;
  salesTax: number = 0;
  filteredProducts: Product[] = [];
  cart: CartItem[] = [];
  frozenTransactions: Transaction[] = [];
  suspendedTransaction: TransientTransaction[] | null = null;
  businessEntities: BusinessEntity[] = [];
  selectedBusinessEntity: BusinessEntity | null = null;
  businessConfirmed = false;
  showBusinessSelection = true;
  isLoading: boolean = false;

  isLoadingBusinessEntities = signal<boolean>(true);

  private inventoryMap = new Map<number, number>();

  // Barcode scanner properties
  showScannerView = false;
  manualBarcode = '';
  scannerConfig = {
    constraints: {
      video: {
        width: {ideal: 640},
        height: {ideal: 480},
        facingMode: 'environment'
      }
    }
  };

  @ViewChild('scanner') scanner!: NgxScannerQRCodeAdapterComponent;
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  private destroyRef = inject(DestroyRef);
  private dialog: MatDialog = inject(MatDialog);

  constructor(
    private snackBar: MatSnackBar,
    private productService: ProductService,
    private posService: PosSystemService,
    private businessEntityService: BusinessEntityService,
    private inventoryService: InventoryService,
  ) {
  }

  ngOnInit(): void {
    this.loadBusinessEntities();
  }

  ngAfterViewInit(): void {
    console.log('In After View Init...');
    if (!this.scanner) {
      console.error('Scanner not found!');
      return;
    }

    // Start the scanner
    this.scanner.startScanner();
  }

  confirmBusinessSelection(): void {
    if (!this.selectedBusinessEntity) return;

    this.businessConfirmed = true;
    this.showBusinessSelection = false;
    this.initializePOS();
  }

  initializePOS(): void {
    this.loadProducts();
    this.setupSearch();
    this.setupBarcodeScanner();
  }

  changeBusinessLocation(): void {
    this.businessConfirmed = false;
    this.showBusinessSelection = true;
    this.selectedBusinessEntity = null;
    this.resetPOS();
  }

  resetPOS(): void {
    this.cart = [];
    this.salesTax = 0;
    this.searchControl.reset();
    this.barcodeControl.reset();
  }

  setupSearch(): void {
    const fuse = new Fuse<Product>(this.products, {
      keys: ['sku', 'description', 'barcode'],
      threshold: 0.3
    });

    this.searchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (!value) {
        this.filteredProducts = [...this.products];
        return;
      }
      const results = fuse.search(value);
      this.filteredProducts = results.map(result => result.item);
    });
  }

  setupBarcodeScanner(): void {
    this.barcodeControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (value && value.length >= 12) {
        this.addProductByBarcode(value);
        this.barcodeControl.reset();
      }
    });
  }

  loadBusinessEntities(): void {
    // It's good practice to ensure the loading flag is true at the start
    this.isLoadingBusinessEntities.set(true);

    console.log('Loading business entities...');
    this.businessEntityService.getBusinessEntities().subscribe({
      // Use 'next' property for the success callback
      next: (entities) => {
        console.log('Successfully loaded business entities:', entities); // Optional: for debugging
        this.businessEntities = entities.filter(entity => entity.active && !entity.external);
        console.log('Filtered business entities:', this.businessEntities); // Optional: for debugging
        console.log('Number of filtered entities:', this.businessEntities.length);
        this.isLoadingBusinessEntities.set(false);
        console.log('isLoadingBusinessEntities set to false (success)');
      },
      error: (error: HttpErrorResponse) => { // Typing the error is good practice
        console.error('Error loading business entities:', error);
        // Consider providing more specific feedback to the user based on error.status etc.
        this.snackBar.open('Failed to load business entities', 'Close', {duration: 5000}); // Maybe increase duration
        this.isLoadingBusinessEntities.set(false);
        console.log('isLoadingBusinessEntities set to false (error)');
      }
    });
  }


// Add this method to get available quantity
  getAvailableQuantity(productId: number): number {
    return this.inventoryMap.get(productId) || 0;
  }

// fliter the product by business
  loadProducts(): void {
    this.isLoading = true;
    if (!this.selectedBusinessEntity) {
      this.isLoading = false;
      return;
    }

    forkJoin([
      this.productService.getProducts(),
      this.inventoryService.getInventoryByBusinessEntity(this.selectedBusinessEntity.id)
    ]).subscribe({
      next: ([products, inventory]) => {
        // Filter active products
        const activeProducts = products.filter(p => p.active);

        // Clear and rebuild the inventory map
        this.inventoryMap.clear();
        inventory.forEach(item => {
          this.inventoryMap.set(item.productId, item.quantity);
        });

        // Only show products that have inventory > 0 at this location
        this.products = activeProducts.filter(product => {
          const quantity = this.inventoryMap.get(product.id) || 0;
          return quantity > 0; // Only include products with available stock
        });

        this.filteredProducts = [...this.products];
        this.focusBarcodeInput();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.snackBar.open('Failed to load products', 'Close', {duration: 2000});
        this.isLoading = false;
      }
    });
  }

  // Barcode Scanner Methods
  toggleScannerView(): void {
    this.showScannerView = !this.showScannerView;
    if (this.showScannerView) {
      setTimeout(() => {
        if (this.scanner) {
          this.scanner.startScanner();
        }
      }, 100);
    } else {
      if (this.scanner) {
        this.scanner.stopScanner();
      }
      this.focusBarcodeInput();
    }
  }

  onCodeResult(result: string): void {
    alert(`Barcode scanned: ${result}`);
    console.log(result);
    this.processBarcode(result);
  }

  processBarcode(barcode: string): void {
    barcode = barcode.trim();
    if (!barcode) return;

    const product = this.products.find(p =>
      p.barcode === barcode
    );

    if (product) {
      this.addToCart(product);
      this.snackBar.open(`${product.description} added`, 'OK', {duration: 1000});

      this.manualBarcode = '';

    } else {
      this.snackBar.open('Product not found', 'Close', {duration: 2000});
    }

    this.manualBarcode = '';
  }

  focusBarcodeInput(): void {
    if (this.barcodeInput) {
      setTimeout(() => this.barcodeInput.nativeElement.focus(), 100);
    }
  }

  // Existing cart methods
  addProductByBarcode(barcode: string): void {
    const product = this.products.find(p => p.barcode === barcode);
    if (product) {
      this.addToCart(product);
    } else {
      this.snackBar.open('Product not found', 'Close', {duration: 2000});
    }
  }

  addToCart(product: Product): void {
    const availableQuantity = this.getAvailableQuantity(product.id);
    const existingItem = this.cart.find(item => item.product.sku === product.sku);

    if (existingItem) {
      // Check if we're exceeding available stock
      if (existingItem.quantity >= availableQuantity) {
        this.snackBar.open(`Only ${availableQuantity} available in stock`, 'Close', {duration: 2000});
        return;
      }
      existingItem.quantity += 1;
    } else {
      // Check if product is in stock at all
      if (availableQuantity <= 0) {
        this.snackBar.open(`${product.description} is out of stock`, 'Close', {duration: 2000});
        return;
      }
      this.cart.push({product, quantity: 1});
    }

    this.calculateSalesTax();
    this.snackBar.open(`${product.description} added to cart`, 'Close', {duration: 1000});
    this.focusBarcodeInput();
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.calculateSalesTax();
    this.focusBarcodeInput();
  }

  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      item.quantity = newQuantity;
    } else {
      this.cart = this.cart.filter(cartItem => cartItem !== item);
    }
    this.calculateSalesTax();
    this.focusBarcodeInput();
  }

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.product.rrp * item.quantity), 0);
  }

  calculateSalesTax(): void {
    if (this.cart.length === 0) {
      this.salesTax = 0;
      return;
    }

    this.taxLoading = true;
    const transaction: Transaction = {
      items: [...this.cart],
      timestamp: new Date()
    };

    const subscription = this.posService.calculateSalesTax(transaction)
      .subscribe({
        next: (taxResult: TaxResult) => {
          this.salesTax = parseFloat(taxResult.taxAmount);
        },
        error: (error: Error) => {
          console.error('Error calculating sales tax:', error);
          this.snackBar.open('Failed to calculate sales tax', 'Close', {duration: 2000});
          this.taxLoading = false;
        },
        complete: () => {
          this.taxLoading = false;
        }
      });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  getTotalWithTax(): number {
    return this.getTotal() + this.salesTax;
  }

  checkout(): void {
    if (!this.selectedBusinessEntity) return;

    const salesDetails = this.cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      salesPricePerUnit: item.product.rrp.toString(),
    }));

    // Remove businessEntityId from the request body since it's now in the URL
    const salesTransactionRequest: SalesTransactionRequest = {
      businessEntityId: this.selectedBusinessEntity.id,
      taxAmount: this.salesTax.toString(),
      totalAmount: this.getTotalWithTax().toString(),
      salesDetails
    };

    this.posService.createTransaction(salesTransactionRequest)
      .subscribe({
        next: (response) => {
          console.log('Transaction created successfully:', response);

          this.dialog.open(PaymentDialogComponent, {
            width: '520px',
            data: {
              clientSecret: response.paymentIntent.clientSecret,
              transactionId: response.transaction.salesTransactionId,
              paymentIntentId: response.paymentIntent.paymentIntentId
            }
          });
          // this.snackBar.open(`Checkout completed. Total: $${response.totalAmount}`, 'Close', {duration: 2000});
          // this.cart = [];
          // this.salesTax = 0;
          // this.focusBarcodeInput();
          // this.loadProducts(); // Reload products to refresh inventory
        },
        error: (error) => {
          console.error('Error creating transaction:', error);
          this.snackBar.open('Failed to create transaction', 'Close', {duration: 2000});
        }
      });
  }

  freezeTransaction(): void {
    if (!this.selectedBusinessEntity) return;
    if (this.cart.length === 0) {
      this.snackBar.open('Cart is empty', 'Close', {duration: 2000});
      return;
    }

    const salesDetails = this.cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      salesPricePerUnit: item.product.rrp.toString(),
    } as SalesDetails));

    const suspendedTransactionRequest: SuspendedTransactionRequest = {
      businessEntityId: this.selectedBusinessEntity.id,
      salesDetails
    };

    const subscription = this.posService
      .suspendTransaction(suspendedTransactionRequest)
      .subscribe({
        next: (response) => {
          this.suspendedTransaction = response;
        },
        error: (error: Error) => {
          console.error('Error suspending transaction:', error);
          this.snackBar.open('Failed to suspend transaction', 'Close', {duration: 2000});
        }
      });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });

    this.cart = [];
    this.snackBar.open('Transaction frozen', 'Close', {duration: 2000});
    this.focusBarcodeInput();
  }

  unfreezeTransaction(transaction: TransientTransaction): void {
    const salesDetails = transaction.salesDetails.map(item => ({
      product: this.products.find(p => p.id === item.productId) || null,
      quantity: item.quantity,
    } as CartItem));

    this.cart = salesDetails;

    const subscription = this.posService.resumeTransaction(transaction.businessEntityId, transaction.transactionId)
      .subscribe({
        next: (response) => {
          this.suspendedTransaction = response;
        },
        error: (error: Error) => {
          console.error('Error resuming transaction:', error);
          this.snackBar.open('Failed to resume transaction', 'Close', {duration: 2000});
        }
      });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });

    this.snackBar.open('Transaction is resumed', 'Close', {duration: 2000});
    this.focusBarcodeInput();
  }


}
