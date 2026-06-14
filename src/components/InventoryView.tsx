/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RawMaterial, InventoryLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  AlertTriangle, 
  AlertCircle, 
  CheckCheck, 
  Sparkles, 
  Coffee, 
  GlassWater, 
  Egg, 
  Cake,
  TrendingUp,
  History as HistoryIcon,
  Trash2,
  X,
  Plus,
  Eye,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';

interface InventoryViewProps {
  materials: RawMaterial[];
  onTriggerAutoRestock: () => void;
  onDeleteMaterial: (id: string) => void;
  onAddMaterial?: (material: RawMaterial) => void;
  onAdjustStock?: (id: string, amount: number) => void;
}

const defaultHistories: Record<string, { date: string; price: number; quantity: number }[]> = {
  raw01: [
    { date: '2026-06-01', price: 12, quantity: 200 },
    { date: '2026-06-05', price: 15, quantity: 150 }
  ],
  raw02: [
    { date: '2026-06-01', price: 850, quantity: 10 },
    { date: '2026-06-07', price: 900, quantity: 5 }
  ],
  raw03: [
    { date: '2026-06-01', price: 55, quantity: 50 },
    { date: '2026-06-06', price: 60, quantity: 50 }
  ],
  raw04: [
    { date: '2026-06-02', price: 6, quantity: 120 },
    { date: '2026-06-08', price: 7, quantity: 120 }
  ]
};

const getMaterialIcon = (iconName: string) => {
  const className = "w-6 h-6 shrink-0";
  switch (iconName) {
    case 'bakery_dining':
      return <Cake className={`${className} text-amber-600/80`} />;
    case 'local_cafe':
      return <Coffee className={`${className} text-amber-800/80`} />;
    case 'opacity':
      return <GlassWater className={`${className} text-blue-500/85`} />;
    case 'egg':
      return <Egg className={`${className} text-amber-500/85`} />;
    default:
      return <Package className={`${className} text-slate-500`} />;
  }
};

