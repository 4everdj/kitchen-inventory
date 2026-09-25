'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from './utils';
import { supabase } from './supabase';
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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setActiveHousehold: (id: string) => void;
  createHousehold: (name: string) => string;
  loadHouseholdData: () => Promise<void>;
  subscribeToRealtime: () => () => void;

  // Items
addItem: (
  data: Partial<Item> & {
    name: string;
    imageFile?: File | null;
  }
) => Promise<Item>;
updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
deleteItem: (id: string) => Promise<void>;
setItemStatus: (id: string, status: ItemStatus) => Promise<void>;
  markPurchased: (id: string) => void;

  // Shopping
addToShoppingList: (name: string, itemId?: string) => Promise<void>;
toggleShoppingItem: (id: string) => Promise<void>;
removeShoppingItem: (id: string) => Promise<void>;
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

      login: async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Login failed.');
  }

  const user = data.user;

  // Find the household membership for this user
  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

if (!membership) {
  set({
    userId: user.id,
    userName: user.email ?? 'User',
    households: [],
    activeHouseholdId: null,
  });

  return;
}

  // Load the household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('id', membership.household_id)
    .single();

  if (householdError) {
    throw new Error(householdError.message);
  }

  set({
    userId: user.id,
    userName: user.email ?? 'User',
    households: [household],
    activeHouseholdId: household.id,
  });
},

loadHouseholdData: async () => {
  const { userId, activeHouseholdId } = get();

  if (!userId || !activeHouseholdId) {
    return;
  }

  // Load categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .or(`household_id.is.null,household_id.eq.${activeHouseholdId}`)
    .order('sort_order', { ascending: true });

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  // Load inventory
  const { data: items, error: itemsError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('household_id', activeHouseholdId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
	
	const itemsWithImages = await Promise.all(
  (items ?? []).map(async (item) => {
    if (!item.image_path) {
      return {
        ...item,
        image_url: null,
      };
    }

    const { data: signedImage } = await supabase.storage
      .from('item-images')
      .createSignedUrl(item.image_path, 60 * 60);

    return {
      ...item,
      image_url: signedImage?.signedUrl ?? null,
    };
  })
);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  // Load shopping list
  const { data: shoppingList, error: shoppingError } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('household_id', activeHouseholdId)
    .order('sort_order', { ascending: true });

  if (shoppingError) {
    throw new Error(shoppingError.message);
  }

  // Load item history
  const { data: history, error: historyError } = await supabase
    .from('item_history')
    .select('*')
    .eq('household_id', activeHouseholdId)
    .order('changed_at', { ascending: false });

  if (historyError) {
    throw new Error(historyError.message);
  }

  set({
    categories: categories ?? [],
    items: itemsWithImages,
    shoppingList: shoppingList ?? [],
    history: history ?? [],
  });
},

subscribeToRealtime: () => {
  const state = get();

  if (!state.userId || !state.activeHouseholdId) {
    return () => {};
  }

  const householdId = state.activeHouseholdId;

  const channel = supabase
    .channel(`household-${householdId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inventory_items',
        filter: `household_id=eq.${householdId}`,
      },
      async () => {
        await get().loadHouseholdData();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shopping_list_items',
        filter: `household_id=eq.${householdId}`,
      },
      async () => {
        await get().loadHouseholdData();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'item_history',
        filter: `household_id=eq.${householdId}`,
      },
      async () => {
        await get().loadHouseholdData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
},

signup: async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Account creation failed.');
  }

  set({
    userId: data.user.id,
    userName: name,
  });
},

      logout: async () => {
  await supabase.auth.signOut();

  set({
    userId: null,
    userName: null,
    households: [],
    activeHouseholdId: null,
    items: [],
    shoppingList: [],
    history: [],
  });
},

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

addItem: async (data) => {
  const state = get();

  if (!state.userId) {
    throw new Error('You must be signed in to add an item.');
  }

  if (!state.activeHouseholdId) {
    throw new Error('No active household found.');
  }

  const householdId = state.activeHouseholdId;
  const now = new Date().toISOString();

  // Save the item to Supabase first so we have its ID.
  const { data: insertedItem, error } = await supabase
    .from('inventory_items')
    .insert({
      household_id: householdId,
      name: data.name,
      category_id: data.category_id ?? null,
      brand: data.brand ?? null,
      status: data.status ?? 'available',
      quantity_level: data.quantity_level ?? null,
      quantity_value: data.quantity_value ?? null,
      quantity_unit: data.quantity_unit ?? null,
      location: data.location ?? 'pantry',
      image_path: null,
      expiration_date: data.expiration_date ?? null,
      notes: data.notes ?? null,
      created_by: state.userId,
      updated_by: state.userId,
      purchased_at:
        data.status === 'available' ? now : null,
      is_deleted: false,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Unable to add item: ${error.message}`);
  }

  if (!insertedItem) {
    throw new Error('Item was not created.');
  }

  let item = insertedItem as Item;

  // Upload the photo to Supabase Storage if one was selected.
  if (data.imageFile) {
    const file = data.imageFile;

    // Convert the image to a safe file extension.
    const extension =
      file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
          ? 'webp'
          : 'jpg';

    const imagePath =
      `${householdId}/${item.id}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(imagePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      // Remove the inventory item if the photo upload fails.
      await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id)
        .eq('household_id', householdId);

      throw new Error(
        `Item was not saved because the photo upload failed: ${uploadError.message}`
      );
    }

    // Save the Storage path on the inventory item.
    const { data: updatedItem, error: imagePathError } =
      await supabase
        .from('inventory_items')
        .update({
          image_path: imagePath,
          updated_at: new Date().toISOString(),
          updated_by: state.userId,
        })
        .eq('id', item.id)
        .eq('household_id', householdId)
        .select('*')
        .single();

    if (imagePathError) {
      throw new Error(
        `Item was created, but the image path could not be saved: ${imagePathError.message}`
      );
    }

    if (updatedItem) {
      item = updatedItem as Item;
    }
  }

  // Update the local Zustand state.
let imageUrl: string | null = null;

if (item.image_path) {
  const { data: signedImage } = await supabase.storage
    .from('item-images')
    .createSignedUrl(
      item.image_path,
      60 * 60
    );

  imageUrl = signedImage?.signedUrl ?? null;
}

// Update the local Zustand state.
set((s) => ({
  items: [
    {
      ...item,
      image_url: imageUrl,
    },
    ...s.items,
  ],
}));

  // Add to shopping list when item is out.
  if (item.status === 'out') {
    await get().addToShoppingList(item.name, item.id);
  }

  // Save history to Supabase.
  const { data: historyEntry, error: historyError } =
    await supabase
      .from('item_history')
      .insert({
        item_id: item.id,
        household_id: householdId,
        status: item.status,
        quantity_level: item.quantity_level,
        changed_by: state.userId,
        changed_at: now,
        note: 'Created',
      })
      .select('*')
      .single();

  if (historyError) {
    throw new Error(
      `Item was created, but history could not be saved: ${historyError.message}`
    );
  }

  // Update local history.
  if (historyEntry) {
    set((s) => ({
      history: [
        historyEntry as ItemHistory,
        ...s.history,
      ],
    }));
  }

  return item;
},
updateItem: async (id, updates) => {
  const state = get();

  if (!state.userId) {
    throw new Error('You must be signed in to update an item.');
  }

  if (!state.activeHouseholdId) {
    throw new Error('No active household found.');
  }

  const now = new Date().toISOString();

  const { data: updatedItem, error } = await supabase
    .from('inventory_items')
    .update({
      ...updates,
      updated_at: now,
      updated_by: state.userId,
    })
    .eq('id', id)
    .eq('household_id', state.activeHouseholdId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Unable to update item: ${error.message}`);
  }

  if (!updatedItem) {
    throw new Error('Item was not updated.');
  }

  // Keep Zustand in sync with Supabase
  set((s) => ({
    items: s.items.map((item) =>
      item.id === id ? (updatedItem as Item) : item
    ),
  }));
},

