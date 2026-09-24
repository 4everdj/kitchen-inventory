// Core domain types for Kitchen Inventory

export type ItemStatus = 'out' | 'low' | 'available';
export type QuantityLevel = 'full' | 'three_quarter' | 'half' | 'quarter' | 'almost_empty' | 'empty';
export type ItemLocation = 'refrigerator' | 'freezer' | 'pantry' | 'kitchen' | 'other';
export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface Household {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  invited_at: string;
  joined_at: string | null;
  email?: string;
  display_name?: string;
}

export interface Category {
  id: string;
  household_id: string | null;
  name: string;
  icon: string | null;
  sort_order: number;
  created_by?: string | null;
  created_at?: string;
}

export interface Item {
  id: string;
  household_id: string;
  name: string;
  category_id: string | null;
  brand: string | null;
  status: ItemStatus;
  quantity_level: QuantityLevel | null;
  quantity_value: number | null;
  quantity_unit: string | null;
  location: ItemLocation;
  image_path: string | null;
  expiration_date: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  purchased_at: string | null;
  is_deleted: boolean;
  category?: Category | null;
  image_url?: string | null;
}

export interface ItemHistory {
  id: string;
  item_id: string;
  household_id: string;
  status: ItemStatus | null;
  quantity_level: QuantityLevel | null;
  changed_by: string | null;
  changed_at: string;
  note: string | null;
}

export interface ShoppingListItem {
  id: string;
  household_id: string;
  item_id: string | null;
  name: string;
  checked: boolean;
  quantity_note: string | null;
  created_by: string | null;
  created_at: string;
  sort_order: number;
  item?: Item | null;
}

export interface HouseholdInvite {
  id: string;
  household_id: string;
  token: string;
  role: MemberRole;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  revoked_at: string | null;
  used_by: string | null;
  used_at: string | null;
}

export const STATUS_CONFIG: Record<ItemStatus, {
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  priority: number;
}> = {
  out: {
    label: 'Must Buy',
    shortLabel: 'OUT',
    emoji: '🔴',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    priority: 1,
  },
  low: {
    label: 'Running Low',
    shortLabel: 'LOW',
    emoji: '🟡',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    priority: 2,
  },
  available: {
    label: 'Available',
    shortLabel: 'OK',
    emoji: '🟢',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    priority: 3,
  },
};

export const QUANTITY_LEVEL_LABELS: Record<QuantityLevel, string> = {
  full: 'Full',
  three_quarter: '¾ Full',
  half: '½ Full',
  quarter: '¼ Full',
  almost_empty: 'Almost Empty',
  empty: 'Empty',
};

export const LOCATION_LABELS: Record<ItemLocation, string> = {
  refrigerator: 'Refrigerator',
  freezer: 'Freezer',
  pantry: 'Pantry',
  kitchen: 'Kitchen',
  other: 'Other',
};

export const LOCATION_ICONS: Record<ItemLocation, string> = {
  refrigerator: '🧊',
  freezer: '❄️',
  pantry: '🗄️',
  kitchen: '🍳',
  other: '📦',
};
