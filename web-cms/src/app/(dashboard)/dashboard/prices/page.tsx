'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, LineChart as LineChartIcon, RefreshCw, Download, 
  Search, Filter, AlertCircle, ChevronDown, Calendar, ArrowUpRight,
  TrendingUp, Activity
} from 'lucide-react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { cn } from '@/lib/utils';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { CustomReport } from '@/components/ui/CustomReport';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface Commodity {
  id: string;
  name: string;
  categoryName?: string;
}

interface PriceRecord {
  id: string;
  commodityName: string;
  categoryName?: string;
  regionName: string;
  price: number;
  priceDate: string;
  marketTypeName?: string; // BI
  levelHargaName?: string; // SiPangan
  source: string;
}

export default function PricesPage() {
  const [activeTab, setActiveTab] = useState<'BI' | 'SIPANGAN' | 'CUSTOM'>('BI');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  
  const [selectedBiCommodity, setSelectedBiCommodity] = useState<string>('');
  const [selectedSipanganCommodity, setSelectedSipanganCommodity] = useState<string>('');
  const selectedCommodity = activeTab === 'BI' ? selectedBiCommodity : selectedSipanganCommodity;
  const setSelectedCommodity = activeTab === 'BI' ? setSelectedBiCommodity : setSelectedSipanganCommodity;
  
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number>(30); // 0 indicates custom date range
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [marketTypeIdBi, setMarketTypeIdBi] = useState<number>(1);
  const [marketTypeIdSipangan, setMarketTypeIdSipangan] = useState<number>(3);
  const marketTypeId = activeTab === 'BI' ? marketTypeIdBi : marketTypeIdSipangan;
  const setMarketTypeId = activeTab === 'BI' ? setMarketTypeIdBi : setMarketTypeIdSipangan;

  // Data States
  const [pricesData, setPricesData] = useState<PriceRecord[]>([]);

  // Fetch Filter Options (Commodities & Regions) when Tab changes
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const baseUrl = activeTab === 'BI' ? '/prices' : '/sipangan-scraper/prices';
        
        // Use Promise.all to fetch concurrently
        const [comRes, regRes] = await Promise.all([
          api.get(`${baseUrl}/commodities`),
          api.get(`${baseUrl}/regions`),
        ]);

        if (comRes.data.success) {
          const rawComs = comRes.data.data;
          // Deduplicate by name and trim
          const uniqueComs: any[] = [];
          const seen = new Set();
          for (const c of rawComs) {
            const normalizedName = (c.name || '').trim();
            const lookupKey = normalizedName.toLowerCase();
            if (!seen.has(lookupKey) && normalizedName.length > 0) {
              seen.add(lookupKey);
              uniqueComs.push({
                // For SiPangan, we prefer using the normalized name as the ID in the frontend
                id: activeTab === 'SIPANGAN' ? normalizedName : c.id,
                name: normalizedName
              });
            }
          }
          setCommodities(uniqueComs.sort((a, b) => a.name.localeCompare(b.name)));
        }
        if (regRes.data.success) {
          setRegions(regRes.data.data);
        }

        // We no longer reset selections when switching tabs to preserve user experience
        // The derived states (selectedCommodity, marketTypeId) automatically switch based on activeTab
        
      } catch (err: any) {
        console.error('Failed to fetch options', err);
        // Don't throw error to UI just for options, fallback to empty lists
      }
    };

    fetchOptions();
  }, [activeTab]);

  // Fetch Data based on filters
  useEffect(() => {
    fetchData();
  }, [activeTab, selectedCommodity, selectedRegion, selectedDays, marketTypeId, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = activeTab === 'BI' ? '/prices' : '/sipangan-scraper/prices';
      const typeParam = activeTab === 'BI' ? 'marketTypeId' : 'levelHargaId';
      
      let url = '';
      let params: Record<string, any> = {
        [typeParam]: marketTypeId
      };

      if (selectedDays === 0) {
        if (startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        } else {
          // Default to 30 days if custom range is selected but not filled yet
          params.days = 30;
        }
      } else {
        params.days = selectedDays;
      }

      if (selectedRegion) {
        params.kabupaten = selectedRegion;
      }

      if (selectedCommodity) {
        if (activeTab === 'SIPANGAN') {
          params.commodityName = selectedCommodity;
        } else {
          params.commodityId = selectedCommodity;
        }
        url = `${baseUrl}/history`;
      } else {
        // Fetch Latest
        url = `${baseUrl}/latest`;
      }

      const res = await api.get(url, { params });
      
      if (res.data.success) {
        setPricesData(res.data.data);
      } else {
        throw new Error('Gagal mengambil data dari server');
      }

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat memuat data');
      setPricesData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (pricesData.length === 0) return;
    
    const formattedData = pricesData.map((p) => ({
      'Komoditas': p.commodityName,
      'Kategori': p.categoryName || '-',
      'Wilayah': p.regionName,
      'Tanggal': new Date(p.priceDate).toLocaleDateString('id-ID'),
      'Harga (Rp)': p.price,
      'Tipe Pasar': p.marketTypeName || p.levelHargaName || '-',
      'Sumber Data': p.source || activeTab
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Harga Pangan");
    
    let fileName = `Laporan_Harga_${activeTab}`;
    // Find name, considering ID could be number or string
    const targetId = isNaN(Number(selectedCommodity)) ? selectedCommodity : Number(selectedCommodity);
    if (selectedCommodity) fileName += `_${commodities.find(c => c.id === targetId || c.id === selectedCommodity)?.name}`;
    if (selectedRegion) fileName += `_${selectedRegion}`;
    
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // Process data for Chart (Only relevant if a specific commodity is selected)
  const getChartData = () => {
    if (!selectedCommodity || pricesData.length === 0) return [];

    // Group by Date to ensure single point per date in line chart
    // If there are multiple regions, we might want to average them or show multiple lines.
    // Assuming single region or average for simplicity of the main chart
    const dateMap = new Map<string, number[]>();
    
    pricesData.forEach(p => {
      // Format as YYYY-MM-DD string for grouping
      if (!p.priceDate) return;
      const dateStr = new Date(p.priceDate).toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, []);
      }
      if (p.price) {
        dateMap.get(dateStr)!.push(p.price);
      }
    });

    const chartData = Array.from(dateMap.entries()).map(([date, prices]) => {
      // Calculate average price for that date across all regions (if no region selected)
      const avgPrice = Math.round(prices.reduce((sum, val) => sum + val, 0) / prices.length);
      return {
        date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        fullDate: date,
        harga: avgPrice
      };
    });

    // Sort chronologically (oldest to newest)
    chartData.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    return chartData;
  };

  const chartData = getChartData();
  const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  // Define Table Columns
  const columns: ColumnDef<PriceRecord>[] = [
    {
      header: 'NO',
      cellClassName: 'text-xs font-medium text-slate-400 dark:text-zinc-600',
      cell: (row, index) => index + 1,
    },
    {
      header: 'KOMODITAS',
      cell: (row) => (
        <>
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
            {row.commodityName}
          </p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
            {row.categoryName || '-'}
          </p>
        </>
      ),
    },
    {
      header: 'WILAYAH',
      cell: (row) => (
        <>
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            {row.regionName}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
              activeTab === 'BI' ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" : "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"
            )}>
              {row.marketTypeName || row.levelHargaName || '-'}
            </span>
          </div>
        </>
      ),
    },
    {
      header: 'HARGA',
      cellClassName: 'text-right',
      headerClassName: 'text-right',
      cell: (row) => (
        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
          {formatRupiah(row.price)}
        </p>
      ),
    },
    {
      header: 'WAKTU REKAM',
      cell: (row) => (
        <>
          <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
            {row.priceDate ? new Date(row.priceDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }) : '-'}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
            Sumber: {row.source || activeTab}
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-20">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent mb-2">
            Pusat Manajemen Harga
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 font-medium">
            Eksplorasi data, filter analitik, dan riwayat pergerakan harga komoditas.
          </p>
        </div>

        <div className="flex bg-slate-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800 backdrop-blur-xl w-full md:w-fit overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('BI')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 flex-1 md:flex-none",
              activeTab === 'BI' 
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                : "text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
            )}
          >
            Bank Indonesia
          </button>
          <button
            onClick={() => setActiveTab('SIPANGAN')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 flex-1 md:flex-none",
              activeTab === 'SIPANGAN' 
                ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm" 
                : "text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
            )}
          >
            SiPangan Bapanas
          </button>
          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 flex-1 md:flex-none",
              activeTab === 'CUSTOM' 
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                : "text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
            )}
          >
            Laporan Kustom
          </button>
        </div>
      </div>

      <div className={cn(activeTab === 'CUSTOM' ? "block" : "hidden")}>
        <CustomReport />
      </div>

      <div className={cn(activeTab !== 'CUSTOM' ? "block" : "hidden")}>
        {/* Advanced Filters */}
      <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm relative z-40">
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("p-2 rounded-xl", activeTab === 'BI' ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400")}>
            <Filter size={20} />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-zinc-200">Filter Analitik</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Commodity Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider pl-1">Komoditas</label>
            <CustomSelect
              value={selectedCommodity || ""}
              onChange={(val) => setSelectedCommodity(val.toString())}
              options={[
                { label: "-- Semua Komoditas (Harga Hari Ini) --", value: "" },
                ...commodities.map((c) => ({ label: c.name, value: c.id.toString() }))
              ]}
              searchable={true}
              placeholder="Pilih Komoditas"
            />
          </div>

          {/* Region Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider pl-1">Wilayah</label>
            <CustomSelect
              value={selectedRegion || ""}
              onChange={(val) => setSelectedRegion(val.toString())}
              options={[
                { label: "-- Semua Kabupaten/Kota --", value: "" },
                ...regions.map((r) => ({ label: r, value: r }))
              ]}
              searchable={true}
              placeholder="Pilih Wilayah"
            />
          </div>

          {/* Market Type Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider pl-1">
              {activeTab === 'BI' ? 'Tipe Pasar' : 'Level Harga'}
            </label>
            <CustomSelect
              value={marketTypeId}
              onChange={(val) => setMarketTypeId(parseInt(val.toString()))}
              options={
                activeTab === 'BI' ? [
                  { label: "Pasar Tradisional", value: 1 },
                  { label: "Pasar Modern", value: 2 },
                  { label: "Pedagang Besar", value: 3 }
                ] : [
                  { label: "Tingkat Produsen", value: 1 },
                  { label: "Tingkat Eceran", value: 3 }
                ]
              }
              searchable={false}
            />
          </div>

          {/* Date Range (Only active if Commodity is selected) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider pl-1">Rentang Waktu <span className="lowercase font-normal opacity-70">(Khusus Tren)</span></label>
            <div className="flex flex-col gap-2">
              <CustomSelect
                value={selectedDays}
                onChange={(val) => setSelectedDays(parseInt(val.toString()))}
                options={[
                  { label: "1 Hari Terakhir", value: 1 },
                  { label: "7 Hari Terakhir", value: 7 },
                  { label: "14 Hari Terakhir", value: 14 },
                  { label: "1 Bulan Terakhir", value: 30 },
                  { label: "3 Bulan Terakhir", value: 90 },
                  { label: "6 Bulan Terakhir", value: 180 },
                  { label: "1 Tahun Terakhir", value: 365 },
                  { label: "Kustom (Pilih Tanggal)...", value: 0 }
                ]}
                disabled={!selectedCommodity}
                searchable={false}
              />
              
              {selectedDays === 0 && (
                <div className="flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!selectedCommodity}
                    className="flex-1 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  />
                  <span className="text-slate-400 font-medium text-xs">-</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={!selectedCommodity}
                    className="flex-1 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-1">Gagal Memuat Data</h3>
            <p className="text-sm text-red-600 dark:text-red-500/80 max-w-md">{error}</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            <RefreshCw size={16} /> Coba Lagi
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className={cn("w-12 h-12 rounded-full border-4 border-t-transparent animate-spin", activeTab === 'BI' ? "border-indigo-500" : "border-teal-500")}></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Menarik Data Warehouse...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Chart Section (Visible only when filtering by commodity) */}
          {selectedCommodity && chartData.length > 0 && (
            <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", activeTab === 'BI' ? "bg-indigo-500 text-white" : "bg-teal-500 text-white")}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100">
                      Tren Harga <span className={activeTab === 'BI' ? "text-indigo-600 dark:text-indigo-400" : "text-teal-600 dark:text-teal-400"}>{commodities.find(c => c.id === selectedCommodity)?.name}</span>
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                      Rata-rata pergerakan harga selama {selectedDays} hari terakhir {selectedRegion ? `di ${selectedRegion}` : 'di semua wilayah'}
                    </p>
                  </div>
                </div>
                
                {/* Micro Metric */}
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Harga Terkini</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-zinc-200 leading-none">
                    {formatRupiah(chartData[chartData.length - 1]?.harga || 0)}
                  </span>
                </div>
              </div>

              <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHarga" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeTab === 'BI' ? "#6366f1" : "#14b8a6"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={activeTab === 'BI' ? "#6366f1" : "#14b8a6"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-zinc-800" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                      dy={10}
                    />
                    <YAxis 
                      width={90}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                      tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                      }}
                      itemStyle={{ color: activeTab === 'BI' ? '#818cf8' : '#2dd4bf' }}
                      formatter={(value: any) => [formatRupiah(value), 'Harga Rata-rata']}
                      labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="harga" 
                      stroke={activeTab === 'BI' ? "#6366f1" : "#14b8a6"} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorHarga)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: activeTab === 'BI' ? "#4f46e5" : "#0d9488" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            
            {/* Table Header Controls */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 rounded-lg">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-zinc-100">
                    {selectedCommodity ? 'Detail Riwayat Harga' : 'Tabel Harga Terbaru'}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-0.5">
                    Menampilkan <span className="text-slate-800 dark:text-zinc-300 font-bold">{pricesData.length}</span> baris data
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchData}
                  className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw size={18} />
                </button>
                <button 
                  onClick={handleExport}
                  disabled={pricesData.length === 0}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border",
                    pricesData.length === 0 
                      ? "bg-slate-100 border-slate-200 text-slate-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                  )}
                >
                  <Download size={16} className={pricesData.length > 0 ? (activeTab === 'BI' ? "text-indigo-500" : "text-teal-500") : ""} />
                  Export .xlsx
                </button>
              </div>
            </div>

            {/* Table */}
            <DataTable 
              columns={columns} 
              data={pricesData} 
              keyExtractor={(row, idx) => row.id || String(idx)}
              emptyState={
                <div className="flex flex-col items-center justify-center space-y-3 py-10">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-2">
                    <Database size={24} className="text-slate-300 dark:text-zinc-700" />
                  </div>
                  <p className="font-bold text-slate-500 dark:text-zinc-400">Tidak ada data harga ditemukan</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs text-center">
                    Coba sesuaikan filter wilayah atau tipe pasar Anda.
                  </p>
                </div>
              }
            />
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
