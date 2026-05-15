import React from 'react';
import Link from 'next/link';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  href?: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  colorClassName?: string;
}

export default function StatsCard({ 
  label, 
  value, 
  icon: Icon, 
  description,
  href,
  trend,
  colorClassName = "bg-indigo-600"
}: StatsCardProps) {
  const CardContent = (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col gap-5 hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
      <div className="flex justify-between items-start">
        <div className={cn(
          "p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110 duration-300", 
          colorClassName
        )}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
            trend.isUp 
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
              : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
          )}>
            {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-zinc-100 mt-1 tracking-tight">{value}</h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 flex items-center gap-1">
            <span className="w-1 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full"></span>
            {description}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{CardContent}</Link>;
  }

  return CardContent;
}
