/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { Contractor, Store, UserAdmin, ActorType } from '../types/membership.ts';
import {
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  HardHat,
  Store as StoreIcon,
  Building,
  KeyRound,
  RotateCcw,
  UserPlus
} from 'lucide-react';

interface UnifiedLoginPanelProps {
  contractors: Contractor[];
  stores: Store[];
  admins: UserAdmin[];
  onLoginSuccess: (actorType: ActorType, user: Contractor | Store | UserAdmin) => void;
  onOpenRegisterModal: () => void;
}

export const UnifiedLoginPanel: React.FC<UnifiedLoginPanelProps> = ({
  contractors,
  stores,
  admins,
  onLoginSuccess,
  onOpenRegisterModal,
}) => {
  const [phoneWa, setPhoneWa] = useState<string>('081234567890'); // Default to Budi Santoso
  const [otp, setOtp] = useState<string>('');
  const [simulatedOtp, setSimulatedOtp] = useState<string>('');
  const [step, setStep] = useState<'INPUT_PHONE' | 'INPUT_OTP'>('INPUT_PHONE');
  const [detectedUser, setDetectedUser] = useState<{
    actorType: ActorType;
    name: string;
    roleDesc: string;
    user: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Quick preset accounts for seamless testing
  const demoPresets = [
    {
      actor: 'Kontraktor',
      icon: HardHat,
      color: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      name: 'Budi Santoso',
      phone: '081234567890',
      desc: 'Member Gold Kontraktor',
    },
    {
      actor: 'Toko Bangunan',
      icon: StoreIcon,
      color: 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300',
      name: 'TB Makmur Jaya Abadi',
      phone: '081298765432',
      desc: 'Mitra Toko Bangunan',
    },
    {
      actor: 'Admin CSA',
      icon: Building,
      color: 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
      name: 'Faisal Siregar',
      phone: '081122334455',
      desc: 'Super Admin CSA',
    },
  ];

  const handleSelectPreset = (phone: string) => {
    setPhoneWa(phone);
    setStep('INPUT_PHONE');
    setOtp('');
    setSimulatedOtp('');
    setErrorMsg('');
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phoneWa.trim()) {
      setErrorMsg('Silakan masukkan nomor WhatsApp aktif Anda.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_wa: phoneWa }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Nomor WhatsApp belum terdaftar');
      }

      setDetectedUser({
        actorType: json.actorType,
        name: json.userName,
        roleDesc: json.userRoleOrTier,
        user: json.user,
      });

      setSimulatedOtp(json.otp || '1234');
      setStep('INPUT_OTP');
    } catch (err: any) {
      setErrorMsg(err.message || 'Nomor WhatsApp tidak terdaftar di sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp.trim()) {
      setErrorMsg('Silakan masukkan 4 digit kode OTP WhatsApp.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_wa: phoneWa, otp }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Kode OTP salah');
      }

      onLoginSuccess(json.actorType, json.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Kode OTP tidak sesuai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofillOtp = () => {
    setOtp(simulatedOtp || '1234');
    setErrorMsg('');
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Branding Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white text-center border-b border-slate-800">
          <div className="inline-flex items-center justify-center h-14 px-4 rounded-2xl bg-white shadow-lg mb-3">
            <img
              src="/assets/aistudio/logo_1bd731b1.png"
              alt="CSA Logo"
              className="h-9 w-auto object-contain"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Portal Membership CSA
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto mt-1">
            Satu akses masuk praktis dengan No. WhatsApp & OTP untuk Kontraktor, Toko Bangunan, dan Admin CSA.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Quick Preset Selector */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Pilih Akun Demo (Akses Instan):
              </span>
              <span className="text-[11px] text-slate-400">Klik untuk isi No. WA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {demoPresets.map((preset, idx) => {
                const Icon = preset.icon;
                const isSelected = phoneWa.replace(/\D/g, '') === preset.phone.replace(/\D/g, '');
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset.phone)}
                    className={`text-left p-3 rounded-2xl border text-xs transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                      <Icon className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate">{preset.actor}</span>
                    </div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300 truncate mt-1 text-[11px]">
                      {preset.name}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {preset.phone}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* STEP 1: INPUT NO WHATSAPP */}
          {step === 'INPUT_PHONE' && (
            <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Phone className="w-4 h-4 text-emerald-500" /> No. WhatsApp Aktif:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phoneWa}
                    onChange={e => setPhoneWa(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full p-3.5 pl-11 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm tracking-wide"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold font-mono text-xs">
                    +62
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem akan otomatis mendeteksi apakah Anda terdaftar sebagai Kontraktor, Toko Bangunan, atau Admin CSA.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memeriksa Nomor WhatsApp...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" /> Kirim Kode OTP WhatsApp <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: INPUT OTP */}
          {step === 'INPUT_OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              {/* Detected User Identification Card */}
              {detectedUser && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 font-bold shrink-0">
                      {detectedUser.actorType === 'CONTRACTOR' ? (
                        <HardHat className="w-5 h-5" />
                      ) : detectedUser.actorType === 'STORE' ? (
                        <StoreIcon className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Building className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Pengguna Terdeteksi:
                      </div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {detectedUser.name}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold font-mono">
                        {detectedUser.roleDesc}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('INPUT_PHONE')}
                    className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" /> Ganti No
                  </button>
                </div>
              )}

              {/* Simulated WhatsApp Notification Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" /> Pesan WhatsApp Masuk ke {phoneWa}:
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono">Baru saja</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300/50 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-slate-500 text-[11px]">Kode OTP Anda:</span>
                    <div className="text-xl font-black text-emerald-600 tracking-widest mt-0.5">
                      {simulatedOtp}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutofillOtp}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Salin & Isi Otomatis
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <KeyRound className="w-4 h-4 text-amber-500" /> Masukkan 4 Digit Kode OTP:
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="• • • •"
                  className="w-full p-3.5 text-center tracking-[0.5em] text-2xl font-black font-mono rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('INPUT_PHONE')}
                  className="px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otp.length < 4}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" /> Verifikasi & Masuk Portal
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Registration Referral Prompt */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs space-y-2">
            <span className="text-slate-500">Belum memiliki akun Member Kontraktor?</span>
            <div>
              <button
                type="button"
                onClick={onOpenRegisterModal}
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Daftar Sekarang via Toko Bangunan Mitra (+50 Poin Bonus)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
