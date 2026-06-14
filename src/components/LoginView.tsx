/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  UserPlus, 
  Lock, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Mail, 
  User, 
  HelpCircle, 
  ChevronRight, 
  ShieldCheck, 
  UtensilsCrossed, 
  Fingerprint, 
  UserSquare2,
  X,
  ChefHat,
  Settings
} from 'lucide-react';
import { UserSession, UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
  onRegisterUser: (userData: any) => Promise<{ success: boolean; error?: string }>;
}

type TabMode = 'login' | 'register_staff';
type LoginStep = 'org_code' | 'select_user' | 'pin_pad';

export default function LoginView({ onLoginSuccess, onRegisterUser }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('login');
  
  // Login flow states
  const [loginStep, setLoginStep] = useState<LoginStep>('org_code');
  const [orgCodeInput, setOrgCodeInput] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [orgUsers, setOrgUsers] = useState<UserSession[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSession | null>(null);
  const [pin, setPin] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);
  
  // Feedback messages
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Staff registration inputs
  const [staffOrgCode, setStaffOrgCode] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('');
  const [staffUsername, setStaffUsername] = useState<string>('');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffPin, setStaffPin] = useState<string>('');
  const [staffRole, setStaffRole] = useState<UserRole>('Waitstaff');

  // Client Onboarding inputs
  const [clientOrgCode, setClientOrgCode] = useState<string>('');
  const [clientBusinessName, setClientBusinessName] = useState<string>('');
  const [clientOwnerName, setClientOwnerName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPin, setClientPin] = useState<string>('');

  // Auto-clear message when tab switches
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setPin('');
  }, [activeTab]);

  // Handle Organization code validation
  const handleValidateOrgCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgCodeInput.trim()) {
      setErrorMsg('Please enter your Organisation Code.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/organisations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgCode: orgCodeInput })
      });

      const data = await response.json();
      if (response.ok && data.exists) {
        setOrgName(data.name);
        
        // Fetch approved operators for this Organization
        const usersResponse = await fetch('/api/organisations/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgCode: orgCodeInput })
        });
        
        const usersData = await usersResponse.json();
        setOrgUsers(usersData.users || []);
        
        // Advance to selection step
        setLoginStep('select_user');
      } else {
        setErrorMsg('Invalid Organisation Code. Please double check.');
      }
    } catch (err) {
      setErrorMsg('Network issue validating organisation.');
    } finally {
      setLoading(false);
    }
  };

  // Select user and proceed to pin pad
  const handleSelectUser = (user: UserSession) => {
    setSelectedUser(user);
    setPin('');
    setErrorMsg('');
    setLoginStep('pin_pad');
  };

  // Back actions in login flow
  const handleBackToOrgCode = () => {
    setLoginStep('org_code');
    setSelectedUser(null);
    setPin('');
    setErrorMsg('');
  };

  const handleBackToSelectUser = () => {
    setLoginStep('select_user');
    setSelectedUser(null);
    setPin('');
    setErrorMsg('');
  };

  // Keyboard press on Pin Pad
  const handleKeyPress = (num: string) => {
    if (successMsg) return;
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    if (successMsg) return;
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (successMsg) return;
    setPin('');
    setErrorMsg('');
  };

  // Automatic Verify PIN when 6 digits are reached
  useEffect(() => {
    if (pin.length === 6 && selectedUser) {
      handlePinSubmit(pin);
    }
  }, [pin]);

  const handlePinSubmit = (enteredPin: string) => {
    if (!selectedUser) return;
    
    if (selectedUser.pin === enteredPin) {
      setSuccessMsg(`Welcome back, ${selectedUser.name}! Identity verified.`);
      setTimeout(() => {
        onLoginSuccess(selectedUser);
      }, 1000);
    } else {
      setErrorMsg('Incorrect 6-digit PIN. Please try again.');
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  // Client Onboarding submit
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!clientOrgCode.trim() || !clientBusinessName.trim() || !clientOwnerName.trim() || !clientEmail.trim() || !clientPin.trim()) {
      setErrorMsg('All registration fields are required.');
      return;
    }

    if (clientPin.length !== 6 || isNaN(Number(clientPin))) {
      setErrorMsg('Supervisor PIN must be exactly 6 numeric digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/organisations/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setSuccessMsg(`Onboarding Success! Code '${clientOrgCode.toUpperCase()}' registered. Log in now!`);
        
        // Auto transfer to login step
        setOrgCodeInput(clientOrgCode.toUpperCase());
        setOrgName(clientBusinessName);
        setSelectedUser(data.user);
        setOrgUsers([data.user]);
        setLoginStep('pin_pad');
        setActiveTab('login');
        
        // Reset inputs
        setClientOrgCode('');
        setClientBusinessName('');
        setClientOwnerName('');
        setClientEmail('');
        setClientPin('');
      } else {
        setErrorMsg(data.error || 'Failed to complete client onboarding.');
      }
    } catch (err) {
      setErrorMsg('Exception occurred during client onboarding.');
    } finally {
      setLoading(false);
    }
  };

  // Staff Signup submit
  const handleRegisterStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!staffOrgCode.trim() || !staffName.trim() || !staffUsername.trim() || !staffEmail.trim() || !staffPin.trim()) {
      setErrorMsg('All staff registration fields are required.');
      return;
    }

    if (staffPin.length !== 6 || isNaN(Number(staffPin))) {
      setErrorMsg('PIN must be exactly 6 numeric digits.');
      return;
    }

    setLoading(true);
    try {
      // Check if organisation exists
      const orgCheck = await fetch('/api/organisations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgCode: staffOrgCode })
      });
      const orgCheckData = await orgCheck.json();
      
      if (!orgCheckData.exists) {
        setErrorMsg(`Organisation code '${staffOrgCode.toUpperCase()}' does not exist.`);
        setLoading(false);
        return;
      }

      // Submit user signup under this orgCode
      const signupResponse = await onRegisterUser({
        name: staffName.trim(),
        username: staffUsername.trim().toLowerCase(),
        email: staffEmail.trim(),
        role: staffRole,
        pin: staffPin.trim(),
        orgCode: staffOrgCode.toUpperCase().trim()
      });

      if (signupResponse.success) {
        setSuccessMsg('Registration Submitted! Ask your Manager/Supervisor to approve you in settings.');
        // Reset inputs
        setStaffOrgCode('');
        setStaffName('');
        setStaffUsername('');
        setStaffEmail('');
        setStaffPin('');
      } else {
        setErrorMsg(signupResponse.error || 'Failed to submit registration.');
      }
    } catch (err) {
      setErrorMsg('Network error submitted registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center p-4 lg:p-8 relative selection:bg-slate-900 selection:text-white">
      
      {/* Decorative branding floating banner */}
      <div className="absolute top-8 flex items-center gap-3 select-none">
        <div className="w-10 h-10 black-glossy rounded-[1rem] flex items-center justify-center shadow-md">
          <UtensilsCrossed size={18} className="text-white shrink-0" />
        </div>
        <div>
          <h2 className="text-md font-black tracking-widest text-primary font-sans leading-none uppercase">Aahar Byte</h2>
          <span className="text-[9px] text-zinc-500 font-bold block mt-1 tracking-widest uppercase">Secure POS Onboarding Portal</span>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-white rounded-[3rem] border border-outline-variant/15 shadow-2xl overflow-hidden flex flex-col mt-12"
      >
        {/* Navigation Selector Bar */}
        <div className="grid grid-cols-2 border-b border-solid border-slate-100 shrink-0">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-4.5 text-[11px] font-bold uppercase tracking-wider text-center focus:outline-none transition-all border-b-2 ${
              activeTab === 'login' 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-zinc-400 hover:text-zinc-650'
            }`}
          >
            Operator Sign In
          </button>
          <button
            onClick={() => setActiveTab('register_staff')}
            className={`py-4.5 text-[11px] font-bold uppercase tracking-wider text-center focus:outline-none transition-all border-b-2 ${
              activeTab === 'register_staff' 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-zinc-400 hover:text-zinc-650'
            }`}
          >
            Register Staff
          </button>
        </div>

        {/* Tab content renders */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[75vh] flex-1">
          
          {/* General Feedback Box */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              </motion.div>
            )}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-850 text-xs font-black flex items-start gap-2 leading-relaxed">
                  <CheckCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* TAB: OPERATOR LOGIN */}
            {activeTab === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {/* LOGIN STEP 1: Verification of Org Code */}
                {loginStep === 'org_code' && (
                  <form onSubmit={handleValidateOrgCode} className="flex flex-col gap-5">
                    <div className="text-center mb-1 select-none">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-800 shadow-sm">
                        <Building2 size={22} />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-3 uppercase tracking-wide">Select your Organisation</h4>
                      <p className="text-xs text-outline mt-1.5 leading-relaxed">
                        Enter the unique organisation gateway code provided during onboarding (e.g., standard code: <span className="font-extrabold text-slate-800">AHARBY</span>) to identify your POS dashboard.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-outline tracking-wider">Organisation Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AHARBY"
                        className="bg-slate-50 border border-outline-variant/20 rounded-2xl py-3.5 px-4 text-sm text-on-surface font-extrabold focus:ring-1 focus:ring-slate-900 outline-none uppercase tracking-widest text-center shadow-xs"
                        value={orgCodeInput}
                        onChange={(e) => setOrgCodeInput(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="black-glossy text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-99 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Validating...' : 'Validate & Verify'}
                      <ChevronRight size={13} className="stroke-[3]" />
                    </button>
                    
                    <div className="text-center pt-2">
                       <span className="text-[11px] text-zinc-400 font-medium">Want to link a new operating terminal? </span>
                       <button 
                         type="button" 
                         onClick={() => setActiveTab('register_staff')}
                         className="text-[11px] text-slate-900 font-extrabold underline hover:text-slate-700 cursor-pointer"
                       >
                         Register Staff
                       </button>
                    </div>
                  </form>
                )}

                {/* LOGIN STEP 2: Selection of approved Tenant operator */}
                {loginStep === 'select_user' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-solid border-slate-100 pb-3 mb-1">
                      <div>
                        <span className="text-[9px] font-black uppercase text-pink-650 bg-pink-50 px-2 py-0.5 rounded tracking-wide">ORGANISATION</span>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1">{orgName}</h4>
                      </div>
                      <button
                        onClick={handleBackToOrgCode}
                        className="text-[10px] font-black uppercase text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer focus:outline-none"
                      >
                        <ArrowLeft size={12} />
                        <span>Change Org</span>
                      </button>
                    </div>

                    <div className="text-center mb-2">
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-widest">Identify Operator</h4>
                      <p className="text-xs text-zinc-500 mt-1">Select your approved operator profile to log in to the POS terminal.</p>
                    </div>

                    {orgUsers.length === 0 ? (
                      <div className="text-center p-8 bg-slate-50 rounded-2xl border border-solid border-slate-100 flex flex-col items-center gap-2">
                        <AlertCircle size={24} className="text-zinc-400" />
                        <h5 className="font-black text-xs text-slate-800 uppercase tracking-wider">No Active Staff Found</h5>
                        <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                          There are no approved operating users linked to this organisation code. Fill the <span className="font-bold text-slate-800">Register Staff</span> form first or ask your Manager to approve pending signups.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                        {orgUsers.map(u => (
                          <button
                            key={u._docId || u.id || u.username}
                            onClick={() => handleSelectUser(u)}
                            className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 hover:border-zinc-300 rounded-2xl text-left cursor-pointer transition-all active:scale-98 group shadow-xs"
                          >
                            <div className="w-9 h-9 rounded-full bg-white border border-slate-150 flex items-center justify-center shrink-0 shadow-sm">
                              {u.role === 'Manager' ? (
                                <Settings size={15} className="text-purple-600 shrink-0" />
                              ) : u.role === 'Kitchen' ? (
                                <ChefHat size={15} className="text-orange-500 shrink-0" />
                              ) : (
                                <User size={15} className="text-blue-500 shrink-0" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-[12px] text-slate-900 leading-none truncate">{u.name}</h5>
                              <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block mt-1.5">
                                {u.role}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* LOGIN STEP 3: Verification of 6-digit PIN */}
                {loginStep === 'pin_pad' && selectedUser && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between border-b border-solid border-slate-100 pb-3 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shadow-xs shrink-0">
                          {selectedUser.role === 'Manager' ? (
                            <Settings size={12} className="text-purple-600" />
                          ) : selectedUser.role === 'Kitchen' ? (
                            <ChefHat size={12} className="text-orange-500" />
                          ) : (
                            <User size={12} className="text-blue-500" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-extrabold text-[12px] text-slate-900 leading-none">{selectedUser.name}</h5>
                          <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider block mt-1">
                            {selectedUser.role} ({orgName})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleBackToSelectUser}
                        className="text-[10px] font-black uppercase text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer focus:outline-none"
                      >
                        <ArrowLeft size={12} />
                        <span>Other Staff</span>
                      </button>
                    </div>

                    {/* Displays PIN Code Indicators */}
                    <div className="flex flex-col items-center gap-2 select-none">
                      <span className="text-[9px] font-black uppercase text-outline tracking-wider">Enter 6-Digit Gate Security PIN</span>
                      
                      <motion.div 
                        animate={{ x: shake ? [-8, 8, -8, 8, 0] : 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex justify-center gap-2 mt-1"
                      >
                        {[0, 1, 2, 3, 4, 5].map(idx => (
                          <div 
                            key={idx} 
                            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                              pin.length > idx 
                                ? 'bg-zinc-900 border-zinc-900 scale-110 shadow-xs' 
                                : 'bg-transparent border-slate-200'
                            }`}
                          />
                        ))}
                      </motion.div>
                    </div>

                    {/* Numeric Pin Pad */}
                    <div className="grid grid-cols-3 gap-2.5 max-w-[270px] mx-auto w-full">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleKeyPress(num)}
                          className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-on-surface font-semibold text-md transition-all cursor-pointer border border-slate-150/60 shadow-xs flex items-center justify-center font-sans focus:outline-none"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleClear}
                        className="h-12 rounded-xl hover:bg-slate-100 text-outline text-[10px] font-black uppercase transition-all cursor-pointer flex items-center justify-center focus:outline-none"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKeyPress('0')}
                        className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-on-surface font-semibold text-md transition-all cursor-pointer border border-slate-150/60 shadow-xs flex items-center justify-center font-sans focus:outline-none"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={handleBackspace}
                        className="h-12 rounded-xl hover:bg-slate-100 text-outline transition-all cursor-pointer flex items-center justify-center active:scale-90 focus:outline-none"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Highly intuitive Login Submission Button */}
                    <div className="max-w-[270px] mx-auto w-full mt-4">
                      <button
                        type="button"
                        onClick={() => handlePinSubmit(pin)}
                        disabled={pin.length !== 6}
                        className="w-full black-glossy text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-97 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer"
                      >
                        <ShieldCheck size={14} />
                        <span>Confirm & Log In</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: STAFF REGISTRATION */}
            {activeTab === 'register_staff' && (
              <motion.form
                key="register-staff-view"
                onSubmit={handleRegisterStaffSubmit}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-700 shadow-sm">
                    <UserPlus size={22} />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-3 uppercase tracking-wide">Register Restaurant Staff</h4>
                  <p className="text-xs text-outline mt-1 leading-normal">
                    Submit a registration request under an existing organization. Requires Approval from your Manager / supervisor.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">Organisation Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AHARBY"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-black focus:ring-1 focus:ring-slate-900 outline-none uppercase tracking-widest text-center shadow-xs"
                      value={staffOrgCode}
                      onChange={(e) => setStaffOrgCode(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">Role Requested</label>
                    <select
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none h-[38px] select-style cursor-pointer"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    >
                      <option value="Waitstaff">Waitstaff / Server</option>
                      <option value="Kitchen">Kitchen Staff / Chef</option>
                      <option value="Manager">Manager / Supervisor</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-outline tracking-wider">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Mishra"
                    className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">Login Username Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rahul.m"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">New 6-Digit POS PIN</label>
                    <input
                      type="password"
                      required
                      maxLength={6}
                      placeholder="6 numeric digits"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-bold tracking-widest focus:ring-1 focus:ring-slate-900 outline-none"
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-outline tracking-wider">Official Email Address</label>
                  <div className="relative">
                    <Mail size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant" />
                    <input
                      type="email"
                      required
                      placeholder="rahul@myrestaurant.com"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none w-full"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="black-glossy text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-99 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  <Fingerprint size={14} />
                  {loading ? 'Submitting registration...' : 'Submit Sign-up Request'}
                </button>
              </motion.form>
            )}

            {/* TAB: ONBOARD CLIENT */}
            {activeTab === 'onboard_client' && (
              <motion.form
                key="onboard-client-view"
                onSubmit={handleOnboardSubmit}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
                    <ShieldCheck size={22} className="stroke-[2]" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-3 uppercase tracking-wide">Client Onboarding Portal</h4>
                  <p className="text-xs text-outline mt-1 leading-normal">
                    Onboard a brand new restaurant/business. Once completed, your custom organisation code is activated and you will instantly boot as Manager.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">Business Gate Code</label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      placeholder="e.g. BYTE77"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-black focus:ring-1 focus:ring-slate-900 outline-none uppercase tracking-widest text-center shadow-xs"
                      value={clientOrgCode}
                      onChange={(e) => setClientOrgCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">Restaurant/Business Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. My Burger Byte"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                      value={clientBusinessName}
                      onChange={(e) => setClientBusinessName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">Owner/Manager Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arpit Tripathi"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                      value={clientOwnerName}
                      onChange={(e) => setClientOwnerName(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">Supervisor 6-Digit PIN</label>
                    <input
                      type="password"
                      required
                      maxLength={6}
                      placeholder="6 numeric digits"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-bold tracking-widest focus:ring-1 focus:ring-slate-900 outline-none"
                      value={clientPin}
                      onChange={(e) => setClientPin(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-outline tracking-wider">Owner Electronic Mail (PII secure)</label>
                  <div className="relative">
                    <Mail size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant" />
                    <input
                      type="email"
                      required
                      placeholder="owner@foodbytes.com"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none w-full cursor-text"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="black-glossy text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-99 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  <Building2 size={13} />
                  {loading ? 'Bootstrapping Restaurant...' : 'Complete Client Onboarding'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
