/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSession, UserRole } from '../types';
import { Lock, ShieldAlert, Key, Check, AlertCircle, X, ChefHat, Settings, User, Mail, UserPlus, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AccessLockedViewProps {
  requiredRoles: UserRole[];
  currentRole: UserRole;
  users: (UserSession & { status?: string; email?: string })[];
  onAuthenticateSuccess: (user: UserSession) => void;
  sectionName: string;
  onRegisterUser?: (userData: { name: string; username: string; email: string; role: UserRole; pin: string }) => Promise<{ success: boolean; error?: string }>;
}

export default function AccessLockedView({
  requiredRoles,
  currentRole,
  users = [],
  onAuthenticateSuccess,
  sectionName,
  onRegisterUser
}: AccessLockedViewProps) {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Form states for signup
  const [regName, setRegName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('Waitstaff');
  const [regPin, setRegPin] = useState<string>('');
  const [regError, setRegError] = useState<string>('');
  const [regSuccess, setRegSuccess] = useState<string>('');
  const [regLoading, setRegLoading] = useState<boolean>(false);

  // Filter out any pending users from quick switch list so only approved users can quick switch, 
  // but we still display them? Or we block them.
  const approvedUsers = users.filter(u => !u.status || u.status === 'Approved');

  // Auto clear error when typing
  useEffect(() => {
    if (pin.length > 0) {
      setErrorMsg('');
    }
  }, [pin]);

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

  const handleVerifyPIN = (enteredPin: string) => {
    const matchedUser = users.find(u => u.pin === enteredPin);
    if (matchedUser) {
      if (matchedUser.status === 'Pending') {
        setErrorMsg(`Operator "${matchedUser.name}" has pending approval status from admin.`);
        setPin('');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      if (requiredRoles.includes(matchedUser.role)) {
        setSuccessMsg(`Welcome, ${matchedUser.name}! Identity verified.`);
        setTimeout(() => {
          onAuthenticateSuccess(matchedUser);
        }, 1200);
      } else {
        setErrorMsg(`Verified ${matchedUser.name} (${matchedUser.role}), but this section requires: ${requiredRoles.join(' or ')}.`);
        setPin('');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } else {
      setErrorMsg('Incorrect master security PIN. Access denied.');
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  // Autoverify when 6 digits are input
  useEffect(() => {
    if (pin.length === 6) {
      handleVerifyPIN(pin);
    }
  }, [pin]);

  const handleQuickSwitch = (user: UserSession) => {
    setPin(user.pin); // Automatically fill and verify
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPin.trim()) {
      setRegError('All registration fields are required.');
      return;
    }

    if (regPin.trim().length !== 6 || isNaN(Number(regPin))) {
      setRegError('Desired PIN must be exactly 6 numerical digits.');
      return;
    }

    setRegLoading(true);
    try {
      if (onRegisterUser) {
        const response = await onRegisterUser({
          name: regName,
          username: regUsername.toLowerCase().trim(),
          email: regEmail.trim(),
          role: regRole,
          pin: regPin
        });

        if (response.success) {
          setRegSuccess('Registration Submitted! Wait for Manager activation / email confirmation to unlock.');
          // Reset fields
          setRegName('');
          setRegUsername('');
          setRegEmail('');
          setRegPin('');
          setTimeout(() => {
            setIsRegistering(false);
            setRegSuccess('');
          }, 4500);
        } else {
          setRegError(response.error || 'Failed to submit registration.');
        }
      } else {
        setRegError('Auth registration api service is currently offline.');
      }
    } catch (err) {
      setRegError('Server exception occurred in registration.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-100/50 overflow-y-auto w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] border border-outline-variant/15 apple-shadow overflow-hidden flex flex-col shadow-xl"
      >
        <AnimatePresence mode="wait">
          {!isRegistering ? (
            <motion.div
              key="auth-login"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Banner header explaining restriction */}
              <div className="black-glossy p-6 text-center flex flex-col items-center gap-3 shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white relative">
                  <Lock size={22} className="stroke-2 animate-pulse" />
                  <ShieldAlert size={14} className="absolute -bottom-1 -right-1 text-rose-450 fill-rose-50" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wide text-white font-sans uppercase">Access Restricted</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    "{sectionName}" requires <span className="font-extrabold text-white">{requiredRoles.join(' or ')}</span> authorization.
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col gap-6">
                {/* Display entered PIN digits */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-outline tracking-wider">Operator Entry Code</span>
                  
                  <motion.div 
                    animate={{ x: shake ? [-10, 10, -10, 10, 0] : 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center gap-3.5 mt-1"
                  >
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <div 
                        key={idx} 
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                          pin.length > idx 
                            ? 'bg-zinc-900 border-zinc-900 scale-110' 
                            : 'bg-transparent border-outline-variant/40'
                        }`}
                      />
                    ))}
                  </motion.div>

                  {/* Error or Success Info message feedback */}
                  <div className="h-8 flex items-center justify-center px-4 text-center mt-2 w-full">
                    <AnimatePresence mode="wait">
                      {errorMsg && (
                        <motion.p 
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="text-xs font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 max-w-full truncate"
                        >
                          <AlertCircle size={13} className="shrink-0" />
                          <span className="truncate">{errorMsg}</span>
                        </motion.p>
                      )}
                      {successMsg && (
                        <motion.p 
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="text-xs font-black text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100"
                        >
                          <Check size={13} />
                          <span>{successMsg}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Core Interactive Pad */}
                <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto w-full">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeyPress(num)}
                      className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-on-surface font-semibold text-lg transition-all cursor-pointer border border-outline-variant/10 shadow-xs flex items-center justify-center font-sans focus:outline-none"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-14 rounded-2xl hover:bg-slate-50 text-outline text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center focus:outline-none"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeyPress('0')}
                    className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-on-surface font-semibold text-lg transition-all cursor-pointer border border-outline-variant/10 shadow-xs flex items-center justify-center font-sans focus:outline-none"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-14 rounded-2xl hover:bg-slate-50 text-outline transition-all cursor-pointer flex items-center justify-center active:scale-90 focus:outline-none"
                    title="Delete last digit"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Quick Register Prompt Option */}
                <div className="border-t border-solid border-outline-variant/10 pt-4 flex flex-col gap-2">
                  <button
                    onClick={() => setIsRegistering(true)}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl border border-slate-950 transition-all cursor-pointer flex items-center justify-center gap-2 font-sans active:scale-[0.99] focus:outline-none"
                  >
                    <UserPlus size={14} />
                    <span>Join POS Staff Registration</span>
                  </button>
                </div>

                {/* Quick Demo Assist Bypasses */}
                {approvedUsers.length > 0 && (
                  <div className="border-t border-solid border-outline-variant/10 pt-4 flex flex-col gap-2 max-h-[170px] overflow-y-auto no-scrollbar">
                    <span className="text-[9px] font-black uppercase text-outline tracking-wider text-center">Fast Demo Operator Switch</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {approvedUsers.map(u => {
                        const isAuthorized = requiredRoles.includes(u.role);
                        return (
                          <button
                            key={u._docId || u.id || u.username}
                            onClick={() => handleQuickSwitch(u)}
                            className="flex justify-between items-center p-2.5 bg-slate-50/50 hover:bg-slate-50 active:scale-99 transition-all rounded-xl border border-outline-variant/10 text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-outline-variant/10 overflow-hidden flex items-center justify-center shrink-0">
                                {u.role === 'Manager' ? (
                                  <Settings size={13} className="text-purple-600 shrink-0" />
                                ) : u.role === 'Kitchen' ? (
                                  <ChefHat size={13} className="text-orange-500 shrink-0" />
                                ) : (
                                  <User size={13} className="text-blue-500 shrink-0" />
                                )}
                              </div>
                              <div className="leading-tight min-w-0">
                                <p className="text-[11px] font-bold text-on-surface flex items-center gap-1 truncate">
                                  <span className="truncate">{u.name}</span>
                                  <span className={`${
                                    u.role === 'Manager' 
                                      ? 'bg-purple-50 text-purple-700' 
                                      : u.role === 'Kitchen'
                                        ? 'bg-orange-50 text-orange-700'
                                        : 'bg-blue-50 text-blue-700'
                                  } text-[7px] font-black uppercase tracking-wider px-1 py-0.1 rounded shrink-0`}>
                                    {u.role}
                                  </span>
                                </p>
                                <p className="text-[9px] text-outline mt-0.5 font-label-mono">PIN: {u.pin}</p>
                              </div>
                            </div>
                            {isAuthorized ? (
                              <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase shrink-0">
                                Enter
                              </span>
                            ) : (
                              <span className="text-[8px] font-extrabold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase shrink-0">
                                Locked
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-signup"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-6 bg-slate-950 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <UserPlus size={18} className="text-white shrink-0" />
                  <h3 className="font-sans font-black text-sm uppercase tracking-wider">Register POS staff</h3>
                </div>
                <button
                  onClick={() => setIsRegistering(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white shrink-0 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSignupSubmit} className="p-6 md:p-8 flex flex-col gap-4">
                <p className="text-xs text-outline leading-relaxed">
                  Join the Aahar terminal team. Your request requires Manager confirmation / email verification before the PIN can be unlocked.
                </p>

                {regError && (
                  <div className="text-xs font-bold text-rose-600 flex items-center gap-1.5 bg-rose-50 p-3 rounded-xl border border-rose-100">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-start gap-1.5 leading-normal">
                    <Check size={14} className="shrink-0 mt-0.5" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-outline tracking-wider">Full Staff Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Mishra"
                    className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-secondary/25 outline-none"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">Desired Login Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rahul.m"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-secondary/25 outline-none"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-outline tracking-wider">Desired Security PIN</label>
                    <input
                      type="password"
                      required
                      maxLength={6}
                      placeholder="6 Digits"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-xs text-on-surface font-bold tracking-widest focus:ring-1 focus:ring-secondary/25 outline-none"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-outline tracking-wider">Official Email Address</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant" />
                    <input
                      type="email"
                      required
                      placeholder="rahul@restaurant.com"
                      className="bg-slate-50 border border-outline-variant/20 rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-secondary/25 outline-none w-full"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-outline tracking-wider">Requested Staff Role</label>
                  <div className="grid grid-cols-3 gap-2.5 mt-0.5">
                    {(['Waitstaff', 'Kitchen', 'Manager'] as UserRole[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegRole(r)}
                        className={`py-2 text-[10px] font-bold tracking-wider rounded-xl border text-center uppercase cursor-pointer transition-colors ${
                          regRole === r
                            ? 'bg-slate-900 border-slate-900 text-white font-extrabold shadow-sm'
                            : 'bg-white border-outline-variant/15 text-outline-variant hover:border-on-surface/40 hover:text-on-surface'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2 shrink-0">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="black-glossy brightness-95 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-md hover:scale-[1.01] active:scale-99 transition-all cursor-pointer disabled:opacity-45"
                  >
                    {regLoading ? 'Submitting request...' : 'Submit Sign-up Request'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="bg-slate-150 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wide text-center cursor-pointer active:scale-99 transition-colors"
                  >
                    Return to login pad
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