deleteItem: async (id) => {
  const state = get();

  if (!state.userId) {
    throw new Error(
      'You must be signed in to delete an item.'
    );
  }

  if (!state.activeHouseholdId) {
    throw new Error(
      'No active household found.'
    );
  }

  const householdId =
    state.activeHouseholdId;

  // Find the item first so we know its image path.
  const { data: item, error: itemError } =
    await supabase
      .from('inventory_items')
      .select('image_path')
      .eq('id', id)
      .eq('household_id', householdId)
      .single();

  if (itemError) {
    throw new Error(
      `Unable to find item: ${itemError.message}`
    );
  }

  const now = new Date().toISOString();

  // Soft-delete the database record.
  const { error } = await supabase
    .from('inventory_items')
    .update({
      is_deleted: true,
      updated_at: now,
      updated_by: state.userId,
    })
    .eq('id', id)
    .eq('household_id', householdId);

  if (error) {
    throw new Error(
      `Unable to delete item: ${error.message}`
    );
  }

  // Delete the photo from Supabase Storage.
  if (item.image_path) {
    const { error: imageError } =
      await supabase.storage
        .from('item-images')
        .remove([item.image_path]);

    if (imageError) {
      console.error(
        'Item was deleted, but its photo could not be removed:',
        imageError.message
      );
    }
  }

  // Remove it from the visible local inventory.
  set((s) => ({
    items: s.items.filter(
      (item) => item.id !== id
    ),
    shoppingList: s.shoppingList.filter(
      (item) => item.item_id !== id
    ),
  }));
},



