// frontend/src/components/ui/badge.tsx
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'accent';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    destructive: 'bg-rose-100 text-rose-800 border-rose-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
    accent: 'bg-amber-400/20 text-amber-900 border-amber-400/40',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
