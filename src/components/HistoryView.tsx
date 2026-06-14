/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, MenuCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Search, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Download, 
  Send, 
  Share2, 
  MessageSquare,
  FileText,
  Printer,
  Percent,
  X,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Tag
} from 'lucide-react';

interface HistoryViewProps {
  orders: Order[];
  categories?: MenuCategory[];
}

export default function HistoryView({ orders, categories }: HistoryViewProps) {
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // New fine-grained filters
  const [yearFilter, setYearFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [emailFilter, setEmailFilter] = useState('');
  
  // Active selected order for viewing details/bill actions dialog
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Simulation feedback states
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Dynamically extract unique years and categories present in orders
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<string>();
    orders.forEach(order => {
      if (order.timestamp) {
        try {
          const d = new Date(order.timestamp);
          const y = d.getFullYear().toString();
          if (y && y !== 'NaN') yearsSet.add(y);
        } catch {}
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [orders]);

  const availableCategories = React.useMemo(() => {
    if (categories && categories.length > 0) {
      return Array.from(new Set(categories.map(c => c.trim())));
    }
    const catsSet = new Set<string>();
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.menuItem?.category) {
          catsSet.add(item.menuItem.category.trim());
        }
      });
    });
    return Array.from(catsSet).sort();
  }, [orders, categories]);

  const MONTHS = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Convert ddmmyy format string back to yyyy-mm-dd for matches
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

  // Advanced Filtering
  const filteredOrders = orders.filter(order => {
    // 1. Date Filter
    if (dateFilter) {
      const orderYYYYMMDD = parseOrderDateToYYYYMMDD(order.id?.split('_')[0], order.timestamp);
      if (orderYYYYMMDD !== dateFilter) return false;
    }

    const orderDate = order.timestamp ? new Date(order.timestamp) : null;

    // 2. Year Filter
    if (yearFilter !== 'All' && orderDate) {
      if (orderDate.getFullYear().toString() !== yearFilter) return false;
    }

    // 3. Month Filter
    if (monthFilter !== 'All' && orderDate) {
      if ((orderDate.getMonth() + 1).toString() !== monthFilter) return false;
    }

    // 4. Category Filter (checks if any single item in the order has this category)
    if (categoryFilter !== 'All') {
      const hasCategory = order.items?.some(item => item.menuItem?.category === categoryFilter);
      if (!hasCategory) return false;
    }

    // 5. Customer Email Filter
    if (emailFilter.trim()) {
      const emailQuery = emailFilter.toLowerCase();
      if (!(order.customerEmail || '').toLowerCase().includes(emailQuery)) return false;
    }

    // 6. Status Filter
    if (statusFilter !== 'All') {
      if (order.status !== statusFilter) return false;
    }

    // 7. Search Query (Name, Phone, Email, Invoice Number / Token No)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = (order.customerName || '').toLowerCase().includes(query);
      const phoneMatch = (order.customerPhone || '').toLowerCase().includes(query);
      const emailMatch = (order.customerEmail || '').toLowerCase().includes(query);
      const idMatch = (order.id || '').toLowerCase().includes(query);
      const billMatch = (order.billNo || '').toLowerCase().includes(query);
      const tokenMatch = String(order.tokenNo || '').includes(query);
      
      if (!nameMatch && !phoneMatch && !emailMatch && !idMatch && !billMatch && !tokenMatch) {
        return false;
      }
    }

    return true;
  });

  // CSV Export functions
  const handleExportCSV = (exportAll: boolean) => {
    const listToExport = exportAll ? orders : filteredOrders;
    
    if (listToExport.length === 0) {
      showNotification('No transactions found matching criteria to export!', 'info');
      return;
    }

    const csvHeaders = [
      'Bill ID / Order ID',
      'Token No',
      'Date-Time',
      'Year',
      'Month',
      'Day',
      'Day of Week',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Order Status',
      'Dine-In / Takeaway',
      'Table / Pager Ref',
      'Menu Item Categories',
      'Total Items Count',
      'Detailed Items List',
      'Subtotal (INR)',
      'Discount Rate (%)',
      'Discount Applied (INR)',
      'GST Taxes (INR)',
      'Grand Total Paid (INR)',
      'Waitstaff Handler'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    const rowStrings = listToExport.map(order => {
      const orderDate = order.timestamp ? new Date(order.timestamp) : new Date();
      
      // Separated Year, Month, Day fields as instructed!
      const year = orderDate.getFullYear();
      const monthPrefix = orderDate.toLocaleString([], { month: 'long' }); // e.g. June
      const monthIndex = orderDate.getMonth() + 1; // 1-12
      const monthField = `${monthPrefix} (${monthIndex})`;
      const day = orderDate.getDate();
      const dayOfWeek = orderDate.toLocaleDateString([], { weekday: 'long' });
      const dateTimeStr = orderDate.toLocaleString();
      
      // Financial calculations
      const discAmount = (order.subtotal || 0) * (order.discountRate || 0);
      const taxAmount = ((order.subtotal || 0) - discAmount) * (order.taxRate || 0);
      
      // Unique item categories
      const categoriesSet = Array.from(new Set(order.items?.map(item => item.menuItem?.category).filter(Boolean)));
      const categoriesString = categoriesSet.join(' | ');
      
      // Totals
      const totalItemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const detailedItemsList = order.items?.map(item => 
        `${item.menuItem?.name || 'Item'} x${item.quantity} [${item.menuItem?.category || 'General'}]`
      ).join('; ') || '';
      
      const row = [
        order.billNo || order.id,
        order.tokenNo || 'N/A',
        dateTimeStr,
        year,
        monthField,
        day,
        dayOfWeek,
        order.customerName || 'Walk-in Guest',
        order.customerPhone || 'N/A',
        order.customerEmail || 'N/A',
        order.status,
        order.dineIn ? 'Dine-In' : 'Takeaway',
        order.tableRef || 'N/A',
        categoriesString,
        totalItemsCount,
        detailedItemsList,
        order.subtotal?.toFixed(2) || '0.00',
        ((order.discountRate || 0) * 100).toFixed(0),
        discAmount.toFixed(2),
        taxAmount.toFixed(2),
        order.total?.toFixed(2) || '0.00',
        order.waitstaff || 'System'
      ];
      
      return row.map(escapeCSV).join(',');
    });

    const csvContent = '\uFEFF' + [csvHeaders.join(','), ...rowStrings].join('\n'); // Add UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const filePrefix = exportAll ? 'All_History' : 'Filtered_History';
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
    link.download = `${filePrefix}_Export_${timestamp}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(
      `Successfully exported ${listToExport.length} orders to CSV (${exportAll ? 'Full Archive' : 'Active Filters'})!`, 
      'success'
    );
  };

  const handleResetFilters = () => {
    setDateFilter('');
    setSearchQuery('');
    setStatusFilter('All');
    setYearFilter('All');
    setMonthFilter('All');
    setCategoryFilter('All');
    setEmailFilter('');
    showNotification('All query filters have been reset!', 'info');
  };

  // Calculate high-fidelity receipt text
  const generateReceiptText = (order: Order) => {
    const dateStr = order.timestamp ? new Date(order.timestamp).toLocaleString() : order.time || 'N/A';
    const itemsStr = order.items.map(item => {
      const discountText = item.menuItem.discountPercentage ? ` (${item.menuItem.discountPercentage}% off)` : '';
      const priceVal = item.menuItem.price * (1 - (item.menuItem.discountPercentage || 0) / 100);
      return `- ${item.menuItem.name} x${item.quantity} [₹${priceVal.toFixed(0)}${discountText}]: ₹${(priceVal * item.quantity).toFixed(0)}`;
    }).join('\n');

    const discAmount = order.subtotal * order.discountRate;
    const taxAmount = (order.subtotal - discAmount) * order.taxRate;

    return `==========================================
             AAHAR RESTAURANT
          POS INVOICE & RECEIPT
==========================================
Bill ID:     ${order.billNo || order.id}
Token No:    Token #${order.tokenNo || '1'}
Date/Time:   ${dateStr}
Waitstaff:   ${order.waitstaff || 'Sarah Jenkins'}
Format:      ${order.dineIn ? 'Dine-In' : 'Takeaway'}
Table/Pager: ${order.tableRef || 'N/A'}
==========================================
ITEMS ORDERED:
${itemsStr}
==========================================
CUSTOMER DETAILS:
Name:  ${order.customerName || 'Guest'}
Phone: ${order.customerPhone || 'N/A'}
Email: ${order.customerEmail || 'N/A'}
==========================================
FINANCIAL TRANSACTION SUMMARY:
Subtotal:          ₹${order.subtotal?.toFixed(2)}
Discount (${(order.discountRate * 100).toFixed(0)}%):    -₹${discAmount?.toFixed(2)}
GST/Service Tax (${(order.taxRate * 100).toFixed(0)}%): ₹${taxAmount?.toFixed(2)}
------------------------------------------
TOTAL PAID:        ₹${order.total?.toFixed(2)}
==========================================
       THANK YOU FOR DINING WITH US
          Power by Tarkbyte Labs
==========================================`;
  };

  const handleDownloadBill = (order: Order) => {
    const textData = generateReceiptText(order);
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${order.billNo || order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification(`Invoice downloaded for ${order.customerName || 'Guest'}!`, 'success');
  };

  const handleSendWhatsApp = (order: Order) => {
    const rawNum = order.customerPhone || '';
    const cleanNum = rawNum.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hello ${order.customerName || 'Guest'},\nHere is your Aahar Restaurant receipt: Bill #${order.billNo || order.id}. Total amount: ₹${order.total?.toFixed(2)}.\nThank you!`);
    
    if (cleanNum) {
      window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
      showNotification('WhatsApp message API triggered!', 'success');
    } else {
      const fallbackNum = prompt('Please enter WhatsApp phone number (with country code):', '91');
      if (fallbackNum) {
        window.open(`https://wa.me/${fallbackNum.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
        showNotification('WhatsApp message API triggered!', 'success');
      }
    }
  };

  const handleSendEmail = (order: Order) => {
    const email = order.customerEmail || '';
    const subject = encodeURIComponent(`Bill Receipt #${order.billNo || order.id} - Aahar Restaurant`);
    const body = encodeURIComponent(generateReceiptText(order));
    
    if (email) {
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
      showNotification('Email dispatch API triggered via mailto client!', 'success');
    } else {
      const fallbackEmail = prompt('Please enter customer email:', '');
      if (fallbackEmail) {
        window.open(`mailto:${fallbackEmail}?subject=${subject}&body=${body}`, '_blank');
        showNotification('Email dispatch API triggered!', 'success');
      }
    }
  };

  const handlePrint = (order: Order) => {
    const text = generateReceiptText(order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 14px; padding: 20px;">${text}</pre>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      showNotification('Sent bill to print pipeline!', 'success');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 gap-6 overflow-y-auto lg:overflow-hidden h-full">
      {/* Dynamic Screen Title & Subtitle */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 id="history-view-title" className="font-headline-lg-mobile sm:text-3xl text-on-surface font-black tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-primary" /> Manager Order History
          </h2>
          <p className="text-sm text-outline mt-1 font-medium">Query, audit, and dispatch historical POS bills and transactions</p>
        </div>
        <span className="bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-label-mono font-black py-1.5 px-3 rounded-full border border-outline-variant/20 shadow-sm uppercase tracking-wider">
          Manager Mode
        </span>
      </div>

      {/* Advanced Query & Filter Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 p-5 sm:p-6 rounded-[2.5rem] apple-shadow shrink-0 flex flex-col gap-5">
        
        {/* Row 1: Direct inputs & query targets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Specific Calendar Date Filter */}
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-3 rounded-2xl border border-outline-variant/10">
            <Calendar className="w-5 h-5 text-outline shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] text-outline font-black uppercase tracking-wide">Calendar Date</span>
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-sm text-on-surface focus:outline-none w-full cursor-pointer font-bold mt-0.5"
              />
            </div>
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/35">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Global Phrase / Token Search */}
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-3 rounded-2xl border border-outline-variant/10">
            <Search className="w-5 h-5 text-outline shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] text-outline font-black uppercase tracking-wide">General Search Token</span>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-on-surface focus:outline-none w-full font-bold mt-0.5"
                placeholder="Name, Phone, Bill..."
              />
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/35">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 3. Dedicated Customer Email Filter */}
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-3 rounded-2xl border border-outline-variant/10">
            <Mail className="w-5 h-5 text-outline shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] text-outline font-black uppercase tracking-wide">Customer Email</span>
              <input 
                type="text"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="bg-transparent text-sm text-on-surface focus:outline-none w-full font-bold mt-0.5"
                placeholder="Filter by customer email..."
              />
            </div>
            {emailFilter && (
              <button onClick={() => setEmailFilter('')} className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/35">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Categorical dynamic dropdowns & Year / Month selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-1">
          {/* Year Selector */}
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-2xl border border-outline-variant/10">
            <div className="flex flex-col flex-1">
              <span className="text-[9px] text-outline font-black uppercase tracking-wider">Transaction Year</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-transparent text-sm text-on-surface focus:outline-none w-full cursor-pointer font-bold font-sans mt-0.5"
              >
                <option value="All">All Years</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-2xl border border-outline-variant/10">
            <div className="flex flex-col flex-1">
              <span className="text-[9px] text-outline font-black uppercase tracking-wider">Transaction Month</span>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="bg-transparent text-sm text-on-surface focus:outline-none w-full cursor-pointer font-bold font-sans mt-0.5"
              >
                <option value="All">All Months</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Item Category Selector */}
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-2xl border border-outline-variant/10">
            <Tag className="w-4 h-4 text-outline shrink-0 animate-pulse" />
            <div className="flex flex-col flex-1">
              <span className="text-[9px] text-outline font-black uppercase tracking-wider">Item Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-sm text-on-surface focus:outline-none w-full cursor-pointer font-bold font-sans mt-0.5"
              >
                <option value="All">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Status Selector */}
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-2xl border border-outline-variant/10">
            <div className="flex flex-col flex-1">
              <span className="text-[9px] text-outline font-black uppercase tracking-wider">Order Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-on-surface focus:outline-none w-full cursor-pointer font-bold font-sans mt-0.5"
              >
                <option value="All">All Statuses</option>
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
        </div>

        {/* Row 3: Metrics summary banner & action tools */}
        <div className="border-t border-outline-variant/15 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-lg">
              {filteredOrders.length}
            </span>
            <span className="text-sm font-semibold text-on-surface-variant font-sans">
              transactions matched current query parameters
              {orders.length !== filteredOrders.length && (
                <span className="text-outline text-xs block md:inline md:ml-1">
                  (out of {orders.length} total in system)
                </span>
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-sans">
            {/* Reset Button */}
            {(dateFilter || searchQuery || statusFilter !== 'All' || yearFilter !== 'All' || monthFilter !== 'All' || categoryFilter !== 'All' || emailFilter) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-black text-xs uppercase py-2.5 px-4 rounded-xl border border-outline-variant/20 transition-all cursor-pointer active:scale-95"
                title="Clear all active inputs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            {/* Export Current Button */}
            <button
              onClick={() => handleExportCSV(false)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
              title="Download CSV spreadsheet of selected rows"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              Export Filtered
            </button>

            {/* Export Everything Button */}
            <button
              onClick={() => handleExportCSV(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
              title="Download CSV spreadsheet of the entire database"
            >
              <Download className="w-4 h-4 text-white" />
              Export Everything
            </button>
          </div>
        </div>

      </div>

      {/* Main Order Table content */}
      <div className="flex-1 min-h-[300px] overflow-hidden flex flex-col bg-surface-container-lowest border border-outline-variant/15 rounded-[2.5rem] apple-shadow">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/40">
                <th className="p-5 text-xs font-black text-outline uppercase tracking-wider font-sans">Token & Order ID</th>
                <th className="p-5 text-xs font-black text-outline uppercase tracking-wider font-sans">Date & Hour</th>
                <th className="p-5 text-xs font-black text-outline uppercase tracking-wider font-sans">Customer Info</th>
                <th className="p-5 text-xs font-black text-outline uppercase tracking-wider font-sans text-center">Status</th>
                <th className="p-5 text-xs font-black text-outline uppercase tracking-wider font-sans text-right">Financial Ledger</th>
                <th className="p-5 text-xs font-black text-outline uppercase tracking-wider font-sans text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-20 text-outline text-sm font-medium">
                    <History className="w-12 h-12 text-outline-variant/50 mx-auto mb-4" />
                    No orders match your filter criteria. Try adjusting date or search token.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  let badgeColor = 'bg-slate-500/10 text-slate-700';
                  if (order.status === 'Completed') badgeColor = 'bg-emerald-500/10 text-emerald-700';
                  if (order.status === 'Ready') badgeColor = 'bg-blue-500/10 text-blue-700';
                  if (order.status === 'Pending') badgeColor = 'bg-amber-500/10 text-amber-700 font-bold';
                  if (order.status === 'Action Required') badgeColor = 'bg-rose-500/10 text-rose-700 animate-pulse';
                  if (order.status === 'Cancelled') badgeColor = 'bg-zinc-500/10 text-zinc-600 line-through';

                  const dateDisplay = order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'Today';
                  const timeDisplay = order.timestamp ? new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : order.time || 'N/A';
                  const discountVal = (order.subtotal || 0) * (order.discountRate || 0);

                  return (
                    <tr key={order.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/20 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-on-surface font-label-mono bg-surface-container px-2.5 py-1 rounded-xl text-xs border border-outline-variant/10">
                            Token #{order.tokenNo || '1'}
                          </span>
                        </div>
                        <div className="text-[10px] text-outline font-label-mono mt-1 font-bold">
                          Bill: {order.billNo || order.id}
                        </div>
                      </td>
                      
                      <td className="p-5 text-sm text-on-surface font-medium font-label-mono">
                        <div>{dateDisplay}</div>
                        <div className="text-outline text-[11px] mt-0.5">{timeDisplay}</div>
                      </td>
                      
                      <td className="p-5">
                        <div className="font-black text-on-surface text-sm">{order.customerName || 'Walk-in Guest'}</div>
                        <div className="flex flex-col gap-0.5 mt-1 font-label-mono text-[10px] text-outline">
                          {order.customerPhone && (
                            <span className="flex items-center gap-1 font-bold">
                              <Phone className="w-3 h-3" /> {order.customerPhone}
                            </span>
                          )}
                          {order.customerEmail && (
                            <span className="flex items-center gap-1 font-bold">
                              <Mail className="w-3 h-3" /> {order.customerEmail}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badgeColor}`}>
                          {order.status}
                        </span>
                      </td>
                      
                      <td className="p-5 text-right">
                        <span className="font-black text-on-surface font-label-mono text-sm leading-6">
                          ₹{order.total?.toFixed(0)}
                        </span>
                        <div className="flex flex-col text-[11px] text-outline font-label-mono mt-0.5">
                          <span>Subtotal: ₹{order.subtotal?.toFixed(0)}</span>
                          {discountVal > 0 && (
                            <span className="text-rose-600 font-bold">
                              Discount: -₹{discountVal.toFixed(0)} ({((order.discountRate || 0) * 100).toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-5">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 p-2.5 rounded-xl text-on-surface transition-all active:scale-90 cursor-pointer flex items-center justify-center"
                            title="Print/Dispatch Bill"
                          >
                            <Share2 className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            onClick={() => handleDownloadBill(order)}
                            className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 p-2.5 rounded-xl text-on-surface transition-all active:scale-90 cursor-pointer flex items-center justify-center"
                            title="Download Receipt TXT"
                          >
                            <Download className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill sharing, Print & WhatsApp dispatch Dialog Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container-lowest max-w-lg w-full rounded-[2.5rem] border border-outline-variant/20 p-6 sm:p-8 apple-shadow flex flex-col gap-6"
            >
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  <h3 className="font-headline-lg-mobile text-xl font-black text-on-surface">Bill Dispatch Terminal</h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface transition-all flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer summary card */}
              <div className="bg-surface-container-low p-5 rounded-3xl border border-outline-variant/10 flex flex-col gap-2">
                <h4 className="text-xs uppercase font-black text-outline tracking-wider font-sans">Active Client Card</h4>
                <div className="font-extrabold text-on-surface font-title-md text-base">{selectedOrder.customerName || 'Anonymous Guest'}</div>
                <div className="grid grid-cols-2 gap-4 mt-2 font-label-mono text-xs text-outline">
                  <div>
                    <span className="block text-[10px] text-outline font-bold">TELEPHONE CONTACT</span>
                    <span className="font-bold text-on-surface">{selectedOrder.customerPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-outline font-bold">ELECTRONIC DISPATCH</span>
                    <span className="font-bold text-on-surface truncate block">{selectedOrder.customerEmail || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Preview box */}
              <div className="bg-surface-container-low/75 border border-outline-variant/15 rounded-3xl p-4 overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black uppercase text-outline tracking-wider font-sans">Live Receipt Template</span>
                  <span className="text-xs font-label-mono font-black text-rose-600">Token #{selectedOrder.tokenNo || '1'}</span>
                </div>
                <div className="max-h-[160px] overflow-y-auto font-mono text-[11px] bg-white p-3.5 rounded-2xl border border-outline-variant/10 text-slate-800 leading-relaxed scrollbar-thin">
                  <pre className="whitespace-pre-wrap">{generateReceiptText(selectedOrder)}</pre>
                </div>
              </div>

              {/* Actions grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handlePrint(selectedOrder)}
                  className="bg-primary hover:bg-primary-hover hover:scale-[1.02] text-white py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-white font-sans">Print Receipt</span>
                </button>

                <button
                  onClick={() => handleSendWhatsApp(selectedOrder)}
                  className="bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-white font-sans">WhatsApp</span>
                </button>

                <button
                  onClick={() => handleSendEmail(selectedOrder)}
                  className="bg-sky-600 hover:bg-sky-700 hover:scale-[1.02] text-white py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-5 h-5 text-white" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-white font-sans">Email Invoice</span>
                </button>
              </div>

              <div className="text-center font-label-mono text-[10px] text-outline font-medium tracking-wide">
                Invoice Total: ₹{selectedOrder.total?.toFixed(2)} | Discount Included
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent micro feedback notify widget */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 black-glossy py-3.5 px-6 rounded-2xl shadow-xl border border-white/10 z-50 flex items-center gap-3"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-wider font-sans">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
