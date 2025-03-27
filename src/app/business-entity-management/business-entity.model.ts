export interface BusinessEntity {
  id: number;
  name: string;
  location: string;  
  type: string;
  active: boolean;
  external: boolean;
}

export interface BusinessEntityDTO {
  name: string;
  location: string;  
  type: string;
  external: boolean;
}

export const BusinessEntityType = [
  { label: 'Shop', value: 'Shop' },
  { label: 'Central Inventory', value: 'CentralInventory' },
  { label: 'Supplier', value: 'Supplier' },
];