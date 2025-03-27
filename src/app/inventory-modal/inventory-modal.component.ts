import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent
} from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import Fuse from 'fuse.js';
import { Product } from '../product-management/product.model';
import { ProductService } from '../product-management/product.service';
import { BusinessEntityService } from '../business-entity-management/business-entity.service';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors, ReactiveFormsModule, FormsModule
} from '@angular/forms';
import {CommonModule, CurrencyPipe} from '@angular/common';
import { InventoryModalService } from './inventory-modal.service';
import { BusinessEntity } from '../business-entity-management/business-entity.model';
import {MatError, MatFormField, MatFormFieldModule, MatLabel} from "@angular/material/form-field";
import {MatOption, MatSelect, MatSelectModule} from "@angular/material/select";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {CurrencyMaskModule} from "ng2-currency-mask";
import { MatTableModule} from "@angular/material/table";
import {MatInputModule} from "@angular/material/input";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSortModule} from "@angular/material/sort";
import {InventoryTransaction} from "./inventory-modal.model";

@Component({
  selector: 'app-inventory-modal',
  templateUrl: './inventory-modal.component.html',
  styleUrls: ['./inventory-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormField,
    MatSelect,
    MatOption,
    MatCheckboxModule,
    MatError,
    MatDialogContent,
    ReactiveFormsModule,
    CurrencyMaskModule,
    MatTableModule,
    MatLabel,
    FormsModule,
    CommonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule
  ],
  providers: [CurrencyPipe]
})
export class InventoryModalComponent implements OnInit {
  importForm!: FormGroup;
  products: Product[] = [];
  stores: BusinessEntity[] = [];
  filteredProducts: Product[] = [];
  displayedColumns = ['select', 'sku', 'quantity', 'costPerUnit'];
  selection = new SelectionModel<Product>(true, []);
  searchTerm = '';

  constructor(
    private dialogRef: MatDialogRef<InventoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { isModalOpen: boolean },
    private productService: ProductService,
    private businessEntityService: BusinessEntityService,
    private fb: FormBuilder,
    private inventoryModalService: InventoryModalService,
  ) {}

  ngOnInit(): void {
    this.importForm = this.fb.group(
      {
        productQuantities: this.fb.array([]),
        costPerUnits: this.fb.array([]),
        sourceBusinessEntity: [null, Validators.required],
        destinationBusinessEntity: [null, Validators.required]
      },
      { validators: this.duplicateEntitiesValidator }
    );

    this.initializeData();
  }

  // Custom Validator to ensure Source and Destination are not the same
  duplicateEntitiesValidator(control: AbstractControl): ValidationErrors | null {
    const source = control.get('sourceBusinessEntity')?.value;
    const destination = control.get('destinationBusinessEntity')?.value;
    return source && destination && source === destination ? { duplicateEntities: true } : null;
  }

  get productQuantities(): FormArray {
    return this.importForm.get('productQuantities') as FormArray;
  }

  get costPerUnits(): FormArray {
    return this.importForm.get('costPerUnits') as FormArray;
  }

  get allSelected(): boolean {
    return this.selection.selected.length === this.filteredProducts.length && this.filteredProducts.length > 0;
  }

  filterProducts(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredProducts = [...this.products];
    } else {
      const fuse = new Fuse(this.products, {
        keys: ['name', 'sku'],
        threshold: 0.3,
        ignoreLocation: true,
      });
      this.filteredProducts = fuse.search(term).map(result => result.item);
    }
    this.initProductQuantityControls();
  }

  initProductQuantityControls(): void {
    this.productQuantities.clear();
    this.costPerUnits.clear();

    this.filteredProducts.forEach(() => {
      this.productQuantities.push(
        new FormControl(1, [Validators.required, Validators.min(1)])
      );
      this.costPerUnits.push(
        new FormControl(0, [Validators.required, Validators.min(0.01)])
      );
    });

    this.importForm.updateValueAndValidity();
  }

  getProductQuantityControl(index: number): FormControl {
    return this.productQuantities.at(index) as FormControl;
  }

  getCostPerUnitControl(index: number): FormControl {
    return this.costPerUnits.at(index) as FormControl;
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products.filter(p => p.active);
      this.filteredProducts = [...this.products];
      this.initProductQuantityControls();
    });
  }

  loadStores(): void {
    this.businessEntityService.getBusinessEntities().subscribe(stores => {
      this.stores = stores;
    });
  }

  toggleProduct(product: Product): void {
    this.selection.toggle(product);
    const index = this.filteredProducts.indexOf(product);
    const control = this.getProductQuantityControl(index);
    if (!this.selection.isSelected(product)) {
      control.reset(1);
    }
  }

  toggleAllProducts(): void {
    if (this.allSelected) {
      this.selection.clear();
      this.productQuantities.controls.forEach(control => {
        control.disable();
        control.reset(1);
      });
    } else {
      this.filteredProducts.forEach(product => this.selection.select(product));
      this.productQuantities.controls.forEach(control => control.enable());
    }
  }

  submit(): void {
    if (this.importForm.invalid) {
      this.importForm.markAllAsTouched();
      return;
    }

    const importData: InventoryTransaction[] = this.selection.selected.map((product, index) => ({
      productId: product.id,
      quantity: this.getProductQuantityControl(index).value,
      costPerUnit: this.getCostPerUnitControl(index).value,
      source: this.importForm.get('sourceBusinessEntity')?.value,
      destination: this.importForm.get('destinationBusinessEntity')?.value,
    }));

    console.log("Import Data:", importData);
    this.inventoryModalService.createInventoryTransaction(importData).subscribe(
        (response: any) => {
        console.log('Inventory Transaction Created:', response);
        this.dialogRef.close(response);
      },
        (error: any) => console.error('Error creating inventory transaction:', error)
    );
  }

  onBusinessEntitySelected(event: any): void {
    console.log('Business Entity Selected:', event);
    if (this.importForm.get('sourceBusinessEntity')?.value === this.importForm.get('destinationBusinessEntity')?.value) {
      this.importForm.get('destinationBusinessEntity')?.setErrors({ duplicateEntities: true });
    } else {
      this.importForm.get('destinationBusinessEntity')?.setErrors(null);
    }
  }

  close(): void {
    this.dialogRef.close();
    this.data.isModalOpen = false;
  }

  private initializeData(): void {
    this.loadProducts();
    this.loadStores();
  }
}
