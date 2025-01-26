import { create } from 'zustand';
import axios from 'axios';
import { getErrorMsg } from '../types/error';
import { Item } from '../types/Item';
import { Purchase } from '../types/Purchase';
import { PurchasedItemNoPurchaseId } from '../types/PurchaseItem';

type CreatePurchase = Omit<Purchase, 'id' | 'purchasedItems'> & {
  purchasedItems: PurchasedItemNoPurchaseId[];
};

interface PurchasesState {
  items: Item[];
  purchases: Purchase[]; // added purchases array
  loadingItems: boolean;
  errorItems: string | null;
  fetchItems: (accessToken: string) => Promise<void>;

  creatingPurchase: boolean;
  purchaseError: string | null;
  fetchPurchases: (accessToken: string) => Promise<void>; // added fetchPurchases
  createPurchase: (
    accessToken: string,
    purchase: CreatePurchase,
  ) => Promise<boolean>;

  resetPurchaseState: () => void;

  loadingPurchases: boolean; // added loadingPurchases
  errorPurchases: string | null; // added errorPurchases
}

const usePurchasesStore = create<PurchasesState>((set, get) => ({
  items: [],
  loadingItems: false,
  errorItems: null,
  fetchItems: async (accessToken: string) => {
    set({ loadingItems: true, errorItems: null });
    try {
      const { data } = await axios.get<Item[]>('/v1/item', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      set({ items: data, loadingItems: false });
    } catch (error) {
      set({ errorItems: getErrorMsg(error), loadingItems: false });
    }
  },

  creatingPurchase: false,
  purchaseError: null,
  purchases: [],
  loadingPurchases: false, // initialize loadingPurchases
  errorPurchases: null, // initialize errorPurchases
  fetchPurchases: async (accessToken: string) => {
    set({ loadingPurchases: true, errorPurchases: null }); // set loading state for purchases
    try {
      const { data } = await axios.get<Purchase[]>('/v1/purchase', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      set({ purchases: data, loadingPurchases: false }); // set purchases and reset loading
    } catch (error) {
      set({ errorPurchases: getErrorMsg(error), loadingPurchases: false }); // set error and reset loading
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
