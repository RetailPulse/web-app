import {BusinessEntity} from '../business-entity-management/business-entity.model';

export class InventoryTransaction {
  productId!:string;
  quantity!:number;
  costPerUnit!:number;
  source!: number;
  destination!: number;
}


export interface Inventory{
  id: number;
  productId: number;
  businessEntityId: number;
  quantity: number;
  totalCostPrice: number;
}

