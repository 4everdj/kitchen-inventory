
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { ItemCard } from '@/components/ItemCard';
import {
  STATUS_CONFIG,
  QUANTITY_LEVEL_LABELS,
  LOCATION_LABELS,
  type Item,
  type ItemStatus,
  type ItemLocation,
  type QuantityLevel,
} from '@/types';
import { Search, Filter, X, Pencil, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const {
    getActiveItems,
    categories,
    getCategoryById,
    updateItem,
  } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<ItemStatus | 'all'>('all');
  const [locationFilter, setLocationFilter] =
    useState<ItemLocation | 'all'>('all');
  const [categoryFilter, setCategoryFilter] =
    useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Edit state
  // Edit state
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Prevent hydration mismatch while Zustand/Supabase loads on the client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = mounted ? getActiveItems() : [];

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      if (locationFilter !== 'all' && item.location !== locationFilter) {
        return false;
      }

      if (
        categoryFilter !== 'all' &&
        item.category_id !== categoryFilter
      ) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const cat = getCategoryById(item.category_id);

        const match =
          item.name.toLowerCase().includes(q) ||
          (item.brand && item.brand.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q)) ||
          (cat && cat.name.toLowerCase().includes(q));

        if (!match) return false;
      }

      return true;
    });
  }, [
    items,
    statusFilter,
    locationFilter,
    categoryFilter,
    search,
    getCategoryById,
  ]);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (locationFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0);

  const openEdit = (item: Item) => {
    setEditError('');
    setEditingItem(item);
  };

  const closeEdit = () => {
    if (saving) return;

    setEditingItem(null);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    if (!editingItem.name.trim()) {
      setEditError('Item name is required.');
      return;
    }

    setSaving(true);
    setEditError('');

    try {
      await updateItem(editingItem.id, {
        name: editingItem.name.trim(),
        brand: editingItem.brand?.trim() || null,
        category_id: editingItem.category_id || null,
        status: editingItem.status,
        location: editingItem.location,
        quantity_level: editingItem.quantity_level || null,
        quantity_value: editingItem.quantity_value ?? null,
        quantity_unit: editingItem.quantity_unit || null,
        expiration_date: editingItem.expiration_date || null,
        notes: editingItem.notes?.trim() || null,
      });

      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update item:', error);

      setEditError(
        error instanceof Error
          ? error.message
          : 'Unable to save changes.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory
        </h1>

        <p className="text-sm text-slate-500 mt-0.5">
          {filtered.length} of {items.length} items
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, brand, notes…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
            showFilters || activeFilterCount > 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-white text-slate-600 border-slate-200'
          )}
        >
          <Filter className="w-4 h-4" />

          Filters

          {activeFilterCount > 0 && (
            <span className="ml-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Quick status chips */}
        {(['all', 'out', 'low', 'available'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors',
              statusFilter === s
                ? s === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].border}`
                : 'bg-white text-slate-500 border-slate-200'
            )}
          >
            {s === 'all'
              ? 'All'
              : STATUS_CONFIG[s].emoji +
                ' ' +
                STATUS_CONFIG[s].shortLabel}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mb-4 p-4 rounded-2xl bg-white border border-slate-100 space-y-4">
          {/* Location */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Location
            </p>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setLocationFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border',
                  locationFilter === 'all'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200'
                )}
              >
                All
              </button>

              {(Object.keys(LOCATION_LABELS) as ItemLocation[]).map(
                (loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocationFilter(loc)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border',
                      locationFilter === loc
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    )}
                  >
                    {LOCATION_LABELS[loc]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Category
            </p>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              <button
                onClick={() => setCategoryFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border',
                  categoryFilter === 'all'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200'
                )}
              >
                All
              </button>

              {[...categories]
  .sort((a, b) => a.sort_order - b.sort_order)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border',
                      categoryFilter === cat.id
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    )}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setLocationFilter('all');
                setCategoryFilter('all');
              }}
              className="text-sm font-medium text-slate-500 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Inventory list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">
            No items match your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Background */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeEdit}
          />

          {/* Modal */}
          <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-xl">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />

                <h2 className="text-lg font-semibold text-slate-900">
                  Edit Item
                </h2>
              </div>

              <button
                onClick={closeEdit}
                disabled={saving}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Error */}
              {editError && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">
                  {editError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Item name
                </label>

                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Milk"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Brand
                </label>

                <input
                  type="text"
                  value={editingItem.brand ?? ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      brand: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Optional"
                />
              </div>

              {/* Category + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Category
                  </label>

                  <select
                    value={editingItem.category_id ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category_id: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">No category</option>

                    {categories
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((cat) => (
<option key={cat.id} value={cat.id}>
  {cat.icon ? cat.icon + ' ' : ''}
  {cat.name}
</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Location
                  </label>

                  <select
                    value={editingItem.location}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        location: e.target.value as ItemLocation,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {(Object.keys(LOCATION_LABELS) as ItemLocation[]).map(
                      (loc) => (
                        <option key={loc} value={loc}>
                          {LOCATION_LABELS[loc]}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Status
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(['out', 'low', 'available'] as ItemStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          setEditingItem({
                            ...editingItem,
                            status,
                          })
                        }
                        className={cn(
                          'py-2.5 px-2 rounded-xl border text-sm font-medium transition-colors',
                          editingItem.status === status
                            ? `${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color} ${STATUS_CONFIG[status].border}`
                            : 'bg-white text-slate-600 border-slate-200'
                        )}
                      >
                        {STATUS_CONFIG[status].emoji}{' '}
                        {STATUS_CONFIG[status].shortLabel}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Quantity level
                </label>

                <select
                  value={editingItem.quantity_level ?? ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      quantity_level:
                        (e.target.value as QuantityLevel) || null,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Not specified</option>

                  {(
                    Object.entries(
                      QUANTITY_LEVEL_LABELS
                    ) as [QuantityLevel, string][]
                  ).map(([level, label]) => (
                    <option key={level} value={level}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Expiration date
                </label>

                <input
                  type="date"
                  value={editingItem.expiration_date ?? ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      expiration_date: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>

                <textarea
                  value={editingItem.notes ?? ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />

                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

