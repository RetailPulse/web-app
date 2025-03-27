export class Product {
  id!: string;            // Unique identifier for the product
  sku!: string;           // SKU (Stock Keeping Unit)
  brand!: string;         // Product brand
  category!: string;      // Product category
  subcategory!: string;   // Product subcategory
  description!: string;   // Short description of the product
  rrp!: number;           // Recommended Retail Price (RRP)
  active: boolean = true;     // Active status of the product (if it's available)
  barcode!: string;       // Barcode for the product
  origin!: string;        // Product's country of origin
  uom!: string;           // Unit of Measure (e.g., kg, liters, etc.)
  vendorCode!: string;   // Vendor code for the product

}

export class Column {
  field!: string;
  header!: string;
}
