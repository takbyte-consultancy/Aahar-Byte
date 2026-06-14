/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, OrderStatus, MenuItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  X, 
  Search, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Grid, 
  Edit2, 
  Trash2, 
  Plus, 
  Minus, 
  AlertCircle,
  Clock,
  CheckCircle,
  Ban,
  FileText
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onModifyOrder?: (orderId: string, updatedOrder: any) => void;
  onStartModifyOrder?: (order: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  onPrintInvoice?: (order: Order) => void;
  menuItems: MenuItem[];
}

export default function OrdersView({ 
  orders, 
  onUpdateStatus, 
  onModifyOrder, 
  onStartModifyOrder,
  onDeleteOrder, 
  onPrintInvoice,
  menuItems = []
}: OrdersViewProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders.length > 0 ? orders[0].id : null
  );

  // Advanced Backlog Filter states
  const [dateQuery, setDateQuery] = useState(() => {
    // Default filter to today to see today's orders by default
    const now = new Date();
    return now.toISOString().split('T')[0]; // "yyyy-mm-dd"
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');

  // Mobile active receipt drawer visibility state
  const [isReceiptOpenMobile, setIsReceiptOpenMobile] = useState(false);

  // Edit/Modification Dialog states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editTableRef, setEditTableRef] = useState('');
  const [editItems, setEditItems] = useState<{ menuItem: MenuItem; quantity: number; customization?: string }[]>([]);
  const [addItemQuery, setAddItemQuery] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  const selectedOrder = orders.find(order => order.id === selectedOrderId);

  // Helper: check if transaction timestamp belongs to today
  const isTodayDate = (timestampStr: string | Date | undefined) => {
    if (!timestampStr) return false;
    const now = new Date();
    const d = new Date(timestampStr);
    return now.toDateString() === d.toDateString();
  };

  // 1. Calculate count of all orders today
  const todayOrdersCount = orders.filter(o => isTodayDate(o.timestamp)).length;

  // Convert ddmmyy format string to yyyy-mm-dd
  const parseOrderDateToYYYYMMDD = (orderDateStr: string | undefined, timestampStr: string | Date | undefined) => {
    if (timestampStr) {
      try {
        const d = new Date(timestampStr);
        return d.toISOString().split('T')[0];
      } catch (e) {}
    }
    if (orderDateStr && orderDateStr.length === 6) {
      const dd = orderDateStr.slice(0, 2);
      const mm = orderDateStr.slice(2, 4);
      const yy = '20' + orderDateStr.slice(4, 6);
      return `${yy}-${mm}-${dd}`;
    }
    return '';
  };

  // 2. Filter criteria logic according to requests (Date, Name, Number, Email, status)
  const filteredOrders = orders.filter(order => {
    // Date filter
    if (dateQuery) {
      const orderYYYYMMDD = parseOrderDateToYYYYMMDD(order.id?.split('_')[0], order.timestamp);
      if (orderYYYYMMDD !== dateQuery) return false;
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (order.status !== statusFilter) return false;
    }

    // Name, telephone number, email search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = (order.customerName || '').toLowerCase().includes(query);
      const phoneMatch = (order.customerPhone || '').toLowerCase().includes(query);
      const emailMatch = (order.customerEmail || '').toLowerCase().includes(query);
      const tableMatch = (order.tableRef || '').toLowerCase().includes(query);
      const tokenMatch = String(order.tokenNo || '').includes(query);
      const billMatch = (order.billNo || order.id || '').toLowerCase().includes(query);

      if (!nameMatch && !phoneMatch && !emailMatch && !tableMatch && !tokenMatch && !billMatch) {
         return false;
      }
    }

    return true;
  });

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return { bg: 'bg-amber-100/60 dark:bg-amber-500/10', text: 'text-amber-700', dot: 'bg-amber-500' };
      case 'Action Required':
        return { bg: 'bg-rose-100/60 dark:bg-rose-500/10', text: 'text-rose-700', dot: 'bg-rose-500' };
      case 'Ready':
        return { bg: 'bg-emerald-100/60 dark:bg-emerald-500/10', text: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'Completed':
        return { bg: 'bg-gray-100/60 dark:bg-gray-500/10', text: 'text-gray-600', dot: 'bg-gray-400' };
      case 'Delayed':
        return { bg: 'bg-red-100/60 dark:bg-red-500/10', text: 'text-red-700', dot: 'bg-red-600' };
      case 'Cancelled':
        return { bg: 'bg-zinc-100/60 text-zinc-500 line-through', text: 'text-zinc-600', dot: 'bg-zinc-400' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
    }
  };

  const handlePrint = () => {
    if (!selectedOrder) return;
    if (onPrintInvoice) onPrintInvoice(selectedOrder);
    alert(`Preparing print task for Receipt Bill #${selectedOrder.id}...`);
  };

  const handleCompletePayment = () => {
    if (!selectedOrderId) return;
    onUpdateStatus(selectedOrderId, 'Completed');
    alert(`Payment processed! Order #${selectedOrderId} changed to Completed.`);
  };

  const handleMarkAsReady = () => {
    if (!selectedOrderId) return;
    onUpdateStatus(selectedOrderId, 'Ready');
    alert(`Order #${selectedOrderId} marked as Ready for pickup.`);
  };

  const handleCancelOrder = () => {
    if (!selectedOrderId) return;
    onUpdateStatus(selectedOrderId, 'Cancelled');
    alert(`Order #${selectedOrderId} cancelled successfully.`);
  };

  const handleDeleteTicket = () => {
    if (!selectedOrderId) return;
    if (confirm(`Are you sure you want to delete order ticket #${selectedOrderId} entirely from the database?`)) {
      if (onDeleteOrder) {
        onDeleteOrder(selectedOrderId);
        setSelectedOrderId(orders[0]?.id || null);
        setIsReceiptOpenMobile(false);
      } else {
        alert('Deletion callback not available');
      }
    }
  };

  // Initialize edit fields
  const handleOpenModify = () => {
    if (!selectedOrder) return;
    if (onStartModifyOrder) {
      onStartModifyOrder(selectedOrder);
    } else {
      setEditCustName(selectedOrder.customerName || '');
      setEditCustPhone(selectedOrder.customerPhone || '');
      setEditCustEmail(selectedOrder.customerEmail || '');
      setEditTableRef(selectedOrder.tableRef || '');
      setEditItems(selectedOrder.items.map(i => ({ ...i })));
      setIsEditModalOpen(true);
    }
  };

  // Modify Item quantities in edits
  const handleEditItemQty = (index: number, delta: number) => {
    const updated = [...editItems];
    updated[index].quantity = Math.max(1, updated[index].quantity + delta);
    setEditItems(updated);
  };

  const handleRemoveEditItem = (index: number) => {
    const updated = [...editItems];
    updated.splice(index, 1);
    setEditItems(updated);
  };

  const handleAddDishToEdit = (dish: MenuItem) => {
    const existingIdx = editItems.findIndex(i => i.menuItem.id === dish.id);
    if (existingIdx > -1) {
      const updated = [...editItems];
      updated[existingIdx].quantity += 1;
      setEditItems(updated);
    } else {
      setEditItems([...editItems, { menuItem: dish, quantity: 1 }]);
    }
    setShowItemDropdown(false);
    setAddItemQuery('');
  };

  // Calculate prices for edited cart
  const calculateEditTotals = () => {
    const subtotal = editItems.reduce((acc, item) => {
      const priceVal = item.menuItem.price * (1 - (item.menuItem.discountPercentage || 0) / 100);
      return acc + (priceVal * item.quantity);
    }, 0);
    const rate = selectedOrder?.discountRate || 0;
    const discount = subtotal * rate;
    const taxRate = selectedOrder?.taxRate || 0.10;
    const serviceTax = (subtotal - discount) * taxRate;
    const total = subtotal - discount + serviceTax;
    return { subtotal, discount, serviceTax, total };
  };

  const handleSaveModify = () => {
    if (!selectedOrder || !onModifyOrder) return;
    if (editItems.length === 0) {
      alert('Please add at least one item to save modifications.');
      return;
    }

    const { subtotal, discount, serviceTax, total } = calculateEditTotals();
    const updatedPayload = {
      customerName: editCustName.trim(),
      customerPhone: editCustPhone.trim(),
      customerEmail: editCustEmail.trim(),
      tableRef: editTableRef.trim() || 'Table 01',
      items: editItems,
      subtotal,
      discount,
      serviceTax,
      total
    };

    onModifyOrder(selectedOrder.id, updatedPayload);
    setIsEditModalOpen(false);
    alert('Order modified successfully!');
  };

  // Filter Menu Options in Edit dropdown
  const filteredMenuOptions = menuItems.filter(item => 
    item.name.toLowerCase().includes(addItemQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col xl:flex-row overflow-hidden p-4 sm:p-6 gap-6 h-full">
      {/* Left: Active/All Orders List with rich filters */}
      <div className="flex-1 flex flex-col gap-5 overflow-hidden h-full">
        {/* Header Block specifying All orders today */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
          <div>
            <h2 className="font-headline-lg-mobile text-on-surface text-2xl font-black flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" /> Active Backlog
            </h2>
            <p className="text-xs text-outline mt-0.5">
              Live kitchen orders and dispatch backlog. Today total ticket count: <strong className="font-label-mono text-secondary">{todayOrdersCount} orders</strong>
            </p>
          </div>
          
          <div className="bg-surface-container text-xs font-label-mono font-black py-1.5 px-3 rounded-full border border-outline-variant/20 shadow-xs uppercase tracking-wider">
            Live Backlog Active
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 p-4 rounded-3xl apple-shadow shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Date Filter */}
          <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/10">
            <Calendar className="w-4 h-4 text-outline shrink-0" />
            <input 
              type="date"
              value={dateQuery}
              onChange={(e) => setDateQuery(e.target.value)}
              className="bg-transparent text-xs text-on-surface font-black focus:outline-none w-full cursor-pointer"
              title="Select backlog date"
            />
            {dateQuery && (
              <button 
                onClick={() => setDateQuery('')} 
                className="text-outline hover:text-red-500 hover:bg-slate-200/50 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                title="Clear date filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Text Query (Name, phone, table) */}
          <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/10">
            <Search className="w-4 h-4 text-outline shrink-0" />
            <input 
              type="text"
              placeholder="Search Customer, phone, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-on-surface focus:outline-none w-full font-bold"
            />
          </div>

          {/* 3. Status filter selection */}
          <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/10">
            <span className="text-[10px] text-outline uppercase font-black">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-black text-on-surface focus:outline-none cursor-pointer w-full font-sans"
            >
              <option value="All">All States</option>
              <option value="Placed">Placed</option>
              <option value="Pending">Pending</option>
              <option value="Action Required">Action Required</option>
              <option value="Ready">Ready</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Outer list scrollable container */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map(order => {
                const statusTheme = getStatusStyle(order.status);
                const isSelected = order.id === selectedOrderId;
                const totalItemsQty = order.items.reduce((total, it) => total + it.quantity, 0);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsReceiptOpenMobile(true);
                    }}
                    key={order.id}
                    className={`p-5 rounded-[2rem] border border-outline-variant/15 apple-shadow transition-all hover:translate-y-[-2px] cursor-pointer relative overflow-hidden flex flex-col justify-between h-[210px] ${
                      isSelected 
                        ? 'black-glossy text-white' 
                        : 'bg-surface-container-lowest text-on-surface'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`${isSelected ? 'text-white' : 'text-outline'} font-label-mono text-[10px] font-bold`}>
                              ID: {order.id}
                            </span>
                            <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full ${
                              order.dineIn 
                                ? (isSelected ? 'bg-white/20 text-white' : 'bg-secondary-container/10 text-secondary')
                                : (isSelected ? 'bg-white/20 text-white' : 'bg-outline-variant/50 text-on-surface-variant')
                            }`}>
                              {order.dineIn ? 'Dine-In' : 'Takeaway'}
                            </span>
                          </div>
                          <h3 className="font-title-md font-black text-base mt-1 flex items-center gap-2">
                            Token #{order.tokenNo} <span className="font-semibold text-xs opacity-75">{order.tableRef}</span>
                          </h3>
                        </div>
                        
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusTheme.bg} ${statusTheme.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dot}`}></span>
                          <span className="font-label-mono text-[9px] font-black uppercase">{order.status}</span>
                        </div>
                      </div>

                      {/* Customer inline brief contacts */}
                      {(order.customerName || order.customerPhone) && (
                        <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-500'} font-medium flex gap-2 truncate mt-1`}>
                          <span>Client: {order.customerName || 'Guest'}</span>
                          {order.customerPhone && <span className="font-label-mono">({order.customerPhone})</span>}
                        </div>
                      )}

                      <div className="flex-1 border-t border-dashed border-outline-variant/15 pt-2 mt-2">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <p key={idx} className="text-xs truncate mb-0.5 opacity-80 font-body-sm">
                            {item.quantity}x {item.menuItem.name} 
                            {item.customization && <span className="italic opacity-60"> ({item.customization})</span>}
                          </p>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-[10px] font-black text-outline-variant italic mt-0.5 font-body-sm">
                            + {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-outline-variant/10">
                      <span className="text-[10px] opacity-70 font-body-sm font-label-mono">
                        {order.timestamp ? new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : order.time || 'N/A'}
                      </span>
                      <span className="font-label-mono font-black text-sm leading-none">
                        ₹{order.total.toFixed(0)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredOrders.length === 0 && (
              <div className="col-span-full py-20 text-center text-on-surface-variant opacity-60 bg-surface-container-low/40 rounded-[2rem] border border-dashed border-outline-variant/20 flex flex-col items-center justify-center">
                <ClipboardList size={44} className="text-outline-variant/65 mb-2 shrink-0" />
                <p className="font-black text-base">No backlog orders found.</p>
                <p className="text-xs text-outline mt-1 font-medium">Try choosing another back-date or adjusting query keywords.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for Mobile Receipt */}
      {isReceiptOpenMobile && selectedOrder && (
        <div 
          className="xl:hidden fixed inset-0 bg-black/40 z-30 transition-opacity"
          onClick={() => setIsReceiptOpenMobile(false)}
        />
      )}

      {/* Right: Selected Live Receipt Detail Panel */}
      <div className={`
        fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-slate-50 flex flex-col h-full shadow-2xl transition-transform duration-300 transform
        xl:static xl:w-[420px] xl:bg-transparent xl:shadow-none xl:translate-x-0
        ${isReceiptOpenMobile && selectedOrder ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}
      `}>
        <div className="bg-white rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-xl border border-outline-variant/20">
          {selectedOrder ? (
            <div className="flex-1 flex flex-col p-5 overflow-hidden">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="font-headline-lg-mobile text-on-surface text-lg font-black flex items-center gap-2">Ticket Console</h2>
                <button 
                  onClick={() => setIsReceiptOpenMobile(false)}
                  className="xl:hidden p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                  title="Close Digital Receipt"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Receipt Visual Container */}
              <div className="flex-1 overflow-y-auto pr-1 select-none custom-scrollbar pb-4">
                <div className="receipt-paper p-5 border border-gray-100 rounded-3xl">
                  <div className="text-center pb-4 border-b border-dashed border-outline-variant/20 flex flex-col items-center gap-1 justify-center">
                    <span className="font-label-mono font-black text-lg tracking-widest text-[#1a1c1f]">AAHAR POS</span>
                    <span className="font-body-sm text-[8px] text-outline uppercase tracking-[0.2em] font-extrabold">Active Kitchen Ticket</span>
                    <span className="font-body-sm text-[10px] text-on-surface-variant font-black">Token No: Token #{selectedOrder.tokenNo}</span>
                  </div>

                  {/* Receipt Meta Infos */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-b border-dashed border-outline-variant/20 py-3 text-xs">
                    <div>
                      <span className="text-[10px] text-outline block">LOCATION</span>
                      <span className="font-bold text-on-surface font-label-mono text-[#001a41] uppercase tracking-wide">{selectedOrder.tableRef}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline block">STATION WAITER</span>
                      <span className="font-bold text-on-surface">{selectedOrder.waitstaff}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline block">TRANSACTION TIME</span>
                      <span className="font-bold text-on-surface font-label-mono whitespace-nowrap text-xs">
                        {new Date(selectedOrder.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline block">CLIENT CORRELATOR</span>
                      <span className="font-bold text-rose-600 truncate block text-[11px] font-label-mono">{selectedOrder.customerName || 'Anonymous Guest'}</span>
                    </div>
                  </div>

                  {/* Receipt Table Row Entries */}
                  <div className="py-3 border-b border-dashed border-outline-variant/20 flex flex-col gap-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="font-label-mono font-black text-xs text-outline w-6">
                          {item.quantity}x
                        </div>
                        <div className="flex-1 flex flex-col">
                          <span className="text-xs font-black text-[#1a1c1f]">{item.menuItem.name}</span>
                          {item.customization && (
                            <span className="font-body-sm text-[9px] text-outline italic font-bold">{item.customization}</span>
                          )}
                        </div>
                        <div className="font-label-mono font-bold text-xs text-[#1a1c1f] text-right">
                          ₹{(item.menuItem.price * item.quantity).toFixed(0)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Receipt Financial Row Sums */}
                  <div className="py-3 flex flex-col gap-2 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-outline">Subtotal</span>
                      <span className="font-label-mono font-bold text-on-surface">₹{selectedOrder.subtotal.toFixed(0)}</span>
                    </div>
                    {selectedOrder.discountRate > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-600 font-bold">
                        <span>Promo Code Discount ({(selectedOrder.discountRate * 100).toFixed(0)}%)</span>
                        <span className="font-label-mono">-₹{(selectedOrder.subtotal * selectedOrder.discountRate).toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px]">
                      <span className="text-outline">Service Tax & GST ({(selectedOrder.taxRate * 100).toFixed(0)}%)</span>
                      <span className="font-label-mono font-bold text-on-surface">
                        ₹{(selectedOrder.subtotal * (1 - selectedOrder.discountRate) * selectedOrder.taxRate).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2 flex-1 border-t border-dashed border-outline-variant/20 pt-2">
                      <span className="font-black text-on-surface text-[11px] uppercase tracking-wider">NET RECEIVABLE</span>
                      <span className="font-label-mono font-black text-sm text-[#1a1c1f]">₹{selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipt Operational Action Buttons */}
              <div className="mt-auto flex flex-col gap-2 shrink-0 border-t border-outline-variant/15 pt-3 bg-white">
                
                {/* Modify & Cancel actions block */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleOpenModify}
                    className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20 font-black text-[11px] uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    title="Edit Customer, Table or ordered dishes"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-secondary" /> Modify Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 font-black text-[11px] uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    title="Cancel Active Order Ticket"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel Ticket
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handlePrint}
                    className="bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20 font-black text-[11px] uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Print Bill</span>
                  </button>

                  <button
                    onClick={handleDeleteTicket}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black text-[11px] uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    title="Delete entirety from state"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete Ticket</span>
                  </button>
                </div>

                {/* Simple & Versatile Status Update Grid */}
                <div className="flex flex-col gap-2 bg-surface-container-low p-3.5 rounded-[1.5rem] border border-outline-variant/15">
                  <span className="text-[10px] uppercase font-black tracking-wider text-outline block">Update Ticket Status</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { status: 'Pending', label: 'Pending' },
                      { status: 'Delayed', label: 'Delayed' },
                      { status: 'Completed', label: 'Completed' },
                      { status: 'Cancelled', label: 'Cancelled' }
                    ].map(opt => {
                      const isActive = selectedOrder.status === opt.status;
                      let badgeStyle = '';
                      if (isActive) {
                        if (opt.status === 'Pending') badgeStyle = 'bg-amber-600 border-amber-600 text-white';
                        else if (opt.status === 'Delayed') badgeStyle = 'bg-rose-600 border-rose-600 text-white';
                        else if (opt.status === 'Completed') badgeStyle = 'bg-emerald-600 border-emerald-600 text-white';
                        else if (opt.status === 'Cancelled') badgeStyle = 'bg-zinc-600 border-zinc-600 text-white';
                      } else {
                        badgeStyle = 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200';
                      }

                      return (
                        <button
                          key={opt.status}
                          onClick={() => {
                            onUpdateStatus(selectedOrder.id, opt.status as any);
                          }}
                          className={`py-2.5 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 ${badgeStyle}`}
                        >
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant opacity-40 text-center select-none">
              <ClipboardList size={44} className="text-outline-variant/65 mb-2 shrink-0" />
              <p className="font-bold text-base">No Ticket Selected</p>
              <p className="text-xs text-outline mt-1 font-semibold">Choose an active ticket on the left menu.</p>
            </div>
          )}
        </div>
      </div>

      {/* COMPREHENSIVE ORDER MODIFICATION MODAL DIALOG */}
      <AnimatePresence>
        {isEditModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container-lowest max-w-2xl w-full rounded-[2.5rem] border border-outline-variant/25 p-6 sm:p-8 apple-shadow flex flex-col gap-6"
            >
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <Edit2 className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-sans font-black text-lg text-on-surface">Modify Backlog Ticket Details</h3>
                    <p className="text-xs text-outline font-semibold">Editing ticket sequence ID: #{selectedOrder.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface transition-all flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edit inputs split frame */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field set left */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-black tracking-wider text-outline block">Customer Demographics</span>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-700">Client Name</label>
                    <input 
                      type="text"
                      className="bg-surface-container-low border border-outline-variant/20 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      value={editCustName}
                      onChange={(e) => setEditCustName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />

                    <label className="text-[11px] font-bold text-slate-700">Phone</label>
                    <input 
                      type="text"
                      className="bg-surface-container-low border border-outline-variant/20 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      value={editCustPhone}
                      onChange={(e) => setEditCustPhone(e.target.value)}
                      placeholder="e.g. 919876543210"
                    />

                    <label className="text-[11px] font-bold text-slate-700">Email Address</label>
                    <input 
                      type="email"
                      className="bg-surface-container-low border border-outline-variant/20 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      value={editCustEmail}
                      onChange={(e) => setEditCustEmail(e.target.value)}
                      placeholder="e.g. john@domain.com"
                    />

                    <label className="text-[11px] font-bold text-slate-700">Dining Table / Seating Reference</label>
                    <input 
                      type="text"
                      className="bg-surface-container-low border border-outline-variant/20 px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      value={editTableRef}
                      onChange={(e) => setEditTableRef(e.target.value)}
                      placeholder="Table ID e.g. Table 03, Pager 4"
                    />
                  </div>
                </div>

                {/* Edit Items list right */}
                <div className="flex flex-col gap-2 overflow-hidden h-[330px]">
                  <span className="text-[10px] uppercase font-black tracking-wider text-outline block">Menu Dish Cart & Quantities</span>
                  
                  {/* Append / dropdown selector for new menu dishes */}
                  <div className="relative shrink-0 mb-1">
                    <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-1.5">
                      <Plus className="w-3.5 h-3.5 text-outline shrink-0" />
                      <input 
                        type="text"
                        placeholder="Search & append custom meal..."
                        className="bg-transparent text-xs font-bold focus:outline-none w-full"
                        value={addItemQuery}
                        onChange={(e) => {
                          setAddItemQuery(e.target.value);
                          setShowItemDropdown(true);
                        }}
                        onFocus={() => setShowItemDropdown(true)}
                      />
                    </div>

                    {showItemDropdown && addItemQuery && (
                      <div className="absolute left-0 right-0 top-9 bg-white border border-outline-variant/20 rounded-xl shadow-xl z-50 max-h-[140px] overflow-y-auto p-1 text-xs">
                        {filteredMenuOptions.map(option => (
                          <div 
                            key={option.id}
                            onClick={() => handleAddDishToEdit(option)}
                            className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between font-bold"
                          >
                            <span>{option.name}</span>
                            <span className="text-outline font-label-mono text-[10px]">₹{option.price}</span>
                          </div>
                        ))}
                        {filteredMenuOptions.length === 0 && (
                          <div className="text-center p-3 text-outline italic text-[11px]">No matching dishes.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Scrollable list edit */}
                  <div className="flex-1 overflow-y-auto border border-outline-variant/10 rounded-2xl bg-white p-2">
                    {editItems.map((item, idx) => {
                      const priceVal = item.menuItem.price * (1 - (item.menuItem.discountPercentage || 0) / 100);
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl border-b border-outline-variant/5 last:border-0 grow">
                          <div className="truncate pr-2">
                            <div className="font-extrabold text-xs text-slate-800 truncate">{item.menuItem.name}</div>
                            <div className="text-[10px] text-outline font-label-mono font-bold">₹{priceVal.toFixed(0)} each</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditItemQty(idx, -1)}
                              className="w-6 h-6 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-label-mono font-black text-xs w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleEditItemQty(idx, 1)}
                              className="w-6 h-6 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleRemoveEditItem(idx)}
                              className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-150 text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recalculated parameters */}
              <div className="border-t border-outline-variant/20 pt-4 bg-surface-container-low rounded-3xl p-4 border flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-outline font-extrabold block">ORIGINAL TOTAL</span>
                  <span className="font-label-mono font-black line-through text-slate-400">₹{selectedOrder.total?.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-outline font-extrabold block">RECALCULATED NET</span>
                  <span className="font-label-mono font-black text-rose-600 text-sm">₹{calculateEditTotals().total.toFixed(0)}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end shrink-0">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md py-3 px-6 rounded-xl cursor-pointer text-sm font-bold"
                >
                  Discard Edits
                </button>
                <button
                  onClick={handleSaveModify}
                  className="bg-primary hover:bg-primary-hover text-white font-title-md py-3 px-6 rounded-xl cursor-pointer text-sm font-black text-white"
                >
                  Save Modifications
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
