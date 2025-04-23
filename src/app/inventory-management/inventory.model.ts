import {BusinessEntity} from '../business-entity-management/business-entity.model';

export class InventoryTransaction {
  productId!: number;
  quantity!: number;
  costPerUnit!: number;
  source!:  string;
  destination!: string; // Destination
}
export class Column {
  field!: string;
  header!: string;
}
export interface Inventory{
  productId: number;
  quantity: number;
  businessEntityId: number;
  totalCostPrice: number;
}

export interface Column {
  field: string;
  header: string;
}

export interface InventoryTransaction {
  productSku: string;
  quantity: number;
  rrp: number;
  source: string;
  destination: string;
  date: Date | null;
}

export interface SummaryData {
  productSKU: string;
  businessEntityName: string;
  quantity: number;
  rrp: number;
}
