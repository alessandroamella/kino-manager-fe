import { BaseDocument } from './BaseDocument';
import { PaymentMethod } from './PaymentMethod';
import {
  PurchasedItem,
  PurchasedItemWithItemNoPurchaseId,
} from './PurchasedItem';

export interface Purchase extends BaseDocument {
  purchaseDate: Date;
  discount: number | null;
  purchasedItems: PurchasedItem[];
  total: number;
  paymentMethod: PaymentMethod;
}

export interface PurchaseExtended extends Omit<Purchase, 'purchasedItems'> {
  purchasedItems: PurchasedItemWithItemNoPurchaseId[];
}
