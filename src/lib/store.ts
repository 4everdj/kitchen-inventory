'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Item,
  Category,
  Household,
  ShoppingListItem,
  ItemStatus,
  QuantityLevel,
  ItemLocation,
  ItemHistory,
} from '@/types';
import { generateId } from './utils';

// Default system categories (mirrors DB seed)
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-dairy', household_id: null, name: 'Dairy', icon: '🥛', sort_order: 10 },
  { id: 'cat-meat', household_id: null, name: 'Meat', icon: '🥩', sort_order: 20 },
  { id: 'cat-seafood', household_id: null, name: 'Seafood', icon: '🐟', sort_order: 30 },
  { id: 'cat-produce', household_id: null, name: 'Produce', icon: '🥬', sort_order: 40 },
  { id: 'cat-fruit', household_id: null, name: 'Fruit', icon: '🍎', sort_order: 50 },
  { id: 'cat-veg', household_id: null, name: 'Vegetables', icon: '🥦', sort_order: 60 },
  { id: 'cat-bev', household_id: null, name: 'Beverages', icon: '🥤', sort_order: 70 },
  { id: 'cat-canned', household_id: null, name: 'Canned Goods', icon: '🥫', sort_order: 80 },
  { id: 'cat-bakery', household_id: null, name: 'Bakery', icon: '🍞', sort_order: 90 },
  { id: 'cat-pasta', household_id: null, name: 'Pasta & Grains', icon: '🍝', sort_order: 100 },
  { id: 'cat-cond', household_id: null, name: 'Condiments & Sauces', icon: '🧂', sort_order: 110 },
  { id: 'cat-pantry', household_id: null, name: 'Pantry', icon: '📦', sort_order: 120 },
  { id: 'cat-frozen', household_id: null, name: 'Frozen', icon: '❄️', sort_order: 130 },
  { id: 'cat-snacks', household_id: null, name: 'Snacks', icon: '🍿', sort_order: 140 },
  { id: 'cat-breakfast', household_id: null, name: 'Breakfast', icon: '🥣', sort_order: 150 },
  { id: 'cat-household', household_id: null, name: 'Household', icon: '🧴', sort_order: 160 },
  { id: 'cat-kids', household_id: null, name: 'Kids', icon: '🧒', sort_order: 170 },
  { id: 'cat-pet', household_id: null, name: 'Pet', icon: '🐕', sort_order: 180 },
  { id: 'cat-other', household_id: null, name: 'Other', icon: '📦', sort_order: 999 },
];

const DEMO_HOUSEHOLD_ID = 'hh-demo-001';

interface AppState {
  // Auth (local mock)
  userId: string | null;
  userName: string | null;

  // Households
  households: Household[];
  activeHouseholdId: string | null;

  // Data
  categories: Category[];
  items: Item[];
  shoppingList: ShoppingListItem[];
  history: ItemHistory[];

  // Actions
  login: (name: string) => void;
  logout: () => void;
  setActiveHousehold: (id: string) => void;
  createHousehold: (name: string) => string;

  // Items
  addItem: (data: Partial<Item> & { name: string }) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  setItemStatus: (id: string, status: ItemStatus) => void;
  markPurchased: (id: string) => void;

