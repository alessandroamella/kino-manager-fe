export interface PurchaseItem {
  itemId: number;
  purchaseId: number;
  quantity: number;
}

export type PurchasedItemNoPurchaseId = Omit<PurchaseItem, 'purchaseId'>;
