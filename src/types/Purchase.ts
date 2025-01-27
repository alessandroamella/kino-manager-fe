import { BaseDocument } from './BaseDocument';
import { PurchaseItem } from './PurchaseItem';

export interface Purchase extends BaseDocument {
  purchaseDate: Date;
  discount: number | null;
  purchasedItems: PurchaseItem[];
}
