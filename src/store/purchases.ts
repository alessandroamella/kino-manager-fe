import { create } from 'zustand';
import axios from 'axios';
import { getErrorMsg } from '../types/error';
import { Item } from '../types/Item';
import { Purchase } from '../types/Purchase';
import { PurchasedItemNoPurchaseId } from '../types/PurchaseItem';
import { Category, CategoryWithItems } from '@/types/Category';

type CreatePurchase = Omit<
  Purchase,
  'id' | 'purchasedItems' | 'createdAt' | 'updatedAt'
> & {
  purchasedItems: PurchasedItemNoPurchaseId[];
};

type ItemWithCategory = Omit<Item, 'categoryId'> & { category: Category };

interface PurchasesState {
  items: ItemWithCategory[];
  categories: CategoryWithItems[];
  purchases: Purchase[];
  loadingItems: boolean;
  errorItems: string | null;
  fetchItems: (accessToken: string) => Promise<void>;

  creatingPurchase: boolean;
  purchaseError: string | null;
  fetchPurchases: (accessToken: string) => Promise<void>;
  createPurchase: (
    accessToken: string,
    purchase: CreatePurchase,
  ) => Promise<boolean>;

  resetPurchaseState: () => void;

  loadingPurchases: boolean;
  errorPurchases: string | null;
}

const usePurchasesStore = create<PurchasesState>((set, get) => ({
  items: [],
  loadingItems: false,
  errorItems: null,
  categories: [],
  fetchItems: async (accessToken: string) => {
    set({ loadingItems: true, errorItems: null });
    try {
      const { data } = await axios.get<ItemWithCategory[]>('/v1/item', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const categories: CategoryWithItems[] = [];
      for (const item of data) {
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

      console.log('Items:', data, 'Categories:', categories);
      set({
        items: data,
        loadingItems: false,
        categories,
      });
    } catch (error) {
      set({ errorItems: getErrorMsg(error), loadingItems: false });
    }
  },

  creatingPurchase: false,
  purchaseError: null,
  purchases: [],
  loadingPurchases: false,
  errorPurchases: null,
  fetchPurchases: async (accessToken: string) => {
    set({ loadingPurchases: true, errorPurchases: null });
    try {
      const { data } = await axios.get<Purchase[]>('/v1/purchase', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      set({ purchases: data, loadingPurchases: false });
    } catch (error) {
      set({ errorPurchases: getErrorMsg(error), loadingPurchases: false });
    }
  },
  createPurchase: async (accessToken: string, purchase: CreatePurchase) => {
    set({ creatingPurchase: true, purchaseError: null });
    try {
      await axios.post('/v1/purchase', purchase, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      set({ creatingPurchase: false, purchaseError: null });
      await get().fetchPurchases(accessToken);
      return true;
    } catch (error) {
      set({ purchaseError: getErrorMsg(error), creatingPurchase: false });
      return false;
    }
  },
  resetPurchaseState: () => {
    set({ purchaseError: null, creatingPurchase: false });
  },
}));

export default usePurchasesStore;
