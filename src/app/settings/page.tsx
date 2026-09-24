'use client';

import { useStore } from '@/lib/store';
import { Users, Home, LogOut, Plus, Info } from 'lucide-react';

export default function SettingsPage() {
  const {
    userName,
    households,
    activeHouseholdId,
    setActiveHousehold,
    createHousehold,
    logout,
  } = useStore();

  const handleCreateHousehold = () => {
    const name = prompt('Household name:');
    if (name?.trim()) {
      createHousehold(name.trim());
    }
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </header>

      {/* Profile */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
            {userName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{userName || 'Guest'}</p>
            <p className="text-sm text-slate-500">Local prototype account</p>
          </div>
        </div>
      </section>

      {/* Households */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Home className="w-4 h-4" /> Households
          </h2>
          <button
            onClick={handleCreateHousehold}
            className="text-sm font-medium text-emerald-600 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
        <div className="space-y-2">
          {households.map((hh) => (
            <button
              key={hh.id}
              onClick={() => setActiveHousehold(hh.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-colors ${
                activeHouseholdId === hh.id
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <span className="font-medium text-slate-900">{hh.name}</span>
              {activeHouseholdId === hh.id && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Sharing placeholder */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
          <Users className="w-4 h-4" /> Sharing
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm text-slate-600">
            Shared household access via secure links is planned for Stage 2
            (Supabase integration).
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Owner / Editor / Viewer roles will be supported.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
          <Info className="w-4 h-4" /> About
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-sm text-slate-600 space-y-1">
          <p>
            <strong>Kitchen Inventory</strong> — Stage 1 prototype
          </p>
          <p>Local storage only. Data stays in this browser.</p>
          <p className="text-xs text-slate-400 mt-2">
            Next: real-time sync, photo storage, multi-device sharing via
            Supabase.
          </p>
        </div>
      </section>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
      >
        <LogOut className="w-4 h-4" />
        Reset / Log out
      </button>
    </div>
  );
}
