/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useRef } from 'react';
import { MenuItem, MenuCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Percent, 
  Check, 
  FileImage, 
  Upload, 
  Coins, 
  Database,
  Grid
} from 'lucide-react';

interface MenuViewProps {
  menuItems: MenuItem[];
  onToggleAvailability: (itemId: string) => void;
  onAddItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updateData: Partial<MenuItem>) => void;
  categories: MenuCategory[];
}

// Beautiful preset food photos for easy high-fidelity testing
const FOOD_PRESETS = [
  { name: 'Salad Starter', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80', description: 'Fresh, vibrant organic bowl greens' },
  { name: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', description: 'Fabulous flame-grilled cheese stacking' },
  { name: 'Rich Pasta', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', description: 'Sizzling hot noodles, tomatoes and herbs' },
  { name: 'Dessert Cake', url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80', description: 'Gourmet confectionary and chocolate' },
  { name: 'Cool Drinks', url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&auto=format&fit=crop&q=80', description: 'Ice-cold custom refreshers and teas' },
  { name: 'Artisan Bread', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', description: 'Oven-cooked brown crust sourdoughs' }
];

export default function MenuView({ menuItems, onToggleAvailability, onAddItem, onDeleteItem, onUpdateItem, categories }: MenuViewProps) {
  const uniqueCategories = Array.from(new Set((categories || []).map(c => c.trim())));
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'All'>('All');
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>(() => uniqueCategories[0] || 'Starters');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isVegan, setIsVegan] = useState(false);
  const [dietType, setDietType] = useState<'Veg' | 'Non-Veg'>('Veg');
  const [isChefChoice, setIsChefChoice] = useState(false);
  const [isPopular, setIsPopular] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter logic
  const filteredItems = menuItems.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    
    let matchesDiet = true;
    const itemTags = item.tags || [];
    const isVegItem = itemTags.includes('Veg') || itemTags.includes('Vegan') || itemTags.includes('Vegetarian');
    if (dietFilter === 'Veg') {
      matchesDiet = isVegItem;
    } else if (dietFilter === 'Non-Veg') {
      matchesDiet = !isVegItem;
    }

    return matchesCat && matchesDiet;
  });

  // Base64 file reader helper
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Only image assets are supported (.jpg, .png, .webp)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert('Name and Price are required fields!');
      return;
    }

    const tags: string[] = [];
    tags.push(dietType);
    if (isVegan) tags.push('Vegan');
    if (isChefChoice) tags.push("Chef's Choice");
    if (isPopular) tags.push('Popular');

    const defaultImage = imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
    const parsedDiscount = discountPercentage ? parseInt(discountPercentage, 10) : undefined;

    const newItem: MenuItem = {
      id: `${category.toLowerCase()}_${Date.now()}`,
      name,
      category,
      price: parseFloat(price),
      stock: stock ? parseInt(stock) : 99,
      image: defaultImage,
      description: description || 'Pristine kitchen signature preparation crafted fresh daily and beautifully curated.',
      tags,
      isAvailable: true,
      discountPercentage: parsedDiscount && parsedDiscount > 0 ? parsedDiscount : undefined
    };

    onAddItem(newItem);
    setIsDialogOpen(false);

    // Reset Form
    setName('');
    setCategory(categories[0] || 'Starters');
    setPrice('');
    setStock('');
    setDescription('');
    setImageUrl('');
    setDiscountPercentage('');
    setIsVegan(false);
    setDietType('Veg');
    setIsChefChoice(false);
    setIsPopular(false);

    alert(`Successfully added gourmet dish: ${name}`);
  };

  const handleToggleItemDiet = async (item: MenuItem) => {
    if (!onUpdateItem) return;
    const isCurrentlyVeg = item.tags.includes('Veg') || item.tags.includes('Vegan') || item.tags.includes('Vegetarian');
    let updatedTags = item.tags.filter(t => t !== 'Veg' && t !== 'Non-Veg' && t !== 'Vegan' && t !== 'Vegetarian');
    if (isCurrentlyVeg) {
      updatedTags.push('Non-Veg');
    } else {
      updatedTags.push('Veg');
    }
    onUpdateItem(item.id, { tags: updatedTags });
  };

  return (
    <div className="flex flex-1 flex-col p-6 gap-6 overflow-hidden relative bg-slate-50/50">
      {/* Search Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="font-headline-lg-mobile text-on-surface text-2xl font-black">Food & Beverage Catalog</h2>
          <p className="text-sm text-outline-variant mt-0.5">Control pricing, stock levels, item-specific sales and terminal availability in real-time.</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="black-glossy text-white font-title-md py-3.5 px-6 rounded-2xl flex items-center gap-2 cursor-pointer shadow-lg hover:scale-102 active:scale-95 transition-all text-sm font-semibold"
        >
          <Plus size={16} />
          <span>Add Catalog Item</span>
        </button>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
        {(['All', ...uniqueCategories]).map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-7 py-3 rounded-2xl font-title-md text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive 
                  ? 'black-glossy font-bold shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Diet Profile Filters (Veg vs Non-Veg) */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 select-none bg-white p-3.5 px-5 rounded-[1.5rem] border border-outline-variant/10 shadow-xs max-w-fit">
        <span className="text-[10px] font-black uppercase text-outline tracking-wider mr-2">Dietary Preference</span>
        {(['All', 'Veg', 'Non-Veg'] as const).map(diet => {
          const isActive = dietFilter === diet;
          return (
            <button
              key={diet}
              type="button"
              onClick={() => setDietFilter(diet)}
              className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-solid ${
                isActive
                  ? 'black-glossy text-white border-transparent shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-150 hover:bg-slate-100'
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

      {/* Catalog Listing Table */}
      <div className="flex-1 overflow-y-auto pb-10 pr-2 custom-scrollbar">
        <div className="bg-white rounded-[2rem] border border-outline-variant/15 apple-shadow overflow-hidden">
          <div className="hidden lg:grid grid-cols-[auto_1fr_120px_160px_130px_100px] gap-6 p-6 bg-slate-100/50 border-b border-outline-variant/15 text-xs font-black uppercase tracking-wider text-outline">
            <span>Dish Asset</span>
            <span>Recipe & Category</span>
            <span>Est. Stock</span>
            <span>Price (USD)</span>
            <span>Availability</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-outline-variant/10 bg-white">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => {
                const isDiscounted = item.discountPercentage && item.discountPercentage > 0;
                const finalPrice = isDiscounted 
                  ? item.price * (1 - (item.discountPercentage ?? 0) / 100) 
                  : item.price;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    key={item.id}
                    className="grid grid-cols-1 lg:grid-cols-[auto_1fr_120px_160px_130px_100px] gap-4 lg:gap-6 p-6 items-center hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Food Image asset */}
                    <div className="flex justify-between lg:block items-center">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-slate-100 overflow-hidden shrink-0 border border-outline-variant/10">
                        <img className="w-full h-full object-cover" src={item.image} alt={item.name} referrerPolicy="no-referrer" />
                      </div>
                      <span className="lg:hidden text-outline font-label-mono text-xs font-bold">STOCK: {item.stock}</span>
                    </div>

                    {/* Info Column */}
                    <div>
                      <h4 className="font-title-md font-black text-on-surface text-base flex flex-wrap items-center gap-2">
                        <span>{item.name}</span>
                        <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase col-span-1">
                          {item.category}
                        </span>
                        
                        {/* Interactive Clickable Diet Badge */}
                        <button
                          type="button"
                          onClick={() => handleToggleItemDiet(item)}
                          disabled={!onUpdateItem}
                          className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-all hover:scale-103 active:scale-97 border border-solid select-none ${
                            item.tags.includes('Veg') || item.tags.includes('Vegan') || item.tags.includes('Vegetarian')
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20'
                              : 'bg-rose-50 text-rose-800 border-rose-500/20'
                          }`}
                          title="Click to switch Veg/Non-Veg status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                            item.tags.includes('Veg') || item.tags.includes('Vegan') || item.tags.includes('Vegetarian')
                              ? 'bg-emerald-500'
                              : 'bg-rose-600'
                          }`}></span>
                          <span>
                            {item.tags.includes('Veg') || item.tags.includes('Vegan') || item.tags.includes('Vegetarian')
                              ? 'Veg'
                              : 'Non-Veg'}
                          </span>
                        </button>

                        {isDiscounted && (
                          <span className="bg-rose-500 text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                            <Percent size={8} /> SALE
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-outline mt-1 font-body-sm line-clamp-1">{item.description}</p>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {item.tags.map(t => (
                            <span key={t} className="bg-emerald-55/10 text-emerald-700 border border-emerald-55/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stock column */}
                    <div className="hidden lg:block">
                      <span className="font-label-mono text-on-surface-variant font-bold text-sm">{item.stock} pcs</span>
                    </div>

                    {/* Price column with Discount rendering */}
                    <div className="flex justify-between lg:block items-center font-sans">
                      <span className="lg:hidden text-outline text-xs block">PRICE:</span>
                      {isDiscounted ? (
                        <div className="flex flex-col text-left">
                          <span className="font-label-mono text-secondary font-black text-base">₹{finalPrice.toFixed(2)}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-label-mono text-[11px] text-outline line-through">₹{item.price.toFixed(2)}</span>
                            <span className="bg-rose-50 text-rose-600 font-bold text-[9px] px-1 py-0.2 rounded">-{item.discountPercentage}%</span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-label-mono text-on-surface font-semibold text-base">₹{item.price.toFixed(2)}</span>
                      )}
                    </div>

                    {/* Checkbox active toggle */}
                    <div className="flex justify-between lg:block items-center">
                      <span className="lg:hidden text-outline text-xs block">AVAILABILITY:</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={item.isAvailable} 
                          onChange={() => onToggleAvailability(item.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ml-3 text-xs font-bold text-on-surface-variant hidden xl:inline-block">
                          {item.isAvailable ? 'In Stock' : 'Suspended'}
                        </span>
                      </label>
                    </div>

                    {/* Delete row option */}
                    <div className="flex justify-end pr-2">
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${item.name} from public terminals?`)) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="w-9 h-9 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center hover:bg-rose-100 transition-all cursor-pointer active:scale-90"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* High Fidelity Create Item Dialog Frame overlay */}
      <AnimatePresence>
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDialogOpen(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-md"
            />

            {/* Modal Dialog container card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl relative z-10 p-6 flex flex-col max-h-[92vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10 shrink-0">
                <h3 className="font-headline-lg-mobile text-on-surface text-xl font-black">Add Gourmet Catalog Item</h3>
                <button 
                  onClick={() => setIsDialogOpen(false)}
                  className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center cursor-pointer transition-all text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-sm font-bold">close</span>
                </button>
              </div>

              {/* Form contents scrollable */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto pr-1 py-4 flex flex-col gap-5 custom-scrollbar">
                
                {/* Drag and Drop premium food asset image selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-outline uppercase tracking-wider">Dish Imagery Asset</label>
                  
                  {/* Active representation preview or upload dropzone */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-3xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      dragActive 
                        ? 'border-secondary bg-secondary/5' 
                        : imageUrl 
                          ? 'border-emerald-500 bg-emerald-50/10' 
                          : 'border-outline-variant/20 hover:bg-slate-50 bg-slate-50/20'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept="image/*"
                      className="hidden" 
                    />

                    {imageUrl ? (
                      <div className="flex items-center gap-4 w-full text-left">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-outline-variant/20">
                          <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                            <Check size={14} /> Image Loaded successfully
                          </p>
                          <p className="text-[10px] text-outline truncate mt-0.5">Click drag-zone again to replace</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-outline-variant stroke-1.5 animate-bounce-subtle" />
                        <div>
                          <p className="text-xs font-bold text-on-surface">Drag & Drop food photo here or <span className="text-secondary font-black">browse files</span></p>
                          <p className="text-[10px] text-outline mt-0.5">Supports PNG, JPEG or WEBP device images</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Built-in quick food category unsplash stock templates */}
                  <div className="mt-1">
                    <p className="text-[10px] font-bold text-outline-variant uppercase tracking-wider mb-2">Or, Tap to select high-fidelity stock presets</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {FOOD_PRESETS.map(preset => {
                        const isPresetSelected = imageUrl === preset.url;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setImageUrl(preset.url)}
                            className={`relative rounded-xl overflow-hidden aspect-video border transition-all cursor-pointer group hover:scale-[1.03] ${
                              isPresetSelected ? 'border-secondary ring-2 ring-secondary/20 scale-[1.03]' : 'border-outline-variant/25 opacity-75 hover:opacity-100'
                            }`}
                            title={preset.name}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                              <span className="text-[9px] text-white font-semibold truncate px-1 text-center block w-full">{preset.name.split(' ')[0]}</span>
                            </div>
                            {isPresetSelected && (
                              <div className="absolute top-1 right-1 bg-secondary text-primary rounded-full p-0.5">
                                <Check size={8} className="text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hotlink direct address entry */}
                  <div className="mt-2.5">
                    <input
                      type="url"
                      placeholder="Or paste direct image URL hotlink here"
                      className="w-full bg-slate-150 bg-opacity-40 rounded-xl py-2 px-4 outline-none border border-outline-variant/30 focus:ring-2 focus:ring-secondary/10 font-body-sm text-xs text-on-surface"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-xs font-black text-outline uppercase tracking-wider">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Avocado Salmon Toast"
                    className="bg-surface-container-low rounded-2xl py-3 px-4 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-body-sm text-sm text-on-surface font-semibold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-outline uppercase tracking-wider">Dish Category</label>
                    <select
                      className="bg-surface-container-low rounded-2xl py-3 px-4 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-body-sm text-sm text-on-surface cursor-pointer appearance-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as MenuCategory)}
                    >
                      {uniqueCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-outline uppercase tracking-wider">Price (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 18.50"
                      className="bg-surface-container-low rounded-2xl py-3 px-4 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-label-mono text-sm font-bold text-on-surface"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-outline uppercase tracking-wider">System Discount Rate (%)</label>
                    <input
                      type="number"
                      placeholder="Optional. e.g. 15 for 15% off"
                      min="0"
                      max="100"
                      className="bg-surface-container-low rounded-2xl py-3 px-4 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-label-mono text-sm text-on-surface"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-outline uppercase tracking-wider">Stock Base Reference</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      className="bg-surface-container-low rounded-2xl py-3 px-4 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-label-mono text-sm text-on-surface"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-outline uppercase tracking-wider">Dish Description</label>
                  <textarea
                    placeholder="Short description highlighting flavor profiles, organic ingredients, spices, textures etc..."
                    rows={2}
                    className="bg-surface-container-low rounded-2xl py-3 px-4 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-body-sm text-sm text-on-surface resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-xs font-black text-outline uppercase tracking-wider">Dietary Preference *</label>
                  <div className="flex gap-3 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/10">
                    {(['Veg', 'Non-Veg'] as const).map(diet => {
                      const isActive = dietType === diet;
                      return (
                        <button
                          key={diet}
                          type="button"
                          onClick={() => setDietType(diet)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isActive
                              ? 'black-glossy text-white shadow-sm font-extrabold'
                              : 'text-on-surface hover:bg-slate-100'
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
                          <span>{diet} Option</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-outline uppercase tracking-wider">Kitchen Badges / Tags</label>
                  <div className="flex flex-wrap gap-4 mt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isVegan}
                        onChange={(e) => setIsVegan(e.target.checked)}
                        className="rounded border-slate-300 text-secondary focus:ring-secondary/20"
                      />
                      <span>Vegan Recipe</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isChefChoice}
                        onChange={(e) => setIsChefChoice(e.target.checked)}
                        className="rounded border-slate-300 text-secondary focus:ring-secondary/20"
                      />
                      <span>Chef's Choice</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isPopular}
                        onChange={(e) => setIsPopular(e.target.checked)}
                        className="rounded border-slate-300 text-secondary focus:ring-secondary/20"
                      />
                      <span>Popular Demand</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="black-glossy text-white font-title-md py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all font-semibold cursor-pointer text-base mt-2 shrink-0"
                >
                  <Plus size={16} />
                  <span>Create Catalog Item</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
