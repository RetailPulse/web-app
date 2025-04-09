import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import Fuse from 'fuse.js';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import {
  CartItem,
  SalesDetails,
  SalesTransactionRequest,
  SalesTransactionResponse, SuspendedTransactionRequest,
  Transaction,
  TransientTransaction
} from './pos-system.model';
import {ProductService} from '../product-management/product.service';
import {Product} from '../product-management/product.model';
import {PosSystemService} from './pos-system.service';

@Component({
  selector: 'app-pos-system',
  templateUrl: './pos-system.component.html',
  imports: [
    MatFormField,
    MatIcon,
    ReactiveFormsModule,
    CurrencyPipe,
    MatMenu,
    // DatePipe,
    MatMenuTrigger,
    CommonModule,
    MatLabel,
    MatIconButton,
    MatButton,
    MatMenuItem,
    MatInput,
  ],
  styleUrls: ['./pos-system.component.css']
})

export class PosComponent implements OnInit {
  searchControl = new FormControl('');
  barcodeControl = new FormControl('');
  products: Product[] = [];
  taxLoading: boolean = false;
  salesTax: number = 0;
  // { sku: 'SKU001', description: 'Wireless Mouse', price: 25.99, barcode: '123456789012' },
  // { sku: 'SKU002', description: 'Mechanical Keyboard', price: 89.99, barcode: '234567890123' },
  // { sku: 'SKU003', description: '27" Monitor', price: 199.99, barcode: '345678901234' },
  // { sku: 'SKU004', description: 'USB-C Cable', price: 12.99, barcode: '456789012345' },
  // { sku: 'SKU005', description: 'Noise Cancelling Headphones', price: 149.99, barcode: '567890123456' },
  // { sku: 'SKU006', description: 'Laptop Stand', price: 34.99, barcode: '678901234567' },
  // { sku: 'SKU007', description: 'Bluetooth Speaker', price: 59.99, barcode: '789012345678' },
  // { sku: 'SKU008', description: 'External SSD 1TB', price: 129.99, barcode: '890123456789' },
  // { sku: 'SKU009', description: 'Wireless Charger', price: 19.99, barcode: '901234567890' },
  // { sku: 'SKU010', description: 'Gaming Mouse', price: 49.99, barcode: '012345678901' },

  // ];

  filteredProducts: Product[] = [];
  cart: CartItem[] = [];
  frozenTransactions: Transaction[] = [];
  suspendedTransaction: TransientTransaction[] | null = null;

  private destroyRef = inject(DestroyRef);

  constructor(private snackBar: MatSnackBar, private productService: ProductService,
              private posService: PosSystemService) {
  }


  // const fuse = new Fuse(this.inventoryTransactions, {
  //   keys: ['sku', 'shop', 'category'],
  //   includeScore: true,
  //   threshold: 0.3,
  //   ignoreLocation: true,
  // });
  //
  // this.inventoryTransactions = fuse.search(term).map((result) => result.item);
  ngOnInit(): void {
    this.loadProducts();
    // Initialize Fuse.js for fuzzy search with proper typing
    const fuse = new Fuse<Product>(this.products, {
      keys: ['sku', 'description', 'barcode'],
      threshold: 0.3
    });

    // Search when input changes
    this.searchControl.valueChanges.subscribe(value => {
      if (!value) {
        this.filteredProducts = [...this.products];
        return;
      }
      const results = fuse.search(value);
      this.filteredProducts = results.map(result => result.item);
    });


    // Barcode scanner simulation
    this.barcodeControl.valueChanges.subscribe(value => {
      if (value && value.length >= 12) { // Assuming barcode is 12 digits
        this.addProductByBarcode(value);
        this.barcodeControl.reset();
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products.filter(p => p.active);
      this.filteredProducts = [...this.products];
    });
  }

  addProductByBarcode(barcode: string): void {
    const product = this.products.find(p => p.barcode === barcode);
    if (product) {
      this.addToCart(product);
    } else {
      this.snackBar.open('Product not found', 'Close', {duration: 2000});
    }
  }

  addToCart(product: Product): void {
    const existingItem = this.cart.find(item => item.product.sku === product.sku);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({product, quantity: 1});
    }

    this.calculateSalesTax();
    this.snackBar.open(`${product.description} added to cart`, 'Close', {duration: 1000});
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.calculateSalesTax();
  }

  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      item.quantity = newQuantity;
    } else {
      this.cart = this.cart.filter(cartItem => cartItem !== item);
    }
    this.calculateSalesTax();
  }

  getTotal(): number {
    //suppose to call from the backend
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
        next: (taxResult: number) => {
          console.log('Tax calculation response:', taxResult);
          this.salesTax = taxResult;
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

  // Update your checkout method to include tax
  checkout(): void {
    const totalWithTax = this.getTotalWithTax();

    const salesDetails = this.cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      salesPricePerUnit: item.product.rrp.toString(),
    } as SalesDetails));

    const salesTransactionRequest: SalesTransactionRequest = {
      businessEntityId: 1,
      taxAmount: this.salesTax.toString(),
      totalAmount: totalWithTax.toString(),
      salesDetails
    };

    let transactionResponse: SalesTransactionResponse;

    const subscription = this.posService
      .createTransaction(salesTransactionRequest)
      .subscribe({
        next: (response) => {
          console.log('Transaction created:', response.salesTransactionId);
          transactionResponse = response;
          this.snackBar.open(`Checkout completed. Total: $` + response.totalAmount, 'Close', {duration: 2000});
        },
        error: (error: Error) => {
          console.error('Error creating transaction:', error);
          this.snackBar.open('Failed to create transaction', 'Close', {duration: 2000});
        }
      });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });

    this.cart = [];
    this.salesTax = 0;
  }


  freezeTransaction(): void {
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
      businessEntityId: 1,
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
  }

  unfreezeTransaction(transaction: TransientTransaction): void {
    // map the transaction to the cart
    const salesDetails = transaction.salesDetails.map(item => ({
      product: this.products.find(p => p.id === item.productId) || null,
      quantity: item.quantity,
    } as CartItem));

    this.cart = salesDetails;

    // Call the resumeTransaction method from the service
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
  }
}
