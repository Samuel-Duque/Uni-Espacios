// frontend/src/components/catalog/category-badge.tsx
import React from 'react';
import { Tv, Dumbbell, Beaker, Armchair, Package } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CategoryBadgeProps {
  categoria: string;
  className?: string;
  showIcon?: boolean;
}

export function CategoryBadge({
  categoria,
  className,
  showIcon = true,
}: CategoryBadgeProps) {
  const getCategoryConfig = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'TECNOLOGIA':
        return {
          label: 'Tecnología',
          icon: Tv,
          styles: 'bg-sky-50 text-sky-800 border-sky-200',
        };
      case 'DEPORTIVO':
        return {
          label: 'Deportivo',
          icon: Dumbbell,
          styles: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'DIDACTICO':
        return {
          label: 'Didáctico',
          icon: Beaker,
          styles: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      case 'MOBILIARIO':
        return {
          label: 'Mobiliario',
          icon: Armchair,
          styles: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      default:
        return {
          label: cat,
          icon: Package,
          styles: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const config = getCategoryConfig(categoria);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
        config.styles,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
