'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { ItemCard } from '@/components/ItemCard';
import { STATUS_CONFIG, type ItemStatus, type ItemLocation } from '@/types';
import { LOCATION_LABELS } from '@/types';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { getActiveItems, categories, getCategoryById } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<ItemLocation | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const items = getActiveItems();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (locationFilter !== 'all' && item.location !== locationFilter) return false;
      if (categoryFilter !== 'all' && item.category_id !== categoryFilter) return false;
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
  }, [items, statusFilter, locationFilter, categoryFilter, search, getCategoryById]);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (locationFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0);

  return (
    <div className="px-4 pt-6 pb-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
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
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
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
              'px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors',
              statusFilter === s
                ? s === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].border}`
                : 'bg-white text-slate-500 border-slate-200'
            )}
          >
            {s === 'all' ? 'All' : STATUS_CONFIG[s].emoji + ' ' + STATUS_CONFIG[s].shortLabel}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mb-4 p-4 rounded-2xl bg-white border border-slate-100 space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Location</p>
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
              {(Object.keys(LOCATION_LABELS) as ItemLocation[]).map((loc) => (
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
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Category</p>
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
              {categories
                .filter((c) => c.household_id === null || true)
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

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setLocationFilter('all');
                setCategoryFilter('all');
              }}
              className="text-sm font-medium text-slate-500 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">No items match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
