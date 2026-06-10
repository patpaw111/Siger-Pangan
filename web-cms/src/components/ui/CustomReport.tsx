'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Database, Filter, Loader2, Download, Search, LayoutGrid, Check, Lock, Unlock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import api from '@/lib/api';
import { DataTable, ColumnDef } from './DataTable';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface CustomReportProps {
  // Pass any global state if needed
}

interface FilterOption {
  id: string | number;
  name: string;
}

export function CustomReport({}: CustomReportProps) {
  const [source, setSource] = useState<'BI' | 'SIPANGAN'>('BI');
  
  // Options
  const [commodityOptions, setCommodityOptions] = useState<FilterOption[]>([]);
  const [regionOptions, setRegionOptions] = useState<FilterOption[]>([]);
  
  // Selections (Empty array means "ALL")
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedMarketTypes, setSelectedMarketTypes] = useState<number[]>([1]); // Default to 1
  
  const [searchCommodity, setSearchCommodity] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  
  // Data State
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isRegionLocked, setIsRegionLocked] = useState(false);

  // Table Search and Sort State
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // State Cache to preserve states when switching sources
  const [stateCache, setStateCache] = useState<Record<string, any>>({});

  // Fetch Options when source changes
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const baseUrl = source === 'BI' ? '/prices' : '/sipangan-scraper/prices';
        const [comRes, regRes] = await Promise.all([
          api.get(`${baseUrl}/commodities`),
          api.get(`${baseUrl}/regions`),
        ]);

        if (comRes.data.success) {
          let opts = comRes.data.data.map((c: any) => ({
            id: c.id.toString(),
            name: c.name
          }));

          // Deduplicate by name to fix duplicate SiPangan commodities
          const uniqueOpts: {id: string, name: string}[] = [];
          const seen = new Set();
          for (const opt of opts) {
            const normalizedName = (opt.name || '').trim();
            const lookupKey = normalizedName.toLowerCase();
            
            if (!seen.has(lookupKey) && normalizedName.length > 0) {
              seen.add(lookupKey);
              uniqueOpts.push({
                // For SiPangan, use name as ID so we search by name instead of a specific ID
                // which might be an obsolete/empty ID.
                id: source === 'SIPANGAN' ? normalizedName : opt.id,
                name: normalizedName
              });
            }
          }
          
          setCommodityOptions(uniqueOpts.sort((a, b) => a.name.localeCompare(b.name)));
        }
        
        if (regRes.data.success) {
          setRegionOptions(regRes.data.data.map((r: any) => ({
            id: r.name || r,
            name: r.name || r
          })));
        }
      } catch (error) {
        console.error('Failed to fetch options', error);
      }
    };
    fetchOptions();
  }, [source]);

  const handleSourceChange = (newSource: 'BI' | 'SIPANGAN') => {
    if (newSource === source) return;

    // Save current state
    setStateCache(prev => ({
      ...prev,
      [source]: {
        selectedCommodities,
        selectedRegions,
        selectedMarketTypes,
        rawData,
        hasGenerated,
        startDate,
        endDate
      }
    }));

    // Restore or reset
    if (stateCache[newSource]) {
      const cached = stateCache[newSource];
      setSelectedCommodities(cached.selectedCommodities);
      setSelectedRegions(cached.selectedRegions);
      setSelectedMarketTypes(cached.selectedMarketTypes);
      setRawData(cached.rawData);
      setHasGenerated(cached.hasGenerated);
      setStartDate(cached.startDate);
      setEndDate(cached.endDate);
    } else {
      setSelectedCommodities([]);
      setSelectedRegions([]);
      setSelectedMarketTypes([newSource === 'BI' ? 1 : 3]);
      setHasGenerated(false);
      setRawData([]);
    }
    
    setSource(newSource);
  };

  // Generate Report
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const baseUrl = source === 'BI' ? '/prices' : '/sipangan-scraper/prices';
      const typeParam = source === 'BI' ? 'marketTypeId' : 'levelHargaId';
      
      // If no commodities selected, fetch all. If some selected, we have to fetch them one by one
      // because the API doesn't support array of IDs.
      let allRecords: any[] = [];
      
      const commoditiesToFetch = selectedCommodities.length > 0 ? selectedCommodities : ['ALL'];
      const marketsToFetch = selectedMarketTypes.length > 0 ? selectedMarketTypes : [source === 'BI' ? 1 : 3];

      for (const comId of commoditiesToFetch) {
        for (const mTypeId of marketsToFetch) {
          let params: any = {
            [typeParam]: mTypeId,
            startDate,
            endDate
          };
          
          if (comId !== 'ALL') {
            if (source === 'SIPANGAN') {
              // comId is the commodityName because we deduplicated by name
              params.commodityName = comId;
            } else {
              params.commodityId = comId;
              const name = commodityOptions.find(c => c.id === comId)?.name;
              if (name) params.commodityName = name;
            }
          }

          const res = await api.get(`${baseUrl}/history`, { params });
          if (res.data.success) {
            allRecords = [...allRecords, ...res.data.data];
          }
        }
      }

      // Filter by regions if any are selected
      if (selectedRegions.length > 0) {
        allRecords = allRecords.filter(record => 
          selectedRegions.includes(record.regionName)
        );
      }

      setRawData(allRecords);
      setHasGenerated(true);
    } catch (error) {
      console.error('Failed to generate report', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform Data into Pivot Table format (Inverted)
  // Rows: Commodity - Region
  // Columns: Dates
  const { pivotData, pivotColumns } = useMemo(() => {
    if (rawData.length === 0) return { pivotData: [], pivotColumns: [] };

    const rowMap = new Map<string, any>();
    const dateSet = new Set<string>();

    // 1. Group by Entity (Commodity-Region-MarketType) and build Date columns
    rawData.forEach(record => {
      // Normalize Date
      const dateObj = new Date(record.priceDate || record.p_price_date);
      const dateStr = dateObj.toISOString().split('T')[0];
      const region = record.regionName || record.p_region_name;
      const commodity = record.commodityName || record.p_commodity_name;
      const price = record.price || record.p_price;
      const marketTypeName = record.marketTypeName || record.levelHargaName || '-';

      const entityKey = `${commodity} - ${region} - ${marketTypeName}`;
      dateSet.add(dateStr);

      if (!rowMap.has(entityKey)) {
        rowMap.set(entityKey, {
          entity: entityKey,
          commodity,
          region,
          marketTypeName
        });
      }

      const row = rowMap.get(entityKey);
      row[dateStr] = price;
    });

    // 2. Convert map to array and sort alphabetically by entity
    const dataArray = Array.from(rowMap.values()).sort((a, b) => a.entity.localeCompare(b.entity));

    // 3. Sort Dates from Oldest to Newest (or Newest to Oldest)
    // For horizontal reading, Oldest to Newest (Left to Right) is standard.
    const sortedDates = Array.from(dateSet).sort();

    const SortIndicator = ({ columnKey, type = 'text' }: { columnKey: string, type?: 'text' | 'number' }) => {
      if (sortConfig?.key !== columnKey) {
        return (
          <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity" title={`Klik untuk mengurutkan ${type === 'text' ? '(A-Z)' : '(Rendah-Tinggi)'}`}>
            <ArrowUpDown size={14} className="text-slate-400" />
          </div>
        );
      }
      
      const isAsc = sortConfig.direction === 'asc';
      const label = type === 'text' ? (isAsc ? 'A-Z' : 'Z-A') : (isAsc ? 'Terendah' : 'Tertinggi');
      
      return (
        <div 
          className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400"
          title={`Sedang diurutkan: ${label}`}
        >
          <span className="text-[10px] font-bold tracking-wider">{label}</span>
          {isAsc ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
        </div>
      );
    };

    const handleSortClick = (key: string) => {
      setSortConfig(current => {
        if (current?.key === key) {
          if (current.direction === 'asc') return { key, direction: 'desc' };
          return null; // toggle off
        }
        return { key, direction: 'asc' };
      });
    };

    // 4. Build ColumnDef definitions
    const cols: ColumnDef<any>[] = [
      {
        header: (
          <div 
            className="flex items-center justify-between gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
            onClick={() => handleSortClick('commodity')}
          >
            <span>KOMODITAS</span>
            <SortIndicator columnKey="commodity" />
          </div>
        ),
        cellClassName: 'font-bold text-slate-700 dark:text-zinc-300 whitespace-normal bg-white dark:bg-zinc-900 sticky left-0 z-10 border-r border-slate-200 dark:border-zinc-800 min-w-[250px] w-[250px] max-w-[250px]',
        headerClassName: 'sticky left-0 z-30 bg-slate-50 dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800',
        cell: (row) => row.commodity
      },
      {
        header: (
          <div className="flex items-center justify-between gap-2">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-1 group"
              onClick={() => handleSortClick('region')}
            >
              <span>WILAYAH</span>
              <SortIndicator columnKey="region" />
            </div>
            <button 
              onClick={() => setIsRegionLocked(!isRegionLocked)}
              className={cn(
                "p-1 rounded transition-colors hover:bg-slate-200 dark:hover:bg-zinc-800",
                isRegionLocked ? "text-indigo-500" : "text-slate-400"
              )}
              title={isRegionLocked ? "Buka kunci kolom" : "Kunci kolom"}
            >
              {isRegionLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          </div>
        ),
        cellClassName: cn(
          'font-medium text-slate-600 dark:text-zinc-400 whitespace-nowrap bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 min-w-[150px]',
          isRegionLocked ? 'sticky left-[250px] z-10 shadow-[4px_0_10px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_10px_rgba(0,0,0,0.2)]' : ''
        ),
        headerClassName: cn(
          'bg-slate-50 dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800',
          isRegionLocked ? 'sticky left-[250px] z-30 shadow-[4px_0_10px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_10px_rgba(0,0,0,0.2)]' : 'z-20'
        ),
        cell: (row) => (
          <div>
            <p>{row.region}</p>
            {row.marketTypeName && row.marketTypeName !== '-' && (
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1 inline-block",
                source === 'BI' ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" : "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"
              )}>
                {row.marketTypeName}
              </span>
            )}
          </div>
        )
      }
    ];

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { 
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
    }).format(val);

    // Add a column for each Date found
    sortedDates.forEach(dateStr => {
      const dateObj = new Date(dateStr);
      const formattedHeader = dateObj.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short'
      });
      // If we fetch for a whole year, we might want to include year if needed, 
      // but DD MMM is very clean.
      
      cols.push({
        header: (
          <div 
            className="flex items-center justify-end gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full group"
            onClick={() => handleSortClick(dateStr)}
          >
            <SortIndicator columnKey={dateStr} type="number" />
            <span>{formattedHeader}</span>
          </div>
        ),
        headerClassName: 'whitespace-nowrap text-right min-w-[120px]',
        cellClassName: 'text-right font-medium',
        cell: (row) => row[dateStr] ? (
          <span className="text-emerald-600 dark:text-emerald-400">{formatRupiah(row[dateStr])}</span>
        ) : (
          <span className="text-slate-300 dark:text-zinc-600">-</span>
        )
      });
    });

    return { pivotData: dataArray, pivotColumns: cols };
  }, [rawData, isRegionLocked, source, sortConfig]);

  // Apply Table Search & Sort
  const processedPivotData = useMemo(() => {
    let result = [...pivotData];
    
    // 1. Search
    if (tableSearchQuery.trim()) {
      const query = tableSearchQuery.toLowerCase();
      result = result.filter(row => 
        (row.commodity && row.commodity.toLowerCase().includes(query)) || 
        (row.region && row.region.toLowerCase().includes(query)) ||
        (row.marketTypeName && row.marketTypeName.toLowerCase().includes(query))
      );
    }
    
    // 2. Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        // Handle undefined or null (empty values always at bottom)
        if (valA === undefined || valA === null || valA === '-') return 1; 
        if (valB === undefined || valB === null || valB === '-') return -1;
        
        // Handle Strings (Commodity, Region)
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        
        // Handle Numbers (Prices)
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        
        return 0;
      });
    }
    
    return result;
  }, [pivotData, tableSearchQuery, sortConfig]);

  const handleExport = () => {
    if (pivotData.length === 0) return;

    // Excel Export matching the inverted table
    const simpleExportData = pivotData.map(row => {
      const formatted: any = { 
        'Komoditas': row.commodity,
        'Wilayah': row.region
      };
      pivotColumns.slice(1).forEach((col, index) => {
        // match header to rawDate
        // Note: we exposed rawDates in the hook return
        const rawDateStr = pivotColumns.length > 0 ? (pivotColumns[index+1] as any)._rawDateStr : null;
        // Wait, to keep it robust:
        // We know pivotColumns maps 1-to-1 with rawDates returned.
      });
      
      // Let's just use Object.keys since the row has exact dateStr keys
      Object.keys(row).forEach(k => {
        if (k !== 'entity' && k !== 'commodity' && k !== 'region') {
          // Format the date key to DD MMM YYYY for Excel header
          const dObj = new Date(k);
          const niceDate = dObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
          formatted[niceDate] = row[k];
        }
      });
      return formatted;
    });

    const ws = XLSX.utils.json_to_sheet(simpleExportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan_Kustom");
    XLSX.writeFile(wb, `Laporan_Harga_${source}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleSelection = (id: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (current.includes(id)) {
      setter(current.filter(item => item !== id));
    } else {
      setter([...current, id]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* FILTER BUILDER */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Kustomisasi Laporan</h2>
              <p className="text-xs text-slate-500">Tentukan kriteria untuk membentuk kolom tabel Anda</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Sumber & Rentang */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">1. Sumber Data</label>
              <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl">
                <button
                  onClick={() => handleSourceChange('BI')}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    source === 'BI' ? "bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Bank Indonesia
                </button>
                <button
                  onClick={() => handleSourceChange('SIPANGAN')}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    source === 'SIPANGAN' ? "bg-white dark:bg-zinc-800 text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  SiPangan
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Rentang Waktu</label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400">Dari</span>
                  </div>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400">Sampai</span>
                  </div>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-16 pr-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">
                {source === 'BI' ? 'Level Pasar' : 'Level Harga'}
              </label>
              <div className="flex flex-col gap-2">
                {(source === 'BI' 
                  ? [{id: 1, label: 'Pasar Tradisional'}, {id: 2, label: 'Pasar Modern'}, {id: 3, label: 'Pedagang Besar'}]
                  : [{id: 3, label: 'Tingkat Eceran'}, {id: 1, label: 'Tingkat Produsen'}]
                ).map(mt => (
                  <label key={mt.id} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-zinc-300">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedMarketTypes.includes(mt.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMarketTypes([...selectedMarketTypes, mt.id]);
                        else setSelectedMarketTypes(selectedMarketTypes.filter(id => id !== mt.id));
                      }}
                    />
                    {mt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Komoditas (Multiple) */}
          <div className="lg:col-span-1 border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800 pt-6 md:pt-0 md:pl-6 flex flex-col h-64">
            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider flex justify-between">
              <span>2. Komoditas</span>
              <span className="text-indigo-500">{selectedCommodities.length === 0 ? 'Semua' : `${selectedCommodities.length} dipilih`}</span>
            </label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari komoditas..." 
                value={searchCommodity}
                onChange={e => setSearchCommodity(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="overflow-y-auto pr-2 space-y-1.5 flex-1 custom-scrollbar">
              <div 
                className={cn(
                  "px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between border transition-all",
                  selectedCommodities.length === 0 ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold" : "border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                )}
                onClick={() => setSelectedCommodities([])}
              >
                Semua Komoditas
                {selectedCommodities.length === 0 && <Check size={16} />}
              </div>
              {commodityOptions.filter(c => c.name.toLowerCase().includes(searchCommodity.toLowerCase())).map(c => (
                <div 
                  key={c.id}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between border transition-all",
                    selectedCommodities.includes(c.id.toString()) ? "border-indigo-200 bg-white shadow-sm font-semibold text-slate-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" : "border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-400"
                  )}
                  onClick={() => toggleSelection(c.id.toString(), selectedCommodities, setSelectedCommodities)}
                >
                  {c.name}
                  {selectedCommodities.includes(c.id.toString()) && <Check size={16} className="text-indigo-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Wilayah (Multiple) */}
          <div className="lg:col-span-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800 pt-6 md:pt-0 md:pl-6 flex flex-col h-64">
            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider flex justify-between">
              <span>3. Wilayah</span>
              <span className="text-teal-500">{selectedRegions.length === 0 ? 'Semua' : `${selectedRegions.length} dipilih`}</span>
            </label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari wilayah..." 
                value={searchRegion}
                onChange={e => setSearchRegion(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <div className="overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 content-start flex-1 custom-scrollbar">
              <div 
                className={cn(
                  "px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between border transition-all h-fit",
                  selectedRegions.length === 0 ? "border-teal-500 bg-teal-50/50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold" : "border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                )}
                onClick={() => setSelectedRegions([])}
              >
                Semua Wilayah
                {selectedRegions.length === 0 && <Check size={16} />}
              </div>
              {regionOptions.filter(r => r.name.toLowerCase().includes(searchRegion.toLowerCase())).map(r => (
                <div 
                  key={r.id}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between border transition-all h-fit",
                    selectedRegions.includes(r.id.toString()) ? "border-teal-200 bg-white shadow-sm font-semibold text-slate-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" : "border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-400"
                  )}
                  onClick={() => toggleSelection(r.id.toString(), selectedRegions, setSelectedRegions)}
                >
                  <span className="truncate pr-2">{r.name}</span>
                  {selectedRegions.includes(r.id.toString()) && <Check size={16} className="text-teal-500 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Generate Button */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Filter size={18} />}
            Generate Laporan
          </button>
        </div>
      </div>

      {/* RESULTS TABLE */}
      {hasGenerated && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-zinc-200">Hasil Perbandingan Harga</h3>
              <p className="text-xs text-slate-500 mt-1">{Math.max(0, pivotColumns.length - 2)} Kombinasi Kolom • {processedPivotData.length} Baris Tanggal</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Cari komoditas, wilayah, pasar..."
                  title="Pencarian mencakup nama komoditas, wilayah, dan jenis pasar/level harga"
                  value={tableSearchQuery}
                  onChange={e => setTableSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                />
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
              >
                <Download size={16} />
                Export .xlsx
              </button>
            </div>
          </div>

          {loading ? (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
               <Loader2 className="animate-spin w-8 h-8 mb-2" />
               <p>Memproses data perbandingan...</p>
             </div>
          ) : (
            <DataTable 
              containerClassName="w-full overflow-auto max-h-[600px] rounded-b-3xl relative custom-scrollbar"
              columns={pivotColumns}
              data={processedPivotData}
              keyExtractor={(row) => row.entity}
              emptyState={
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <Database size={32} className="mb-3 opacity-50" />
                  <p>Tidak ada data ditemukan untuk kombinasi ini.</p>
                </div>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
