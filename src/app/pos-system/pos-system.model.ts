import {Product} from '../product-management/product.model';


export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction { // shopping cart c
  items: CartItem[];
  timestamp: Date;
}

export interface SalesDetails {
  productId: number;
  quantity: number;
  salesPricePerUnit: string;
}

export interface TaxResult {
  subTotalAmount: string;
  taxType: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  salesDetails: SalesDetails[];
}

export interface TransientTransaction {
  transactionId: string;
  businessEntityId: number;
  subTotalAmount: string;
  taxType: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  salesDetails: SalesDetails[];
  transactionDateTime: string;
}

export interface SalesTransactionRequest {
  businessEntityId: number;
  taxAmount: string;
  totalAmount: string;
  salesDetails: SalesDetails[];
}

export interface SuspendedTransactionRequest {
  businessEntityId: number;
  salesDetails: SalesDetails[];
}

export interface SalesTransactionResponse {
  salesTransactionId: number;
  businessEntityId: number;
  subTotalAmount: string;
  taxType: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  salesDetails: SalesDetails[];
  transactionDateTime: string;
}
