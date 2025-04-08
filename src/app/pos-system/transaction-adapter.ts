// src/app/pos-system/transaction-adapter.ts
import { Transaction, SalesDetails } from './pos-system.model';

export class TransactionAdapter {
  static mapTransactionToSalesDetails(transaction: Transaction): SalesDetails[] {
    return transaction.items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      salesPricePerUnit: item.product.rrp.toString(),
    } as SalesDetails));
  }
}
