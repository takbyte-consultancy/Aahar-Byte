import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Check, 
  AlertCircle, 
  ArrowLeft, 
  User, 
  Mail, 
  Key, 
  ShieldCheck, 
  UtensilsCrossed 
} from 'lucide-react';

interface OnboardingViewProps {
  onBackToLogin: () => void;
}

export default function OnboardingView({ onBackToLogin }: OnboardingViewProps) {
  const [clientOrgCode, setClientOrgCode] = useState('');
  const [clientBusinessName, setClientBusinessName] = useState('');
  const [clientOwnerName, setClientOwnerName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPin, setClientPin] = useState('');
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState('');
  const [onboardError, setOnboardError] = useState('');

  const handleOnboardSubmit = async (e: React.FormEvent) => {
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
          'Content-Type': 'application/json'
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
        setOnboardSuccess(`Restaurant '${clientBusinessName}' successfully bootstrapped! Tenant code: ${clientOrgCode.toUpperCase()}`);
      } else {
        setOnboardError(data.error || 'Failed to complete client onboarding.');
      }
    } catch (err) {
      setOnboardError('Exception occurred during client onboarding.');
    } finally {
      setOnboardLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-tr from-slate-50 via-zinc-100 to-pink-50/15 flex flex-col items-center justify-center p-4 sm:p-8 font-sans text-on-surface select-none">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-900 via-rose-500 to-amber-500 opacity-90" />

      <div className="max-w-xl w-full flex flex-col gap-6 z-10">
        
        {/* Back Link */}
        <button 
          onClick={onBackToLogin}
          className="self-start flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-white px-4.5 py-2.5 rounded-full border border-slate-200/60 shadow-xs"
        >
          <ArrowLeft size={13} />
          <span>Exit to POS Gateway</span>
        </button>

        {/* Brand Banner */}
        <div className="flex items-center gap-3.5 px-2">
          <div className="w-10 h-10 black-glossy rounded-xl flex items-center justify-center text-white font-bold shadow-md">
            <UtensilsCrossed size={18} className="text-white shrink-0" />
          </div>
          <div>
            <h1 className="font-sans font-black text-xs tracking-widest text-slate-900 uppercase">AAHAR POS GALAXY</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">SECURE INSTANT TENANT PROVISIONING</p>
          </div>
        </div>

        {/* Main interactive form card */}
        <div className="bg-white border border-outline-variant/15 rounded-[2.5rem] p-6 sm:p-10 shadow-xl flex flex-col gap-6">
          
          {/* Header block with displayed SaaS owner's status as Manager */}
          <div className="border-b border-light pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[9px] font-bold text-rose-600 font-mono bg-rose-50 border border-rose-100/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Self-Service Onboarding Console
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-2.5">
                  Register Your Restaurant
                </h2>
              </div>
              <ShieldCheck size={32} className="text-slate-900 stroke-1 shrink-0" />
            </div>
            
            {/* The manager info block - Arpit Tripathi displayed prominently */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-[10px] text-white font-black">
                AT
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-900 leading-none">
                  SaaS Owner & Manager: <span className="text-rose-600">Arpit Tripathi</span>
                </p>
                <p className="text-[9px] text-slate-500 leading-normal mt-1">
                  Arpit Tripathi is automatically displayed and configured as Manager for backup administrative support across all registered restaurants.
                </p>
              </div>
            </div>
          </div>

          {onboardSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-6 gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <Check size={32} className="stroke-[3]" />
              </div>
              <div>
                <h3 className="font-sans font-black text-lg text-slate-850">Bootstrap Complete!</h3>
                <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
                  The tenant database for <span className="font-bold text-slate-800">'{clientBusinessName}'</span> was successfully initialized.
                </p>
              </div>

              <div className="w-full bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-2 text-left font-sans">
                <div className="flex justify-between text-xs py-1 border-b border-dashed border-slate-200">
                  <span className="text-outline">Terminal Organisation Code</span>
                  <span className="font-black text-slate-900 uppercase font-mono tracking-widest">{clientOrgCode.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-dashed border-slate-200">
                  <span className="text-outline">Supervisor Email</span>
                  <span className="font-semibold text-slate-700">{clientEmail}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-outline">Supervisor Entry PIN</span>
                  <span className="font-mono font-bold text-rose-600">{clientPin}</span>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 max-w-xs">
                To start registering staff, preparing orders, and managing layout, click the button below and log in using the Organization Code and your supervisor PIN.
              </p>

              <button
                onClick={() => {
                  window.location.hash = '';
                  onBackToLogin();
                }}
                className="w-full black-glossy text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-99 cursor-pointer transition-all"
              >
                <span>Navigate to Portal Login</span>
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleOnboardSubmit} className="flex flex-col gap-4">
              
              {onboardError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-fade-in shrink-0">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{onboardError}</span>
                </div>
              )}

              {/* Each field takes exactly one full-width row */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Building2 size={11} className="text-slate-400" />
                  <span>Gate Access Code / Tenant Code</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="e.g. PIZZA88"
                  className="bg-slate-50 border border-outline-variant/20 rounded-xl py-3 px-3.5 text-xs text-on-surface font-black focus:ring-1 focus:ring-slate-900 outline-none uppercase tracking-widest text-center"
                  value={clientOrgCode}
                  onChange={(e) => setClientOrgCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                />
                <p className="text-[9px] text-zinc-400 mt-0.5">Define a shorthand code (2-8 letters) to isolate POS data.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Building2 size={11} className="text-slate-400" />
                  <span>Business Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Slice & Dice Pizzeria"
                  className="bg-slate-50 border border-outline-variant/20 rounded-xl py-3 px-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                  value={clientBusinessName}
                  onChange={(e) => setClientBusinessName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <User size={11} className="text-slate-400" />
                  <span>Owner Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michelle Arpit"
                  className="bg-slate-50 border border-outline-variant/20 rounded-xl py-3 px-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                  value={clientOwnerName}
                  onChange={(e) => setClientOwnerName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Key size={11} className="text-slate-400" />
                  <span>Supervisor 6-Digit PIN</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="6 numeric digits"
                  className="bg-slate-50 border border-outline-variant/20 rounded-xl py-3 px-3.5 text-xs text-on-surface font-bold tracking-widest focus:ring-1 focus:ring-slate-900 outline-none"
                  value={clientPin}
                  onChange={(e) => setClientPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Mail size={11} className="text-slate-400" />
                  <span>Owner Email (For login access)</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="owner@sliceanddice.com"
                  className="bg-slate-50 border border-outline-variant/20 rounded-xl py-3 px-3.5 text-xs text-on-surface font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={onboardLoading}
                className="black-glossy text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-99 transition-all cursor-pointer disabled:opacity-50 mt-3"
              >
                <span>{onboardLoading ? 'Registering New Tenant Org...' : 'Onboard Client Organization'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