  // Shopping
  addToShoppingList: (name: string, itemId?: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearCheckedShopping: () => void;

  // Categories
  addCategory: (name: string, icon?: string) => void;

  // Helpers
  getActiveItems: () => Item[];
  getItemsByStatus: (status: ItemStatus) => Item[];
  getCategoryById: (id: string | null) => Category | undefined;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      userName: null,
      households: [],
      activeHouseholdId: null,
      categories: DEFAULT_CATEGORIES,
      items: [],
      shoppingList: [],
      history: [],

      login: (name) => {
        const userId = generateId();
        set({ userId, userName: name });
        // Auto-create demo household if none
        const state = get();
        if (state.households.length === 0) {
          const hhId = get().createHousehold('My Home');
          // Seed a few demo items
          get().addItem({
            name: 'Milk',
            status: 'low',
            category_id: 'cat-dairy',
            location: 'refrigerator',
            quantity_level: 'quarter',
            brand: 'Organic Valley',
            notes: '2% milk',
          });
          get().addItem({
            name: 'Eggs',
            status: 'out',
            category_id: 'cat-dairy',
            location: 'refrigerator',
            quantity_level: 'empty',
          });
          get().addItem({
            name: 'Bananas',
            status: 'out',
            category_id: 'cat-fruit',
            location: 'kitchen',
          });
          get().addItem({
            name: 'Chicken Breast',
            status: 'available',
            category_id: 'cat-meat',
            location: 'freezer',
            quantity_level: 'half',
          });
          get().addItem({
            name: 'Orange Juice',
            status: 'low',
            category_id: 'cat-bev',
            location: 'refrigerator',
            quantity_level: 'quarter',
          });
          get().addItem({
            name: 'Yogurt',
            status: 'available',
            category_id: 'cat-dairy',
            location: 'refrigerator',
            quantity_level: 'full',
          });
        }
      },

      logout: () => set({ userId: null, userName: null, activeHouseholdId: null }),

      setActiveHousehold: (id) => set({ activeHouseholdId: id }),

      createHousehold: (name) => {
        const id = generateId();
        const hh: Household = {
          id,
          name,
          created_by: get().userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((s) => ({
          households: [...s.households, hh],
          activeHouseholdId: id,
        }));
        return id;
      },

      addItem: (data) => {
        const state = get();
        const householdId = state.activeHouseholdId || DEMO_HOUSEHOLD_ID;
        const now = new Date().toISOString();
        const item: Item = {
          id: generateId(),
          household_id: householdId,
          name: data.name,
          category_id: data.category_id ?? null,
          brand: data.brand ?? null,
          status: data.status ?? 'available',
          quantity_level: data.quantity_level ?? null,
          quantity_value: data.quantity_value ?? null,
          quantity_unit: data.quantity_unit ?? null,
          location: data.location ?? 'pantry',
          image_path: data.image_path ?? null,
          image_url: data.image_url ?? null,
          expiration_date: data.expiration_date ?? null,
          notes: data.notes ?? null,
          created_by: state.userId,
          updated_by: state.userId,
          created_at: now,
          updated_at: now,
          purchased_at: data.status === 'available' ? now : null,
          is_deleted: false,
        };
        set((s) => ({ items: [item, ...s.items] }));

        // Auto-add to shopping list if out
        if (item.status === 'out') {
          get().addToShoppingList(item.name, item.id);
        }

        // History
        set((s) => ({
          history: [
            {
              id: generateId(),
              item_id: item.id,
              household_id: householdId,
              status: item.status,
              quantity_level: item.quantity_level,
              changed_by: state.userId,
              changed_at: now,
              note: 'Created',
            },
            ...s.history,
          ],
        }));

        return item;
      },

      updateItem: (id, updates) => {
        const now = new Date().toISOString();
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id
              ? { ...item, ...updates, updated_at: now, updated_by: s.userId }
              : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id ? { ...item, is_deleted: true, updated_at: new Date().toISOString() } : item
          ),
          shoppingList: s.shoppingList.filter((si) => si.item_id !== id),
        }));
      },

      setItemStatus: (id, status) => {
        const state = get();
        const item = state.items.find((i) => i.id === id);
        if (!item) return;

        const now = new Date().toISOString();
        const updates: Partial<Item> = {
          status,
          updated_at: now,
          updated_by: state.userId,
        };

        if (status === 'available') {
          updates.purchased_at = now;
          // Remove from shopping list
          set((s) => ({
            shoppingList: s.shoppingList.filter((si) => si.item_id !== id),
          }));
        } else if (status === 'out') {
          // Ensure on shopping list
          const already = state.shoppingList.some((si) => si.item_id === id && !si.checked);
          if (!already) {
            get().addToShoppingList(item.name, id);
          }
        }

        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
          history: [
            {
              id: generateId(),
              item_id: id,
              household_id: item.household_id,
              status,
              quantity_level: item.quantity_level,
              changed_by: state.userId,
              changed_at: now,
              note: `Status → ${status}`,
            },
            ...s.history,
          ],
        }));
      },

      markPurchased: (id) => {
        get().setItemStatus(id, 'available');
      },

      addToShoppingList: (name, itemId) => {
        const state = get();
        const householdId = state.activeHouseholdId || DEMO_HOUSEHOLD_ID;
        // Avoid duplicates
        if (itemId && state.shoppingList.some((si) => si.item_id === itemId && !si.checked)) {
          return;
        }
        const entry: ShoppingListItem = {
          id: generateId(),
          household_id: householdId,
          item_id: itemId ?? null,
          name,
          checked: false,
          quantity_note: null,
          created_by: state.userId,
          created_at: new Date().toISOString(),
          sort_order: state.shoppingList.length,
        };
        set((s) => ({ shoppingList: [...s.shoppingList, entry] }));
      },

      toggleShoppingItem: (id) => {
        const state = get();
        const si = state.shoppingList.find((s) => s.id === id);
        if (!si) return;

        const newChecked = !si.checked;
        set((s) => ({
          shoppingList: s.shoppingList.map((item) =>
            item.id === id ? { ...item, checked: newChecked } : item
          ),
        }));

        // If checking off and linked to inventory item → mark available
        if (newChecked && si.item_id) {
          get().markPurchased(si.item_id);
        }
      },

      removeShoppingItem: (id) => {
        set((s) => ({
          shoppingList: s.shoppingList.filter((si) => si.id !== id),
        }));
      },

      clearCheckedShopping: () => {
        set((s) => ({
          shoppingList: s.shoppingList.filter((si) => !si.checked),
        }));
      },

      addCategory: (name, icon = '📦') => {
        const state = get();
        const cat: Category = {
          id: generateId(),
          household_id: state.activeHouseholdId,
          name,
          icon,
          sort_order: 500,
          created_by: state.userId,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ categories: [...s.categories, cat] }));
      },

      getActiveItems: () => {
        const state = get();
        const hhId = state.activeHouseholdId;
        return state.items
          .filter((i) => !i.is_deleted && (!hhId || i.household_id === hhId))
          .sort((a, b) => {
            const pa = a.status === 'out' ? 0 : a.status === 'low' ? 1 : 2;
            const pb = b.status === 'out' ? 0 : b.status === 'low' ? 1 : 2;
            if (pa !== pb) return pa - pb;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });
      },

      getItemsByStatus: (status) => {
        return get().getActiveItems().filter((i) => i.status === status);
      },

      getCategoryById: (id) => {
        if (!id) return undefined;
        return get().categories.find((c) => c.id === id);
      },
    }),
    {
      name: 'kitchen-inventory-storage',
      partialize: (state) => ({
        userId: state.userId,
        userName: state.userName,
        households: state.households,
        activeHouseholdId: state.activeHouseholdId,
        categories: state.categories,
        items: state.items,
        shoppingList: state.shoppingList,
        history: state.history,
      }),
    }
  )
);
