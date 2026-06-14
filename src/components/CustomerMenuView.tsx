/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MenuItem, MenuCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  UtensilsCrossed, 
  Sparkles, 
  Info,
  Check,
  Percent,
  X
} from 'lucide-react';

interface CustomerMenuViewProps {
  menuItems: MenuItem[];
  categories: MenuCategory[];
  tableId: string;
  onClose?: () => void;
}

export default function CustomerMenuView({ menuItems, categories, tableId, onClose }: CustomerMenuViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'All'>('All');
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all categories
  const sanitisedCategories = useMemo(() => {
    return Array.from(new Set((categories || []).map(c => c.trim())));
  }, [categories]);

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Must be available for customers
      if (!item.isAvailable) return false;

      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      
      const itemTags = item.tags || [];
      const isVeg = itemTags.includes('Veg') || itemTags.includes('Vegan') || itemTags.includes('Vegetarian');
      let matchesDiet = true;
      if (dietFilter === 'Veg') {
        matchesDiet = isVeg;
      } else if (dietFilter === 'Non-Veg') {
        matchesDiet = !isVeg;
      }

      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesDiet && matchesSearch;
    });
  }, [menuItems, selectedCategory, dietFilter, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col overflow-y-auto font-sans text-on-surface antialiased pb-12">
      {/* Premium Header Banner */}
      <div className="w-full bg-zinc-950 text-white relative overflow-hidden py-10 px-6 sm:px-10 flex flex-col items-center text-center select-none shadow-xl border-b border-white/5 shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-slate-950 to-black z-0 opacity-90" />
        
        {/* Subtle grid elements */}
        <div className="absolute inset-0 bg-grid-white/[0.02] z-0" />

        {/* Ambient light streak */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-80 bg-emerald-500/10 rounded-full blur-[120px]" />

        <div className="z-10 flex flex-col items-center max-w-2xl w-full">
          {/* Logo element */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 mb-4 backdrop-blur-md">
            <UtensilsCrossed size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Aahar Byte Experience</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-2">
            Gourmet Digitized Catalog
          </h1>
          
          {tableId ? (
            <p className="text-sm font-semibold text-emerald-400 font-sans tracking-wide bg-emerald-900/40 border border-emerald-500/20 px-3.5 py-1.5 rounded-2xl inline-flex items-center gap-1.5 mt-1 select-all hover:bg-emerald-900/60 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse block" />
              Serving at <strong className="font-mono text-white text-base">Table T-{tableId}</strong>
            </p>
          ) : (
            <p className="text-xs text-outline-variant mt-1.5 leading-relaxed max-w-md opacity-80">
              Browse our freshly sourced seasonal offerings, configured with exact pricing and live availability.
            </p>
          )}

          {/* Close back button if provided */}
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10"
              title="Return to Workspace"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Core View Area */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex flex-col gap-6">
        {/* Search and Filters Strip */}
        <div className="bg-white p-4 rounded-[2rem] border border-outline-variant/10 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
          
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Search dishes, ingredients..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-11 pr-4 outline-none text-xs font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Dietary filters selector */}
          <div className="flex gap-2 w-full sm:w-auto shrink-0 overflow-x-auto no-scrollbar justify-center">
            {(['All', 'Veg', 'Non-Veg'] as const).map(diet => {
              const isActive = dietFilter === diet;
              return (
                <button
                  key={diet}
                  onClick={() => setDietFilter(diet)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border border-solid shrink-0 ${
                    isActive
                      ? 'black-glossy text-white border-transparent shadow-xs font-extrabold'
                      : 'bg-slate-50 text-slate-700 border-slate-100/80 hover:bg-slate-100'
                  }`}
                >
                  {diet === 'Veg' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600/30 shrink-0 inline-flex items-center justify-center">
                      <span className="w-1 h-1 bg-white rounded-full"></span>
                    </span>
                  )}
                  {diet === 'Non-Veg' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-rose-750/30 shrink-0 inline-flex items-center justify-center">
                      <span className="w-1 h-1 bg-white rounded-full"></span>
                    </span>
                  )}
                  <span>{diet === 'All' ? 'Show All' : diet}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category horizontal track bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`py-2.5 px-4.5 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
              selectedCategory === 'All'
                ? 'black-glossy text-white shadow-md font-black hover:bg-zinc-900'
                : 'bg-white text-on-surface-variant hover:bg-zinc-100 border border-outline-variant/10 shadow-xs'
            }`}
          >
            All Collections
          </button>
          {sanitisedCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-2.5 px-4.5 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                selectedCategory === cat
                  ? 'black-glossy text-white shadow-md font-black hover:bg-zinc-900'
                  : 'bg-white text-on-surface-variant hover:bg-zinc-100 border border-outline-variant/10 shadow-xs'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Items Display Grid */}
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-72 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/15 rounded-3xl p-8 text-center bg-white"
            >
              <UtensilsCrossed size={40} className="text-outline-variant mb-3 stroke-1 animate-pulse" />
              <h3 className="font-sans font-bold text-base text-on-surface">No matching recipe items</h3>
              <p className="text-xs text-outline mt-1 max-w-sm">
                Try selecting a different category, adjusting filters, or clearing your active search keyword.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => {
                const isDiscounted = item.discountPercentage && item.discountPercentage > 0;
                const finalPrice = isDiscounted 
                  ? item.price * (1 - (item.discountPercentage ?? 0) / 100) 
                  : item.price;
                const isVeg = item.tags?.includes('Veg') || item.tags?.includes('Vegan') || item.tags?.includes('Vegetarian');

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    key={item.id}
                    className="bg-white rounded-[2rem] border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col justify-between group hover:translate-y-[-2px] transition-all duration-300"
                  >
                    {/* Item Image Top */}
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden shrink-0 select-none">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-80" />

                      {/* Top Action Ribbon Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                        {/* Food Classification badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase inline-flex items-center gap-1 backdrop-blur-md text-white border border-white/5 shadow-md ${
                          isVeg ? 'bg-emerald-600/90' : 'bg-rose-600/90'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full bg-white block ${isVeg ? 'animate-pulse' : ''}`} />
                          {isVeg ? 'Veg' : 'Non-Veg'}
                        </span>

                        {/* Discount Ribbon percentage */}
                        {isDiscounted && (
                          <span className="bg-rose-500 text-white border border-rose-400/20 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-xl flex items-center gap-0.5 shadow-md">
                            <Percent size={10} className="stroke-[3]" />
                            <span>{item.discountPercentage}% OFF</span>
                          </span>
                        )}
                      </div>

                      {/* Display category pinned on left bottom */}
                      <span className="absolute bottom-3.5 left-4 bg-zinc-950/60 backdrop-blur-md text-slate-100 font-label-mono text-[9px] font-extrabold uppercase tracking-wide px-2.5 py-0.8 rounded-lg border border-white/5">
                        {item.category}
                      </span>
                    </div>

                    {/* Body content */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        {/* Tags list */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.filter(t => t !== 'Veg' && t !== 'Non-Veg').map(t => (
                              <span 
                                key={t} 
                                className="text-[8px] font-black uppercase tracking-wide text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        <h4 className="font-heading font-black text-slate-900 text-base leading-snug tracking-tight font-sans">
                          {item.name}
                        </h4>

                        <p className="text-xs text-outline leading-normal line-clamp-2 mt-0.5">
                          {item.description || 'No description configured for this gourmet item.'}
                        </p>
                      </div>

                      {/* Price Section */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-dashed border-outline-variant/10 shrink-0">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-outline uppercase tracking-wider">Unit Cost</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-slate-900 font-sans">
                              ₹{finalPrice.toFixed(2)}
                            </span>
                            {isDiscounted && (
                              <span className="text-xs text-outline line-through font-bold">
                                ₹{item.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Availability stamp */}
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-sans border border-emerald-100">
                          <Sparkles size={11} />
                          <span>Seasonal Fresh</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
