import { Component, OnInit } from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import Fuse from 'fuse.js';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import {MatTab} from "@angular/material/tabs";
import {CartItem, ProductCatalog, Transaction} from './pos-system.model';
import {ProductService} from '../product-management/product.service';
import {Product} from '../product-management/product.model';

@Component({
  selector: 'app-pos-system',
  templateUrl: './pos-system.component.html',
  imports: [
    MatFormField,
    MatIcon,
    ReactiveFormsModule,
    CurrencyPipe,
    MatMenu,
    DatePipe,
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


  constructor(private snackBar: MatSnackBar, private productService: ProductService) {}


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
      this.snackBar.open('Product not found', 'Close', { duration: 2000 });
    }
  }

  addToCart(product: Product): void {
    const existingItem = this.cart.find(item => item.product.sku === product.sku);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({ product, quantity: 1 });
    }

    this.snackBar.open(`${product.description} added to cart`, 'Close', { duration: 1000 });
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }

  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      item.quantity = newQuantity;
    } else {
      this.cart = this.cart.filter(cartItem => cartItem !== item);
    }
  }

  getTotal(): number {
    //suppose to call from the backend
    return this.cart.reduce((sum, item) => sum + (item.product.rrp * item.quantity), 0);
  }

  checkout(): void {
    console.log('Checkout completed:', this.cart);
    this.snackBar.open('Checkout completed successfully', 'Close', { duration: 2000 });
    this.cart = [];
  }

  freezeTransaction(): void {
    if (this.cart.length === 0) {
      this.snackBar.open('Cart is empty', 'Close', { duration: 2000 });
      return;
    }

    const transaction: Transaction = {
      id: `TRX-${Date.now()}`,
      items: [...this.cart],
      timestamp: new Date()
    };

    this.frozenTransactions.push(transaction);
    this.cart = [];
    this.snackBar.open('Transaction frozen', 'Close', { duration: 2000 });
  }

  unfreezeTransaction(transaction: Transaction): void {
    this.cart = [...transaction.items];
    this.frozenTransactions = this.frozenTransactions.filter(t => t.id !== transaction.id);
    this.snackBar.open('Transaction unfrozen', 'Close', { duration: 2000 });
  }
}
