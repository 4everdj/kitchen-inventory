'use client';

import { useState } from 'react';
import {
  STATUS_CONFIG,
  QUANTITY_LEVEL_LABELS,
  LOCATION_ICONS,
  LOCATION_LABELS,
  type Item,
  type ItemStatus,
} from '@/types';
import { StatusBadge } from './StatusBadge';
import { useStore } from '@/lib/store';
import { formatRelativeDate, formatExpiration, cn } from '@/lib/utils';
import {
  MoreHorizontal,
  ShoppingCart,
  Check,
  AlertTriangle,
  Pencil,
  Trash2,
  Package,
} from 'lucide-react';

interface ItemCardProps {
  item: Item;
  compact?: boolean;
  onEdit?: (item: Item) => void;
}

export function ItemCard({ item, compact = false, onEdit }: ItemCardProps) {
  const { setItemStatus, markPurchased, deleteItem, getCategoryById } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const category = getCategoryById(item.category_id);
  const config = STATUS_CONFIG[item.status];
  const expWarning = formatExpiration(item.expiration_date);

  const handleStatus = (status: ItemStatus) => {
    setItemStatus(item.id, status);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      deleteItem(item.id);
      setConfirmDelete(false);
      setMenuOpen(false);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <article
      className={cn(
        'relative bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md',
        config.border,
        item.status === 'out' && 'ring-2 ring-red-100'
      )}
    >
      <div className={cn('flex gap-3 p-3', compact ? 'items-center' : '')}>
        {/* Photo / Placeholder */}
        <div
          className={cn(
            'shrink-0 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center',
            compact ? 'w-14 h-14' : 'w-20 h-20'
          )}
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl opacity-40">
              {category?.icon || <Package className="w-8 h-8 text-slate-300" />}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate leading-tight">
                {item.name}
              </h3>
              {item.brand && (
                <p className="text-xs text-slate-500 truncate">{item.brand}</p>
              )}
            </div>
            <StatusBadge status={item.status} size="sm" />
          </div>

          {!compact && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {category && (
                <span className="inline-flex items-center gap-1">
                  <span>{category.icon}</span>
                  {category.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                {LOCATION_ICONS[item.location]} {LOCATION_LABELS[item.location]}
              </span>
              {item.quantity_level && (
                <span>{QUANTITY_LEVEL_LABELS[item.quantity_level]}</span>
              )}
            </div>
          )}

          {expWarning && (
            <p
              className={cn(
                'mt-1 text-xs font-medium flex items-center gap-1',
                expWarning.startsWith('Expired') || expWarning.includes('today') || expWarning.includes('tomorrow')
                  ? 'text-red-600'
                  : 'text-amber-600'
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              {expWarning}
            </p>
          )}

          {item.notes && !compact && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">{item.notes}</p>
          )}

          <p className="mt-1 text-[11px] text-slate-400">
            Updated {formatRelativeDate(item.updated_at)}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
        {item.status !== 'out' && (
          <button
            onClick={() => handleStatus('out')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Must Buy
          </button>
        )}
        {item.status !== 'low' && (
          <button
            onClick={() => handleStatus('low')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
          >
            Low
          </button>
        )}
        {item.status !== 'available' && (
          <button
            onClick={() => markPurchased(item.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Purchased
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setConfirmDelete(false);
            }}
            className="px-3 py-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 bottom-full mb-1 z-20 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-sm">
                <button
                  onClick={() => {
                    onEdit?.(item);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left',
                    confirmDelete
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-red-600 hover:bg-red-50'
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {confirmDelete ? 'Confirm Delete' : 'Delete'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
