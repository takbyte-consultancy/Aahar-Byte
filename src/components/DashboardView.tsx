/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Order, MenuItem, TableInfo } from '../types';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  Utensils, 
  Users, 
  Percent,
  Calendar,
  Layers,
  ArrowUpRight,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  tables: TableInfo[];
}

export default function DashboardView({ orders, menuItems, tables }: DashboardViewProps) {
  
  // CSV exporter for accounting and bookkeepers
  const handleDownloadCSV = () => {
    if (orders.length === 0) {
      alert("No order records registered in database to export.");
      return;
    }

    // Define CSV headers representing detailed audit coordinates
    const headers = [
      "Order ID",
      "Date & Time",
      "Table / Seating",
      "Service Mode",
      "Waitstaff/Operator",
      "Ordered Items (Qty x Item Name)",
      "Status",
      "Subtotal (INR)",
      "Discount Rate",
      "Discount Deducts (INR)",
      "Tax Rate",
      "Final Total (INR)"
    ];

    // Format individual row items
    const rows = orders.map(o => {
      const orderDate = o.timestamp instanceof Date ? o.timestamp : new Date(o.timestamp);
      const dateString = orderDate.toLocaleString('en-US');
      const serviceMode = o.dineIn ? "Dine-In" : "Takeaway";
      
      const itemsSummary = o.items
        ? o.items.map(item => `${item.quantity}x ${item.menuItem?.name || 'Item'}`).join(' | ')
        : "";
        
      const discountDeduction = (o.subtotal || 0) * (o.discountRate || 0);

      const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;

      return [
        escape(o.id || ""),
        escape(dateString),
        escape(o.tableRef || ""),
        escape(serviceMode),
        escape(o.waitstaff || ""),
        escape(itemsSummary),
        escape(o.status || ""),
        (o.subtotal || 0).toFixed(2),
        `${((o.discountRate || 0) * 100).toFixed(0)}%`,
        discountDeduction.toFixed(2),
        `${((o.taxRate || 0) * 100).toFixed(1)}%`,
        (o.total || 0).toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const todayStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Aahar_Byte_Daily_Accounting_Report_${todayStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate core summary metrics
  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const count = orders.length;
    const aov = count > 0 ? totalRev / count : 0;
    const occupiedTables = tables.filter(t => t.status === 'Occupied').length;
    
    // Calculate total discount given
    const totalDiscount = orders.reduce((sum, o) => {
      const discountVal = (o.subtotal || 0) * (o.discountRate || 0);
      return sum + discountVal;
    }, 0);

    return {
      totalRevenue: totalRev,
      ordersCount: count,
      averageOrderValue: aov,
      occupiedTables,
      totalDiscount
    };
  }, [orders, tables]);

  // Aggregate daily revenue for the past 7 days purely from real order data
  const dailyRevenueData = useMemo(() => {
    const dataPoints: { dateLabel: string; dateStr: string; Revenue: number; Orders: number }[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize the last 7 days with zero values
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      dataPoints.push({
        dateLabel: dayName,
        dateStr: dateString,
        Revenue: 0,
        Orders: 0
      });
    }

    // Now aggregate only actual real orders
    orders.forEach(order => {
      if (!order.timestamp) return;
      // Safely parse date
      const orderDate = order.timestamp instanceof Date ? order.timestamp : new Date(order.timestamp);
      const dayName = days[orderDate.getDay()];
      const dateString = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const point = dataPoints.find(dp => dp.dateStr === dateString || dp.dateLabel === dayName);
      if (point) {
        point.Revenue += (order.total || 0);
        point.Orders += 1;
      }
    });

    return dataPoints;
  }, [orders]);

  // Aggregate top selling menu items purely from real order data
  const topSellingData = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};

    // Aggregate ONLY actual real orders
    orders.forEach(order => {
      if (!order.items) return;
      order.items.forEach(cartItem => {
        if (!cartItem.menuItem) return;
        const itemId = cartItem.menuItem.id;
        const name = cartItem.menuItem.name;
        const qty = cartItem.quantity || 1;
        const rev = qty * (cartItem.menuItem.price || 0);
        const category = cartItem.menuItem.category || 'General';

        if (counts[itemId]) {
          counts[itemId].quantity += qty;
          counts[itemId].revenue += rev;
        } else {
          counts[itemId] = {
            name,
            quantity: qty,
            revenue: rev,
            category
          };
        }
      });
    });

    // Convert to array and sort by quantity descending
    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6); // Top 6 selling items
  }, [orders]);

  // Custom colors for beautiful presentation
  const barColors = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto bg-slate-50/50">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="font-headline-lg-mobile text-on-surface text-2xl font-black font-sans leading-none">
            Restaurant Terminal Overview
          </h2>
          <p className="text-sm text-outline-variant mt-1.5 leading-relaxed">
            Real-time sales metrics, analytics charts, and active dining floor productivity indexes.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-900 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-zinc-900/10 shrink-0 select-none hover:translate-y-[-1px]"
            title="Download full summary order data as CSV"
          >
            <Download size={14} className="stroke-[2.5]" />
            <span>Download Daily Report</span>
          </button>

          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl border border-outline-variant/15 shadow-xs shrink-0 select-none">
            <Calendar size={14} className="text-outline" />
            <span className="text-xs font-label-mono font-bold text-on-surface">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Widgets Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
        
        {/* Net Revenue */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-[2rem] border border-outline-variant/10 shadow-xs flex items-center justify-between group overflow-hidden relative"
        >
          <div className="flex flex-col gap-1.5 z-10">
            <span className="text-[10px] font-black uppercase text-outline tracking-wider">Gross Sales</span>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight font-sans">
              ₹{stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-emerald-600 bg-emerald-58/10 border border-emerald-58/2 w-fit px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
              <TrendingUp size={10} />
              <span>{orders.length > 0 ? ((orders.filter(o => o.status === 'Completed').length / orders.length) * 100).toFixed(0) : 0}% Completed Orders</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-lg shadow-zinc-950/10 group-hover:scale-105 transition-all">
            <IndianRupee size={20} className="stroke-2" />
          </div>
          {/* Ambient card design asset */}
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-50 rounded-full opacity-40 group-hover:scale-125 transition-transform" />
        </motion.div>

        {/* Orders Queue size */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-[2rem] border border-outline-variant/10 shadow-xs flex items-center justify-between group overflow-hidden relative"
        >
          <div className="flex flex-col gap-1.5 z-10">
            <span className="text-[10px] font-black uppercase text-outline tracking-wider">Total Sales Count</span>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight font-sans">
              {stats.ordersCount} Orders
            </h3>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100/50 w-fit px-2 py-0.5 rounded-full font-bold">
              Avg {stats.ordersCount > 0 ? (stats.ordersCount / 7).toFixed(1) : 0} per day
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-950 flex items-center justify-center border border-outline-variant/15 group-hover:scale-105 transition-all">
            <ShoppingBag size={20} className="stroke-2 text-slate-900" />
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-50 rounded-full opacity-40 group-hover:scale-125 transition-transform" />
        </motion.div>

        {/* AOV Value */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-[2rem] border border-outline-variant/10 shadow-xs flex items-center justify-between group overflow-hidden relative"
        >
          <div className="flex flex-col gap-1.5 z-10">
            <span className="text-[10px] font-black uppercase text-outline tracking-wider">Avg Order Ticket</span>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight font-sans">
              ₹{stats.averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100/50 w-fit px-2 py-0.5 rounded-full font-bold">
              {stats.averageOrderValue > 100 ? 'Premium Tier Ticket Avg' : (stats.averageOrderValue > 0 ? 'Standard Ticket Avg' : 'No Sales Registered')}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-950 flex items-center justify-center border border-outline-variant/15 group-hover:scale-105 transition-all">
            <Utensils size={20} className="stroke-2 text-slate-900" />
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-50 rounded-full opacity-40 group-hover:scale-125 transition-transform" />
        </motion.div>

        {/* Occupied Dining nodes */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-[2rem] border border-outline-variant/10 shadow-xs flex items-center justify-between group overflow-hidden relative"
        >
          <div className="flex flex-col gap-1.5 z-10">
            <span className="text-[10px] font-black uppercase text-outline tracking-wider">Active Table Occupancy</span>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight font-sans">
              {stats.occupiedTables} / {tables.length} Occupied
            </h3>
            <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-100/50 w-fit px-2 py-0.5 rounded-full font-bold">
              {(tables.length > 0 ? (stats.occupiedTables / tables.length) * 100 : 0).toFixed(0)}% utilization
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-950 flex items-center justify-center border border-outline-variant/15 group-hover:scale-105 transition-all">
            <Users size={20} className="stroke-2 text-slate-900" />
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-50 rounded-full opacity-40 group-hover:scale-125 transition-transform" />
        </motion.div>

      </div>

      {/* Main Revenue & Top-Selling Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-1 min-h-[380px]">
        {/* Daily Revenue Trend (Line Chart) */}
        <div className="xl:col-span-3 bg-white p-6 rounded-[2.5rem] border border-outline-variant/10 shadow-xs flex flex-col gap-4 overflow-hidden">
          <div className="flex justify-between items-center shrink-0">
            <div>
              <h4 className="text-sm font-black font-sans text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 block"></span>
                Daily Revenue Sequence
              </h4>
              <p className="text-xs text-outline mt-0.5">Historical revenue trajectory including today's dynamic checkouts.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-on-surface font-bold">
                <span className="w-3 h-1 bg-slate-900 rounded-full" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-outline font-bold">
                <span className="w-3 h-1 bg-slate-400 rounded-full" />
                Volume
              </span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[260px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenueData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="dateStr" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8"
                  style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '16px', 
                    border: 'none', 
                    color: '#fff',
                    fontFamily: 'sans-serif',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any, name: string) => [
                    name === 'Revenue' ? `₹${parseFloat(value).toFixed(2)}` : `${value} sales`,
                    name
                  ]}
                />
                <Line 
                  name="Revenue"
                  type="monotone" 
                  dataKey="Revenue" 
                  stroke="#0f172a" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: '#0f172a', strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  name="Volume"
                  type="monotone" 
                  dataKey="Orders" 
                  stroke="#94a3b8" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top-Selling items (Bar Chart) */}
        <div className="xl:col-span-2 bg-white p-6 rounded-[2.5rem] border border-outline-variant/10 shadow-xs flex flex-col gap-4 overflow-hidden">
          <div className="shrink-0">
            <h4 className="text-sm font-black font-sans text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              Ranked Top Selling Dishes
            </h4>
            <p className="text-xs text-outline mt-0.5">Distribution count of cumulative portions sold in the system.</p>
          </div>

          <div className="flex-1 w-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topSellingData} 
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8"
                  style={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#1e293b"
                  width={110}
                  style={{ fontSize: '10px', fontWeight: 'bold', textOverflow: 'ellipsis' }}
                  tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    color: '#0f172a',
                    fontFamily: 'sans-serif',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                  formatter={(value: any, name: any, props: any) => [
                    `${value} portions sold (Revenue: ₹${parseFloat(props.payload.revenue).toFixed(2)})`,
                    'Sales Volume'
                  ]}
                />
                <Bar 
                  dataKey="quantity" 
                  radius={[0, 8, 8, 0]}
                  barSize={14}
                >
                  {topSellingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Live Activity Feed & Table Status nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
        
        {/* Promo discount effectiveness */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-outline-variant/10 shadow-xs flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-black font-sans text-on-surface uppercase tracking-wider">Account Policies & Promotion Margin</h4>
            <p className="text-xs text-outline mt-0.5">Discount deductions & operational policies currently active in terminal.</p>
          </div>

          <div className="flex flex-col gap-4.5">
            <div className="flex justify-between items-center p-3 rounded-2xl bg-rose-50/60 border border-rose-100/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center">
                  <Percent size={14} className="stroke-2" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Total Deducted Promos</p>
                  <p className="text-[10px] text-outline">Accumulated discount values active</p>
                </div>
              </div>
              <p className="text-xs font-label-mono font-black text-rose-600">
                -₹{stats.totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-58/5 border border-emerald-58/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center">
                  <Layers size={14} className="stroke-2" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Total Active Revenue Margin</p>
                  <p className="text-[10px] text-outline">Subtotals minus discount codes</p>
                </div>
              </div>
              <p className="text-xs font-label-mono font-black text-emerald-700">
                ₹{stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Recent High Value orders */}
        <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-outline-variant/10 shadow-xs flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-black font-sans text-on-surface uppercase tracking-wider">Recent Audited Checkout Actions</h4>
            <p className="text-xs text-outline mt-0.5">Real-time terminal checks completed inside the POS system.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {orders.slice(0, 3).length > 0 ? (
              orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-all rounded-2xl border border-outline-variant/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-full bg-slate-100 flex items-center justify-center text-slate-950 border border-slate-200">
                      <span className="material-symbols-outlined text-sm font-bold">receipt</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-950">Order #{order.id} — {order.tableRef}</p>
                      <p className="text-[9px] text-outline font-label-mono mt-0.5">
                        Waiter: {order.waitstaff} • {order.items.length} items sold • {order.dineIn ? 'Dine-In' : 'Takeaway'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right leading-tight">
                    <p className="text-xs font-label-mono font-black text-slate-950">₹{order.total.toFixed(2)}</p>
                    <span className="text-[8px] font-extrabold uppercase bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded-full mt-1 inline-block border border-emerald-100">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-outline text-center py-6">No historical orders checked out yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
