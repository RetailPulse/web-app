import {Product} from '../product-management/product.model';

export interface ProductCatalog {
  sku: string;
  description: string;
  price: number;
  barcode: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction { // shopping cart c
  id: string;
  items: CartItem[];
  timestamp: Date;
}

