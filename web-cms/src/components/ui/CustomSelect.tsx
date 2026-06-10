import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string | number;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  searchable = false,
  disabled = false,
  className
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value || opt.value.toString() === value.toString());

  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-sm rounded-2xl px-4 py-3 transition-all font-medium",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-indigo-500/50 hover:bg-white dark:hover:bg-zinc-900",
          isOpen ? "ring-2 ring-indigo-500/20 border-indigo-500/50 bg-white dark:bg-zinc-900" : "",
          !selectedOption ? "text-slate-500 dark:text-zinc-500" : "text-slate-800 dark:text-zinc-200"
        )}
      >
        <span className="truncate pr-4">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-slate-400 transition-transform duration-300 flex-shrink-0",
            isOpen && "rotate-180 text-indigo-500"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/40 overflow-hidden transform opacity-100 scale-100 origin-top transition-all duration-200 animate-in fade-in zoom-in-95">
          {searchable && (
            <div className="p-2 border-b border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-center text-slate-500 dark:text-zinc-500">
                Tidak ada data
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedOption?.value === option.value || (selectedOption?.value?.toString() === option.value?.toString());
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-colors",
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <span className="truncate pr-4">{option.label}</span>
                    {isSelected && <Check size={16} className="flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
