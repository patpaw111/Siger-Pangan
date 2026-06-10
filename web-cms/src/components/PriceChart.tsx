'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Filter, Loader2, AlertCircle, ChevronDown, Check, X, Download, Info } from 'lucide-react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';

type ChartType = 'line' | 'bar' | 'area';

const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export interface PriceChartProps {
  dataSource?: 'bi' | 'sipangan';
}

export default function PriceChart({ dataSource = 'bi' }: PriceChartProps) {
  const [biData, setBiData] = useState<any[]>([]);
  const [sipanganData, setSipanganData] = useState<any[]>([]);
  
  const [biCommodities, setBiCommodities] = useState<any[]>([]);
  const [sipanganCommodities, setSipanganCommodities] = useState<any[]>([]);
  const [biRegions, setBiRegions] = useState<string[]>([]);
  const [sipanganRegions, setSipanganRegions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters (Separated by data source to preserve state)
  const [selectedBiCommodities, setSelectedBiCommodities] = useState<string[]>([]);
  const [selectedSipanganCommodities, setSelectedSipanganCommodities] = useState<string[]>([]);
  const [selectedBiRegions, setSelectedBiRegions] = useState<string[]>([]);
  const [selectedSipanganRegions, setSelectedSipanganRegions] = useState<string[]>([]);
  const [selectedBiLevels, setSelectedBiLevels] = useState<number[]>([1]);
  const [selectedSipanganLevels, setSelectedSipanganLevels] = useState<number[]>([3]);
  
  // Derived state based on current data source
  const commodities = dataSource === 'bi' ? biCommodities : sipanganCommodities;
  const regions = dataSource === 'bi' ? biRegions : sipanganRegions;
  const selectedCommodities = dataSource === 'bi' ? selectedBiCommodities : selectedSipanganCommodities;
  const selectedRegions = dataSource === 'bi' ? selectedBiRegions : selectedSipanganRegions;
  const selectedLevels = dataSource === 'bi' ? selectedBiLevels : selectedSipanganLevels;
  
  const data = dataSource === 'bi' ? biData : sipanganData;
  const setData = dataSource === 'bi' ? setBiData : setSipanganData;
  const levels = [{ id: 3, name: 'Eceran' }, { id: 1, name: 'Produsen' }];
  const [chartType, setChartType] = useState<ChartType>('line');
  const [days, setDays] = useState<number>(30);
  
  // UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const levelDropdownRef = useRef<HTMLDivElement>(null);
  
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  
  const [commoditySearchQuery, setCommoditySearchQuery] = useState('');

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setIsRegionDropdownOpen(false);
      }
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) {
        setIsLevelDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Load available commodities on mount or when dataSource changes
  useEffect(() => {
    // Only fetch if we haven't loaded data for this source yet
    if (dataSource === 'bi' && biCommodities.length > 0) return;
    if (dataSource === 'sipangan' && sipanganCommodities.length > 0) return;

    const fetchCommodities = async () => {
      try {
        const url = dataSource === 'sipangan' ? '/sipangan-scraper/prices/commodities' : '/prices/commodities';
        const res = await api.get(url);
        if (res.data.success && res.data.data.length > 0) {
          const rawComs = res.data.data;
          let processedComs: any[] = [];
          
          if (dataSource === 'sipangan') {
            const seen = new Set();
            for (const c of rawComs) {
              const normalizedName = (c.name || '').trim();
              const lookupKey = normalizedName.toLowerCase();
              if (!seen.has(lookupKey) && normalizedName.length > 0) {
                seen.add(lookupKey);
                processedComs.push({ id: normalizedName, name: normalizedName });
              }
            }
            processedComs.sort((a, b) => a.name.localeCompare(b.name));
          } else {
            // BI keeps all original IDs to ensure data fetching works correctly
            processedComs = rawComs.map((c: any) => ({
              id: c.id,
              name: (c.name || '').trim()
            }));
            // Optional: sort BI as well
            processedComs.sort((a, b) => a.name.localeCompare(b.name));
          }
          
          if (dataSource === 'sipangan') {
            setSipanganCommodities(processedComs);
            if (processedComs.length > 0) {
              setSelectedSipanganCommodities([processedComs[0].id]);
            }
          } else {
            setBiCommodities(processedComs);
            if (processedComs.length > 0) {
              setSelectedBiCommodities([processedComs[0].id]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch commodities for chart', err);
      }
    };
    
    const fetchRegions = async () => {
      try {
        const url = dataSource === 'sipangan' ? '/sipangan-scraper/prices/regions' : '/prices/regions';
        const res = await api.get(url);
        if (res.data.success) {
          if (dataSource === 'sipangan') {
            setSipanganRegions(res.data.data);
          } else {
            setBiRegions(res.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch regions for chart', err);
      }
    };
    
    fetchCommodities();
    fetchRegions();
  }, [dataSource]);

  // Fetch chart data when filters change
  useEffect(() => {
    if (selectedCommodities.length === 0 || commodities.length === 0) {
      setData([]);
      return;
    }

    // Prevent mismatched API calls during data source toggle
    // Ensure all selected commodities exist in the current commodities list
    const allValid = selectedCommodities.every(id => commodities.some(c => c.id === id));
    if (!allValid) {
      return;
    }

    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const promises: Promise<any>[] = [];
        const metadata: { commId: string; region: string; levelId: number }[] = [];
        
        const baseUrl = dataSource === 'sipangan' ? '/sipangan-scraper/prices/history' : '/prices/history';
        const levelsToUse = selectedLevels.length > 0 ? selectedLevels : [3];
        
        selectedCommodities.forEach(commId => {
          const commName = commodities.find(c => c.id === commId)?.name || commId;
          levelsToUse.forEach(levelId => {
            const params: any = { days };
            if (dataSource === 'sipangan') {
              params.commodityName = commName;
              params.levelHargaId = levelId;
            } else {
              params.commodityId = commId;
              params.marketTypeId = levelId;
            }

            if (selectedRegions.length === 0) {
              promises.push(api.get(baseUrl, { params }));
              metadata.push({ commId, region: '', levelId });
            } else {
              selectedRegions.forEach(reg => {
                promises.push(api.get(baseUrl, { params: { ...params, kabupaten: reg } }));
                metadata.push({ commId, region: reg, levelId });
              });
            }
          });
        });

        const results = await Promise.allSettled(promises);

        const dateMap: Record<string, any> = {};

        results.forEach((res, index) => {
          if (res.status === 'fulfilled' && res.value.data.success) {
            const meta = metadata[index];
            const commName = commodities.find(c => c.id === meta.commId)?.name || meta.commId;
            const regionSuffix = meta.region ? ` (${meta.region})` : ' (Rata-rata Seluruh Wilayah)';
            let levelName = '';
            if (dataSource === 'sipangan') {
              levelName = levels.find(l => l.id === meta.levelId)?.name || '';
            } else {
              const biLevels = [{ id: 1, name: 'Pasar Tradisional' }, { id: 2, name: 'Pasar Modern' }, { id: 3, name: 'Pedagang Besar' }];
              levelName = biLevels.find(l => l.id === meta.levelId)?.name || '';
            }
            const levelSuffix = levelName ? ` - ${levelName}` : '';
            const seriesName = `${commName}${regionSuffix}${levelSuffix}`;
            
            const rawData = res.value.data.data;
            
            // Aggregate by date (average if multiple regions return data for same day)
            const aggByDate = rawData.reduce((acc: any, curr: any) => {
              const d = new Date(curr.priceDate);
              d.setHours(0,0,0,0);
              const timestamp = d.getTime();
              if (!acc[timestamp]) acc[timestamp] = [];
              acc[timestamp].push(curr.price);
              return acc;
            }, {});

            Object.keys(aggByDate).forEach(ts => {
              if (!dateMap[ts]) {
                dateMap[ts] = { 
                  timestamp: Number(ts), 
                  date: new Date(Number(ts)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }) 
                };
              }
              dateMap[ts][seriesName] = Math.round(aggByDate[ts].reduce((a: number, b: number) => a + b, 0) / aggByDate[ts].length);
            });
          }
        });

        // Sort chronologically
        const sortedData = Object.values(dateMap).sort((a: any, b: any) => a.timestamp - b.timestamp);
        setData(sortedData);
      } catch (err: any) {
        console.error('Failed to fetch chart data', err);
        setError('Gagal memuat data grafik.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedCommodities, days, commodities, selectedRegions, dataSource, selectedLevels]);

  const toggleCommodity = (id: string) => {
    if (dataSource === 'bi') {
      setSelectedBiCommodities(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    } else {
      setSelectedSipanganCommodities(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    }
  };

  const removeCommodity = (id: string) => {
    if (dataSource === 'bi') {
      setSelectedBiCommodities(prev => prev.filter(c => c !== id));
    } else {
      setSelectedSipanganCommodities(prev => prev.filter(c => c !== id));
    }
  };

  const toggleRegion = (reg: string) => {
    if (dataSource === 'bi') {
      setSelectedBiRegions(prev => prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]);
    } else {
      setSelectedSipanganRegions(prev => prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]);
    }
  };

  const removeRegion = (reg: string) => {
    if (dataSource === 'bi') {
      setSelectedBiRegions(prev => prev.filter(r => r !== reg));
    } else {
      setSelectedSipanganRegions(prev => prev.filter(r => r !== reg));
    }
  };

  const toggleLevel = (id: number) => {
    if (dataSource === 'bi') {
      setSelectedBiLevels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    } else {
      setSelectedSipanganLevels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip to format multiple values correctly
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl shadow-lg">
          <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 justify-between mt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{formatRupiah(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render multiple data series dynamically based on selected commodities and regions
  const getActiveSeriesNames = () => {
    const names: string[] = [];
    const levelsToUse = selectedLevels.length > 0 ? selectedLevels : [3];
    
    selectedCommodities.forEach(commId => {
      const commName = commodities.find(c => c.id === commId)?.name || commId;
      levelsToUse.forEach(levelId => {
        let levelName = '';
        if (dataSource === 'sipangan') {
          levelName = levels.find(l => l.id === levelId)?.name || '';
        } else {
          const biLevels = [{ id: 1, name: 'Pasar Tradisional' }, { id: 2, name: 'Pasar Modern' }, { id: 3, name: 'Pedagang Besar' }];
          levelName = biLevels.find(l => l.id === levelId)?.name || '';
        }
        const levelSuffix = levelName ? ` - ${levelName}` : '';
        
        if (selectedRegions.length === 0) {
          names.push(`${commName} (Rata-rata Seluruh Wilayah)${levelSuffix}`);
        } else {
          selectedRegions.forEach(reg => {
            names.push(`${commName} (${reg})${levelSuffix}`);
          });
        }
      });
    });
    return names;
  };

  const exportData = (format: 'excel' | 'csv') => {
    if (data.length === 0) return;
    
    const activeSeries = getActiveSeriesNames();
    
    const exportRows = data.map(item => {
      const row: any = { Tanggal: item.date };
      activeSeries.forEach(series => {
        row[series] = item[series] || 0;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Harga Komoditas");

    const dateStr = new Date().toISOString().split('T')[0];
    if (format === 'excel') {
      XLSX.writeFile(workbook, `Data_Harga_Siger_Pangan_${dateStr}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `Data_Harga_Siger_Pangan_${dateStr}.csv`, { bookType: 'csv' });
    }
    setIsExportDropdownOpen(false);
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="h-72 flex items-center justify-center text-slate-400">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-72 flex flex-col items-center justify-center text-red-500 gap-2">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      );
    }

    if (data.length === 0) {
      if (selectedCommodities.length === 0) {
        return (
          <div className="h-72 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 gap-2">
            <Filter className="w-8 h-8 opacity-50" />
            <p className="text-sm font-medium">Belum ada komoditas yang dipilih. Silakan tambah komoditas.</p>
          </div>
        );
      } else {
        return (
          <div className="h-72 flex flex-col items-center justify-center text-slate-500 dark:text-zinc-400 text-center px-4 gap-3 bg-slate-50/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 m-4">
            <Info className="w-10 h-10 opacity-30" />
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Data Tidak Tersedia</p>
              <p className="text-xs mt-1 max-w-md leading-relaxed">
                Tidak ada riwayat harga yang dilaporkan oleh sumber data untuk kombinasi wilayah dan level harga ini pada rentang waktu yang Anda pilih.
              </p>
            </div>
          </div>
        );
      }
    }

    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 20, bottom: 0 },
    };

    const yAxisProps = {
      tickFormatter: (value: number) => `Rp ${value / 1000}k`,
      width: 80,
      tick: { fontSize: 12, fill: '#888888' },
      axisLine: false,
      tickLine: false,
    };

    const xAxisProps = {
      dataKey: "date",
      tick: { fontSize: 12, fill: '#888888' },
      axisLine: false,
      tickLine: false,
      dy: 10
    };



    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {getActiveSeriesNames().map((name, idx) => (
                <Bar key={name} dataKey={name} fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={[4, 4, 0, 0]} barSize={20} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {getActiveSeriesNames().map((name, idx) => {
                const color = CHART_COLORS[idx % CHART_COLORS.length];
                return (
                  <Area key={name} connectNulls={true} type="monotone" dataKey={name} stroke={color} fillOpacity={0.1} fill={color} strokeWidth={3} />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {getActiveSeriesNames().map((name, idx) => (
                <Line 
                  key={name} 
                  connectNulls={true}
                  type="monotone" 
                  dataKey={name} 
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                  strokeWidth={3} 
                  dot={{ r: 3, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 transition-colors duration-300 w-full">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <Filter className="text-indigo-600 dark:text-indigo-400" size={20} />
            Perbandingan Harga Komoditas
          </h3>
          
          {/* Selected Commodity Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedCommodities.map((id, idx) => {
              const cName = commodities.find(c => c.id === id)?.name || id;
              const color = CHART_COLORS[idx % CHART_COLORS.length];
              return (
                <div key={id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 py-1.5 px-3 rounded-full text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                  {cName}
                  <button onClick={() => removeCommodity(id)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
            {selectedRegions.map((reg, idx) => (
              <div key={reg} className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 py-1.5 px-3 rounded-full text-xs font-bold text-indigo-700 dark:text-indigo-400">
                {reg}
                <button onClick={() => removeRegion(reg)} className="ml-1 text-indigo-400 hover:text-indigo-600 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Multi-Select Dropdown for Commodities */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={commodities.length === 0}
              className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-sm font-medium rounded-xl px-4 py-2.5 outline-none transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              + Tambah Komoditas
              <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 flex flex-col gap-1">
                  <div className="px-1 pb-1">
                    <input 
                      type="text" 
                      placeholder="Cari komoditas..." 
                      className="w-full bg-slate-100 dark:bg-zinc-800 border-none rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-400"
                      value={commoditySearchQuery}
                      onChange={(e) => setCommoditySearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {commodities.filter(c => c.name.toLowerCase().includes(commoditySearchQuery.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-sm text-slate-500 text-center">Tidak ditemukan</div>
                  )}
                  {commodities.filter(c => c.name.toLowerCase().includes(commoditySearchQuery.toLowerCase())).map((c) => {
                    const isSelected = selectedCommodities.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleCommodity(c.id)}
                        className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold' 
                            : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="truncate pr-4">{c.name}</span>
                        {isSelected && <Check size={16} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Multi-Select Dropdown for Regions */}
          <div className="relative" ref={regionDropdownRef}>
            <button 
              onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              disabled={regions.length === 0}
              className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-sm font-medium rounded-xl px-4 py-2.5 outline-none transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              + Wilayah
              <ChevronDown size={16} className={`transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isRegionDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 flex flex-col gap-1">
                  {regions.map((reg) => {
                    const isSelected = selectedRegions.includes(reg);
                    return (
                      <button
                        key={reg}
                        onClick={() => toggleRegion(reg)}
                        className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold' 
                            : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="truncate pr-4">{reg}</span>
                        {isSelected && <Check size={16} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Level Filter (Harga untuk SiPangan, Pasar untuk BI) */}
          <div className="relative" ref={levelDropdownRef}>
            <button 
              onClick={() => {
                setIsLevelDropdownOpen(!isLevelDropdownOpen);
                setIsRegionDropdownOpen(false);
                setIsDropdownOpen(false);
              }}
              className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-sm font-medium rounded-xl px-4 py-2.5 outline-none transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              {dataSource === 'sipangan' ? '+ Level Harga' : '+ Level Pasar'} {selectedLevels.length > 0 && `(${selectedLevels.length})`}
              <ChevronDown size={16} className={`transition-transform ${isLevelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isLevelDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 py-1">
                {(dataSource === 'sipangan' 
                  ? [{ id: 3, name: 'Eceran' }, { id: 1, name: 'Produsen' }] 
                  : [{ id: 1, name: 'Pasar Tradisional' }, { id: 2, name: 'Pasar Modern' }, { id: 3, name: 'Pedagang Besar' }]
                ).map(l => {
                  const isSelected = selectedLevels.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLevel(l.id)}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors ${
                        isSelected ? 'text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>{l.name}</span>
                      {isSelected && <Check size={16} className="text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time Range */}
          <select 
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none transition-colors"
          >
            <option value={7}>7 Hari Terakhir</option>
            <option value={14}>14 Hari Terakhir</option>
            <option value={30}>30 Hari Terakhir</option>
            <option value={90}>3 Bulan Terakhir</option>
            <option value={180}>6 Bulan Terakhir</option>
            <option value={365}>1 Tahun Terakhir</option>
          </select>

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              disabled={data.length === 0}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl px-4 py-2.5 outline-none transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-10 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-1.5 flex flex-col gap-1">
                  <button
                    onClick={() => exportData('excel')}
                    className="text-left px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium"
                  >
                    Export ke Excel
                  </button>
                  <button
                    onClick={() => exportData('csv')}
                    className="text-left px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium"
                  >
                    Export ke CSV
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 hidden sm:flex">
            {(['line', 'bar', 'area'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                  chartType === type 
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-500">
        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Jika tidak ada wilayah yang dipilih, grafik akan secara otomatis menghitung dan menampilkan <b>harga rata-rata</b> dari seluruh data wilayah yang tersedia pada tanggal tersebut.</span>
      </div>

      {/* Chart Container */}
      <div className="h-[350px] w-full">
        {renderChart()}
      </div>
    </div>
  );
}
