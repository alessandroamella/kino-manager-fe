import { Item } from './Item';

export interface PurchasedItem {
  itemId: number;
  purchaseId: number;
  quantity: number;
}

export type PurchasedItemNoPurchaseId = Omit<PurchasedItem, 'purchaseId'>;

export interface PurchasedItemWithItemNoPurchaseId
  extends PurchasedItemNoPurchaseId {
  item?: Item;
}
