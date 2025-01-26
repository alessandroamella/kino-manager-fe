import { PurchaseItem } from './PurchaseItem';

export interface Purchase {
  id: number;
  purchaseDate: Date;
  discount?: number;
  purchasedItems: PurchaseItem[];
}
