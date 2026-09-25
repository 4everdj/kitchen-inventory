'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ItemCard } from '@/components/ItemCard';
import { ShoppingCart, CheckCircle2, Plus } from 'lucide-react';

export default function HomePage() {
  const {
    userId,
    userName,
    getItemsByStatus,
    getActiveItems,
    households,
    activeHouseholdId,
  } = useStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-400">Loading…</div>
      </div>
    );
  }

  const mustBuy = getItemsByStatus('out');
  const runningLow = getItemsByStatus('low');
  const available = getItemsByStatus('available');
  const total = getActiveItems().length;
  const activeHh = households.find((h) => h.id === activeHouseholdId);

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Welcome back{userName ? `, ${userName}` : ''}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeHh?.name || 'Kitchen Inventory'}
            </h1>
          </div>
          <Link
            href="/add"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </Link>
        </div>

        {/* Counts */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{mustBuy.length}</div>
            <div className="text-xs font-medium text-red-700 mt-0.5">Must Buy</div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{runningLow.length}</div>
            <div className="text-xs font-medium text-amber-700 mt-0.5">Running Low</div>
          </div>
          <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{available.length}</div>
            <div className="text-xs font-medium text-green-700 mt-0.5">Available</div>
          </div>
        </div>
      </header>

      {/* MUST BUY */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="text-xl">🔴</span> Must Buy
            {mustBuy.length > 0 && (
              <span className="text-sm font-normal text-slate-500">
                ({mustBuy.length})
              </span>
            )}
          </h2>
          {mustBuy.length > 0 && (
            <Link
              href="/shopping"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <ShoppingCart className="w-4 h-4" />
              Shopping List
            </Link>
          )}
        </div>

        {mustBuy.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-slate-700">Nothing to buy!</p>
            <p className="text-sm text-slate-500 mt-1">You&apos;re all stocked up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mustBuy.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* RUNNING LOW */}
      {runningLow.length > 0 && (
        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
            <span className="text-xl">🟡</span> Running Low
            <span className="text-sm font-normal text-slate-500">
              ({runningLow.length})
            </span>
          </h2>
          <div className="space-y-3">
            {runningLow.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* AVAILABLE summary */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="text-xl">🟢</span> Available
            <span className="text-sm font-normal text-slate-500">
              ({available.length})
            </span>
          </h2>
          <Link
            href="/inventory"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            View all →
          </Link>
        </div>

        {available.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-500">No available items yet.</p>
            <Link
              href="/add"
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-emerald-600"
            >
              <Plus className="w-4 h-4" /> Add your first item
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {available.slice(0, 4).map((item) => (
              <ItemCard key={item.id} item={item} compact />
            ))}
            {available.length > 4 && (
              <Link
                href="/inventory"
                className="block text-center py-3 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                + {available.length - 4} more available items
              </Link>
            )}
          </div>
        )}
      </section>

      {total === 0 && (
        <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-100 p-6 text-center">
          <p className="font-medium text-emerald-800">Get started</p>
          <p className="text-sm text-emerald-700 mt-1">
            Take a photo of something in your fridge or pantry and add it to
            your inventory.
          </p>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </Link>
        </div>
      )}
    </div>
  );
}
