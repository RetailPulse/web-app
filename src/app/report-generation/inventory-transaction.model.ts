import {ProductModel} from './product.model';
import {ProductPricingModel} from './product-pricing.model';
import {BusinessEntityModel} from './business-entity.model';

export interface InventoryTransactionModel {
  transactionId: string;
  product: ProductModel;
  productPricing: ProductPricingModel;
  source: BusinessEntityModel;
  destination: BusinessEntityModel;
  transactionDateTime: string;
}
