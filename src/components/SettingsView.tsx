/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TableInfo, TableZone, TableStatus, PromoDiscount, MenuCategory, MenuItem, UserSession, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tag, 
  Trash2, 
  Percent, 
  Plus, 
  Grid,
  Layers,
  Users,
  LayoutGrid,
  TicketPercent,
  Check,
  AlertCircle,
  Mail,
  Edit2,
  Lock,
  Eye,
  ShieldCheck,
  Trash,
  X,
  QrCode,
  Printer,
  ExternalLink
} from 'lucide-react';

interface SettingsViewProps {
  tables: TableInfo[];
  onUpdateTableStatus: (tableId: string, status: TableStatus) => void;
  onAddTable: (table: TableInfo) => void;
  onUpdateTable?: (tableId: string, updatedData: Partial<TableInfo>) => void;
  promoDiscounts: PromoDiscount[];
  onAddPromoDiscount: (newPromo: PromoDiscount) => void;
  onTogglePromoDiscount: (promoId: string) => void;
  onDeletePromoDiscount: (promoId: string) => void;
  categories: MenuCategory[];
  onAddCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  menuItems: MenuItem[];
  
  // Full-Stack User Management Props
  users: (UserSession & { status?: string; email?: string })[];
  onApproveUser: (userId: string) => void;
  onUpdateUser: (userId: string, userData: { name?: string; email?: string; role?: UserRole; pin?: string }) => void;
  onAddUser: (userData: { name: string; username: string; email: string; role: UserRole; pin: string }) => void;
  onDeleteUser: (userId: string) => void;
  
  currentUser: UserSession | null;
}

