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
  productId: string;
  quantity: number;
  businessEntityId: number;
  totalCostPrice: number;
}
