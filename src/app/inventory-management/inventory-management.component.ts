import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import Fuse from 'fuse.js';
import { forkJoin, map, switchMap } from 'rxjs';
import { InventoryService } from './inventory.service';
import { BusinessEntityService } from '../business-entity-management/business-entity.service';
import { ProductService } from '../product-management/product.service';
import { InventoryModalComponent } from '../inventory-modal/inventory-modal.component';
import { BusinessEntity } from '../business-entity-management/business-entity.model';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatOption, MatSelect} from '@angular/material/select';
import {NgForOf, NgIf} from '@angular/common';

interface Column {
  field: string;
  header: string;
}

interface InventoryTransaction {
  productSku: string;
  quantity: number;
  rrp: number;
  source: string;
  destination: string;
}

interface SummaryData {
  productSKU: string;
  businessEntityName: string;
  quantity: number;
}

@Component({
  selector: 'app-inventory-management',
  templateUrl: './inventory-management.component.html',
  imports: [
    MatFormField,
    MatIcon,
    MatInput,
    MatButton,
    FormsModule,
    MatTabGroup,
    MatTab,
    MatCard,
    MatCardContent,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatSelect,
    MatOption,
    MatHeaderRowDef,
    MatRowDef,
    NgForOf,
    MatCellDef,
    MatHeaderCellDef,
    NgIf,
    MatLabel
  ],
  styleUrls: ['./inventory-management.component.css']
})
export class InventoryManagementComponent implements OnInit {
  searchTerm: string = '';
  isModalOpen: boolean = false;

  // Table configurations
  inventoryTransactionCols: Column[] = [
    { field: 'productSku', header: 'Product SKU' },
    { field: 'quantity', header: 'Quantity' },
    { field: 'rrp', header: 'Retail Price' },
    { field: 'source', header: 'Source' },
    { field: 'destination', header: 'Destination' }
  ];

  summaryCols: Column[] = [
    { field: 'productSKU', header: 'SKU' },
    { field: 'quantity', header: 'Quantity' },
    { field: 'rrp', header: 'Retail Price' },
    { field: 'businessEntityName', header: 'Business Entity' },
  ];

  displayedTransactionColumns: string[] = this.inventoryTransactionCols.map(col => col.field);
  displayedSummaryColumns: string[] = this.summaryCols.map(col => col.field);

  // Data sources
  inventoryTransactions = new MatTableDataSource<InventoryTransaction>([]);
  tableData = new MatTableDataSource<SummaryData>([]);

  businessOptions: BusinessEntity[] = [];
  selectedFilter: number | null = null;
  errorMessage: string = '';
  shopMap: { [id: number]: string } = {};

  constructor(
    private businessEntityService: BusinessEntityService,
    private inventoryService: InventoryService,
    private productService: ProductService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInventoryTransaction();
    this.fetchBusinessEntities();
  }

  fetchBusinessEntities(): void {
    this.businessEntityService.getBusinessEntities().subscribe({
      next: (businessEntities) => {
        this.businessOptions = businessEntities;
        businessEntities.forEach((entity) => {
          this.shopMap[entity.id] = entity.name;
        });
      },
      error: (error) => {
        console.error('Error fetching business entities:', error);
      },
    });
  }

  onFilterChange(filterValue: number): void {
    this.inventoryService.getInventoryByBusinessEntity(filterValue).subscribe({
      next: (inventoryData) => {
        if (!inventoryData || inventoryData.length === 0) {
          this.tableData.data = [];
          return;
        }

        const requests = inventoryData.map(item =>
          forkJoin([
            this.productService.getProductById(item.productId),
            this.businessEntityService.getBusinessEntityById(item.businessEntityId)
          ]).pipe(
            map(([product, businessEntity]) => ({
              productSKU: product.sku,
              rrp: product.rrp,
              businessEntityName: businessEntity.name,
              quantity: item.quantity,
              totalCostPrice: item.totalCostPrice
            }))
          )
        );

        forkJoin(requests).subscribe(results => {
          this.tableData.data = results;
        });
      },
      error: (error) => {
        console.error('Error fetching filtered inventory:', error);
        this.errorMessage = 'An error occurred while fetching filtered inventory.';
      },
    });
  }

  private loadInventoryTransaction(): void {
    this.inventoryService.getInventoryTransaction().pipe(
      switchMap((data: any[]) => {
        if (!data || data.length === 0) {
          this.errorMessage = 'No inventory transactions found.';
          return [];
        }

        const entityRequests = data.flatMap((item) => [
          this.businessEntityService.getBusinessEntityById(item.inventoryTransaction.source),
          this.businessEntityService.getBusinessEntityById(item.inventoryTransaction.destination),
        ]);

        return forkJoin(entityRequests).pipe(
          map((entities) => {
            return data.map((item, index) => ({
              productSku: item.product.sku,
              quantity: item.inventoryTransaction.quantity,
              rrp: item.product.rrp,
              source: entities[index * 2].name,
              destination: entities[index * 2 + 1].name,
            }));
          })
        );
      })
    ).subscribe({
      next: (result) => {
        this.inventoryTransactions.data = result;
        this.errorMessage = '';
      },
      error: (error) => {
        console.error('Error fetching inventory transactions:', error);
        this.inventoryTransactions.data = [];
        this.errorMessage = 'An error occurred while fetching inventory transactions.';
      },
    });
  }

  filterProducts(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.inventoryTransactions.filter = '';
      return;
    }

    const fuse = new Fuse(this.inventoryTransactions.data, {
      keys: ['productSku', 'source', 'destination'],
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
    });

    this.inventoryTransactions.filter = term;
  }

  openModal(): void {
    const dialogRef = this.dialog.open(InventoryModalComponent, {
      width: '60%',
      height: 'auto',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Selected Options:', result.selectedOption1, result.selectedOption2);
      }
      this.isModalOpen = false;
    });
  }
}
