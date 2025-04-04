import {Product} from '../product-management/product.model';


export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction { // shopping cart c
  id: number;
  items: CartItem[];
  timestamp: Date;
}

export interface SalesDetails {
  saleId: number;
  productId: number;
  quantity: number;
  salesPricePerUnit: number;
}
