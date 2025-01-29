import { create } from 'zustand';
import axios from 'axios';
import { getErrorMsg } from '../types/error';
import { Item } from '../types/Item';
import { Purchase, PurchaseExtended } from '../types/Purchase';
import { PurchasedItemNoPurchaseId } from '../types/PurchasedItem';
import { Category, CategoryWithItems } from '@/types/Category';

type CreatePurchase = Pick<Purchase, 'discount' | 'paymentMethod'> & {
  purchasedItems: PurchasedItemNoPurchaseId[];
};

type ItemWithCategory = Omit<Item, 'categoryId'> & { category: Category };

interface PurchasesState {
  items: ItemWithCategory[];
  categories: CategoryWithItems[];
  purchases: PurchaseExtended[];

  loadingData: boolean;
  errorData: string | null;
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

  loadingData: false,
  errorData: null,
  fetchAllData: async (accessToken: string) => {
    set({ loadingData: true, errorData: null });
    try {
      const [itemsResponse, purchasesResponse] = await Promise.all([
        axios.get<ItemWithCategory[]>('/v1/item', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get<Purchase[]>('/v1/purchase', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit: 50 },
        }),
      ]);

      const itemsData = itemsResponse.data;
      const purchasesData = purchasesResponse.data;

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

      const purchases = purchasesData.map((purchase) => {
        return {
          ...purchase,
          purchasedItems: purchase.purchasedItems.map((purchasedItem) => {
            const item = itemsData.find(
              (item) => item.id === purchasedItem.itemId,
            )!;
            return { ...purchasedItem, item };
          }),
        };
      });

      set({
        items: itemsData,
        categories,
        purchases,
        loadingData: false,
      });
    } catch (error) {
      set({ errorData: getErrorMsg(error), loadingData: false });
    }
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
