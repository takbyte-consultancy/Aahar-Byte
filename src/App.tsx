/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MenuItem, 
  Order, 
  TableInfo, 
  RawMaterial, 
  OrderStatus, 
  TableStatus,
  PromoDiscount,
  UserRole,
  UserSession,
  MenuCategory
} from './types';
import { 
  LayoutDashboard, 
  Store, 
  ClipboardList, 
  Package, 
  ChefHat, 
  Settings, 
  Lock, 
  User, 
  ChevronDown, 
  ChevronsUpDown,
  UtensilsCrossed,
  Menu,
  X,
  Heart,
  LogOut,
  History
} from 'lucide-react';
import POSView from './components/POSView';
import OrdersView from './components/OrdersView';
import InventoryView from './components/InventoryView';
import MenuView from './components/MenuView';
import SettingsView from './components/SettingsView';
import AccessLockedView from './components/AccessLockedView';
import DashboardView from './components/DashboardView';
import LoginView from './components/LoginView';
import HistoryView from './components/HistoryView';
import OnboardingView from './components/OnboardingView';
import CustomerMenuView from './components/CustomerMenuView';

type ViewMode = 'dashboard' | 'pos' | 'orders' | 'inventory' | 'menu' | 'settings' | 'history';

const VIEW_PERMISSIONS: Record<ViewMode, UserRole[]> = {
  dashboard: ['Manager', 'Waitstaff', 'Kitchen'],
  pos: ['Manager', 'Waitstaff'],
  orders: ['Manager', 'Waitstaff', 'Kitchen'],
  inventory: ['Manager', 'Kitchen'],
  menu: ['Manager'],
  settings: ['Manager'],
  history: ['Manager']
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);

  const [isOnboardingPage, setIsOnboardingPage] = useState(() => {
    return window.location.pathname === '/onboard' || window.location.hash === '#/onboard';
  });

  const [isCustomerView, setIsCustomerView] = useState(() => {
    return window.location.hash.startsWith('#/menu') || 
           window.location.pathname === '/menu' || 
           window.location.pathname.startsWith('/menu') ||
           window.location.search.includes('menu=');
  });

  const [customerTableId, setCustomerTableId] = useState<string>(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const paramSource = search || (hash.includes('?') ? hash.substring(hash.indexOf('?')) : '');
    const params = new URLSearchParams(paramSource);
    return params.get('table') || '';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsOnboardingPage(window.location.pathname === '/onboard' || window.location.hash === '#/onboard');
      const isCustomer = window.location.hash.startsWith('#/menu') || 
                         window.location.pathname === '/menu' || 
                         window.location.pathname.startsWith('/menu') || 
                         window.location.search.includes('menu=');
      setIsCustomerView(isCustomer);
      if (isCustomer) {
        const hash = window.location.hash;
        const search = window.location.search;
        const paramSource = search || (hash.includes('?') ? hash.substring(hash.indexOf('?')) : '');
        const params = new URLSearchParams(paramSource);
        setCustomerTableId(params.get('table') || '');
        
        const urlOrg = params.get('org');
        if (urlOrg) {
          localStorage.setItem('aahar_customer_org', urlOrg);
        }
      }
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Synced state variables
  const [users, setUsers] = useState<UserSession[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [promoDiscounts, setPromoDiscounts] = useState<PromoDiscount[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Current logged in user session (persists in LocalStorage of multi-tenant portal)
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('aahar_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aahar_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aahar_current_user');
    }
  }, [currentUser]);

  // Synchronize state with backend
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setMenuItems(data.menuItems || []);
        setTables(data.tables || []);
        setMaterials(data.materials || []);
        setPromoDiscounts(data.promoDiscounts || []);
        setCategories(data.categories || []);
        setCustomers(data.customers || []);

        const parsedOrders = (data.orders || []).map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp)
        }));
        setOrders(parsedOrders);
      }
    } catch (e) {
      console.error('Failed to sync state from full-stack system:', e);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 4000); // 4-second dynamic sync
    return () => clearInterval(interval);
  }, []);

  // Handler: Promo discount configurations
  const handleAddPromoDiscount = async (newPromo: PromoDiscount) => {
    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromo)
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePromoDiscount = async (promoId: string) => {
    try {
      const res = await fetch(`/api/promos/${promoId}/toggle`, {
        method: 'PUT'
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePromoDiscount = async (promoId: string) => {
    try {
      const res = await fetch(`/api/promos/${promoId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Placing checkout order from POS catalog
  const handleSubmitOrder = async (newOrderData: Omit<Order, 'id' | 'timestamp'>): Promise<Order | null> => {
    try {
      // Append the operator's session details as creator
      const payload = {
        ...newOrderData,
        operatorName: currentUser?.name || 'Guest',
        operatorRole: currentUser?.role || 'Waitstaff'
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        fetchState();
        return {
          ...data.order,
          timestamp: new Date(data.order.timestamp)
        };
      }
    } catch (e) {
      console.error('Order creation exception:', e);
    }
    return null;
  };

  // Handler: Updating general status of a ticket in queue
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Adjust raw stock level
  const handleAdjustStock = async (materialId: string, amount: number) => {
    try {
      const res = await fetch('/api/materials/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: materialId, amount })
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerAutoRestock = async () => {
    try {
      const res = await fetch('/api/materials/restock', {
        method: 'POST'
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Toggle menu availability
  const handleToggleAvailability = async (itemId: string) => {
    try {
      const res = await fetch(`/api/menu/${itemId}/isAvailable`, {
        method: 'PUT'
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMenuItem = async (item: MenuItem) => {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMenuItem = async (itemId: string, updateData: Partial<MenuItem>) => {
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Update seating table occupancy status
  const handleUpdateTableStatus = async (tableId: string, status: TableStatus) => {
    try {
      const res = await fetch(`/api/tables/${tableId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTable = async (table: TableInfo) => {
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(table)
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTable = async (tableId: string, updatedData: Partial<TableInfo>) => {
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error('Error updating table configurations:', e);
    }
  };

  const handleModifyOrder = async (orderId: string, updatedPayload: any) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error('Error modifying order:', e);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error('Error deleting order:', e);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error('Error deleting material:', e);
    }
  };

  const handleAddMaterial = async (materialData: RawMaterial) => {
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error('Error adding material:', e);
    }
  };

  const handleAddCategory = async (catName: string) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName })
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    try {
      const res = await fetch(`/api/categories?name=${encodeURIComponent(catName)}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Admin / Approval operations
  const handleApproveUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/approve`, {
        method: 'PUT'
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUser = async (userId: string, userData: { name?: string; email?: string; role?: UserRole; pin?: string }) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        const data = await res.json();
        if (currentUser && currentUser.id === userId && data.user) {
          setCurrentUser(data.user);
        }
        fetchState();
      }
    } catch (e) {
      console.error('Error updating user detail:', e);
    }
  };

  const handleAddUser = async (userData: any) => {
    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // If current operator was deleted, log them out
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(null);
        }
        fetchState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegisterUserSignup = async (userData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchState();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to submit request.' };
    } catch (e) {
      return { success: false, error: 'Database network error.' };
    }
  };

  const activeCount = orders.filter(o => o.status !== 'Completed').length;

  if (isOnboardingPage) {
    return (
      <OnboardingView 
        onBackToLogin={() => {
          setIsOnboardingPage(false);
          window.location.hash = '';
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  if (isCustomerView) {
    return (
      <CustomerMenuView 
        menuItems={menuItems}
        categories={categories}
        tableId={customerTableId}
        onClose={() => {
          setIsCustomerView(false);
          window.location.hash = '';
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginView 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        onRegisterUser={handleRegisterUserSignup}
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background leading-normal font-sans text-on-surface antialiased relative">
      {/* Sidebar Backdrop overlay on mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left drawer sidebar layout */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 bg-white flex flex-col justify-between border-r border-outline-variant/15 select-none h-full shrink-0 z-50 transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div>
          {/* Main POS Logo */}
          <div className="p-8 pb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4.5">
              <div className="w-12 h-12 black-glossy rounded-[1.25rem] flex items-center justify-center text-white font-bold shadow-lg">
                <UtensilsCrossed size={22} className="text-white shrink-0" />
              </div>
              <div>
                <h1 className="font-headline-lg-mobile text-[19px] font-black tracking-wider text-primary font-sans leading-none">AAHAR</h1>
                <span className="text-[10px] font-label-mono text-outline uppercase tracking-[0.2em] block mt-1.5 font-bold">POS Terminal</span>
              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer active:scale-95 text-outline-variant hover:text-on-surface focus:outline-none"
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation link elements */}
          <nav className="px-5 py-4 flex flex-col gap-2">
            <button
              onClick={() => {
                setActiveView('dashboard');
                setIsSidebarOpen(false);
              }}
              className={`w-full py-4 px-6 rounded-2xl font-title-md text-sm cursor-pointer transition-all flex items-center justify-between group focus:outline-none ${
                activeView === 'dashboard' 
                  ? 'black-glossy font-bold shadow-md' 
                  : 'text-on-surface-variant hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <LayoutDashboard size={18} className={`transition-transform duration-300 shrink-0 ${activeView === 'dashboard' ? 'text-white' : 'text-outline-variant group-hover:scale-110'}`} />
                <span className={activeView === 'dashboard' ? 'text-white font-bold' : ''}>Analytics Dashboard</span>
              </div>
              {!VIEW_PERMISSIONS.dashboard.includes(currentUser.role) && (
                <Lock size={12} className="text-outline/50 shrink-0 select-none animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('pos');
                setIsSidebarOpen(false);
              }}
              className={`w-full py-4 px-6 rounded-2xl font-title-md text-sm cursor-pointer transition-all flex items-center justify-between group focus:outline-none ${
                activeView === 'pos' 
                  ? 'black-glossy font-bold shadow-md' 
                  : 'text-on-surface-variant hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Store size={18} className={`transition-transform duration-300 shrink-0 ${activeView === 'pos' ? 'text-white' : 'text-outline-variant group-hover:scale-110'}`} />
                <span className={activeView === 'pos' ? 'text-white font-bold' : ''}>Catalog Sales (POS)</span>
              </div>
              {!VIEW_PERMISSIONS.pos.includes(currentUser.role) && (
                <Lock size={12} className="text-outline/50 shrink-0 select-none animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('orders');
                setIsSidebarOpen(false);
              }}
              className={`w-full py-4 px-6 rounded-2xl font-title-md text-sm cursor-pointer transition-all flex items-center justify-between group focus:outline-none ${
                activeView === 'orders' 
                  ? 'black-glossy font-bold shadow-md' 
                  : 'text-on-surface-variant hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <ClipboardList size={18} className={`transition-transform duration-300 shrink-0 ${activeView === 'orders' ? 'text-white' : 'text-outline-variant group-hover:scale-110'}`} />
                <span className={activeView === 'orders' ? 'text-white font-bold' : ''}>Orders Queue</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {activeCount > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeView === 'orders' ? 'bg-white text-black font-extrabold' : 'bg-rose-600 text-white animate-pulse'
                  }`}>
                    {activeCount}
                  </span>
                )}
                {!VIEW_PERMISSIONS.orders.includes(currentUser.role) && (
                  <Lock size={12} className="text-outline/50 shrink-0 select-none animate-pulse" />
                )}
              </div>
            </button>

            <button
              onClick={() => {
                setActiveView('inventory');
                setIsSidebarOpen(false);
              }}
              className={`w-full py-4 px-6 rounded-2xl font-title-md text-sm cursor-pointer transition-all flex items-center justify-between group focus:outline-none ${
                activeView === 'inventory' 
                  ? 'black-glossy font-bold shadow-md' 
                  : 'text-on-surface-variant hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Package size={18} className={`transition-transform duration-300 shrink-0 ${activeView === 'inventory' ? 'text-white' : 'text-outline-variant group-hover:scale-110'}`} />
                <span className={activeView === 'inventory' ? 'text-white font-bold' : ''}>Raw Inventory</span>
              </div>
              {!VIEW_PERMISSIONS.inventory.includes(currentUser.role) && (
                <Lock size={12} className="text-outline/50 shrink-0 select-none animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('menu');
                setIsSidebarOpen(false);
              }}
              className={`w-full py-4 px-6 rounded-2xl font-title-md text-sm cursor-pointer transition-all flex items-center justify-between group focus:outline-none ${
                activeView === 'menu' 
                  ? 'black-glossy font-bold shadow-md' 
                  : 'text-on-surface-variant hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <ChefHat size={18} className={`transition-transform duration-300 shrink-0 ${activeView === 'menu' ? 'text-white' : 'text-outline-variant group-hover:scale-110'}`} />
                <span className={activeView === 'menu' ? 'text-white font-bold' : ''}>Restaurant Menu</span>
              </div>
              {!VIEW_PERMISSIONS.menu.includes(currentUser.role) && (
                <Lock size={12} className="text-outline/50 shrink-0 select-none animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('history');
                setIsSidebarOpen(false);
              }}
              className={`w-full py-4 px-6 rounded-2xl font-title-md text-sm cursor-pointer transition-all flex items-center justify-between group focus:outline-none ${
                activeView === 'history' 
                  ? 'black-glossy font-bold shadow-md' 
                  : 'text-on-surface-variant hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <History size={18} className={`transition-transform duration-300 shrink-0 ${activeView === 'history' ? 'text-white' : 'text-outline-variant group-hover:scale-110'}`} />
                <span className={activeView === 'history' ? 'text-white font-bold' : ''}>Manager History</span>
              </div>
              {!VIEW_PERMISSIONS.history.includes(currentUser?.role || 'Waitstaff') && (
                <Lock size={12} className="text-outline/50 shrink-0 select-none animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('settings');
                setIsSidebarOpen(false);
              }}
              className={`w-full py-4 px-6 rounded-2xl font-title-md text-sm cursor-pointer transition-all flex items-center justify-between group focus:outline-none ${
                activeView === 'settings' 
                  ? 'black-glossy font-bold shadow-md' 
                  : 'text-on-surface-variant hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Settings size={18} className={`transition-transform duration-300 shrink-0 ${activeView === 'settings' ? 'text-white' : 'text-outline-variant group-hover:scale-110'}`} />
                <span className={activeView === 'settings' ? 'text-white font-bold' : ''}>Account Settings</span>
              </div>
              {!VIEW_PERMISSIONS.settings.includes(currentUser?.role || 'Waitstaff') && (
                <Lock size={12} className="text-outline/50 shrink-0 select-none animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem('aahar_current_user');
                setIsSidebarOpen(false);
              }}
              className="w-full py-4 px-6 rounded-2xl font-title-md text-sm cursor-pointer transition-all flex items-center justify-between group focus:outline-none text-rose-600 hover:bg-rose-50/60 mt-1 border border-solid border-transparent hover:border-rose-100/30"
            >
              <div className="flex items-center gap-3.5">
                <LogOut size={18} className="text-rose-500 transition-transform duration-300 shrink-0 group-hover:scale-110" />
                <span className="font-extrabold">Log Out Terminal</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Footer operator card block & Tarkbyte Labs Branding */}
        <div className="flex flex-col shrink-0">
          <div className="p-3 border-t border-solid border-outline-variant/10 mx-3 mb-1.5 bg-surface-container bg-opacity-30 rounded-[1.75rem] flex flex-col gap-2">
            <div 
              onClick={() => setIsUserPanelOpen(!isUserPanelOpen)}
              className="p-2 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer flex items-center justify-between group select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden select-none shrink-0 border border-outline-variant/10 flex items-center justify-center">
                  {currentUser?.role === 'Manager' ? (
                    <Settings size={18} className="text-purple-600 shrink-0" />
                  ) : currentUser?.role === 'Kitchen' ? (
                    <ChefHat size={18} className="text-orange-500 shrink-0" />
                  ) : (
                    <User size={18} className="text-blue-500 shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-on-surface truncate flex items-center gap-1">
                    <span className="truncate">{currentUser?.name}</span>
                    <span className={`${
                      currentUser?.role === 'Manager' 
                        ? 'bg-purple-100 text-purple-800' 
                        : currentUser?.role === 'Kitchen'
                          ? 'bg-orange-100 text-orange-850'
                          : 'bg-blue-100 text-blue-800'
                    } text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded shrink-0`}>
                      {currentUser?.role}
                    </span>
                  </h4>
                  <span className="text-[10px] text-outline font-label-mono truncate block mt-0.5">{currentUser?.username}</span>
                </div>
              </div>
              {isUserPanelOpen ? (
                <ChevronDown size={18} className="text-outline group-hover:text-on-surface transition-transform duration-200 shrink-0" />
              ) : (
                <ChevronsUpDown size={18} className="text-outline group-hover:text-on-surface transition-transform duration-200 shrink-0" />
              )}
            </div>

            <AnimatePresence>
              {isUserPanelOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden flex flex-col gap-1.5 pt-2 border-t border-dashed border-outline-variant/10 shrink-0"
                >
                  <p className="text-[9px] font-black uppercase text-outline tracking-wider px-2 pb-1">Switch Operator</p>
                  {/* Pull dynamically approved users list for fast operator switcher inside this tenant */}
                  {users.filter(u => (!u.status || u.status === 'Approved') && (u.orgCode || 'AHARBY').toUpperCase() === (currentUser?.orgCode || 'AHARBY').toUpperCase()).map(u => (
                    <button
                      key={u._docId || u.id || u.username}
                      onClick={() => {
                        setCurrentUser(u);
                        setIsUserPanelOpen(false);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-left cursor-pointer transition-all focus:outline-none ${
                        currentUser?.id === u.id 
                          ? 'bg-slate-100 font-bold' 
                          : 'hover:bg-slate-50 text-on-surface-variant text-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-50 border border-outline-variant/10 flex items-center justify-center shrink-0">
                        {u.role === 'Manager' ? (
                          <Settings size={14} className="text-purple-600 shrink-0" />
                        ) : u.role === 'Kitchen' ? (
                          <ChefHat size={14} className="text-orange-500 shrink-0" />
                        ) : (
                          <User size={14} className="text-blue-500 shrink-0" />
                        )}
                      </div>
                      <div className="leading-none min-w-0">
                        <p className="text-[11px] font-bold truncate">{u.name}</p>
                        <span className="text-[9px] text-outline block mt-0.5">{u.role} (PIN: {u.pin})</span>
                      </div>
                    </button>
                  ))}

                  {/* Complete Log Out Portal Button */}
                  <div className="border-t border-solid border-slate-100 pt-2.5 mt-1">
                    <button
                      onClick={() => {
                        setCurrentUser(null);
                        localStorage.removeItem('aahar_current_user');
                        setIsUserPanelOpen(false);
                        setIsSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left cursor-pointer transition-all focus:outline-none hover:bg-rose-50 text-rose-600 border border-solid border-transparent hover:border-rose-100/40"
                    >
                      <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                        <Lock size={12} className="text-rose-600 shrink-0 animate-pulse" />
                      </div>
                      <div className="leading-none min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider">Log Out Tenant</p>
                        <span className="text-[8px] text-rose-500 font-bold block mt-1">Exit gateway portal</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tarkbyte Labs Elegant Credit Brand Footer */}
          <div className="text-center px-4 py-3 border-t border-slate-150 shrink-0 select-none bg-slate-50">
            <p className="text-[10px] text-zinc-500/90 font-medium flex items-center justify-center gap-1">
              <span>Created by</span>
              <span className="font-extrabold text-slate-900 tracking-wide">Tarkbyte Labs</span>
              <span>for you</span>
              <Heart size={10} className="text-rose-500 fill-rose-500 animate-pulse inline shrink-0" />
            </p>
          </div>
        </div>
      </aside>

      {/* Main interactive application content center */}
      <main className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Mobile top navigation header */}
        <header className="lg:hidden bg-white border-b border-outline-variant/15 px-5 py-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer active:scale-95 text-on-surface focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 black-glossy rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                <UtensilsCrossed size={14} className="text-white shrink-0" />
              </div>
              <h1 className="font-sans font-black text-sm tracking-wider text-primary">AAHAR</h1>
            </div>
          </div>
          
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-50 border border-slate-100/80 px-3 py-1 rounded-full text-outline-variant">
            {activeView === 'dashboard' ? 'Analytics' :
             activeView === 'pos' ? 'Sales' :
             activeView === 'orders' ? 'Orders' :
             activeView === 'inventory' ? 'Inventory' :
             activeView === 'menu' ? 'Menu' : 
             activeView === 'history' ? 'History' : 'Settings'}
          </span>
        </header>

        {/* Unified Verification Locking Screen (Bypasses rendering actual subview) */}
        {!VIEW_PERMISSIONS[activeView].includes(currentUser.role) ? (
          <AccessLockedView 
            requiredRoles={VIEW_PERMISSIONS[activeView]} 
            currentRole={currentUser.role}
            users={users}
            onAuthenticateSuccess={(user) => {
              setCurrentUser(user);
            }}
            onRegisterUser={handleRegisterUserSignup}
            sectionName={
              activeView === 'dashboard' ? 'Analytics Dashboard' :
              activeView === 'pos' ? 'Catalog Sales (POS)' :
              activeView === 'orders' ? 'Orders Queue' :
              activeView === 'inventory' ? 'Raw Inventory' :
              activeView === 'menu' ? 'Restaurant Menu' : 
              activeView === 'history' ? 'Order History Archive' : 'Account Settings'
            }
          />
        ) : (
          <>
            {activeView === 'dashboard' && (
              <DashboardView 
                orders={orders}
                menuItems={menuItems}
                tables={tables}
              />
            )}
            {activeView === 'pos' && (
              <POSView 
                menuItems={menuItems} 
                tables={tables}
                onSubmitOrder={handleSubmitOrder}
                promoDiscounts={promoDiscounts}
                categories={categories}
                orders={orders} // for client duplicate detection
                customers={customers}
                editingOrder={editingOrder}
                onCancelEdit={() => setEditingOrder(null)}
                onModifyOrder={async (id, payload) => {
                  await handleModifyOrder(id, payload);
                  setEditingOrder(null);
                }}
              />
            )}
            {activeView === 'orders' && (
              <OrdersView 
                orders={orders} 
                onUpdateStatus={handleUpdateOrderStatus}
                onModifyOrder={handleModifyOrder}
                onStartModifyOrder={(order) => {
                  setEditingOrder(order);
                  setActiveView('pos');
                }}
                onDeleteOrder={handleDeleteOrder}
                menuItems={menuItems}
              />
            )}
            {activeView === 'inventory' && (
              <InventoryView 
                materials={materials} 
                onTriggerAutoRestock={handleTriggerAutoRestock}
                onDeleteMaterial={handleDeleteMaterial}
                onAddMaterial={handleAddMaterial}
                onAdjustStock={handleAdjustStock}
              />
            )}
            {activeView === 'menu' && (
              <MenuView 
                menuItems={menuItems}
                onToggleAvailability={handleToggleAvailability}
                onAddItem={handleAddMenuItem}
                onDeleteItem={handleDeleteMenuItem}
                onUpdateItem={handleUpdateMenuItem}
                categories={categories}
              />
            )}
            {activeView === 'history' && (
              <HistoryView 
                orders={orders}
                categories={categories}
              />
            )}
            {activeView === 'settings' && (
              <SettingsView 
                tables={tables}
                onUpdateTableStatus={handleUpdateTableStatus}
                onAddTable={handleAddTable}
                onUpdateTable={handleUpdateTable}
                promoDiscounts={promoDiscounts}
                onAddPromoDiscount={handleAddPromoDiscount}
                onTogglePromoDiscount={handleTogglePromoDiscount}
                onDeletePromoDiscount={handleDeletePromoDiscount}
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                menuItems={menuItems}
                
                users={users}
                onApproveUser={handleApproveUser}
                onUpdateUser={handleUpdateUser}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                currentUser={currentUser}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