export default function SettingsView({ 
  tables, 
  onUpdateTableStatus, 
  onAddTable,
  onUpdateTable,
  promoDiscounts = [],
  onAddPromoDiscount,
  onTogglePromoDiscount,
  onDeletePromoDiscount,
  categories = [],
  onAddCategory,
  onDeleteCategory,
  menuItems = [],
  
  users = [],
  onApproveUser,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  currentUser
}: SettingsViewProps) {
  const [settingsTab, setSettingsTab] = useState<'tables' | 'discounts' | 'categories' | 'team' | 'onboard'>('tables');
  const [selectedZone, setSelectedZone] = useState<TableZone | 'All'>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedQRTable, setSelectedQRTable] = useState<TableInfo | null>(null);

  const uniqueCategories = Array.from(new Set(categories.map(c => c.trim())));

  // Client Onboarding within settings for supreme superadmin
  const [clientOrgCode, setClientOrgCode] = useState('');
  const [clientBusinessName, setClientBusinessName] = useState('');
  const [clientOwnerName, setClientOwnerName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPin, setClientPin] = useState('');
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState('');
  const [onboardError, setOnboardError] = useState('');

  // Superadmin Organistions List & PIN Update States
  const [onboardedOrgs, setOnboardedOrgs] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [updatingPinId, setUpdatingPinId] = useState<string | null>(null);
  const [newPinValues, setNewPinValues] = useState<{[userId: string]: string}>({});

  const fetchOnboardedOrgs = async () => {
    setOrgsLoading(true);
    try {
      const res = await fetch('/api/organisations-list');
      const data = await res.json();
      if (res.ok && data.success) {
        setOnboardedOrgs(data.organisations);
      }
    } catch (err) {
      console.error('Failed to load registered clients:', err);
    } finally {
      setOrgsLoading(false);
    }
  };

  const handleUpdateTenantPin = async (userId: string, newPin: string) => {
    if (newPin.length !== 6 || isNaN(Number(newPin))) {
      alert('The PIN must be exactly 6 numeric digits.');
      return;
    }
    
    setUpdatingPinId(userId);
    try {
      const res = await fetch('/api/organisations/update-user-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Access PIN updated successfully on database!');
        await fetchOnboardedOrgs();
        // Clear value
        setNewPinValues(prev => ({ ...prev, [userId]: '' }));
      } else {
        alert(data.error || 'Failed to update PIN.');
      }
    } catch (err) {
      alert('Network error occurred while updating PIN.');
    } finally {
      setUpdatingPinId(null);
    }
  };

  useEffect(() => {
    if (settingsTab === 'onboard' && currentUser?.email === 'arpittripathi2007@gmail.com') {
      fetchOnboardedOrgs();
    }
  }, [settingsTab, currentUser]);

  // New category states
  const [newCategoryName, setNewCategoryName] = useState('');

  // New table states
  const [tableId, setTableId] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [zone, setZone] = useState<TableZone>('Main Floor');
  const [floor, setFloor] = useState('Ground Floor');

  // New promo states
  const [promoCode, setPromoCode] = useState('');
  const [promoType, setPromoType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [promoValue, setPromoValue] = useState('');
  const [minSpend, setMinSpend] = useState('');

  // New Staff member states
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('Waitstaff');
  const [staffPin, setStaffPin] = useState('');

  // Custom react modal state for secure user profile editing (since prompt/alert is blocked in iframes)
  const [editingUser, setEditingUser] = useState<(UserSession & { email?: string }) | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedRole, setEditedRole] = useState<UserRole>('Waitstaff');
  const [editedPin, setEditedPin] = useState('');

  // Editing Table States
  const [editingTable, setEditingTable] = useState<TableInfo | null>(null);
  const [editedTableCapacity, setEditedTableCapacity] = useState('');
  const [editedTableZone, setEditedTableZone] = useState<TableZone>('Main Floor');
  const [editedTableFloor, setEditedTableFloor] = useState('');

  const zones: (TableZone | 'All')[] = [
    'All', 'Main Floor', 'Window', 'Booth', 'VIP Area', 'Bar', 'Patio'
  ];

  const filteredTables = tables.filter(table => {
    if (selectedZone === 'All') return true;
    return table.zone === selectedZone;
  });

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'Available':
        return 'border-emerald-500 bg-emerald-55/10 text-emerald-700';
      case 'Occupied':
        return 'border-rose-500 bg-rose-55/10 text-rose-700';
      case 'Reserved':
        return 'border-amber-500 bg-amber-55/10 text-amber-700';
    }
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableId.trim()) {
      alert('Table number is required.');
      return;
    }

    const paddedId = tableId.trim().padStart(2, '0');

    // Duplicate check
    if (tables.some(t => t.id === paddedId)) {
      alert(`Table ${paddedId} already exists in the dining layout database!`);
      return;
    }

    const newTable: TableInfo = {
      id: paddedId,
      capacity: parseInt(capacity),
      zone,
      status: 'Available',
      floor
    };

    onAddTable(newTable);
    setIsFormOpen(false);
    setTableId('');
    setCapacity('4');
    setFloor('Ground Floor');
  };

  const handleCreatePromoDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = promoCode.trim().toUpperCase();
    if (!formattedCode) {
      alert('Promo code name is required.');
      return;
    }

    if (promoDiscounts.some(p => p.code === formattedCode)) {
      alert(`Discount code "${formattedCode}" already exists!`);
      return;
    }

    const finalVal = parseFloat(promoValue);
    if (isNaN(finalVal) || finalVal <= 0) {
      alert('Discount value must be a positive number.');
      return;
    }

    if (promoType === 'Percentage' && finalVal > 100) {
      alert('Percentage discount cannot exceed 100%.');
      return;
    }

    const newPromo: PromoDiscount = {
      id: Date.now().toString(),
      code: formattedCode,
      type: promoType,
      value: finalVal,
      isActive: true,
      minSpend: minSpend ? parseFloat(minSpend) : undefined
    };

    onAddPromoDiscount(newPromo);
    setIsFormOpen(false);
    setPromoCode('');
    setPromoValue('');
    setMinSpend('');
  };

  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newCategoryName.trim();
    if (!formatted) return;
    if (categories.some(c => c.toLowerCase() === formatted.toLowerCase())) {
      alert(`Category "${formatted}" already exists!`);
      return;
    }
    onAddCategory(formatted);
    setIsFormOpen(false);
    setNewCategoryName('');
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffUsername.trim() || !staffEmail.trim() || !staffPin.trim()) {
      alert('All staff register fields are required.');
      return;
    }

    if (staffPin.trim().length !== 6 || isNaN(Number(staffPin))) {
      alert('Secret entry PIN must be exactly 6 numeric digits.');
      return;
    }

    const formattedUsername = staffUsername.toLowerCase().trim();
    if (users.some(u => u.username.toLowerCase() === formattedUsername)) {
      alert('Username is already registered by another operator.');
      return;
    }

    onAddUser({
      name: staffName.trim(),
      username: formattedUsername,
      email: staffEmail.trim(),
      role: staffRole,
      pin: staffPin.trim()
    });

    setIsFormOpen(false);
    setStaffName('');
    setStaffUsername('');
    setStaffEmail('');
    setStaffPin('');
    alert(`Successfully registered approved operator "${staffName}"!`);
  };

  const handleEditOperatorClick = (user: UserSession & { email?: string }) => {
    setEditingUser(user);
    setEditedName(user.name);
    setEditedEmail(user.email || '');
    setEditedRole(user.role);
    setEditedPin(user.pin);
  };

  const handleManualEmailConfirmation = (userId: string, name: string) => {
    const confirmApprove = window.confirm(`Approve registration and send email confirmation to ${name}?`);
    if (confirmApprove) {
      onApproveUser(userId);
      alert(`Aahar cloud server: Registration approved. Welcoming email confirmation dispatched to staff inbox!`);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-3 sm:p-6 gap-3 sm:gap-6 overflow-hidden bg-slate-50/50">
      {/* Visual Workspace Headers with Navigation Segmented Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 sm:gap-4 shrink-0">
        <div>
          <h2 className="font-headline-lg-mobile text-on-surface text-lg sm:text-2xl font-black font-sans leading-none">
            {settingsTab === 'tables' 
              ? 'Seating Layout & Table Management' 
              : settingsTab === 'discounts' 
                ? 'Discount Codes & Account Policies' 
                : settingsTab === 'categories'
                  ? 'Dish Categories & Menu Cataloging'
                  : settingsTab === 'team'
                    ? 'Team PIN Configurations & Auth Signups'
                    : 'Supreme Client Onboarding'}
          </h2>
          <p className="hidden sm:block text-xs sm:text-sm text-outline-variant mt-1.5 leading-relaxed">
            {settingsTab === 'tables' 
              ? 'Map physical seating nodes, occupy, or hold locations in the restaurant register.' 
              : settingsTab === 'discounts'
                ? 'Configure terminal-wide coupons, flat rate discounts, and corporate promo thresholds.'
                : settingsTab === 'categories'
                  ? 'Configure customized food groupings and menu categories.'
                  : settingsTab === 'team'
                    ? 'Approve staff registration, dispatch email confirmations, and customize secure entry PINs.'
                    : 'Designated administrative portal to register and bootstrap clean, isolated restaurant clients.'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full xl:w-auto">
          {/* Segmented Controls */}
          <div className="flex bg-surface-container bg-opacity-70 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl gap-1 border border-outline-variant/10 shadow-xs max-w-full overflow-x-auto custom-scrollbar scroll-smooth shrink-0 mb-1 sm:mb-0">
            <button
              onClick={() => {
                setSettingsTab('tables');
                setIsFormOpen(false);
              }}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl font-sans text-[10px] sm:text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                settingsTab === 'tables' 
                  ? 'black-glossy text-white shadow-s' 
                  : 'text-on-surface-variant hover:text-on-surface text-slate-700'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Seat Layout</span>
            </button>
            <button
              onClick={() => {
                setSettingsTab('discounts');
                setIsFormOpen(false);
              }}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl font-sans text-[10px] sm:text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                settingsTab === 'discounts' 
                  ? 'black-glossy text-white shadow-s' 
                  : 'text-on-surface-variant hover:text-on-surface text-slate-700'
              }`}
            >
              <TicketPercent size={13} />
              <span>Promo Discounts</span>
            </button>
            <button
              onClick={() => {
                setSettingsTab('categories');
                setIsFormOpen(false);
              }}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl font-sans text-[10px] sm:text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                settingsTab === 'categories' 
                  ? 'black-glossy text-white shadow-s' 
                  : 'text-on-surface-variant hover:text-on-surface text-slate-700'
              }`}
            >
              <Layers size={13} />
              <span>Dish Categories</span>
            </button>
             <button
              onClick={() => {
                setSettingsTab('team');
                setIsFormOpen(false);
              }}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl font-sans text-[10px] sm:text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                settingsTab === 'team' 
                  ? 'black-glossy text-white shadow-s' 
                  : 'text-on-surface-variant hover:text-on-surface text-slate-700'
              }`}
            >
              <Users size={13} />
              <span>Team & PINs</span>
            </button>
            {currentUser?.email === 'arpittripathi2007@gmail.com' && (
              <button
                onClick={() => {
                  setSettingsTab('onboard');
                  setIsFormOpen(false);
                }}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl font-sans text-[10px] sm:text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                  settingsTab === 'onboard' 
                    ? 'black-glossy text-white bg-pink-600 shadow-s' 
                    : 'text-pink-600 hover:text-pink-800'
                }`}
              >
                <ShieldCheck size={13} />
                <span>Client Onboard</span>
              </button>
            )}
          </div>

          {settingsTab !== 'onboard' && (
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="black-glossy text-white font-title-md py-1.5 px-3 sm:py-3 sm:px-5 rounded-lg sm:rounded-2xl flex items-center gap-1 cursor-pointer transition-all text-[10px] sm:text-xs font-black shadow-md shrink-0"
            >
              <Plus size={13} />
              <span>
                {isFormOpen 
                  ? 'Hide Creator' 
                  : (settingsTab === 'tables' 
                    ? 'Add Dining Table' 
                    : settingsTab === 'discounts' 
                      ? 'Form Promo Code' 
                      : settingsTab === 'categories'
                        ? 'Add Dish Category'
                        : 'Register Approved Staff')}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Side Active Panel Content */}
        <div className="flex-1 flex flex-col gap-5 overflow-hidden">
          {settingsTab === 'tables' ? (
            <>
              {/* Seating Zone Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                {zones.map(z => (
                  <button
                    key={z}
                    onClick={() => setSelectedZone(z)}
                    className={`px-6 py-2.5 rounded-full font-title-md text-xs whitespace-nowrap cursor-pointer transition-all ${
                      selectedZone === z 
                        ? 'black-glossy text-white font-bold shadow-sm' 
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>

              {/* Table List Cards Grid */}
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-10">
                {filteredTables.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/15 rounded-3xl p-8 text-center bg-white">
                    <Grid size={40} className="text-outline-variant mb-3 stroke-1" />
                    <h3 className="font-sans font-bold text-base text-on-surface">No registered tables</h3>
                    <p className="text-xs text-outline mt-1">Deploy tables to this area using the Add Dining Table creator.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    <AnimatePresence mode="popLayout">
                      {filteredTables.map(table => {
                        const statusColors = getStatusColor(table.status);
                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={table.id}
                            className="bg-white border border-outline-variant/15 rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-5.5 apple-shadow select-none hover:translate-y-[-2px] transition-all flex flex-col justify-between h-auto min-h-[145px] sm:min-h-[185px]"
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[7px] sm:text-[10px] font-label-mono text-outline font-bold uppercase tracking-wider block truncate">
                                    {table.floor ? `${table.floor} • ` : ''}{table.zone}
                                  </span>
                                  <h3 className="font-title-md font-black text-sm sm:text-xl text-on-surface font-sans mt-0.5">T-{table.id}</h3>
                                </div>
                                <div className="flex gap-1 items-center shrink-0">
                                  <span className="bg-slate-50 border border-slate-100 text-on-surface-variant text-[8px] sm:text-[11px] font-bold px-1 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1">
                                    <Users size={10} className="stroke-[2.5] sm:w-[12px] sm:h-[12px]" />
                                    <span>{table.capacity} <span className="hidden xs:inline">Pax</span></span>
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingTable(table);
                                      setEditedTableCapacity(String(table.capacity));
                                      setEditedTableZone(table.zone);
                                      setEditedTableFloor(table.floor || '');
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-secondary transition-colors cursor-pointer"
                                    title="Edit table floor/zone/capacity"
                                  >
                                    <Edit2 size={10} className="text-secondary pointer-events-none sm:w-[12px] sm:h-[12px]" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedQRTable(table)}
                                    className="p-1 hover:bg-slate-150 rounded text-zinc-950 transition-colors cursor-pointer ml-0.5 sm:ml-1"
                                    title="Display Table QR Code"
                                  >
                                    <QrCode size={11} className="sm:w-[13px] sm:h-[13px]" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Interactive toggle control */}
                            <div className="pt-1.5 sm:pt-3 border-t border-outline-variant/10 flex flex-col gap-1 sm:gap-2">
                              <div className={`border text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-center py-0.5 sm:py-1.5 rounded-lg border-dashed ${statusColors}`}>
                                {table.status}
                              </div>
                              <div className="flex gap-0.5 sm:gap-1 justify-center">
                                <button
                                  onClick={() => onUpdateTableStatus(table.id, 'Available')}
                                  className="flex-1 text-[7px] sm:text-[9px] font-black py-0.5 sm:py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded cursor-pointer transition-colors focus:outline-none"
                                >
                                  FREE
                                </button>
                                <button
                                  onClick={() => onUpdateTableStatus(table.id, 'Occupied')}
                                  className="flex-1 text-[7px] sm:text-[9px] font-black py-0.5 sm:py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded cursor-pointer transition-colors focus:outline-none"
                                >
                                  BUSY
                                </button>
                                <button
                                  onClick={() => onUpdateTableStatus(table.id, 'Reserved')}
                                  className="flex-1 text-[7px] sm:text-[9px] font-black py-0.5 sm:py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded cursor-pointer transition-colors focus:outline-none"
                                >
                                  HOLD
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </>
          ) : settingsTab === 'discounts' ? (
            /* Promo Discount list */
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-outline-variant tracking-wider uppercase">Active Promotions ({promoDiscounts.length})</span>
                <span className="text-[10px] text-outline font-mono">CODES STORED IN SYSTEM</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar">
                {promoDiscounts.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/15 rounded-3xl p-8 text-center bg-white">
                    <Percent size={40} className="text-outline-variant mb-3 stroke-1" />
                    <h3 className="font-sans font-bold text-base text-on-surface">No Coupon Codes Found</h3>
                    <p className="text-xs text-outline mt-1 font-sans">Authorise promotions to display standard checkout drops.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
                    <AnimatePresence mode="popLayout">
                      {promoDiscounts.map(promo => {
                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={promo.id}
                            className={`bg-white border rounded-[2.5rem] p-6 apple-shadow hover:translate-y-[-2px] transition-all flex flex-col justify-between h-[170px] ${
                              promo.isActive ? 'border-indigo-200/50' : 'border-outline-variant/15 opacity-75'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center ${
                                    promo.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    <Tag size={15} />
                                  </div>
                                  <h3 className="font-sans font-black text-sm text-slate-900 tracking-wider font-mono">{promo.code}</h3>
                                </div>
                                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                                  promo.isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {promo.isActive ? 'Active' : 'Muted'}
                                </span>
                              </div>

                              <p className="text-xs font-sans text-outline mt-4 leading-relaxed font-bold">
                                {promo.type === 'Percentage' ? `${promo.value}% Percentage Cut` : `₹${promo.value}.00 Flat Deduction`}
                                {promo.minSpend ? ` on spends above ₹${promo.minSpend.toFixed(2)}` : ' on all orders'}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-solid border-outline-variant/10 flex items-center justify-between shrink-0">
                              <button
                                onClick={() => onTogglePromoDiscount(promo.id)}
                                className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl cursor-pointer transition-[transform,colors] ${
                                  promo.isActive 
                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {promo.isActive ? 'Mute Code' : 'Enable Code'}
                              </button>

                              <button
                                onClick={() => onDeletePromoDiscount(promo.id)}
                                className="text-outline hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center shrink-0"
                                title="Delete promo coupon"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          ) : settingsTab === 'categories' ? (
            /* Dish Category list */
            <div className="flex-1 flex flex-col gap-4 overflow-hidden animate-fade-in-up">
              <div className="flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-outline-variant tracking-wider uppercase">Active Menu Categories ({categories.length})</span>
                <span className="text-[10px] text-outline font-mono">GROUPS OF RECIPES</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar">
                {categories.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/15 rounded-3xl p-8 text-center bg-white">
                    <Layers size={40} className="text-outline-variant mb-3 stroke-1" />
                    <h3 className="font-sans font-bold text-base text-on-surface">No dish categories found</h3>
                    <p className="text-xs text-outline mt-1">Configure active dish groupings using the Add Category form.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                      {uniqueCategories.map(cat => {
                        // Count how many menu items are currently inside this category
                        const itemCount = menuItems.filter(item => item.category === cat).length;
                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={cat}
                            className="bg-white border border-outline-variant/15 rounded-[2.5rem] p-6 apple-shadow select-none hover:translate-y-[-2px] transition-all flex flex-col justify-between h-[145px]"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-on-surface shrink-0">
                                  <Layers size={18} className="text-zinc-500" />
                                </div>
                                <div className="leading-tight">
                                  <h4 className="font-sans font-black text-base text-on-surface">{cat}</h4>
                                  <span className="text-[11px] font-medium text-outline mt-0.5 block">{itemCount} Dish(es) Linked</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-solid border-outline-variant/10 flex items-center justify-between animate-grow">
                              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">System Category</span>
                              <button
                                onClick={() => onDeleteCategory(cat)}
                                className="text-outline hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center shrink-0 focus:outline-none"
                                title="Delete Category"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          ) : settingsTab === 'team' ? (
             /* Tab 4: New Team Signups & Custom PIN Configurations (Manager authorization desk) */
            <div className="flex-1 flex flex-col gap-4 overflow-hidden animate-fade-in-up">
              {(() => {
                const rosterUsers = users.filter(u => u.role !== 'Manager');
                return (
                  <>
                    <div className="flex justify-between items-center shrink-0">
                      <span className="text-xs font-bold text-outline-variant tracking-wider uppercase">Restaurant Operator Registers ({rosterUsers.length})</span>
                      <span className="text-[10px] text-outline font-mono uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded rounded-full">
                        Admin authorization live desk
                      </span>
                    </div>

                    {/* Staff table display list */}
                    <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar">
                      {rosterUsers.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/15 rounded-3xl p-8 text-center bg-white">
                          <Users size={40} className="text-outline-variant mb-3 stroke-1" />
                          <h3 className="font-sans font-bold text-base text-on-surface">No staff members enrolled</h3>
                          <p className="text-xs text-outline mt-1">Register first-class staff approved members directly on the sidebar form.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {/* Segment pending queue first for fast visual check */}
                          {rosterUsers.some(u => u.status === 'Pending') && (
                            <div className="bg-red-50/40 border border-red-200/50 rounded-3xl p-5 flex flex-col gap-3">
                              <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest flex items-center gap-1">
                                <AlertCircle size={14} className="stroke-[2.5]" />
                                <span>Pending Admin Approvals & Email Confirmations</span>
                              </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rosterUsers.filter(u => u.status === 'Pending').map(u => (
                            <div key={u._docId || u.id || u.username} className="bg-white border border-red-200 p-4 rounded-2xl shadow-xs flex justify-between items-center gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-black text-slate-900 truncate">{u.name}</p>
                                  <span className="bg-rose-100 text-rose-850 text-[7px] font-black tracking-wider uppercase px-1.5 py-0.2 rounded">
                                    {u.role}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-500 font-label-mono truncate mt-1">{u.email}</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">Username: {u.username} • Desired PIN: 🔒 {u.pin}</p>
                              </div>

                              <button
                                onClick={() => handleManualEmailConfirmation(u.id, u.name)}
                                className="bg-indigo-600 hover:bg-slate-950 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors shrink-0 flex items-center gap-1 focus:outline-none shadow-sm"
                              >
                                <ShieldCheck size={12} />
                                <span>Approve & Confirm</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Registered Approved Active staff lists */}
                    <div className="bg-white border border-outline-variant/15 rounded-[2rem] p-6 shadow-xs flex flex-col gap-4">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Approved Operator Roster</h3>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-outline-variant/10">
                              <th className="pb-3.5 text-[9px] font-black uppercase text-outline tracking-wider">operator</th>
                              <th className="pb-3.5 text-[9px] font-black uppercase text-outline tracking-wider">official email</th>
                              <th className="pb-3.5 text-[9px] font-black uppercase text-outline tracking-wider">username</th>
                              <th className="pb-3.5 text-[9px] font-black uppercase text-outline tracking-wider text-center">role badge</th>
                              <th className="pb-3.5 text-[9px] font-black uppercase text-outline tracking-wider text-center">gate security pin</th>
                              <th className="pb-3.5 text-[9px] font-black uppercase text-outline tracking-wider text-right">actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rosterUsers.filter(u => !u.status || u.status === 'Approved').map(u => (
                              <tr key={u._docId || u.id || u.username} className="border-b border-light border-outline-variant/5 hover:bg-slate-50/50 transition-colors">
                                <td className="py-4.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8.5 h-8.5 rounded-full bg-slate-100 border border-outline-variant/10 overflow-hidden flex items-center justify-center">
                                      {u.role === 'Manager' ? (
                                        <ShieldCheck size={14} className="text-purple-600" />
                                      ) : u.role === 'Kitchen' ? (
                                        <Users size={14} className="text-orange-500" />
                                      ) : (
                                        <Users size={14} className="text-blue-500" />
                                      )}
                                    </div>
                                    <span className="text-xs font-black text-slate-900">{u.name}</span>
                                  </div>
                                </td>
                                <td className="py-4.5">
                                  <span className="text-xs text-slate-500 font-label-mono">{u.email || 'N/A'}</span>
                                </td>
                                <td className="py-4.5">
                                  <span className="text-xs text-outline font-label-mono">{u.username}</span>
                                </td>
                                <td className="py-4.5 text-center">
                                  <span className={`${
                                    u.role === 'Manager' 
                                      ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                      : u.role === 'Kitchen'
                                        ? 'bg-orange-50 text-orange-750 border-orange-100'
                                        : 'bg-blue-50 text-blue-700 border-blue-105'
                                  } text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-4.5 text-center">
                                  <div className="inline-flex items-center gap-2">
                                    <span className="font-label-mono font-black text-xs text-on-surface-variant bg-slate-100 px-2.5 py-1 rounded border border-outline-variant/10">
                                      {u.pin}
                                    </span>
                                    <button
                                      onClick={() => handleEditOperatorClick(u)}
                                      className="p-1 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded transition-all cursor-pointer focus:outline-none"
                                      title="Modify operator profile and PIN"
                                    >
                                      <Edit2 size={11} />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-4.5 text-right">
                                  {u.username !== 'admin.michelle' && u.email !== 'arpittripathi2007@gmail.com' ? (
                                    <button
                                      onClick={() => {
                                        if (confirm(`Remove staff operator "${u.name}" permanently?`)) {
                                          onDeleteUser(u.id);
                                        }
                                      }}
                                      className="p-2 text-outline hover:text-rose-600 hover:bg-rose-55/15 rounded-xl cursor-pointer transition-colors focus:outline-none"
                                      title="Revoke access"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  ) : (
                                    <span className="text-[9px] font-black text-slate-300 select-none pr-3">PERSISTENT ADMIN</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    ) : (
      /* Client Onboarding Tab */
      <div className="flex-1 flex flex-col gap-4 overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-outline-variant tracking-wider uppercase">Onboard Business Tenant Client</span>
          <button 
            type="button"
            onClick={fetchOnboardedOrgs}
            className="text-[10px] text-pink-650 font-mono uppercase font-bold bg-pink-50 border border-pink-100 px-3 py-1 rounded-full cursor-pointer hover:bg-pink-100 transition-colors"
          >
            {orgsLoading ? 'Syncing...' : 'Sync Clients List'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar">
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            
            {/* Left Panel: Onboarding Form */}
            <div className="w-full xl:w-96 bg-white border border-outline-variant/15 rounded-[2rem] p-5 sm:p-6 shadow-xs flex flex-col gap-4 shrink-0">
              <div className="border-b border-light pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Bootstrap Tenant Org</h3>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  Spin-up a brand new clean workspace. All menu categories, discounts, tables, and roster lists will be perfectly isolated.
                </p>
              </div>

              {onboardError && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{onboardError}</span>
                </div>
              )}

              {onboardSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-fade-in">
                  <Check size={13} className="shrink-0" />
                  <span>{onboardSuccess}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setOnboardError('');
                setOnboardSuccess('');

                if (!clientOrgCode.trim() || !clientBusinessName.trim() || !clientOwnerName.trim() || !clientEmail.trim() || !clientPin.trim()) {
                  setOnboardError('All fields are strictly required.');
                  return;
                }

                if (clientPin.length !== 6 || isNaN(Number(clientPin))) {
                  setOnboardError('Supervisor PIN must be exactly 6 numeric digits.');
                  return;
                }

                setOnboardLoading(true);
                try {
                  const response = await fetch('/api/organisations/register', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'x-admin-email': currentUser?.email || ''
                    },
                    body: JSON.stringify({
                      orgCode: clientOrgCode.toUpperCase().trim(),
                      name: clientBusinessName.trim(),
                      ownerName: clientOwnerName.trim(),
                      ownerEmail: clientEmail.trim(),
                      pin: clientPin.trim()
                    })
                  });

                  const data = await response.json();
                  if (response.ok && data.success) {
                    setOnboardSuccess(`Client organization '${clientOrgCode.toUpperCase()}' successfully bootstrapped! Unique Manager user has been created with access PIN: ${clientPin}`);
                    setClientOrgCode('');
                    setClientBusinessName('');
                    setClientOwnerName('');
                    setClientEmail('');
                    setClientPin('');
                    await fetchOnboardedOrgs();
                  } else {
                    setOnboardError(data.error || 'Failed to complete client onboarding.');
                  }
                } catch (err) {
                  setOnboardError('Exception occurred during client onboarding.');
                } finally {
                  setOnboardLoading(false);
                }
              }} className="flex flex-col gap-3">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider">Gate Access Code</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="e.g. BYTE77"
                    className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2 px-3 text-xs text-on-surface font-black focus:ring-1 focus:ring-slate-900 outline-none uppercase tracking-widest text-center"
                    value={clientOrgCode}
                    onChange={(e) => setClientOrgCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider">Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Burger Byte"
                    className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2 px-3 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                    value={clientBusinessName}
                    onChange={(e) => setClientBusinessName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider">Owner Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Michelle Arpit"
                    className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2 px-3 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                    value={clientOwnerName}
                    onChange={(e) => setClientOwnerName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider">Manager 6-Digit PIN</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="6 numeric digits"
                    className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2 px-3 text-xs text-on-surface font-bold tracking-widest focus:ring-1 focus:ring-slate-900 outline-none"
                    value={clientPin}
                    onChange={(e) => setClientPin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider">Owner Email (For login access)</label>
                  <input
                    type="email"
                    required
                    placeholder="owner@mypos.com"
                    className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2 px-3 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={onboardLoading}
                  className="black-glossy text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-99 transition-all cursor-pointer disabled:opacity-50 mt-1"
                >
                  <span>{onboardLoading ? 'Bootstrapping...' : 'Onboard Client'}</span>
                </button>
              </form>
            </div>

            {/* Right Panel: List of Onboarded Clients & Database Document Reference Guide */}
            <div className="flex-1 w-full flex flex-col gap-6">
              
              <div className="bg-white border border-outline-variant/15 rounded-[2rem] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
                <div className="border-b border-light pb-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Onboarded Client Organizations ({onboardedOrgs.length})</h3>
                  <p className="text-[11px] text-zinc-500 mt-1">Review live tenant operations and change access PINs directly on the database registers.</p>
                </div>

                {orgsLoading && onboardedOrgs.length === 0 ? (
                  <div className="h-48 flex items-center justify-center">
                    <span className="text-xs text-outline font-mono animate-pulse">Querying database systems...</span>
                  </div>
                ) : onboardedOrgs.length === 0 ? (
                  <div className="h-48 border-2 border-dashed border-outline-variant/10 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                    <p className="text-xs font-bold text-slate-800">No active tenant clients bootstrapped</p>
                    <p className="text-[10px] text-outline mt-1 max-w-xs">Use the left console to create client systems.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {onboardedOrgs.map((org) => (
                      <div key={org._docId || org.id || org.code} className="border border-outline-variant/15 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[8px] font-black uppercase text-pink-650 bg-pink-100/50 border border-pink-200/20 px-2 py-0.5 rounded-full font-mono tracking-wider">Code: {org.code}</span>
                              <h4 className="text-xs font-bold text-slate-800 mt-1.5">{org.name}</h4>
                            </div>
                            <span className="text-[9px] text-outline font-label-mono">{new Date(org.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="mt-3 text-[10px] text-outline leading-tight flex flex-col gap-1">
                            <p><strong>Owner Name:</strong> {org.ownerName}</p>
                            <p className="truncate"><strong>Owner Email:</strong> {org.ownerEmail}</p>
                          </div>
                        </div>

                        {/* Associated users with PIN changing forms */}
                        <div className="pt-3 border-t border-dashed border-outline-variant/10 flex flex-col gap-2.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Terminal Operators & Associated PINs</p>
                          {org.users && org.users.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {org.users.map((user: any) => (
                                <div key={user._docId || user.id || user.username} className="bg-white border border-outline-variant/10 p-2.5 rounded-xl flex flex-col gap-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 truncate">{user.name}</p>
                                      <p className="text-[8px] text-outline uppercase">{user.role} • {user.username}</p>
                                    </div>
                                    <span className="font-bold font-mono text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-black">🔒 {user.pin}</span>
                                  </div>
                                  
                                  {/* Update PIN field */}
                                  <div className="flex gap-1.5 items-center mt-1.5">
                                    <input
                                      type="password"
                                      placeholder="New 6-digit PIN"
                                      maxLength={6}
                                      className="flex-1 bg-slate-50/50 border border-outline-variant/10 rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-widest focus:ring-1 focus:ring-slate-900 outline-none"
                                      value={newPinValues[user.id] || ''}
                                      onChange={(e) => setNewPinValues(prev => ({ ...prev, [user.id]: e.target.value.replace(/\D/g, '') }))}
                                    />
                                    <button
                                      type="button"
                                      disabled={updatingPinId === user.id}
                                      onClick={() => handleUpdateTenantPin(user.id, newPinValues[user.id] || '')}
                                      className="bg-slate-900 hover:bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                      {updatingPinId === user.id ? 'Saving...' : 'Set PIN'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[9px] text-zinc-400 italic">No operators found for this organization.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reference Instruction Book: How to change PINs on Firestore directly */}
              <div className="bg-white border border-outline-variant/15 rounded-[2rem] p-5 sm:p-6 shadow-xs flex flex-col gap-3">
                <div className="border-b border-light pb-2 flex items-center gap-2">
                  <Lock size={14} className="text-slate-900" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Firestore Database Document Guide</h3>
                </div>
                
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  All terminal operators are mapped locally to an isolated server session that persists inside Google Cloud Firestore. If you ever need to manually update or heal an operator credentials directly inside the Firestore console, please use the structured schema protocol below:
                </p>

                <div className="bg-slate-950 text-slate-200 text-[10px] font-mono leading-relaxed p-4 rounded-xl border border-slate-800 flex flex-col gap-1.5 select-all">
                  <p className="text-rose-400 font-bold">// 1. Navigation Collection Location</p>
                  <p>Firestore Database Instance &gt; Collections &gt; <span className="text-amber-300">"users"</span></p>
                  
                  <p className="text-rose-400 font-bold mt-2">// 2. Dynamic Document ID Syntax Reference</p>
                  <p>Client Operator prefix matches pattern: <span className="text-emerald-400">"[TenantOrgCode]_[OperatorID]"</span></p>
                  <p className="text-zinc-500 pl-4">Example: AHARBY_1 (Default operator) or TARKBYTE_1718000000000</p>
                  
                  <p className="text-rose-400 font-bold mt-2">// 3. Target Node Updates</p>
                  <p>Find document id &gt; Fields &gt; Change <span className="text-emerald-400">"pin"</span> key field string value to desired 6 digits.</p>
                  <p className="text-zinc-500 pl-4">Example: pin: "123456" (Must be fully wrapped as a plain text string)</p>
                </div>
                
                <p className="text-[9px] text-zinc-400">
                  Updates saved directly onto the Firestore database instantly synchronize live POS terminals on the client side without needing to boot or rebuild containers.
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>
    )}

        {/* Universal Entry Form Sidebar */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 25 }}
              className="w-96 bg-white rounded-[2.5rem] border border-outline-variant/15 p-6 apple-shadow h-full flex flex-col overflow-hidden justify-between shrink-0"
            >
              {settingsTab === 'tables' ? (
                /* Tab 1: Create Table form */
                <form onSubmit={handleCreateTable} className="flex-1 flex flex-col justify-between">
                  <div className="flex flex-col gap-5">
                    <div className="pb-3 border-b border-light border-outline-variant/10">
                      <h3 className="font-title-md font-black text-on-surface text-lg">Dining Layout Setup</h3>
                      <p className="text-xs text-outline mt-0.5">Register a physical table layout inside terminal systems.</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-outline uppercase tracking-wider">Table Number / Reference</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 14"
                        className="bg-surface-container bg-opacity-40 rounded-2xl py-3.5 px-5 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-label-mono text-on-surface font-bold text-sm"
                        value={tableId}
                        onChange={(e) => setTableId(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-outline uppercase tracking-wider">Chair Capacity (Pax)</label>
                      <select
                        className="bg-surface-container bg-opacity-40 rounded-2xl py-3.5 px-5 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-sans text-on-surface cursor-pointer text-sm font-bold appearance-none"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                      >
                        <option value="1">1 Person</option>
                        <option value="2">2 Persons (Standard Couple)</option>
                        <option value="3">3 Persons</option>
                        <option value="4">4 Persons (Standard Quad)</option>
                        <option value="6">6 Persons (Large Family)</option>
                        <option value="8">8 Persons (VIP Sized)</option>
                        <option value="12">12 Persons (Banquets/Feasts)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-outline uppercase tracking-wider">Seating Area / Zone</label>
                      <select
                        className="bg-surface-container bg-opacity-40 rounded-2xl py-3.5 px-5 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-sans text-on-surface cursor-pointer text-sm font-bold appearance-none"
                        value={zone}
                        onChange={(e) => setZone(e.target.value as TableZone)}
                      >
                        <option value="Main Floor">Main Floor</option>
                        <option value="Window">Window Seat</option>
                        <option value="Booth">Cosy Booth</option>
                        <option value="VIP Area">VIP Lounge</option>
                        <option value="Bar">Bar Counter</option>
                        <option value="Patio">Patio Garden</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-outline uppercase tracking-wider">Floor / Level Designation</label>
                      <select
                        className="bg-surface-container bg-opacity-40 rounded-2xl py-3.5 px-5 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-sans text-on-surface cursor-pointer text-sm font-bold appearance-none"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                      >
                        <option value="Ground Floor">Ground Floor</option>
                        <option value="1st Floor">1st Floor (Mezzanine)</option>
                        <option value="2nd Floor">2nd Floor</option>
                        <option value="Outdoor Garden">Outdoor Garden</option>
                        <option value="Rooftop Lounge">Rooftop Lounge</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/10 flex flex-col gap-3 shrink-0">
                    <button
                      type="submit"
                      className="black-glossy text-white font-title-md py-4 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-95 transition-all text-sm font-bold cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Deploy Seat Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-on-surface-variant font-title-md py-3.5 rounded-2xl transition-all text-xs font-bold cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : settingsTab === 'discounts' ? (
                /* Tab 2: Create Promo discount code */
                <form onSubmit={handleCreatePromoDiscount} className="flex-1 flex flex-col justify-between">
                  <div className="flex flex-col gap-5">
                    <div className="pb-3 border-b border-light border-outline-variant/10">
                      <h3 className="font-title-md font-black text-on-surface text-lg">New Discount Code</h3>
                      <p className="text-xs text-outline mt-0.5">Authorise general promotion codes for instant bill drops.</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-outline uppercase tracking-wider">Promotion Coupon Code</label>
                      <div className="relative">
                        <Tag size={15} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-outline-variant" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. WELCOME15"
                          className="pl-11 bg-surface-container bg-opacity-40 rounded-2xl py-3.5 px-5 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-sans tracking-wide font-extrabold text-on-surface text-sm uppercase"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-outline uppercase tracking-wider">Discount Rate Scheme</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPromoType('Percentage')}
                          className={`py-3 text-xs font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                            promoType === 'Percentage'
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-outline-variant/15 text-outline-variant'
                          }`}
                        >
                          Percentage Off (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPromoType('Fixed')}
                          className={`py-3 text-xs font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                            promoType === 'Fixed'
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-outline-variant/15 text-outline-variant'
                          }`}
                        >
                          Flat Rupee Cut (₹)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-outline uppercase tracking-wider">
                        Discount Portion ({promoType === 'Percentage' ? '%' : '₹'})
                      </label>
                      <input
                        type="number"
                        required
                        placeholder={promoType === 'Percentage' ? 'e.g. 15' : 'e.g. 150'}
                        className="bg-surface-container bg-opacity-40 rounded-2xl py-3.5 px-5 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-sans font-bold text-on-surface text-sm"
                        value={promoValue}
                        onChange={(e) => setPromoValue(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-outline uppercase tracking-wider">Minimum Required spend (INR - optional)</label>
                      <input
                        type="number"
                        placeholder="e.g. 500 (leave empty for no limit)"
                        className="bg-surface-container bg-opacity-40 rounded-2xl py-3.5 px-5 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-sans text-on-surface text-xs font-semibold"
                        value={minSpend}
                        onChange={(e) => setMinSpend(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/10 flex flex-col gap-3 shrink-0">
                    <button
                      type="submit"
                      className="black-glossy text-white font-title-md py-4 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-95 transition-all text-sm font-bold cursor-pointer"
                    >
                      Deploy Promotion Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-on-surface-variant font-title-md py-3.5 rounded-2xl transition-all text-xs font-bold cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : settingsTab === 'categories' ? (
                /* Tab 3: Create Category form */
                <form onSubmit={handleCreateCategorySubmit} className="flex-1 flex flex-col justify-between">
                  <div className="flex flex-col gap-5">
                    <div className="pb-3 border-b border-light border-outline-variant/10">
                      <h3 className="font-title-md font-black text-on-surface text-lg">Add Food Category</h3>
                      <p className="text-xs text-outline mt-0.5">Define category tags to filter active dishes properly.</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-outline uppercase tracking-wider">Category Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Biryani Specials"
                        className="bg-surface-container bg-opacity-40 rounded-2xl py-3.5 px-5 outline-none border-none focus:ring-2 focus:ring-secondary/10 font-sans text-on-surface font-extrabold text-sm"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/10 flex flex-col gap-3 shrink-0">
                    <button
                      type="submit"
                      className="black-glossy text-white font-title-md py-4 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-95 transition-all text-sm font-bold cursor-pointer"
                    >
                      Deploy Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-on-surface-variant font-title-md py-3.5 rounded-2xl transition-all text-xs font-bold cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Tab 4: Direct Approved Staff Creation */
                <form onSubmit={handleAddStaffSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
                  <div className="flex flex-col gap-4">
                    <div className="pb-2 border-b border-light border-outline-variant/10">
                      <h3 className="font-title-md font-black text-slate-900 text-sm uppercase">Direct Register operator</h3>
                      <p className="text-[11px] text-outline mt-0.5">Creates a fully pre-approved operator directly inside the live pos database.</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-outline uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amit Patil"
                        className="bg-slate-50 border border-outline-variant/15 rounded-xl py-2 px-3 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-secondary/20 outline-none"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-outline uppercase tracking-wider">Username Reference</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. amit.patil"
                        className="bg-slate-50 border border-outline-variant/15 rounded-xl py-2 px-3 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-secondary/20 outline-none"
                        value={staffUsername}
                        onChange={(e) => setStaffUsername(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-outline uppercase tracking-wider">Staff Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="amit@restaurant.com"
                        className="bg-slate-50 border border-outline-variant/15 rounded-xl py-2 px-3 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-secondary/20 outline-none"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-outline uppercase tracking-wider">Staff Security PIN</label>
                        <input
                          type="password"
                          required
                          maxLength={6}
                          placeholder="6-digits PIN"
                          className="bg-slate-50 border border-outline-variant/15 rounded-xl py-2 px-3 text-xs text-on-surface font-extrabold tracking-widest focus:ring-1 focus:ring-secondary/20 outline-none"
                          value={staffPin}
                          onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-outline uppercase tracking-wider">Staff Terminal Role</label>
                        <select
                          className="bg-slate-50 border border-outline-variant/15 rounded-xl py-2 px-2.5 text-xs text-on-surface font-bold focus:ring-1 focus:ring-secondary/20 outline-none cursor-pointer"
                          value={staffRole}
                          onChange={(e) => setStaffRole(e.target.value as UserRole)}
                        >
                          <option value="Waitstaff">Waitstaff</option>
                          <option value="Kitchen">Kitchen Staff</option>
                          <option value="Manager">Manager</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/10 flex flex-col gap-2 shrink-0">
                    <button
                      type="submit"
                      className="black-glossy text-white font-title-md py-3.5 rounded-xl shadow-md hover:scale-[1.01] active:scale-95 transition-all text-xs font-bold cursor-pointer"
                    >
                      Enlist Certified Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-on-surface-variant py-2.5 rounded-xl transition-all text-[10px] uppercase font-bold tracking-wide cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom inline modal for operator profile changes */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white rounded-[2.5rem] border border-outline-variant/15 p-6 md:p-8 shadow-2xl flex flex-col gap-5"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-light border-outline-variant/10">
                <h3 className="font-title-md font-black text-on-surface text-base uppercase tracking-wide">Edit Operator Profile</h3>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-250 text-slate-750 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-outline uppercase tracking-wider">Full Operator Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Patil"
                    className="bg-slate-50 border border-slate-205 rounded-xl py-2.5 px-3 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-secondary/20 outline-none"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-outline uppercase tracking-wider">Official Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. amit@restaurant.com"
                    className="bg-slate-50 border border-slate-205 rounded-xl py-2.5 px-3 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-secondary/20 outline-none"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-outline uppercase tracking-wider">Security PIN (6 Digits)</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6 numeric digits"
                      className="bg-slate-50 border border-slate-205 rounded-xl py-2.5 px-3 text-xs text-on-surface font-extrabold tracking-widest focus:ring-1 focus:ring-secondary/20 outline-none"
                      value={editedPin}
                      onChange={(e) => setEditedPin(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-outline uppercase tracking-wider">Terminal Access Role</label>
                    <select
                      className="bg-slate-50 border border-slate-205 rounded-xl py-2.5 px-2.5 text-xs text-on-surface font-bold focus:ring-1 focus:ring-secondary/20 outline-none cursor-pointer"
                      value={editedRole}
                      disabled={editingUser.username === 'admin.michelle'}
                      onChange={(e) => setEditedRole(e.target.value as UserRole)}
                    >
                      <option value="Waitstaff">Waitstaff</option>
                      <option value="Kitchen">Kitchen Staff</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold py-3.5 rounded-2xl text-xs transition-transform active:scale-95 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editedName.trim().length === 0) {
                      alert('Operator name must be provided.');
                      return;
                    }
                    if (editedPin.length !== 6) {
                      alert('PIN must be exactly 6 digits.');
                      return;
                    }
                    onUpdateUser(editingUser.id, {
                      name: editedName,
                      email: editedEmail,
                      role: editedRole,
                      pin: editedPin
                    });
                    setEditingUser(null);
                    alert(`Operator "${editedName}" profile updated successfully!`);
                  }}
                  className="flex-1 black-glossy text-white font-bold py-3.5 rounded-2xl text-xs transition-transform active:scale-95 cursor-pointer text-center"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* SECURE DINING TABLE CONFIGURATION MODAL DIALOG */}
        {editingTable && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container-lowest max-w-sm w-full rounded-[2.5rem] border border-outline-variant/20 p-6 sm:p-8 apple-shadow flex flex-col gap-6"
            >
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <Grid size={22} className="text-secondary" />
                  <div>
                    <h3 className="font-sans font-black text-base text-on-surface">Dining Table Setup</h3>
                    <p className="text-xs text-outline font-semibold">Editing Table Code: T-{editingTable.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTable(null)}
                  className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface transition-all flex items-center justify-center cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Seating Area / Zone</label>
                  <select
                    className="w-full bg-surface-container px-3.5 py-3 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-secondary/15 font-sans"
                    value={editedTableZone}
                    onChange={(e) => setEditedTableZone(e.target.value as TableZone)}
                  >
                    <option value="Main Floor">Main Floor</option>
                    <option value="Window">Window Seat</option>
                    <option value="Booth">Cozy Booth</option>
                    <option value="VIP Area">VIP Exclusive Lounge</option>
                    <option value="Bar">High bar stools</option>
                    <option value="Patio">Alfresco Patio</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Floor / Level Designation</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container px-3.5 py-3 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-secondary/15"
                    value={editedTableFloor}
                    onChange={(e) => setEditedTableFloor(e.target.value)}
                    placeholder="e.g. Ground Floor, 1st Floor, Terrace"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Capacity Chair Count (Max Pax)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="w-full bg-surface-container px-3.5 py-3 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-secondary/15 font-label-mono"
                    value={editedTableCapacity}
                    onChange={(e) => setEditedTableCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-755 font-bold py-3.5 rounded-2xl text-xs transition-transform active:scale-95 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const parsedCap = parseInt(editedTableCapacity);
                    if (isNaN(parsedCap) || parsedCap <= 0) {
                      alert('Valid capacity chair count must be specified.');
                      return;
                    }
                    if (onUpdateTable) {
                      onUpdateTable(editingTable.id, {
                        capacity: parsedCap,
                        zone: editedTableZone,
                        floor: editedTableFloor
                      });
                    }
                    setEditingTable(null);
                    alert(`Table T-${editingTable.id} configuration updated successfully.`);
                  }}
                  className="flex-1 black-glossy text-white font-bold py-3.5 rounded-2xl text-xs transition-transform active:scale-95 cursor-pointer text-center"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedQRTable && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 select-none animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full border border-outline-variant/15 shadow-2xl flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
              
              <div className="flex justify-between items-start pt-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider font-sans bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Live Digital Catalog
                  </span>
                  <h3 className="font-sans font-black text-on-surface text-xl mt-1.5 leading-none">
                    Table T-{selectedQRTable.id} QR Code
                  </h3>
                  <p className="text-[10px] text-outline mt-1 font-sans">
                    {selectedQRTable.floor ? `${selectedQRTable.floor} • ` : ''}{selectedQRTable.zone} Seating Node
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQRTable(null)}
                  className="p-1 text-slate-450 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  title="Close Dialog"
                >
                  <X size={16} />
                </button>
              </div>

              <div id={`qr-card-print-area-${selectedQRTable.id}`} className="bg-slate-50 rounded-3xl p-5 border border-outline-variant/10 flex flex-col items-center justify-center gap-3.5 shadow-inner">
                <div className="text-center">
                  <h4 className="text-sm font-black text-slate-900 tracking-tight leading-none">Aahar Byte</h4>
                  <p className="text-[9px] text-outline mt-0.5 font-sans font-semibold">Gourmet Dining Experience</p>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm flex items-center justify-center relative group">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      window.location.origin + '/menu?table=' + selectedQRTable.id + '&org=' + (currentUser?.orgCode || 'AHARBY')
                    )}`}
                    alt={`Table ${selectedQRTable.id} QR`}
                    referrerPolicy="no-referrer"
                    className="w-[180px] h-[180px] object-contain select-text"
                  />
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-black bg-zinc-950 text-white px-3 py-1 rounded-xl shadow-sm tracking-widest font-mono">
                    TABLE T-{selectedQRTable.id}
                  </span>
                  <p className="text-[8px] text-zinc-500 font-bold mt-2 font-sans">
                    Scan QR to view current food & beverage menu.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const relativeLink = `/menu?table=${selectedQRTable.id}&org=${currentUser?.orgCode || 'AHARBY'}`;
                    window.open(relativeLink, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 rounded-2xl text-xs transition-transform active:scale-95 cursor-pointer border border-transparent"
                >
                  <ExternalLink size={12} />
                  <span>Test Customer Browse View</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const customerLink = window.location.origin + '/menu?table=' + selectedQRTable.id + '&org=' + (currentUser?.orgCode || 'AHARBY');
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Aahar Byte - Table T-${selectedQRTable.id} QR Code Card</title>
                            <style>
                              body {
                                margin: 0;
                                padding: 0;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                background: #fff;
                                text-align: center;
                              }
                              .qr-card {
                                border: 2px solid #000;
                                border-radius: 40px;
                                padding: 60px 40px;
                                width: 380px;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                                background: #fff;
                              }
                              h1 {
                                font-size: 32px;
                                font-weight: 900;
                                margin: 0 0 4px 0;
                                text-transform: uppercase;
                                letter-spacing: -0.5px;
                              }
                              h2 {
                                font-size: 14px;
                                font-weight: 600;
                                color: #64748b;
                                margin: 0 0 35px 0;
                                text-transform: uppercase;
                                letter-spacing: 2px;
                              }
                              .qr-wrap {
                                background: #fff;
                                padding: 25px;
                                border: 1px solid #e2e8f0;
                                border-radius: 30px;
                                display: inline-flex;
                                justify-content: center;
                                align-items: center;
                                box-shadow: 0 8px 24px rgba(0,0,0,0.04);
                                margin-bottom: 35px;
                              }
                              .qr-image {
                                width: 230px;
                                height: 230px;
                              }
                              .table-badge {
                                display: inline-block;
                                background: #000;
                                color: #fff;
                                font-size: 20px;
                                font-weight: 900;
                                padding: 12px 30px;
                                border-radius: 20px;
                                letter-spacing: 3px;
                                font-family: monospace;
                              }
                              p {
                                font-size: 13px;
                                color: #475569;
                                font-weight: bold;
                                margin: 25px 0 0 0;
                              }
                            </style>
                          </head>
                          <body>
                            <div class="qr-card">
                              <h1>Aahar Byte</h1>
                              <h2>Gourmet Dining Experience</h2>
                              <div class="qr-wrap">
                                <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(customerLink)}" />
                              </div>
                              <br />
                              <span class="table-badge">TABLE T-${selectedQRTable.id}</span>
                              <p>Scan QR code with your mobile smartphone camera to browse current digital recipe lists, price entries, and live discount events.</p>
                            </div>
                            <script>
                              window.onload = function() {
                                window.focus();
                                setTimeout(function() {
                                  window.print();
                                }, 500);
                              }
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    } else {
                      alert('Please allow popups to print the dining card.');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-900 text-white font-bold py-3.5 rounded-2xl text-xs transition-transform active:scale-95 cursor-pointer shadow-md shadow-zinc-900/10 border border-transparent"
                >
                  <Printer size={12} />
                  <span>Print Seating QR Card</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
