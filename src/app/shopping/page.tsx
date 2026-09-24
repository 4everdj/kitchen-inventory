'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Check,
  Plus,
  Trash2,
  ShoppingCart,
  Circle,
  CheckCircle2,
} from 'lucide-react';

export default function ShoppingPage() {
  const {
    shoppingList,
    toggleShoppingItem,
    removeShoppingItem,
    addToShoppingList,
    clearCheckedShopping,
  } = useStore();

  const [newItem, setNewItem] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const unchecked = shoppingList.filter((i) => !i.checked);
  const checked = shoppingList.filter((i) => i.checked);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    addToShoppingList(newItem.trim());
    setNewItem('');
    setShowAdd(false);
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7" />
            Shopping List
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unchecked.length} item{unchecked.length !== 1 ? 's' : ''} to buy
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium shadow-sm hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </header>

      {/* Quick add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Item name…"
            autoFocus
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAdd(false);
              setNewItem('');
            }}
            className="px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
        </form>
      )}

      {shoppingList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700">List is empty</p>
          <p className="text-sm text-slate-500 mt-1">
            Items marked &quot;Must Buy&quot; appear here automatically.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600"
          >
            <Plus className="w-4 h-4" /> Add something manually
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unchecked */}
          {unchecked.length > 0 && (
            <ul className="space-y-2">
              {unchecked.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-3 py-3 shadow-sm"
                >
                  <button
                    onClick={() => toggleShoppingItem(item.id)}
                    className="shrink-0 text-slate-300 hover:text-emerald-600 transition-colors"
                    aria-label="Mark purchased"
                  >
                    <Circle className="w-6 h-6" />
                  </button>
                  <span className="flex-1 font-medium text-slate-900">
                    {item.name}
                  </span>
                  <button
                    onClick={() => removeShoppingItem(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Checked */}
          {checked.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-500">
                  Purchased ({checked.length})
                </h3>
                <button
                  onClick={clearCheckedShopping}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              </div>
              <ul className="space-y-2">
                {checked.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-100 px-3 py-3 opacity-60"
                  >
                    <button
                      onClick={() => toggleShoppingItem(item.id)}
                      className="shrink-0 text-emerald-600"
                      aria-label="Undo"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <span className="flex-1 font-medium text-slate-500 line-through">
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeShoppingItem(item.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
