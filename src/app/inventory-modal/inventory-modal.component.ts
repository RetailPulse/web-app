import { Component, Inject, OnInit } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogClose} from '@angular/material/dialog';
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
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { InventoryModalService } from './inventory-modal.service';
import { BusinessEntity } from '../business-entity-management/business-entity.model';
import { InventoryTransaction } from './inventory-modal.model';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import {CurrencyMaskModule} from 'ng2-currency-mask';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {CurrencyPipe, NgForOf, NgIf} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-inventory-modal',
  templateUrl: './inventory-modal.component.html',
  imports: [
    MatDialogContent,
    MatFormField,
    MatIcon,
    FormsModule,
    MatInput,
    ReactiveFormsModule,
    MatSelect,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    CurrencyMaskModule,
    MatButton,
    MatRow,
    MatHeaderRow,
    MatTable,
    MatCheckbox,
    MatCellDef,
    MatHeaderCellDef,
    NgIf,
    NgForOf,
    MatRowDef,
    MatHeaderRowDef,
    MatOption,
    MatError,
    MatLabel,
    MatDialogClose,
    MatIconButton,
    CurrencyPipe
  ],
  styleUrls: ['./inventory-modal.component.css']
})
export class InventoryModalComponent implements OnInit {
  importForm: FormGroup;
  products: Product[] = [];
  stores: BusinessEntity[] = [];
  filteredProducts: Product[] = [];
  displayedColumns = ['select', 'sku', 'quantity', 'rrp'];
  selection = new SelectionModel<Product>(true, []);
  searchTerm = '';
  quantityTouched:boolean[] =[];
  costTouched:boolean[] =[];

  constructor(
    private dialogRef: MatDialogRef<InventoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { isModalOpen: boolean },
    private productService: ProductService,
    private businessEntityService: BusinessEntityService,
    private fb: FormBuilder,
    private inventoryModalService: InventoryModalService,
    private snackBar: MatSnackBar
  ) {
    this.importForm = this.fb.group({
      productQuantities: this.fb.array([]),
      sourceBusinessEntity: [null, Validators.required],
      destinationBusinessEntity: [null, Validators.required]
    }, { validators: this.duplicateEntitiesValidator });
  }

  ngOnInit(): void {
    this.initializeData();
  }

  duplicateEntitiesValidator(control: AbstractControl) {
    const source = control.get('sourceBusinessEntity')?.value;
    const destination = control.get('destinationBusinessEntity')?.value;
    return source && destination && source === destination
      ? { duplicateEntities: true }
      : null;
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
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.products];
    } else {
      const fuse = new Fuse(this.products, {
        keys: ['name', 'sku'],
        threshold: 0.3,
        ignoreLocation: true,
      });
      this.filteredProducts = fuse.search(this.searchTerm.trim()).map(result => result.item);
    }
    this.initProductControls();
  }

  initProductControls(): void {
    this.productQuantities.clear();
    this.quantityTouched = [];
    this.costTouched = [];

    this.filteredProducts.forEach(() => {
      this.productQuantities.push(
        new FormControl(1, [Validators.required, Validators.min(1)])
      );
      this.costPerUnits.push(
        new FormControl(0.01, [Validators.required, Validators.min(0.01)])
      );
      this.quantityTouched.push(false);
      this.costTouched.push(false);
    });
  }

  getProductQuantityControl(index: number): FormControl {
    return this.productQuantities.at(index) as FormControl;
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products.filter(p => p.active);
      this.filteredProducts = [...this.products];
      this.initProductControls();
    });
  }

  loadStores(): void {
    this.businessEntityService.getBusinessEntities().subscribe(stores => {
      this.stores = stores;
    });
  }
  markQuantityAsTouched(index: number): void {
    this.quantityTouched[index] = true;
  }


// Helper methods for error display
  shouldShowQuantityError(index: number): boolean {
    const control = this.getProductQuantityControl(index);
    return this.quantityTouched[index] && control.invalid;
  }

  getQuantityErrorMessage(index: number): string {
    const control = this.getProductQuantityControl(index);
    if (control.hasError('required')) {
      return 'Required';
    }
    return control.hasError('min') ? 'Must be positive!' : '';
  }




  toggleProduct(product: Product): void {
    this.selection.toggle(product);
    const index = this.filteredProducts.indexOf(product);
    const quantityControl = this.getProductQuantityControl(index);

    if (this.selection.isSelected(product)) {
      quantityControl.enable();
      this.quantityTouched[index] = false;
      this.costTouched[index] = false;
    } else {
      quantityControl.disable();
      quantityControl.reset(1);
    }
  }

  toggleAllProducts(): void {
    if (this.allSelected) {
      this.selection.clear();
      this.productQuantities.controls.forEach(control => {
        control.disable();
        control.reset(1);
      });
      this.costPerUnits.controls.forEach(control => {
        control.disable();
        control.reset(0.01);
      });
    } else {
      this.filteredProducts.forEach(product => this.selection.select(product));
      this.productQuantities.controls.forEach(control => control.enable());
      this.costPerUnits.controls.forEach(control => control.enable());
    }
  }

  submit(): void {
    if (this.importForm.invalid || this.selection.selected.length === 0) {
      this.importForm.markAllAsTouched();
      return;
    }

    const transactions: InventoryTransaction[] = this.selection.selected.map((product, index) => ({
      productId: product.id,
      quantity: this.getProductQuantityControl(index).value,
      source: this.importForm.value.sourceBusinessEntity,
      destination: this.importForm.value.destinationBusinessEntity,
    }));

    this.inventoryModalService.createInventoryTransaction(transactions).subscribe({
      next: (response) => {
        this.showSuccessNotification('Inventory allocated successfully!');
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error creating inventory transaction:', error);
        console.log(error);
        this.showErrorNotification('Failed to allocate inventory. Please try again.');
      }
    });
  }

  private showSuccessNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private showErrorNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  onBusinessEntitySelected(value: number): void {
    if (this.importForm.value.sourceBusinessEntity === this.importForm.value.destinationBusinessEntity) {
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
