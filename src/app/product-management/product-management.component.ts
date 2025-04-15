import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from '@angular/material/dialog';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import Fuse from 'fuse.js';
import { Product } from './product.model';
import { ProductService } from './product.service';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {CurrencyPipe, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault} from '@angular/common';
import {MatChip, MatChipListbox} from '@angular/material/chips';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatButton, MatFabButton, MatIconButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  imports: [
    MatFormField,
    MatIcon,
    FormsModule,
    MatTable,
    NgSwitch,
    MatColumnDef,
    MatChip,
    CurrencyPipe,
    ReactiveFormsModule,
    MatSlideToggle,
    MatButton,
    MatInput,
    MatFabButton,
    MatHeaderCell,
    MatCell,
    MatChipListbox,
    MatIconButton,
    MatHeaderRow,
    MatRow,
    MatHeaderCellDef,
    NgForOf,
    MatCellDef,
    NgSwitchCase,
    NgSwitchDefault,
    MatHeaderRowDef,
    MatRowDef,
    MatLabel,
    MatDialogClose,
  ],
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  displayModal: boolean = false;
  modalMode: 'create' | 'update' = 'create';
  productForm: FormGroup;

  cols = [
    {field: 'sku', header: 'SKU'},
    {field: 'brand', header: 'Brand'},
    {field: 'category', header: 'Category'},
    {field: 'subcategory', header: 'Subcategory'},
    {field: 'description', header: 'Description'},
    {field: 'rrp', header: 'RRP'},
    {field: 'barcode', header: 'Barcode'},
    {field: 'origin', header: 'Origin'},
    {field: 'uom', header: 'UOM'},
    {field: 'vendorCode', header: 'Vendor Code'},
    {field: 'is_active', header: 'Status'}
  ];

  displayedColumns: string[] = [...this.cols.map(col => col.field), 'actions'];
  @ViewChild('productDialog') productDialogTemplate!: TemplateRef<any>;
  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.productForm = this.fb.group({
      id: [''],
      sku: ['', Validators.required],
      brand: ['', Validators.required],
      category: ['', Validators.required],
      subcategory: [''],
      description: [''],
      rrp: [0, [Validators.required, Validators.min(0)]],
      barcode: [''],
      origin: [''],
      uom: [''],
      vendorCode: [''],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe((data: Product[]) => {
      this.products = data.filter(product => product.active);
      this.filteredProducts = this.products;
    });
  }

  filterProducts(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredProducts = this.products;
      return;
    }

    const fuse = new Fuse(this.products, {
      keys: ['brand', 'sku', 'category', 'subcategory', 'description', 'barcode', 'origin', 'uom', 'vendorCode'],
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
    });

    const results = fuse.search(term);
    this.filteredProducts = results.map(result => result.item);
  }

  openDialog() {
    this.dialog.open(this.productDialogTemplate, {
      width: '800px',
      disableClose: true // Optional: prevents closing by clicking outside
    });
  }


  createProduct(): void {
    this.productForm.reset({ is_active: true });
    this.modalMode = 'create';
    this.openDialog();
  }

  editProduct(product: Product): void {
    this.productForm.patchValue({
      ...product,
      is_active: product.active || false
    });
    this.modalMode = 'update';
    this.openDialog();
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      return;
    }

    const productData = this.productForm.value;

    if (this.modalMode === 'create') {
      this.productService.createProduct(productData).subscribe({
        next: (createdProduct) => {
          this.products.push(createdProduct);
          this.filteredProducts = [...this.products];
          this.dialog.closeAll();
        },
        error: (error) => console.error('Error creating product:', error)
      });
    } else {
      this.productService.updateProduct(productData).subscribe({
        next: (updatedProduct) => {
          const index = this.products.findIndex(p => p.id === updatedProduct.id);
          this.products[index] = updatedProduct;
          this.filteredProducts = [...this.products];
          this.dialog.closeAll();
        },
        error: (error) => console.error('Error updating product:', error)
      });
    }
  }

  deleteProduct(product: Product): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(product.id.toString()).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
          this.filteredProducts = this.filteredProducts.filter(p => p.id !== product.id);
        },
        error: (error) => console.error('Error deleting product:', error)
      });
    }
  }
}
