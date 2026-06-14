/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MenuItem, CartItem, MenuCategory, TableInfo, Order, PromoDiscount } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Percent, 
  Trash2, 
  ChevronRight, 
  ShoppingBag, 
  Plus, 
  Search, 
  Tag, 
  Utensils, 
  Soup, 
  IceCream, 
  GlassWater, 
  Cake, 
  Frown, 
  ChevronDown,
  Printer,
  Mail,
  Share2,
  Check,
  Loader2,
  AlertTriangle,
  X,
  User,
  Phone
} from 'lucide-react';

interface POSViewProps {
  menuItems: MenuItem[];
  tables: TableInfo[];
  onSubmitOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Promise<Order | null>;
  promoDiscounts?: PromoDiscount[];
  categories: MenuCategory[];
  orders?: Order[]; // passed for client-side duplicate check
  customers?: any[]; // passed for automatic profile lookups
  editingOrder?: Order | null;
  onCancelEdit?: () => void;
  onModifyOrder?: (orderId: string, updatedOrder: any) => Promise<void>;
}

export default function POSView({ 
  menuItems, 
  tables, 
  onSubmitOrder, 
  promoDiscounts = [], 
  categories = [],
  orders = [],
  customers = [],
  editingOrder = null,
  onCancelEdit,
  onModifyOrder
}: POSViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'All'>('All');
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [dineIn, setDineIn] = useState(true);
  const [selectedTable, setSelectedTable] = useState('Table 01');
  const [takeawayRef, setTakeawayRef] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);

  // Optional customer details state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');

  const prevEditingOrderRef = React.useRef<Order | null>(null);

  // Handle edit propagation
  React.useEffect(() => {
    const prevOrder = prevEditingOrderRef.current;
    if (editingOrder === prevOrder) {
      return; // Do not reset or re-propagate if the editing order hasn't actually changed
    }
    prevEditingOrderRef.current = editingOrder;

    if (editingOrder) {
      setCartItems(editingOrder.items.map(item => ({
        id: item.id || Date.now().toString() + Math.random().toString(),
        menuItem: item.menuItem,
        quantity: item.quantity,
        customization: item.customization
      })));
      setDineIn(editingOrder.dineIn);
      if (editingOrder.dineIn) {
        setSelectedTable(editingOrder.tableRef || 'Table 01');
      } else {
        setTakeawayRef(editingOrder.tableRef || '');
      }
      setCustName(editingOrder.customerName || '');
      setCustPhone(editingOrder.customerPhone || '');
      setCustEmail(editingOrder.customerEmail || '');
      
      if (editingOrder.discountRate > 0) {
        const matchingPromo = promoDiscounts.find(p => {
          if (p.type === 'Percentage') {
            return Math.abs(p.value - (editingOrder.discountRate * 100)) < 1;
          }
          return false;
        });
        if (matchingPromo) {
          setAppliedPromo(matchingPromo);
        } else {
          setAppliedPromo({
            id: 'custom_discount',
            code: 'Custom ' + (editingOrder.discountRate * 100).toFixed(0) + '%',
            value: editingOrder.discountRate * 100,
            type: 'Percentage',
            isActive: true
          });
        }
      } else {
        setAppliedPromo(null);
      }
    } else {
      // Clear inputs only when transitioning from a previous active edit session to null (Cancel Edit)
      setCartItems([]);
      setDineIn(true);
      setSelectedTable('Table 01');
      setTakeawayRef('');
      setCustName('');
      setCustPhone('');
      setCustEmail('');
      setAppliedPromo(null);
    }
  }, [editingOrder]);

  // Newly placed order details for Receipt Modal
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Duplicate Check confirmation modal state
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateOrderData, setDuplicateOrderData] = useState<any>(null);

  // Mobile responsive active ticket slide-out visibility
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);

  const getCategoryIcon = (cat: string, active: boolean) => {
    const cls = active ? 'text-white' : 'text-zinc-500';
    switch (cat.toLowerCase()) {
      case 'starters':
        return <Soup size={16} className={cls} />;
      case 'mains':
        return <Utensils size={16} className={cls} />;
      case 'desserts':
        return <Cake size={16} className={cls} />;
      case 'drinks':
        return <GlassWater size={16} className={cls} />;
      default:
        return <IceCream size={16} className={cls} />;
    }
  };

  const calculateItemPrice = (item: MenuItem) => {
    if (item.discountPercentage && item.discountPercentage > 0) {
      return item.price * (1 - item.discountPercentage / 100);
    }
    return item.price;
  };

  const filteredItems = menuItems.filter(item => {
    if (!item.isAvailable) return false;
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDiet = true;
    const itemTags = item.tags || [];
    const isVegItem = itemTags.includes('Veg') || itemTags.includes('Vegan') || itemTags.includes('Vegetarian');
    if (dietFilter === 'Veg') {
      matchesDiet = isVegItem;
    } else if (dietFilter === 'Non-Veg') {
      matchesDiet = !isVegItem;
    }

    return matchesCat && matchesSearch && matchesDiet;
  });

  const handleAddToCart = (item: MenuItem) => {
    const existing = cartItems.find(c => c.menuItem.id === item.id);
    if (existing) {
      if (existing.quantity >= item.stock) {
        alert(`Only ${item.stock} portions of "${item.name}" are currently in stock!`);
        return;
      }
      setCartItems(cartItems.map(c => 
        c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      if (item.stock < 1) {
        alert(`"${item.name}" is out of stock!`);
        return;
      }
      const newCartItem: CartItem = {
        id: Date.now().toString(),
        menuItem: item,
        quantity: 1
      };
      setCartItems([...cartItems, newCartItem]);
    }
  };

  const handleAdjustQuantity = (cartId: string, amount: number) => {
    const cartItem = cartItems.find(c => c.id === cartId);
    if (!cartItem) return;

    const nextQty = cartItem.quantity + amount;
    if (nextQty <= 0) {
      setCartItems(cartItems.filter(c => c.id !== cartId));
    } else {
      if (nextQty > cartItem.menuItem.stock) {
        alert(`Cannot exceed active stock of ${cartItem.menuItem.stock} portions.`);
        return;
      }
      setCartItems(cartItems.map(c => 
        c.id === cartId ? { ...c, quantity: nextQty } : c
      ));
    }
  };

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, c) => acc + calculateItemPrice(c.menuItem) * c.quantity, 0);
  
  let promoDiscountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'Percentage') {
      promoDiscountAmount = (subtotal * appliedPromo.value) / 100;
    } else {
      promoDiscountAmount = appliedPromo.value;
    }
  }

  const serviceTax = (subtotal - promoDiscountAmount) * 0.10;
  const total = Math.max(0, subtotal - promoDiscountAmount + serviceTax);

  // Checks for duplicate order submission within last 30s
  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;

    const targetRef = dineIn ? selectedTable : takeawayRef || 'Takeaway';
    
    // Scan recent orders inside orders array (last 30 seconds, same table/ref, same total amount)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const duplicate = orders.find(order => {
      const orderTime = new Date(order.timestamp || Date.now());
      const isRecent = orderTime >= thirtySecondsAgo;
      const sameRef = order.tableRef === targetRef;
      const sameCost = Math.abs(order.total - total) < 1; // within a rupee
      return isRecent && sameRef && sameCost;
    });

    const discountRate = subtotal > 0 ? Number((promoDiscountAmount / subtotal).toFixed(4)) : 0;
    const taxRate = 0.10;

    const orderPayload = {
      items: cartItems,
      tableRef: targetRef,
      subtotal,
      discount: promoDiscountAmount,
      serviceTax,
      discountRate,
      taxRate,
      dineIn,
      total,
      status: 'Placed' as const,
      customerName: custName.trim() || undefined,
      customerPhone: custPhone.trim() || undefined,
      customerEmail: custEmail.trim() || undefined
    };

    if (duplicate) {
      // Trigger Warning dialog instead of direct submission
      setDuplicateOrderData(orderPayload);
      setShowDuplicateWarning(true);
    } else {
      executeOrderSubmission(orderPayload);
    }
  };

  const executeOrderSubmission = async (payload: any) => {
    try {
      if (editingOrder && onModifyOrder) {
        const updatedPayload = {
          ...editingOrder,
          items: payload.items,
          tableRef: payload.tableRef,
          subtotal: payload.subtotal,
          discount: payload.discount,
          serviceTax: payload.serviceTax,
          discountRate: payload.discountRate,
          taxRate: payload.taxRate,
          dineIn: payload.dineIn,
          total: payload.total,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerEmail: payload.customerEmail
        };
        await onModifyOrder(editingOrder.id, updatedPayload);
        alert('Order modified successfully!');
        if (onCancelEdit) {
          onCancelEdit();
        }
      } else {
        const result = await onSubmitOrder(payload);
        if (result) {
          setCreatedOrder(result);
          setShowReceipt(true);
          // Clear active cart & customer inputs on success
          setCartItems([]);
          setAppliedPromo(null);
          setCustName('');
          setCustPhone('');
          setCustEmail('');
          setEmailSentSuccess(false);
          setIsCartOpenMobile(false);
        } else {
          alert('Could not record pos ticket. Server offline.');
        }
      }
    } catch (e) {
      alert('Exception occurred while placing terminal ticket.');
    }
  };

  const triggerPrintReceipt = () => {
    window.print();
  };

  const handleSimulatedEmail = () => {
    if (!createdOrder?.customerEmail) return;
    setEmailSending(true);
    setTimeout(() => {
      setEmailSending(false);
      setEmailSentSuccess(true);
    }, 1500);
  };

  const getWhatsAppURILink = () => {
    if (!createdOrder) return '#';
    const phoneNum = createdOrder.customerPhone || custPhone || '';
    const dateStr = new Date(createdOrder.timestamp).toLocaleDateString();
    
    let itemsStr = createdOrder.items.map(i => `• ${i.menuItem.name} x${i.quantity} (₹${(calculateItemPrice(i.menuItem) * i.quantity).toFixed(0)})`).join('\n');
    
    const messageText = `*AAHAR POS RECEIPT BILL*\n--------------------------------\n*Bill ID:* ${createdOrder.billId || 'N/A'}\n*Token No:* ${createdOrder.tokenNo || 'N/A'}\n*Date:* ${dateStr}\n*Source:* ${createdOrder.tableRef}\n--------------------------------\n${itemsStr}\n--------------------------------\n*Subtotal:* ₹${createdOrder.subtotal.toFixed(0)}\n*Discount:* -₹${createdOrder.discount.toFixed(0)}\n*Service Tax:* ₹${createdOrder.serviceTax.toFixed(0)}\n*Final Amount:* ₹${createdOrder.total.toFixed(0)}\n--------------------------------\nThank you for dining with us!\n_Created by Tarkbyte Labs_`;
    
    return `https://api.whatsapp.com/send?phone=${phoneNum.replace(/\D/g, '')}&text=${encodeURIComponent(messageText)}`;
  };

  const uniqueCategories = Array.from(new Set((categories || []).map(c => c.trim())));
  const categoriesList = [{ id: 'All', name: 'All' }].concat(uniqueCategories.map(c => ({ id: c, name: c })));

  return (
    <div className="flex-1 flex overflow-hidden">
      
      {/* Front-facing Catalog Grid */}
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        
        {/* Search header container */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              className="w-full bg-white border border-outline-variant/15 pl-11 pr-5 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-primary/5 text-sm font-semibold select-all font-sans leading-none"
              placeholder="Search dishes or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="font-label-mono text-[10px] uppercase font-bold text-on-surface-variant bg-white border border-outline-variant/10 px-4 py-2.5 rounded-2xl shadow-xs shrink-0 select-none">
            Register: Term POS-A
          </span>
        </div>

        {/* Category horizontal tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar shrink-0 select-none">
          {categoriesList.map(cat => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-8 py-3 rounded-2xl font-title-md text-xs uppercase tracking-wider whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'black-glossy font-black shadow-md scale-[1.01]' 
                    : 'bg-white border border-outline-variant/10 text-on-surface-variant hover:bg-slate-50'
                }`}
              >
                {cat.name !== 'All' ? getCategoryIcon(cat.name, isActive) : <Utensils size={14} className={isActive ? 'text-white' : 'text-zinc-500'} />}
                <span className={isActive ? 'text-white font-black' : ''}>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Diet Profile Filters (Veg vs Non-Veg) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 select-none bg-white p-3.5 px-5 rounded-[1.5rem] border border-outline-variant/10 shadow-xs">
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

        {/* Dynamic product layout grid */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-10 pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => {
                const isDiscounted = item.discountPercentage && item.discountPercentage > 0;
                const finalUnitPrice = calculateItemPrice(item);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    key={item.id}
                    className="bg-white rounded-[2rem] overflow-hidden apple-shadow hover:translate-y-[-3px] transition-all group cursor-pointer active:scale-[0.99] border border-outline-variant/15 flex flex-col justify-between"
                    onClick={() => handleAddToCart(item)}
                  >
                    <div className="h-40 overflow-hidden relative bg-slate-100 shrink-0">
                      <img 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                        src={item.image} 
                        alt={item.name}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full font-label-mono text-primary text-[9px] font-bold shadow-sm">
                          STOCK: {item.stock}
                        </span>
                        {isDiscounted && (
                          <span className="px-2.5 py-1 bg-rose-600 text-white rounded-full font-sans text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5 animate-pulse">
                            <Percent size={8} /> SALE
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col gap-1 flex-1 justify-between">
                      <div>
                        <h3 className="font-title-md text-on-surface text-sm truncate font-black leading-tight">{item.name}</h3>
                        <p className="text-xs text-outline line-clamp-2 mt-1 leading-relaxed font-body">{item.description}</p>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-outline-variant/10">
                        {isDiscounted ? (
                          <div className="flex flex-col">
                            <span className="font-sans font-black text-secondary text-sm leading-none">₹{finalUnitPrice.toFixed(0)}</span>
                            <div className="flex items-center gap-1 mt-1 leading-none">
                              <span className="font-label-mono text-[9px] text-outline line-through">₹{item.price.toFixed(0)}</span>
                              <span className="bg-rose-50 text-rose-550 text-[8px] font-black px-1 rounded">-{item.discountPercentage}%</span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-sans font-extrabold text-on-surface text-sm">₹{item.price.toFixed(0)}</span>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                          className="w-8 h-8 bg-secondary/10 text-secondary rounded-full flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all cursor-pointer active:scale-90 focus:outline-none"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredItems.length === 0 && (
              <div className="col-span-full py-16 text-center text-outline-variant">
                <Frown size={42} className="mx-auto text-outline-variant/50 mb-2 shrink-0" />
                <p className="font-black text-sm text-on-surface">No products found matching criteria</p>
                <p className="text-xs mt-0.5">Try modifying search term or shifting selected categories.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for Mobile Cart */}
      {isCartOpenMobile && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 z-30 transition-opacity"
          onClick={() => setIsCartOpenMobile(false)}
        />
      )}

      {/* Right Sidebar: Active Cart & Checkout Context Drawer */}
      <div className={`
        fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-100 flex flex-col gap-5 h-full p-6 shadow-2xl transition-transform duration-300 transform
        lg:static lg:w-96 lg:bg-transparent lg:shadow-none lg:p-6 lg:pl-0 lg:translate-x-0
        ${isCartOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="bg-white rounded-[2.5rem] flex-1 flex flex-col overflow-hidden border border-outline-variant/15 apple-shadow p-5">
          
          {/* Cart Header Panel */}
          <div className="flex flex-col gap-3 mb-4 shrink-0">
            <div className="flex justify-between items-center select-none">
              {editingOrder ? (
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-headline-lg-mobile text-secondary text-base font-black flex items-center gap-1.5 leading-none">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0" />
                    Editing Ticket
                  </h2>
                  <span className="text-[10px] font-bold text-outline uppercase font-label-mono leading-none">#{editingOrder.id}</span>
                </div>
              ) : (
                <h2 className="font-headline-lg-mobile text-on-surface text-base font-black">Active Ticket</h2>
              )}
              <div className="flex items-center gap-1.5">
                {editingOrder ? (
                  <button 
                    onClick={onCancelEdit} 
                    className="px-3.5 py-1.5 bg-rose-55/15 hover:bg-rose-100 text-rose-600 transition-all rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer focus:outline-none"
                  >
                    Cancel Edit
                  </button>
                ) : (
                  <button 
                    onClick={() => setCartItems([])} 
                    disabled={cartItems.length === 0}
                    className="px-3.5 py-1.5 bg-rose-55/10 hover:bg-rose-100 text-rose-600 transition-all rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-35 disabled:pointer-events-none focus:outline-none"
                  >
                    Clear Cart
                  </button>
                )}
                <button 
                  onClick={() => setIsCartOpenMobile(false)}
                  className="lg:hidden p-1.5 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-xl cursor-pointer"
                  title="Close active ticket"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            
            {/* DineIn vs Takeaway */}
            <div className="flex p-1 bg-slate-100 rounded-xl gap-1 select-none">
              <button 
                onClick={() => setDineIn(true)}
                className={`flex-1 py-1.5 rounded-lg font-title-md text-[11px] font-black tracking-wide transition-colors cursor-pointer focus:outline-none ${
                  dineIn ? 'black-glossy shadow-xs text-white' : 'text-outline hover:text-on-surface'
                }`}
              >
                Dine-In
              </button>
              <button 
                onClick={() => setDineIn(false)}
                className={`flex-1 py-1.5 rounded-lg font-title-md text-[11px] font-black tracking-wide transition-colors cursor-pointer focus:outline-none ${
                  !dineIn ? 'black-glossy shadow-xs text-white' : 'text-outline hover:text-on-surface'
                }`}
              >
                Takeaway
              </button>
            </div>

            {dineIn ? (
              <div className="relative">
                <select 
                  className="w-full bg-slate-100 border-none rounded-xl py-2.5 px-4 appearance-none font-sans text-xs text-on-surface font-black cursor-pointer focus:ring-1 focus:ring-secondary/10 shadow-xs"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                >
                  {tables.map(table => (
                    <option key={table.id} value={`Table ${table.id}`}>Table {table.id} ({table.zone})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline shrink-0 animate-pulse" />
              </div>
            ) : (
              <div className="relative">
                <Tag size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pager Reference or Guest Name"
                  className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 font-sans text-xs text-on-surface focus:ring-1 focus:ring-secondary/10 shadow-xs outline-none font-bold"
                  value={takeawayRef}
                  onChange={(e) => setTakeawayRef(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Optional Customer Details Form Block */}
          <div className="bg-slate-50/50 border border-outline-variant/10 rounded-2xl p-3.5 mb-4 flex flex-col gap-2 shrink-0">
            <span className="text-[9px] font-black uppercase text-outline tracking-wider block">Customer Reference (Optional)</span>
            
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <User size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" />
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="w-full bg-white border border-outline-variant/10 rounded-xl py-1.5 pl-8 pr-3 text-[11px] font-semibold focus:ring-1 focus:ring-secondary/10 outline-none"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Phone size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" />
                  <input
                    type="text"
                    placeholder="Mobile"
                    className="w-full bg-white border border-outline-variant/10 rounded-xl py-1.5 pl-8 pr-3 text-[11px] font-semibold focus:ring-1 focus:ring-secondary/10 outline-none"
                    value={custPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustPhone(val);
                      const trimmed = val.trim();
                      if (trimmed.length >= 4) {
                        const matched = customers.find((c: any) => 
                          (c.phone && c.phone.trim() === trimmed) || 
                          (c.phone && c.phone.replace(/\D/g, '') === trimmed.replace(/\D/g, '')) ||
                          c.id === trimmed
                        );
                        if (matched) {
                          setCustName(matched.name);
                          if (matched.email) setCustEmail(matched.email);
                        }
                      }
                    }}
                  />
                </div>

                <div className="relative">
                  <Mail size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full bg-white border border-outline-variant/10 rounded-xl py-1.5 pl-8 pr-3 text-[11px] font-semibold focus:ring-1 focus:ring-secondary/10 outline-none"
                    value={custEmail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustEmail(val);
                      const trimmed = val.trim().toLowerCase();
                      if (trimmed.length > 3 && trimmed.includes('@')) {
                        const matched = customers.find((c: any) => 
                          (c.email && c.email.toLowerCase().trim() === trimmed) || 
                          c.id === trimmed
                        );
                        if (matched) {
                          setCustName(matched.name);
                          if (matched.phone) setCustPhone(matched.phone);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cart Items Body (scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 custom-scrollbar">
            <AnimatePresence initial={false}>
              {cartItems.map((item) => {
                const isItemDiscounted = item.menuItem.discountPercentage && item.menuItem.discountPercentage > 0;
                const unitPrice = calculateItemPrice(item.menuItem);
                const itemCartSubtotal = unitPrice * item.quantity;

                return (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.12 }}
                    key={item.id} 
                    className="flex items-center gap-3 py-1.5 border-b border-light border-outline-variant/5 group bg-white"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-outline-variant/10">
                      <img className="w-full h-full object-cover" src={item.menuItem.image} alt={item.menuItem.name} referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-sans font-black text-xs text-on-surface truncate pr-1">{item.menuItem.name}</h4>
                        <span className="font-sans text-secondary font-black text-xs shrink-0">
                          ₹{itemCartSubtotal.toFixed(0)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-bold text-slate-400">
                          ₹{unitPrice.toFixed(0)}/u
                        </span>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAdjustQuantity(item.id, -1)}
                            className="w-5.5 h-5.5 rounded-full border border-outline-variant/30 flex items-center justify-center text-outline hover:bg-slate-100 hover:text-black active:scale-90 transition-all cursor-pointer text-xs font-bold focus:outline-none"
                          >
                            -
                          </button>
                          <span className="font-label-mono font-black text-[11px] w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => handleAdjustQuantity(item.id, 1)}
                            className="w-5.5 h-5.5 rounded-full border border-outline-variant/30 flex items-center justify-center text-outline hover:bg-slate-100 hover:text-black active:scale-90 transition-all cursor-pointer text-xs font-bold focus:outline-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {cartItems.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-outline-variant my-auto shrink-0 select-none">
                <ShoppingBag size={35} className="stroke-1 mb-2 text-zinc-300" />
                <p className="font-black text-xs text-on-surface">Queue building state is idle</p>
                <p className="text-[10px] mt-0.5">Select client food cards to compose bill ticket.</p>
              </div>
            )}
          </div>

          {/* Cart Bill Details and Place Order footer block */}
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex flex-col gap-2 shrink-0 bg-white">
            
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-outline-variant">
              <span>Financial summary</span>
              <span>INR</span>
            </div>

            <div className="flex justify-between items-center text-xs mt-0.5 select-none">
              <span className="text-outline">Cart Subtotal</span>
              <span className="font-sans font-bold text-on-surface">₹{subtotal.toFixed(0)}</span>
            </div>

            {/* Bill Promotion selector dropdown inside checkout sidebar */}
            {cartItems.length > 0 && promoDiscounts && (
              <div className="flex flex-col gap-1 py-1 border-t border-dashed border-outline-variant/10 mt-1 shrink-0">
                <label className="text-[9px] font-black text-outline uppercase tracking-wider flex items-center gap-1">
                  <Tag size={9} className="text-secondary" />
                  <span>Promo Code Applied</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      className="w-full bg-slate-100 border-none rounded-lg py-1.5 px-3 appearance-none font-sans text-[10px] text-on-surface font-semibold cursor-pointer focus:ring-1 focus:ring-secondary/20 shadow-xs"
                      value={appliedPromo?.code || ''}
                      onChange={(e) => {
                        const selected = promoDiscounts.find(p => p.code === e.target.value);
                        if (selected) {
                          if (selected.minSpend && subtotal < selected.minSpend) {
                            alert(`Promo "${selected.code}" requires a minimum spend of ₹${selected.minSpend.toFixed(2)}.`);
                            return;
                          }
                          setAppliedPromo(selected);
                        } else {
                          setAppliedPromo(null);
                        }
                      }}
                    >
                      <option value="">-- Apply Coupon Code --</option>
                      {promoDiscounts.filter(p => p.isActive).map(promo => {
                        const isEligible = !promo.minSpend || subtotal >= promo.minSpend;
                        return (
                          <option key={promo.id} value={promo.code} disabled={!isEligible}>
                            {promo.code} ({promo.type === 'Percentage' ? `${promo.value}%` : `₹${promo.value}`}) {!isEligible ? `[Spend ₹${promo.minSpend}]` : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline shrink-0" />
                  </div>
                  
                  {appliedPromo && (
                    <button
                      onClick={() => setAppliedPromo(null)}
                      className="text-[9px] font-black text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 py-1.5 px-2 rounded-lg cursor-pointer transition-all shrink-0 font-sans uppercase focus:outline-none"
                    >
                      clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {appliedPromo && (
              <div className="flex justify-between items-center text-xs text-emerald-700 bg-emerald-50/50 px-3 py-1.5 border border-dashed border-emerald-250 rounded-lg leading-none font-bold">
                <span className="flex items-center gap-1 text-[9px] font-black uppercase">
                  Promo discount
                </span>
                <span className="font-sans font-extrabold">-₹{promoDiscountAmount.toFixed(0)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs">
              <span className="text-outline">Service Tax (10%)</span>
              <span className="font-sans font-bold text-on-surface">₹{serviceTax.toFixed(0)}</span>
            </div>

            <div className="flex justify-between items-center mt-1.5 border-t border-dashed border-outline-variant/20 pt-1.5 shrink-0 select-none">
              <span className="font-black text-on-surface text-xs uppercase tracking-wide">Final Bill</span>
              <span className="font-sans font-black text-2xl text-primary leading-none">₹{total.toFixed(0)}</span>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={cartItems.length === 0}
              className="black-glossy w-full py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all mt-1.5 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus:outline-none"
            >
              <span>{editingOrder ? 'Save Order Modifications' : 'Submit Ticket Code'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Duplicate Order Warning Bypass Confirm */}
      <AnimatePresence>
        {showDuplicateWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-outline-variant/15 p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-5 text-center animate-shake"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mx-auto">
                <AlertTriangle size={28} className="stroke-[2.5]" />
              </div>

              <div>
                <h3 className="font-sans font-black text-slate-900 text-lg uppercase tracking-wide">Duplicate Ticket Alarm</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  An identical order costing <span className="font-black text-slate-900">₹{total.toFixed(0)}</span> has already been placed on <span className="font-black text-indigo-700">{dineIn ? selectedTable : takeawayRef || 'Takeaway'}</span> within the last 30 seconds.
                </p>
                <p className="text-[11px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 leading-relaxed">
                  Accidental double tapping of "Submit Ticket" happens. Do you want to submit again and create a duplicate ticket anyway?
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    if (duplicateOrderData) {
                      executeOrderSubmission(duplicateOrderData);
                    }
                  }}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Yes, Force Place Ticket
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    setDuplicateOrderData(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-zinc-800 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  No, Abort (Cancel Duplicate)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: AcessLocked / Print Invoice Receipt Visuals overlay */}
      <AnimatePresence>
        {showReceipt && createdOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl flex flex-col gap-5 border border-slate-200"
            >
              <div className="flex justify-between items-center pb-2 border-b border-light border-outline-variant/10 select-none">
                <span className="text-[10px] font-black uppercase text-outline tracking-widest font-mono">Terminal Bill Success</span>
                <button
                  onClick={() => {
                    setShowReceipt(false);
                    setCreatedOrder(null);
                  }}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-950 transition-all cursor-pointer focus:outline-none shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Printable Ticket Receipt Area */}
              <div id="printable-receipt" className="border-2 border-dashed border-slate-200 rounded-3xl p-5 bg-slate-50/40 relative font-sans text-xs">
                
                {/* Decorative cutouts inside bills */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-6 rounded-r-full bg-white border border-slate-200 border-l-0" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-6 rounded-l-full bg-white border border-slate-200 border-r-0" />

                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <h3 className="font-sans font-black text-base text-slate-950 uppercase tracking-widest">AAHAR RESTAURANT</h3>
                  <span className="text-[10px] font-label-mono text-outline uppercase tracking-wider block mt-1">POS Terminal Receipt</span>
                </div>

                <div className="flex flex-col gap-1.5 py-4.5 border-b border-dashed border-slate-300 leading-tight">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-outline">Order Code:</span>
                    <span className="font-extrabold text-slate-900 font-mono">#{createdOrder.id}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-outline">Unique Bill ID:</span>
                    <span className="font-black text-indigo-700 font-mono text-[10px] uppercase truncate max-w-[190px]">
                      {createdOrder.billId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-outline">Daily Token No:</span>
                    <span className="font-black text-rose-600 font-mono text-sm">Token #{createdOrder.tokenNo || '1'}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-outline">Dining Status:</span>
                    <span className="font-bold text-slate-800">{createdOrder.tableRef}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2 mt-1 pt-1.5 border-t border-slate-100">
                    <span className="text-outline">Date & Time:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {new Date(createdOrder.timestamp).toLocaleDateString()} at {createdOrder.time || 'N/A'}
                    </span>
                  </div>
                  
                  {/* Option display customer specifics */}
                  {(createdOrder.customerName || createdOrder.customerPhone || createdOrder.customerEmail) && (
                    <div className="bg-white rounded-xl p-2.5 mt-2.5 border border-dashed border-slate-200 leading-relaxed font-semibold text-[10px] text-zinc-650 flex flex-col">
                      <span className="text-[8px] font-black uppercase text-outline tracking-wider">Recipient Guest</span>
                      {createdOrder.customerName && <div>Name: {createdOrder.customerName}</div>}
                      {createdOrder.customerPhone && <div>Mobile: {createdOrder.customerPhone}</div>}
                      {createdOrder.customerEmail && <div className="truncate">Email: {createdOrder.customerEmail}</div>}
                    </div>
                  )}
                </div>

                {/* Bill Items Rows */}
                <div className="py-4 flex flex-col gap-2 max-h-[170px] overflow-y-auto no-scrollbar border-b border-dashed border-slate-300">
                  {createdOrder.items.map((cart) => (
                    <div key={cart.id} className="flex justify-between items-start gap-3">
                      <span className="font-bold text-slate-800 flex-1 leading-normal">
                        {cart.menuItem.name} <span className="font-mono text-[10px] text-zinc-400">x{cart.quantity}</span>
                      </span>
                      <span className="font-label-mono text-slate-650 shrink-0">
                        ₹{(calculateItemPrice(cart.menuItem) * cart.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotals */}
                <div className="pt-4 flex flex-col gap-1.5 leading-none">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-outline">Subtotal:</span>
                    <span className="font-medium text-slate-800">₹{createdOrder.subtotal.toFixed(0)}</span>
                  </div>
                  {createdOrder.discount > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-700">
                      <span>Discount Coupon:</span>
                      <span>-₹{createdOrder.discount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-outline">Service Surcharge (10%):</span>
                    <span className="font-medium text-slate-800">₹{createdOrder.serviceTax.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-dashed border-slate-200 pt-3 mt-1.5 font-sans leading-none">
                    <span>FINAL BILL:</span>
                    <span className="font-sans font-black text-base text-slate-950">₹{createdOrder.total.toFixed(0)}</span>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-dashed border-slate-300 mt-4 text-[9px] text-outline font-label-mono uppercase tracking-widest leading-none">
                  Thank You • Taste of Tarkbyte Labs
                </div>
              </div>

              {/* Action Operations Panel: Print, WhatsApp, Email */}
              <div className="grid grid-cols-1 gap-2 select-none">
                <button
                  onClick={triggerPrintReceipt}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 outline-none border border-slate-900 focus:outline-none"
                >
                  <Printer size={14} />
                  <span>Print Invoice / Save PDF</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={getWhatsAppURILink()}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 text-center leading-none"
                  >
                    <Share2 size={13} />
                    <span>WhatsApp bill</span>
                  </a>

                  {createdOrder.customerEmail ? (
                    <button
                      onClick={handleSimulatedEmail}
                      disabled={emailSending || emailSentSuccess}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 focus:outline-none shrink-0"
                    >
                      {emailSending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : emailSentSuccess ? (
                        <Check size={13} />
                      ) : (
                        <Mail size={13} />
                      )}
                      <span>{emailSentSuccess ? 'Emailed' : 'Email bill'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl text-center cursor-not-allowed leading-none border border-outline-variant/10 select-none"
                      title="Provide email reference first"
                    >
                      <span>No guest email</span>
                    </button>
                  )}
                </div>

                {/* Feedback notifications */}
                {emailSentSuccess && (
                  <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-center font-bold">
                    Cloud Service: Electronic invoice dispatched safely to "{createdOrder.customerEmail}"!
                  </p>
                )}

                <button
                  onClick={() => {
                    setShowReceipt(false);
                    setCreatedOrder(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wide text-center mt-2 cursor-pointer focus:outline-none"
                >
                  Next POS Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Bar for Mobile View */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30">
        <button 
          onClick={() => setIsCartOpenMobile(true)}
          className="w-full black-glossy text-white py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <span>Active Ticket ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
          </div>
          <span>₹{total.toFixed(0)}</span>
        </button>
      </div>
    </div>
  );
}
