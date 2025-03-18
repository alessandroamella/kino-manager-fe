import { Category, CategoryWithItems } from '@/types/Category';
import axios from 'axios';
import { create } from 'zustand';
import { getErrorMsg } from '../types/error';
import { Item } from '../types/Item';
import { Purchase, PurchaseExtended } from '../types/Purchase';
import { PurchasedItemNoPurchaseId } from '../types/PurchasedItem';

type CreatePurchase = Pick<Purchase, 'discount' | 'paymentMethod'> & {
  purchasedItems: PurchasedItemNoPurchaseId[];
};

type ItemWithCategory = Omit<Item, 'categoryId'> & { category: Category };

interface PurchasesState {
  items: ItemWithCategory[];
  categories: CategoryWithItems[];
  purchases: PurchaseExtended[];

  loadingItems: boolean;
  loadingPurchases: boolean;
  errorItems: string | null;
  errorPurchases: string | null;

  // Fetch functions
  fetchItems: () => Promise<void>;
  fetchPurchases: (accessToken: string) => Promise<void>;
  fetchAllData: (accessToken: string) => Promise<void>;

  creatingPurchase: boolean;
  purchaseError: string | null;
  createPurchase: (
    accessToken: string,
    purchase: CreatePurchase,
  ) => Promise<boolean>;
}

const usePurchasesStore = create<PurchasesState>((set, get) => ({
  items: [],
  categories: [],
  purchases: [],

  loadingItems: false,
  loadingPurchases: false,
  errorItems: null,
  errorPurchases: null,

  // Fetch only items and categories
  fetchItems: async () => {
    set({ loadingItems: true, errorItems: null });
    try {
      const response = await axios.get<ItemWithCategory[]>('/v1/item');

      const itemsData = response.data;

      const categories: CategoryWithItems[] = [];
      for (const item of itemsData) {
        const existingCategory = categories.find(
          (category) => category.id === item.category.id,
        );
        if (existingCategory) {
          existingCategory.items.push(item);
        } else {
          categories.push({
            id: item.category.id,
            name: item.category.name,
            items: [item],
            imageUrl: item.imageUrl,
          });
        }
      }

      set({
        items: itemsData,
        categories,
        loadingItems: false,
      });
    } catch (error) {
      set({ errorItems: getErrorMsg(error), loadingItems: false });
    }
  },

  // Fetch only purchases
  fetchPurchases: async (accessToken: string) => {
    set({ loadingPurchases: true, errorPurchases: null });
    try {
      const response = await axios.get<Purchase[]>('/v1/purchase', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 50 },
      });

      const purchasesData = response.data;
      const { items } = get();

      const purchases = purchasesData.map((purchase) => {
        return {
          ...purchase,
          purchasedItems: purchase.purchasedItems.map((purchasedItem) => {
            const item = items.find(
              (item) => item.id === purchasedItem.itemId,
            )!;
            return { ...purchasedItem, item };
          }),
        };
      });

      set({
        purchases,
        loadingPurchases: false,
      });
    } catch (error) {
      set({ errorPurchases: getErrorMsg(error), loadingPurchases: false });
    }
  },

  // Fetch both items and purchases
  fetchAllData: async (accessToken: string) => {
    await get().fetchItems();
    await get().fetchPurchases(accessToken);
  },

  creatingPurchase: false,
  purchaseError: null,
  createPurchase: async (
    accessToken: string,
    newPurchaseData: CreatePurchase,
  ) => {
    set({ creatingPurchase: true, purchaseError: null });

    try {
      const { data: persistedPurchase } = await axios.post<Purchase>(
        '/v1/purchase',
        newPurchaseData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const extendedPersistedPurchase: PurchaseExtended = {
        ...persistedPurchase,
        purchasedItems: persistedPurchase.purchasedItems.map(
          (purchasedItem) => {
            const item = get().items.find(
              (item) => item.id === purchasedItem.itemId,
            )!;
            return { ...purchasedItem, item };
          },
        ),
      };

      // optimistic update
      set((state) => ({
        purchases: [extendedPersistedPurchase, ...state.purchases],
        creatingPurchase: false,
        purchaseError: null,
      }));
      return true;
    } catch (error) {
      set({ purchaseError: getErrorMsg(error), creatingPurchase: false });
      return false;
    }
  },
}));

export default usePurchasesStore;
