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
  insertedAt: Date | null;
}

export interface SummaryData {
  productSKU: string;
  businessEntityName: string;
  quantity: number;
  rrp: number;
}
