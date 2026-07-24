'use client';

import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  searchTerm: string;
  onSearch: (val: string) => void;
  placeholder?: string;
  totalItems: number;
  label?: string;
}

export function DataFilterBar({ searchTerm, onSearch, placeholder, totalItems, label = "Items" }: FilterBarProps) {
  return (
    <div className="flex items-center justify-between bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder={placeholder || "Search..."}
          className="pl-9 border-none focus-visible:ring-0 bg-transparent text-xs font-bold"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 border-l border-slate-100">
          {totalItems} {label.toUpperCase()}
        </div>
      </div>
    </div>
  );
}