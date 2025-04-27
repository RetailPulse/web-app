import {Component, OnInit, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef, MatTable,
  MatTableDataSource
} from '@angular/material/table';
import { forkJoin, map, switchMap } from 'rxjs';
import { InventoryService } from './inventory.service';
import { BusinessEntityService } from '../business-entity-management/business-entity.service';
import { ProductService } from '../product-management/product.service';
import { InventoryModalComponent } from '../inventory-modal/inventory-modal.component';
import { BusinessEntity } from '../business-entity-management/business-entity.model';
import {MatPaginator} from '@angular/material/paginator';
import {CurrencyPipe, DatePipe, NgForOf, NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatOptgroup, MatOption} from '@angular/material/core';
import {FormsModule} from '@angular/forms';
import { MatLabel, MatSelect} from '@angular/material/select';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatSort} from '@angular/material/sort';
import Fuse from 'fuse.js';
import {MatInput} from '@angular/material/input';
import {Column, InventoryTransaction, SummaryData} from './inventory.model';


@Component({
  selector: 'app-inventory-management',
  templateUrl: './inventory-management.component.html',
  imports: [
    MatFormFieldModule,
    MatPaginator,
    MatRow,
    MatHeaderRow,
    MatCell,
    MatHeaderCell,
    MatColumnDef,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRowDef,
    MatRowDef,
    CurrencyPipe,
    NgIf,
    MatTable,
    MatIcon,
    MatButton,
    MatProgressSpinner,
    MatOption,
    FormsModule,
    MatSelect,
    NgForOf,
    MatLabel,
    MatTab,
    MatTabGroup,
    MatCard,
    MatCardContent,
    MatInput,
    DatePipe,
    MatOptgroup,
  ],
  styleUrls: ['./inventory-management.component.css']
})
export class InventoryManagementComponent implements OnInit {
  searchTerm: string = '';
  isModalOpen: boolean = false;
  isLoading: boolean = false;

  // Table configurations
  inventoryTransactionCols: Column[] = [
    { field: 'productSku', header: 'Product SKU' },
    { field: 'quantity', header: 'Quantity' },
    { field: 'rrp', header: 'Retail Price' },
    { field: 'source', header: 'Source' },
    { field: 'destination', header: 'Destination' },
    { field: 'insertedAt', header: 'Date' },
  ];

  summaryCols: Column[] = [
    { field: 'productSKU', header: 'SKU' },
    { field: 'quantity', header: 'Quantity' },
    { field: 'rrp', header: 'Retail Price' },
    { field: 'businessEntityName', header: 'Business Entity' },
  ];

  displayedTransactionColumns = this.inventoryTransactionCols.map(col => col.field);
  displayedSummaryColumns = this.summaryCols.map(col => col.field);
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
  private fuseTransactionOptions = {
    keys: ['productSku', 'source', 'destination'],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true
  };

  private fuseSummaryOptions = {
    keys: ['productSKU', 'businessEntityName'],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadData();
    setTimeout(() => {
      if (this.sort) {
        this.inventoryTransactions.sort = this.sort;
        // Set default sort to insertedAt descending
        this.sort.sort({
          id: 'insertedAt',
          start: 'asc',
          disableClear: false
        });
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.fetchBusinessEntities();
    this.loadInventoryTransaction();
  }

  private refreshData(): void {
    this.loadInventoryTransaction();
    if (this.selectedFilter) {
      this.onFilterChange(this.selectedFilter);
    }
  }

  applyFilter(): void {
    const term = this.searchTerm.trim();

    if (!term) {
      // If search term is empty, show all data
      this.inventoryTransactions.filter = '';
      this.tableData.filter = '';
      return;
    }

    // Filter transactions table
    if (this.inventoryTransactions.data.length) {
      const fuse = new Fuse(this.inventoryTransactions.data, this.fuseTransactionOptions);
      const results = fuse.search(term).map(r => r.item);
      this.inventoryTransactions.filteredData = results;
    }

    // Filter summary table
    if (this.tableData.data.length) {
      const fuse = new Fuse(this.tableData.data, this.fuseSummaryOptions);
      const results = fuse.search(term).map(r => r.item);
      this.tableData.filteredData = results;
    }
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
        this.isLoading = false;
      },
    });
  }

  onFilterChange(filterValue: number): void {
    this.isLoading = true;
    this.inventoryService.getInventoryByBusinessEntity(filterValue).subscribe({
      next: (inventoryData) => {
        if (!inventoryData || inventoryData.length === 0) {
          this.tableData.data = [];
          this.isLoading = false;
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
              quantity: item.quantity
            }))
          )
        );

        forkJoin(requests).subscribe({
          next: results => {
            this.tableData= new MatTableDataSource(results);
            this.tableData.paginator = this.paginator;
            this.tableData.sort = this.sort;
            this.isLoading = false;
          },
          error: error => {
            console.error('Error processing inventory data:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error fetching filtered inventory:', error);
        this.errorMessage = 'Failed to load inventory data';
        this.isLoading = false;
      },
    });
  }

  private loadInventoryTransaction(): void {
    this.isLoading = true;
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
            return data.map((item, index) => {
              return {
                productSku: item.product.sku,
                quantity: item.inventoryTransaction.quantity,
                rrp: item.product.rrp,
                source: entities[index * 2].name,
                destination: entities[index * 2 + 1].name,
                insertedAt: new Date(item.inventoryTransaction.insertedAt) // Make sure this is included
              } as InventoryTransaction;
            });
          })
        );
      })
    ).subscribe({
      next: (result) => {
        this.inventoryTransactions.data = result;
        this.inventoryTransactions.sort = this.sort; // Set sort here as well
        this.errorMessage = '';
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching inventory transactions:', error);
        this.inventoryTransactions.data = [];
        this.errorMessage = 'Failed to load transactions';
        this.isLoading = false;
      },
    });
  }

  openModal(): void {
    this.isModalOpen = true;
    const dialogRef = this.dialog.open(InventoryModalComponent, {
      width: '80%',
      maxWidth: '1000px',
      height: 'auto',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.isModalOpen = false;
      if (result) {
        this.refreshData();
      }
    });
  }
}
