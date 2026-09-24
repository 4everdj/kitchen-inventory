'use client';

import { STATUS_CONFIG, type ItemStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bg,
        config.color,
        config.border,
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={config.label}
    >
      <span aria-hidden="true">{config.emoji}</span>
      {showLabel && <span>{config.shortLabel}</span>}
    </span>
  );
}
