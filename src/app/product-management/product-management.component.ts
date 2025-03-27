import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import Fuse from 'fuse.js';
import {Column, Product} from './product.model';
import {InputText} from "primeng/inputtext";
import {ProductService} from "./product.service";
import {Textarea} from 'primeng/textarea';


@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    TableModule,
    TagModule,
    FormsModule,
    CurrencyPipe,
    ButtonModule,
    DialogModule,
    InputText,
    CommonModule,
    Textarea,
  ],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  products!: Product[];
  filteredProducts!: Product[];
  searchTerm: string = '';
  displayModal: boolean = false;
  newProduct: Product = new Product();
  modalMode: 'create' | 'update' = 'create';

  cols!: Column[];
  checked: boolean = true;

  constructor(private productService: ProductService) {
  }

  ngOnInit(): void {
    // Use the ProductService to fetch the products from the backend
    this.productService.getProducts().subscribe((data: Product[]) => {
      console.log('Fetched Products:', data);
      // Filter the products to only include those that are active
      this.products = data.filter(product => product.active);
      console.log('Active Products:', this.products);
      this.filteredProducts = this.products;
    });

    this.cols = [
      {field: 'sku', header: 'SKU'},
      {field: 'brand', header: 'Brand'},
      {field: 'category', header: 'Category'},
      {field: 'subcategory', header: 'Subcategory'},
      {field: 'description', header: 'Description'},
      {field: 'rrp', header: 'RRP'},
      {field: 'barcode', header: 'Barcode'},
      {field: 'origin', header: 'Origin'},
      {field: 'uom', header: 'UOM'},
      {field: 'vendorCode', header: 'Vendor Code'}
    ];
  }

  filterProducts(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredProducts = this.products;
      return;
    }

    const fuse = new Fuse(this.products, {
      keys: ['brand', 'sku', 'category', 'subcategory', 'description', 'barcode', 'origin', 'uom', 'vendor_code'],
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
    });

    const results = fuse.search(term);
    this.filteredProducts = results.map(result => result.item);
  }

  createProduct(): void {
    this.newProduct = new Product();
    this.modalMode = 'create';
    this.displayModal = true;

  }

 editProduct(product: Product): void {
   this.newProduct = { ...product };
   this.modalMode = 'update';
   this.displayModal = true;
 }

 saveProduct(): void {
   if (this.modalMode === 'create') {
     this.productService.createProduct(this.newProduct).subscribe((createdProduct: Product) => {
       this.products.push(createdProduct);
       this.filteredProducts = [...this.products];
       this.newProduct = new Product();
       this.displayModal = false;
     }, (error) => {
       console.error('Error creating product:', error);
     });
   } else if (this.modalMode === 'update') {
     this.productService.updateProduct(this.newProduct).subscribe((updatedProduct: Product) => {
       const index = this.products.findIndex(p => p.id === updatedProduct.id);
       this.products[index] = updatedProduct;
       this.filteredProducts = [...this.products];
       this.displayModal = false;
     }, (error) => {
       console.error('Error updating product:', error);
     });
   }
 }


  deleteProduct(product: Product): void {
    this.productService.deleteProduct(product.id).subscribe(() => {
      this.products = this.products.filter(p => p.id !== product.id);
      this.filteredProducts = this.filteredProducts.filter(p => p.id !== product.id);
    }, (error) => {
      console.error('Error deleting product:', error);
    });
  }
}