export default function InventoryView({ 
  materials, 
  onTriggerAutoRestock, 
  onDeleteMaterial,
  onAddMaterial,
  onAdjustStock
}: InventoryViewProps) {
  // Navigation tabs between list and audit logs
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  
  // Auditing logs states
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);

  // General select / form dialog overlays
  const [selectedMat, setSelectedMat] = useState<RawMaterial | null>(null);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  // Form registration mode: "select" (add stock to existing chosen in dropdown) or "create" (make new list item)
  const [addMode, setAddMode] = useState<'select' | 'create'>('select');

  // Mode "select" dropdown form fields
  const [selectedDropdownMatId, setSelectedDropdownMatId] = useState<string>('');
  const [selectAmount, setSelectAmount] = useState<string>('');
  const [selectNotes, setSelectNotes] = useState<string>('');

  // Mode "create" from-scratch form fields
  const [newName, setNewName] = useState<string>('');
  const [newUnit, setNewUnit] = useState<string>('pcs');
  const [newInitialStock, setNewInitialStock] = useState<string>('15');
  const [newUnitPrice, setNewUnitPrice] = useState<string>('5');
  const [newCategory, setNewCategory] = useState<string>('Produce');
  const [newLabel, setNewLabel] = useState<string>('Regular');
  const [newIcon, setNewIcon] = useState<string>('bakery_dining');

  // Inline adjustment state (replaces prompt logic to work within sandbox iframes)
  const [inlineAdjustId, setInlineAdjustId] = useState<string | null>(null);
  const [inlineAdjustType, setInlineAdjustType] = useState<'add' | 'use' | null>(null);
  const [inlineAdjustAmount, setInlineAdjustAmount] = useState<string>('');

  // Load backend logs on transition
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/materials/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Error fetching inventory logs:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, materials]);

  // Handle dropdown pre-selection
  useEffect(() => {
    if (materials.length > 0 && !selectedDropdownMatId) {
      setSelectedDropdownMatId(materials[0].id);
    }
  }, [materials, selectedDropdownMatId]);

  // Compute metrics dynamically for beautiful summary cards
  const totalItems = materials.length;
  const lowStockCount = materials.filter(m => m.status === 'LOW STOCK').length;
  const outOfStockCount = materials.filter(m => m.status === 'OUT OF STOCK').length;

  const getRestockCost = () => {
    let priceSum = 0;
    materials.forEach(m => {
      if (m.status === 'OUT OF STOCK' || m.status === 'LOW STOCK') {
        if (m.name === 'Brioche Buns') priceSum += 200 * 0.40;
        if (m.name === 'Arabica Beans') priceSum += 15 * 14.50;
        if (m.name === 'Whole Milk') priceSum += 100 * 2.10;
        if (m.name === 'Organic Eggs') priceSum += 240 * 0.35;
      }
    });
    return priceSum > 0 ? priceSum : 0;
  };

  const statusCost = getRestockCost();

  // Helper to obtain price histories list for any material
  const getMaterialHistory = (m: RawMaterial) => {
    if (m.priceHistories && m.priceHistories.length > 0) {
      return m.priceHistories;
    }
    return defaultHistories[m.id] || [
      { date: '2026-06-08', price: m.id === 'raw01' ? 14 : (m.id === 'raw02' ? 875 : 45), quantity: 20 }
    ];
  };

  // Helper/Formula to compute average price for a material
  const calculateAveragePrice = (m: RawMaterial) => {
    if (m.avgPrice && m.avgPrice > 0) return m.avgPrice;
    const history = getMaterialHistory(m);
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, current) => acc + current.price, 0);
    return sum / history.length;
  };

  // Submit modal handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addMode === 'select') {
      if (!selectedDropdownMatId || !selectAmount) {
        alert('Please fill out all required fields');
        return;
      }
      const qty = parseFloat(selectAmount);
      if (isNaN(qty) || qty <= 0) {
        alert('Invalid amount quantity');
        return;
      }

      if (onAdjustStock) {
        await onAdjustStock(selectedDropdownMatId, qty);
        // Refresh logs if showing
        if (activeTab === 'logs') fetchLogs();
        setIsAddOpen(false);
        setSelectAmount('');
        setSelectNotes('');
        alert('Stock successfully updated for selected material!');
      }
    } else {
      if (!newName || !newInitialStock || !newUnitPrice) {
        alert('Please complete all fields correctly');
        return;
      }

      const initStockNum = parseFloat(newInitialStock);
      const unitPriceNum = parseFloat(newUnitPrice);

      if (isNaN(initStockNum) || initStockNum < 0 || isNaN(unitPriceNum) || unitPriceNum < 0) {
        alert('Values must be positive numbers');
        return;
      }

      const computedStatus = initStockNum === 0 
        ? 'OUT OF STOCK' 
        : initStockNum < 10 ? 'LOW STOCK' : 'HEALTHY';

      const customMaterial: RawMaterial = {
        id: 'raw_' + Date.now().toString().slice(-6),
        name: newName,
        unit: newUnit,
        currentStock: initStockNum,
        status: computedStatus,
        category: newCategory,
        label: newLabel,
        icon: newIcon,
        avgPrice: unitPriceNum,
        priceHistories: [
          {
            date: new Date().toISOString().split('T')[0],
            price: unitPriceNum,
            quantity: initStockNum
          }
        ]
      };

      if (onAddMaterial) {
        await onAddMaterial(customMaterial);
        // Reset states
        setIsAddOpen(false);
        setNewName('');
        setNewInitialStock('15');
        setNewUnitPrice('5');
        setNewCategory('Produce');
        setNewLabel('Regular');
        setNewIcon('bakery_dining');
        if (activeTab === 'logs') fetchLogs();
        alert(`Registered new material item: ${newName}`);
      }
    }
  };

  const triggerDecrease = (material: RawMaterial) => {
    setInlineAdjustId(material.id);
    setInlineAdjustType('use');
    setInlineAdjustAmount('');
  };

  const triggerIncrease = (material: RawMaterial) => {
    setInlineAdjustId(material.id);
    setInlineAdjustType('add');
    setInlineAdjustAmount('');
  };

  const handleInlineAdjustSubmit = async (materialId: string, currentStock: number) => {
    const amt = parseFloat(inlineAdjustAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please specify a valid, positive quantity to adjust');
      return;
    }

    if (onAdjustStock) {
      const adjustment = inlineAdjustType === 'use' ? -amt : amt;
      await onAdjustStock(materialId, adjustment);
      if (activeTab === 'logs') fetchLogs();
    }
    setInlineAdjustId(null);
    setInlineAdjustType(null);
    setInlineAdjustAmount('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 gap-6 overflow-y-auto lg:overflow-hidden h-full bg-slate-50/50">
      
      {/* Header View Options and Navigation tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="font-headline-lg-mobile text-on-surface text-2xl font-black">Kitchen Sourced Inventory</h2>
          <p className="text-sm text-outline-variant mt-0.5">Track raw ingredients volume, handle check-in sourcing, and monitor real-time dining floor stock depletion maps.</p>
        </div>

        {/* View Tabs & Action row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-surface-container-low p-1.5 rounded-2xl flex items-center border border-outline-variant/10">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'inventory' 
                  ? 'black-glossy text-white shadow-md' 
                  : 'text-on-surface-variant hover:bg-slate-200/50'
              }`}
            >
              <Package size={14} />
              <span>Stocks Warehouse</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'logs' 
                  ? 'black-glossy text-white shadow-md' 
                  : 'text-on-surface-variant hover:bg-slate-200/50'
              }`}
            >
              <HistoryIcon size={14} />
              <span>Audit Log Trail</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="black-glossy text-white font-title-md py-3 px-5 rounded-2xl flex items-center gap-2 cursor-pointer shadow-lg hover:scale-102 active:scale-95 transition-all text-sm font-semibold"
          >
            <Plus size={16} />
            <span>Add / Register Inventory</span>
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Dynamic Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
            <div className="bg-white p-6 rounded-[2rem] border border-outline-variant/15 apple-shadow flex items-center gap-5">
              <div className="w-14 h-14 rounded-[1.25rem] bg-secondary/10 text-secondary flex items-center justify-center">
                <Package className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <span className="text-outline text-xs block mb-0.5">Total SKU Items</span>
                <span className="font-black text-xl text-on-surface font-label-mono">{totalItems} Raw Materials</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-outline-variant/15 apple-shadow flex items-center gap-5">
              <div className="w-14 h-14 rounded-[1.25rem] bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <span className="text-outline text-xs block mb-0.5">Low Stock Alarm</span>
                <span className="font-black text-xl text-on-surface font-label-mono">{lowStockCount} Items</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-outline-variant/15 apple-shadow flex items-center gap-5">
              <div className="w-14 h-14 rounded-[1.25rem] bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <span className="text-outline text-xs block mb-0.5">Out of Stock</span>
                <span className="font-black text-xl text-on-surface font-label-mono">{outOfStockCount} Items</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-outline-variant/15 apple-shadow flex items-center gap-5">
              <div className="w-14 h-14 rounded-[1.25rem] bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCheck className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <span className="text-outline text-xs block mb-0.5">Healthy Stocks</span>
                <span className="font-black text-xl text-on-surface font-label-mono">
                  {totalItems - lowStockCount - outOfStockCount} Items
                </span>
              </div>
            </div>
          </div>

          {/* Auto-Restock Warning Banner with Black font button */}
          {statusCost > 0 && (
            <div className="black-glossy p-6 rounded-[2rem] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-[1.25rem] flex items-center justify-center text-white font-bold shrink-0">
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <h4 className="font-title-md font-bold text-lg text-white">Smart AI Reorder Alerts Identified</h4>
                  <p className="text-xs text-slate-350 mt-0.5">
                    Restock is critical for {lowStockCount} low tier material{lowStockCount > 1 ? 's' : ''} and {outOfStockCount} out-of-stock tier item{outOfStockCount > 1 ? 's' : ''}. 
                    Forecasted ordering cost: <strong className="font-label-mono font-black border-b border-dashed border-slate-600 pb-0.5 text-white">₹{statusCost.toFixed(2)}</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onTriggerAutoRestock();
                  alert('Triggered Smart Auto-Restock procedure! All materials filled to base capacity levels.');
                }}
                className="bg-white hover:bg-slate-100 !text-black font-title-md text-sm py-3 px-6 rounded-2xl cursor-pointer self-stretch md:self-auto transition-all active:scale-95 font-extrabold shrink-0"
              >
                Auto-Restock All
              </button>
            </div>
          )}

          {/* Materials List Panel */}
          <div className="flex-1 lg:overflow-hidden overflow-visible flex flex-col gap-4 min-h-[450px] lg:min-h-0">
            <div className="flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-headline-lg-mobile text-on-surface text-xl font-black">Raw Sourced Materials</h3>
                <span className="text-[10px] text-outline uppercase font-semibold">Average pricing & price history variance synchronization active</span>
              </div>
              <span className="text-xs font-label-mono text-outline uppercase tracking-wider font-extrabold">Active Sinks</span>
            </div>

            <div className="flex-1 lg:overflow-y-auto overflow-y-visible pr-2 custom-scrollbar min-h-[350px] lg:min-h-0">
              <div className="flex flex-col gap-4 pb-12">
                <AnimatePresence mode="popLayout">
                  {materials.map(material => {
                    let badgeClass = 'bg-emerald-55/10 text-emerald-700 border-emerald-55/20';
                    if (material.status === 'LOW STOCK') badgeClass = 'bg-amber-500/10 text-amber-700 border-amber-500/20';
                    if (material.status === 'OUT OF STOCK') badgeClass = 'bg-rose-500/10 text-rose-700 border-rose-500/20';

                    const avgPrice = calculateAveragePrice(material);

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        key={material.id}
                        className="p-5 rounded-[2.25rem] bg-white border border-outline-variant/15 apple-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-outline-variant shrink-0 border border-slate-100">
                            {getMaterialIcon(material.icon)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-title-md font-black text-on-surface text-base">{material.name}</h4>
                              <span className="bg-blue-50 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                {material.category || 'General'}
                              </span>
                              <span className="bg-slate-100 text-slate-700 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                                {material.label || 'Regular'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-block text-[9px] uppercase font-black px-2 rounded-full border ${badgeClass}`}>
                                {material.status}
                              </span>
                              <span className="text-[10px] font-label-mono text-outline font-bold">
                                Avg Price: ₹{avgPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 lg:gap-8">
                          <div className="text-left sm:text-right min-w-[110px]">
                            <span className="text-outline text-[10px] uppercase font-black block mb-0.5">CURRENT LEVEL</span>
                            <span className="font-label-mono font-black text-lg text-on-surface">
                              {material.currentStock % 1 === 0 ? material.currentStock : material.currentStock.toFixed(1)} <span className="text-sm font-bold text-outline-variant font-sans">{material.unit}</span>
                            </span>
                          </div>

                          {/* Inline increase/decrease inventory adjustment controls */}
                          {inlineAdjustId === material.id ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleInlineAdjustSubmit(material.id, material.currentStock);
                              }}
                              className="flex items-center gap-1.5 bg-slate-100 rounded-2xl p-1 border border-outline-variant/15 shadow-inner"
                            >
                              <span className="text-[10px] font-black text-slate-500 uppercase px-1 leading-none font-sans">
                                {inlineAdjustType === 'use' ? 'Use:' : 'Add:'}
                              </span>
                              <input
                                type="number"
                                step="any"
                                autoFocus
                                required
                                placeholder="Qty"
                                className="w-16 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-on-surface focus:border-slate-400 focus:outline-none font-label-mono"
                                value={inlineAdjustAmount}
                                onChange={(e) => setInlineAdjustAmount(e.target.value)}
                              />
                              <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all active:scale-90 cursor-pointer"
                                title="Confirm Sourced Adjustment"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineAdjustId(null);
                                  setInlineAdjustType(null);
                                }}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all active:scale-90 cursor-pointer"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-slate-50 rounded-2xl p-1 border border-outline-variant/10">
                              <button
                                onClick={() => triggerDecrease(material)}
                                className="px-3.5 py-2 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center justify-center font-bold active:scale-95 transition-all text-xs border border-transparent hover:border-rose-100 cursor-pointer"
                                title="Manual Decrease Quantity Sourced (Used)"
                              >
                                - Use
                              </button>
                              <button
                                onClick={() => triggerIncrease(material)}
                                className="px-3.5 py-2 rounded-xl hover:bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold active:scale-95 transition-all text-xs border border-transparent hover:border-emerald-100 cursor-pointer"
                                title="Manual Restock Quantity Sourced (Add Stock)"
                              >
                                + Add
                              </button>
                            </div>
                          )}

                          {/* Dedicated detail actions & delete buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedMat(material)}
                              className="px-4 py-2 rounded-2xl border border-outline-variant/20 bg-slate-100 text-xs font-black text-on-surface hover:bg-slate-200 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${material.name}" altogether from the restaurant inventory database?`)) {
                                  onDeleteMaterial(material.id);
                                }
                              }}
                              className="w-10 h-10 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all flex items-center justify-center shrink-0 border border-rose-100 active:scale-90 cursor-pointer"
                              title="Delete material altogether"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {materials.length === 0 && (
                  <div className="text-center py-20 text-outline text-sm font-semibold bg-white border border-dashed border-outline-variant/25 rounded-[2rem] p-6 apple-shadow">
                    <Package className="w-10 h-10 mx-auto text-outline-variant/70 mb-3" />
                    No raw materials stored in the system. Use "Add / Register Inventory" panel above to register materials.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Sourced Inventory Log Audit Trail Tab panel */
        <div className="flex-1 lg:overflow-hidden overflow-visible flex flex-col gap-4 min-h-[450px] lg:min-h-0">
          <div className="flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-headline-lg-mobile text-on-surface text-xl font-black">Audit Log Timeline</h3>
              <span className="text-[10px] text-outline uppercase font-semibold">Chronological traceability ledger of kitchen materials additions, restock events, and POS checked items</span>
            </div>
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-on-surface transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-40"
            >
              <RefreshCw size={13} className={logsLoading ? 'animate-spin' : ''} />
              <span>Refresh Trail</span>
            </button>
          </div>

          <div className="flex-1 lg:overflow-y-auto overflow-y-visible pr-2 custom-scrollbar pb-10 min-h-[350px] lg:min-h-0">
            {logsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="w-8 h-8 text-secondary animate-spin" />
                <p className="text-xs font-bold text-outline">Fetching database transaction trail...</p>
              </div>
            ) : logs.length > 0 ? (
              <div className="bg-white rounded-[2rem] border border-outline-variant/15 apple-shadow overflow-hidden p-6 flex flex-col gap-5">
                <div className="relative border-l-2 border-slate-150 pl-6 ml-4 flex flex-col gap-6">
                  {logs.map((log) => {
                    let actionColor = 'bg-slate-100 text-slate-800 border-slate-200';
                    let actionText = log.actionType;
                    if (log.actionType === 'CREATE') {
                      actionColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    } else if (log.actionType === 'RESTOCK') {
                      actionColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    } else if (log.actionType === 'ADJUST') {
                      actionColor = 'bg-amber-50 text-amber-700 border-amber-200';
                    } else if (log.actionType === 'USE') {
                      actionColor = 'bg-purple-50 text-purple-700 border-purple-200';
                    } else if (log.actionType === 'DELETE') {
                      actionColor = 'bg-rose-50 text-rose-700 border-rose-200';
                    }

                    return (
                      <div key={log.id} className="relative">
                        {/* Timeline Bullet Ring */}
                        <span className="absolute -left-[32px] top-1 w-4 h-4 rounded-full border-2 border-slate-150 bg-white flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-secondary rounded-full" />
                        </span>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-label-mono text-outline block bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${actionColor}`}>
                              {actionText}
                            </span>
                          </div>
                          <span className="text-[10px] text-outline font-medium">Logged ID: ID {log.id}</span>
                        </div>

                        <div className="mt-1.5 bg-slate-100 bg-opacity-40 rounded-2xl p-4 border border-outline-variant/10">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                                <span>{log.materialName}</span>
                                <ArrowRight size={12} className="text-outline-variant" />
                                <span className="font-semibold text-outline text-xs">
                                  Balance: {log.previousStock} {log.unit} → {log.newStock} {log.unit}
                                </span>
                              </h4>
                              <p className="text-xs text-outline mt-1 font-body-sm">{log.notes || `Stock delta: ${log.amount > 0 ? '+' : ''}${log.amount}`}</p>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] font-label-mono font-black bg-white shadow-sm border border-slate-150 px-2.5 py-1 rounded-xl inline-block text-on-surface select-none">
                                {log.actionType === 'USE' || log.actionType === 'DELETE' || (log.actionType === 'ADJUST' && log.newStock < log.previousStock) ? '-' : '+'}
                                {log.amount} {log.unit}
                              </span>
                              <div className="text-[9px] text-outline mt-0.5 font-bold uppercase">Operator: {log.operator}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-outline text-sm font-semibold bg-white border border-dashed border-outline-variant/25 rounded-[2rem] p-6 apple-shadow">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-outline-variant/70 mb-3 animate-pulse" />
                No inventory logs records stored yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw Material Details View Modal (containing price history log records) */}
      <AnimatePresence>
        {selectedMat && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-lg w-full rounded-[2.5rem] border border-outline-variant/20 p-6 sm:p-8 apple-shadow flex flex-col gap-6"
            >
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center">
                    {getMaterialIcon(selectedMat.icon)}
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-lg text-on-surface">{selectedMat.name}</h3>
                    <p className="text-xs text-outline font-medium">Sourced Material Price Logs & Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMat(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-outline hover:text-on-surface transition-all flex items-center justify-center cursor-pointer border border-slate-200/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Statistical overview indices */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-outline-variant/5 text-center">
                  <span className="text-[10px] uppercase font-black text-outline block mb-1">Stock Level</span>
                  <span className="font-label-mono font-black text-on-surface text-base">
                    {selectedMat.currentStock} <span className="text-xs font-bold text-outline-variant font-sans">{selectedMat.unit}</span>
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-outline-variant/5 text-center">
                  <span className="text-[10px] uppercase font-black text-outline block mb-1">Average Price</span>
                  <span className="font-label-mono font-black text-on-surface text-base">
                    ₹{calculateAveragePrice(selectedMat).toFixed(1)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-outline-variant/5 text-center">
                  <span className="text-[10px] uppercase font-black text-outline block mb-1">SKU Status</span>
                  <span className={`inline-block text-[9px] uppercase font-black mt-1 px-2.5 rounded-full border ${
                    selectedMat.status === 'HEALTHY' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedMat.status}
                  </span>
                </div>
              </div>

              {/* Extra classification row */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 border border-outline-variant/10 rounded-2xl">
                <div>
                  <span className="text-[10px] uppercase font-black text-outline block mb-0.5">Category Sourcing</span>
                  <span className="font-bold text-sm text-on-surface">{selectedMat.category || 'General'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-outline block mb-0.5">Classification Tag</span>
                  <span className="font-bold text-sm text-on-surface">{selectedMat.label || 'Regular'}</span>
                </div>
              </div>

              {/* Price Histories list */}
              <div>
                <h4 className="text-xs font-black uppercase text-outline tracking-wider font-sans mb-3 flex items-center gap-2">
                  <HistoryIcon className="w-3.5 h-3.5 text-primary" />Sourced Price Change History
                </h4>
                <div className="border border-outline-variant/15 rounded-2xl overflow-hidden bg-white max-h-[180px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-outline-variant/10 text-outline font-black uppercase">
                        <th className="p-3">Sourcing Date</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Quantity Sourced</th>
                      </tr>
                    </thead>
                    <tbody className="font-label-mono font-bold text-on-surface">
                      {getMaterialHistory(selectedMat).map((record, index) => (
                        <tr key={index} className="border-b border-outline-variant/5 hover:bg-slate-50/50">
                          <td className="p-3 text-outline">{record.date}</td>
                          <td className="p-3 text-right text-slate-800">₹{record.price.toFixed(2)}</td>
                          <td className="p-3 text-right text-slate-600">{record.quantity} {selectedMat.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 mt-2 shrink-0">
                <button
                  onClick={() => setSelectedMat(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-on-surface font-title-md py-3.5 rounded-xl cursor-pointer text-center font-bold text-sm border border-slate-200"
                >
                  Close Details
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${selectedMat.name} altogether from restaurant database?`)) {
                      onDeleteMaterial(selectedMat.id);
                      setSelectedMat(null);
                    }
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 hover:scale-[1.01] text-white font-title-md py-3.5 rounded-xl cursor-pointer font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 text-white"
                >
                  <Trash2 className="w-4 h-4 text-white" /> Delete Material
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Dialog overlay to Add Stock (Option A dropdown select, Option B from scratch registration) */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setIsAddOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white max-w-lg w-full rounded-[2.5rem] border border-outline-variant/20 p-6 sm:p-8 apple-shadow relative z-10 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center shrink-0 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-headline-lg-mobile text-on-surface text-xl font-black">Sourced Stock Enrollment</h3>
                  <p className="text-xs text-outline mt-0.5">Enroll new materials, or add stock to previously saved inventory</p>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-outline hover:text-on-surface transition-all flex items-center justify-center cursor-pointer border border-slate-200/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Selection tab switcher */}
              <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0 border border-slate-200/30">
                <button
                  type="button"
                  onClick={() => setAddMode('select')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    addMode === 'select'
                      ? 'bg-white shadow-md text-on-surface'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Dropdown Existing Item
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('create')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    addMode === 'create'
                      ? 'bg-white shadow-md text-on-surface'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Create New From Scratch
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                {addMode === 'select' ? (
                  <>
                    {/* Add Stock to existing item selected from dropdown */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-outline tracking-wider">Select Existing Sourced Item *</label>
                      <select
                        required
                        className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl outline-none text-on-surface font-semibold text-sm appearance-none cursor-pointer w-full"
                        value={selectedDropdownMatId}
                        onChange={(e) => setSelectedDropdownMatId(e.target.value)}
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.currentStock} {m.unit} in Stock)
                          </option>
                        ))}
                        {materials.length === 0 && (
                          <option value="">No stored materials found. Use scratch mode.</option>
                        )}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-outline tracking-wider">Sourcing Quantity to Add *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="e.g. 50"
                          className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl outline-none text-on-surface font-label-mono font-bold text-sm w-full"
                          value={selectAmount}
                          onChange={(e) => setSelectAmount(e.target.value)}
                        />
                        <span className="absolute right-4 top-4 text-xs font-bold text-outline">
                          {materials.find(m => m.id === selectedDropdownMatId)?.unit || 'units'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-outline tracking-wider">Transaction Memo / Comments</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Sourced from local vendor"
                        className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl outline-none text-on-surface font-semibold text-sm resize-none"
                        value={selectNotes}
                        onChange={(e) => setSelectNotes(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Build Completely New Sourced Material from scratch */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-outline tracking-wider">Item Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Organic Tomatoes"
                        className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl outline-none text-on-surface font-semibold text-sm"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-outline tracking-wider">Measuring Unit</label>
                        <select
                          className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl outline-none text-on-surface font-semibold text-sm"
                          value={newUnit}
                          onChange={(e) => setNewUnit(e.target.value)}
                        >
                          <option value="pcs">pcs (Pieces)</option>
                          <option value="kg">kg (Kilograms)</option>
                          <option value="liters">liters (Liters)</option>
                          <option value="pack">pack (Packs)</option>
                          <option value="can">can (Cans)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-outline tracking-wider">Initial Sourcing Vol *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="e.g. 25"
                          className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl outline-none text-on-surface font-label-mono font-bold text-sm"
                          value={newInitialStock}
                          onChange={(e) => setNewInitialStock(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-outline tracking-wider">Sourcing Unit Price (₹) *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="e.g. 15.50"
                          className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl outline-none text-on-surface font-label-mono font-bold text-sm"
                          value={newUnitPrice}
                          onChange={(e) => setNewUnitPrice(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-outline tracking-wider">Inventory Category</label>
                        <select
                          className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl outline-none text-on-surface font-semibold text-sm cursor-pointer"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        >
                          <option value="Produce">Produce (Veggies / Fruits)</option>
                          <option value="Dairy">Dairy (Eggs, Milk, Cheese)</option>
                          <option value="Bakery">Bakery (Bread, Buns, Baking)</option>
                          <option value="Dry Goods">Dry Goods (Spices, Flour, Sugar)</option>
                          <option value="Beverages">Beverages (Teas, Coffee, Soda)</option>
                          <option value="Meats">Meats (Meat, Seafood, Poultry)</option>
                          <option value="General">General Sourced</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-outline tracking-wider">Verification Classification Tag</label>
                        <input
                          type="text"
                          placeholder="e.g. High Priority, Local Farm"
                          className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl outline-none text-on-surface font-semibold text-xs"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-outline tracking-wider">Visual Material Icon Symbol</label>
                        <div className="grid grid-cols-4 gap-2 border border-slate-150 rounded-2xl p-2 bg-slate-50">
                          {[
                            { name: 'bakery_dining', icon: <Cake size={14} className="text-amber-800" /> },
                            { name: 'local_cafe', icon: <Coffee size={14} className="text-amber-700" /> },
                            { name: 'opacity', icon: <GlassWater size={14} className="text-blue-500" /> },
                            { name: 'egg', icon: <Egg size={14} className="text-amber-500" /> }
                          ].map((sym) => {
                            const isSelected = newIcon === sym.name;
                            return (
                              <button
                                key={sym.name}
                                type="button"
                                onClick={() => setNewIcon(sym.name)}
                                className={`py-2 px-1 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-white border-secondary ring-2 ring-secondary/15 rounded-xl scale-[1.05] shadow-sm'
                                    : 'border-slate-200 hover:bg-white bg-slate-50'
                                }`}
                              >
                                {sym.icon}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="black-glossy text-white font-title-md py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all font-semibold font-bold cursor-pointer text-sm mt-3"
                >
                  <Plus size={16} />
                  <span>
                    {addMode === 'select' ? 'Add Stock to Selected material' : 'Register completely new material'}
                  </span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
