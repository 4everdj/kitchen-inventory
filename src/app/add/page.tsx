'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  STATUS_CONFIG,
  QUANTITY_LEVEL_LABELS,
  LOCATION_LABELS,
  type ItemStatus,
  type QuantityLevel,
  type ItemLocation,
} from '@/types';
import { cn } from '@/lib/utils';
import {
  Camera,
  ImagePlus,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';

export default function AddItemPage() {
  const router = useRouter();
  const { addItem, categories } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<ItemStatus>('available');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [location, setLocation] = useState<ItemLocation>('refrigerator');
  const [quantityLevel, setQuantityLevel] = useState<QuantityLevel | ''>('');
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    addItem({
      name: name.trim(),
      status,
      category_id: categoryId,
      location,
      quantity_level: quantityLevel || null,
      brand: brand.trim() || null,
      notes: notes.trim() || null,
      expiration_date: expirationDate || null,
      image_url: imagePreview,
    });

    // Small delay for UX
    setTimeout(() => {
      router.push('/');
    }, 300);
  };

  const sortedCategories = [...categories].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <div className="px-4 pt-6 pb-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Add Item</h1>
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo capture */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Photo
          </label>
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
              >
                <Camera className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">
                  Take Photo
                </span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
              >
                <ImagePlus className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">
                  Upload
                </span>
              </button>
            </div>
          )}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-slate-400">
            Optional — you can always add a photo later
          </p>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Item name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Milk, Eggs, Bananas"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['out', 'low', 'available'] as ItemStatus[]).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all',
                    status === s
                      ? `${cfg.border} ${cfg.bg} ring-2 ring-offset-1`
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  )}
                >
                  <span className="text-xl">{cfg.emoji}</span>
                  <span className={cn('text-xs font-medium', status === s ? cfg.color : 'text-slate-600')}>
                    {cfg.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <div className="relative">
            <select
              id="category"
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select category…</option>
              {sortedCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Location
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LOCATION_LABELS) as ItemLocation[]).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  location === loc
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                {LOCATION_LABELS[loc]}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity level */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            How much is left?
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(QUANTITY_LEVEL_LABELS) as QuantityLevel[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantityLevel(quantityLevel === q ? '' : q)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  quantityLevel === q
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                {QUANTITY_LEVEL_LABELS[q]}
              </button>
            ))}
          </div>
        </div>

        {/* Brand (optional) */}
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-slate-700 mb-1">
            Brand <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Organic Valley"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Expiration */}
        <div>
          <label htmlFor="exp" className="block text-sm font-medium text-slate-700 mb-1">
            Expiration date <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="exp"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
            Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details…"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-colors',
            name.trim() && !saving
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
              : 'bg-slate-300 cursor-not-allowed'
          )}
        >
          {saving ? (
            'Saving…'
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Item
            </>
          )}
        </button>
      </form>
    </div>
  );
}