setItemStatus: async (id, status) => {
  const state = get();

  if (!state.userId) {
    throw new Error('You must be signed in to change item status.');
  }

  if (!state.activeHouseholdId) {
    throw new Error('No active household found.');
  }

  const item = state.items.find((i) => i.id === id);

  if (!item) {
    throw new Error('Item not found.');
  }

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: now,
    updated_by: state.userId,
  };

  if (status === 'available') {
    updateData.purchased_at = now;
  } else if (status === 'out') {
    updateData.purchased_at = null;
  }

  // Update Supabase
  const { data: updatedItem, error } = await supabase
    .from('inventory_items')
    .update(updateData)
    .eq('id', id)
    .eq('household_id', state.activeHouseholdId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Unable to change item status: ${error.message}`);
  }

  if (!updatedItem) {
    throw new Error('Item status was not updated.');
  }

  // Save history to Supabase
  const { data: historyEntry, error: historyError } = await supabase
    .from('item_history')
    .insert({
      item_id: id,
      household_id: state.activeHouseholdId,
      status,
      quantity_level: item.quantity_level,
      changed_by: state.userId,
      changed_at: now,
      note: `Status → ${status}`,
    })
    .select('*')
    .single();

  if (historyError) {
    throw new Error(
      `Status changed, but history could not be saved: ${historyError.message}`
    );
  }

  // Update local item
  set((s) => ({
    items: s.items.map((i) =>
      i.id === id ? (updatedItem as Item) : i
    ),
    history: historyEntry
      ? [historyEntry as ItemHistory, ...s.history]
      : s.history,
  }));

  // Available → remove from shopping list
  if (status === 'available') {
    set((s) => ({
      shoppingList: s.shoppingList.filter(
        (si) => si.item_id !== id
      ),
    }));
  }

  // Out → add to shopping list
  if (status === 'out') {
    const alreadyOnList = get().shoppingList.some(
      (si) => si.item_id === id && !si.checked
    );

    if (!alreadyOnList) {
      await get().addToShoppingList(item.name, id);
    }
  }
},

      markPurchased: (id) => {
        get().setItemStatus(id, 'available');
      },

addToShoppingList: async (name, itemId) => {
  const state = get();

  if (!state.userId) {
    throw new Error('You must be signed in to modify the shopping list.');
  }

  if (!state.activeHouseholdId) {
    throw new Error('No active household found.');
  }

  const householdId = state.activeHouseholdId;

  // Avoid duplicate active entries
  if (
    itemId &&
    state.shoppingList.some(
      (si) => si.item_id === itemId && !si.checked
    )
  ) {
    return;
  }

  // Check Supabase as well
  if (itemId) {
    const { data: existingItem, error: existingError } = await supabase
      .from('shopping_list_items')
      .select('id')
      .eq('household_id', householdId)
      .eq('item_id', itemId)
      .eq('checked', false)
      .maybeSingle();

    if (existingError) {
      throw new Error(
        `Unable to check shopping list: ${existingError.message}`
      );
    }

    if (existingItem) {
      return;
    }
  }

  const { data: maxSort } = await supabase
    .from('shopping_list_items')
    .select('sort_order')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = maxSort
    ? (maxSort.sort_order ?? 0) + 1
    : 0;

  const { data: newEntry, error } = await supabase
    .from('shopping_list_items')
    .insert({
      household_id: householdId,
      item_id: itemId ?? null,
      name,
      checked: false,
      quantity_note: null,
      created_by: state.userId,
      sort_order: sortOrder,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(
      `Unable to add to shopping list: ${error.message}`
    );
  }

  if (!newEntry) {
    throw new Error('Shopping list item was not created.');
  }

  set((s) => ({
    shoppingList: [
      ...s.shoppingList,
      newEntry as ShoppingListItem,
    ],
  }));
},

toggleShoppingItem: async (id) => {
  const state = get();

  if (!state.userId) {
    throw new Error(
      'You must be signed in to modify the shopping list.'
    );
  }

  if (!state.activeHouseholdId) {
    throw new Error('No active household found.');
  }

  const si = state.shoppingList.find((s) => s.id === id);

  if (!si) {
    throw new Error('Shopping list item not found.');
  }

  const newChecked = !si.checked;

  const { error } = await supabase
    .from('shopping_list_items')
    .update({
      checked: newChecked,
    })
    .eq('id', id)
    .eq('household_id', state.activeHouseholdId);

  if (error) {
    throw new Error(
      `Unable to update shopping list: ${error.message}`
    );
  }

  // Update the local Zustand state after Supabase confirms the update.
  set((s) => ({
    shoppingList: s.shoppingList.map((item) =>
      item.id === id
        ? { ...item, checked: newChecked }
        : item
    ),
  }));

  // If the shopping item was checked as purchased,
  // mark the associated inventory item as Available.
  if (newChecked && si.item_id) {
    await get().setItemStatus(
      si.item_id,
      'available'
    );
  }
},

removeShoppingItem: async (id) => {
  const state = get();

  if (!state.userId) {
    throw new Error('You must be signed in to modify the shopping list.');
  }

  if (!state.activeHouseholdId) {
    throw new Error('No active household found.');
  }

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id)
    .eq('household_id', state.activeHouseholdId);

  if (error) {
    throw new Error(
      `Unable to remove shopping item: ${error.message}`
    );
  }

  // Keep Zustand synchronized
  set((s) => ({
    shoppingList: s.shoppingList.filter(
      (si) => si.id !== id
    ),
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
