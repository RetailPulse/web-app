import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import Fuse from 'fuse.js';
import {Column, Inventory, InventoryTransaction} from './inventory.model';
import { InventoryService } from './inventory.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { InventoryModalComponent } from '../inventory-modal/inventory-modal.component';
import { forkJoin, map, switchMap } from 'rxjs';
import { BusinessEntityService } from '../business-entity-management/business-entity.service';
import { BusinessEntity } from '../business-entity-management/business-entity.model';
import {ProductService} from '../product-management/product.service';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [
    TableModule,
    TagModule,
    CommonModule,
    MatTab,
    MatTabGroup,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: './inventory-management.component.html',
  styleUrls: ['./inventory-management.component.css'],
})
export class InventoryManagementComponent implements OnInit {
  searchTerm: string = '';
  isMenuOpen: boolean = false;
  isModalOpen: boolean = false;
  inventoryTransactionCols: Column[] = [];
  summaryCols: Column[] = [];
  businessOptions: BusinessEntity[] = []; // Holds the list of business entities for the dropdown
  selectedFilter: number | null = null; // Holds the selected business entity ID
  inventoryTransactions: InventoryTransaction[] = [];
  inventories:Inventory[]=[];
  errorMessage: string = ''; // Holds the error message to be displayed in the table
  shopMap: { [id: number]: string } = {};
  tableData: { productSKU: string; businessEntityName: string; quantity: number; totalCostPrice: number }[]=[];

  constructor(
    private businessEntityService: BusinessEntityService,
    private inventoryService: InventoryService,
    private productService: ProductService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInventoryTransaction();
    this.initializeColumns();
    this.fetchBusinessEntities();
  }

  // Fetch business entities for the dropdown
  fetchBusinessEntities(): void {
    this.businessEntityService.getBusinessEntities().subscribe({
      next: (businessEntities) => {
        this.businessOptions = businessEntities; // Populate the dropdown options
        businessEntities.forEach((entity) => {
          this.shopMap[entity.id] = entity.name; // Populate the shop map
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
          this.tableData = [];
          return;
        }

        // Array to store the combined data
        const tableData: {
            productSKU: string; // Assuming the product object has a `name` field
            businessEntityName: string; // Assuming the business entity object has a `name` field
            quantity: number; totalCostPrice: number;
        }[] = [];

        // Loop through each inventory item
        inventoryData.forEach((item) => {
          // Fetch product details to get the product name
          this.productService.getProductById(item.productId).subscribe({
            next: (product) => {
              // Fetch business entity details to get the business entity name
              this.businessEntityService.getBusinessEntityById(item.businessEntityId).subscribe({
                next: (businessEntity) => {
                  // Combine the data
                  tableData.push({
                    productSKU: product.sku, // Assuming the product object has a `name` field
                    businessEntityName: businessEntity.name, // Assuming the business entity object has a `name` field
                    quantity: item.quantity,
                    totalCostPrice: item.totalCostPrice,
                  });

                  // If all items are processed, assign the combined data to `this.tableData`
                  if (tableData.length === inventoryData.length) {
                    this.tableData = tableData;
                    console.log(this.tableData); // Log the combined data
                  }
                },
                error: (error) => {
                  console.error('Error fetching business entity details:', error);
                }
              });
            },
            error: (error) => {
              console.error('Error fetching product details:', error);
            }
          });
        });
      },
      error: (error) => {
        console.error('Error fetching filtered inventory:', error);
        this.errorMessage = 'An error occurred while fetching filtered inventory.';
      },
    });
  }

  // Load inventory transactions
  private loadInventoryTransaction(): void {
    this.inventoryService.getInventoryTransaction().pipe(
      switchMap((data: any[]) => {
        if (!data || data.length === 0) {
          this.errorMessage = 'No inventory transactions found.';
          return [];
        }

        // Collect all entity ID requests
        const entityRequests = data.flatMap((item) => [
          this.businessEntityService.getBusinessEntityById(item.inventoryTransaction.source),
          this.businessEntityService.getBusinessEntityById(item.inventoryTransaction.destination),
        ]);

        // Perform all requests concurrently
        return forkJoin(entityRequests).pipe(
          map((entities) => {
            return data.map((item, index) => ({
              productSku: item.product.sku,
              quantity: item.inventoryTransaction.quantity,
              costPerUnit: item.inventoryTransaction.costPricePerUnit,
              source: entities[index].name, // Source entity
              destination: entities[index + 1].name, // Destination entity
            }));
          })
        );
      })
    ).subscribe({
      next: (result) => {
        this.inventoryTransactions = result;
        this.errorMessage = ''; // Clear error message on success
      },
      error: (error) => {
        console.error('Error fetching inventory transactions:', error);
        this.inventoryTransactions = [];
        this.errorMessage = 'An error occurred while fetching inventory transactions.';
      },
    });
  }

  // Initialize table columns
  private initializeColumns(): void {
    this.inventoryTransactionCols = [
      { field: 'productSku', header: 'Product SKU' },
      { field: 'quantity', header: 'Quantity' },
      { field: 'costPerUnit', header: 'Cost Per Unit' },
      { field: 'source', header: 'Source' },
      { field: 'destination', header: 'Destination' },
    ];

    this.summaryCols = [
      { field: 'productSKU', header: 'SKU' },
      { field: 'quantity', header: 'Quantity' },
      { field: 'businessEntityName', header: 'Business Entity' },
      { field : 'totalCostPrice', header: 'Total Cost Price'}
    ];
  }

  // Filter products based on search term
  filterProducts(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.inventoryTransactions = [...this.inventoryTransactions];
      return;
    }

    const fuse = new Fuse(this.inventoryTransactions, {
      keys: ['sku', 'shop', 'category'],
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
    });

    this.inventoryTransactions = fuse.search(term).map((result) => result.item);
  }

  // Toggle menu
  toggleMenu(event: MouseEvent): void {
    this.isMenuOpen = !this.isMenuOpen;
    event.stopPropagation();
  }

  // Open modal
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
      this.isMenuOpen = false;
    });
  }
}
