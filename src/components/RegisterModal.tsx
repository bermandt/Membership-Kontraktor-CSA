/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { Store, Contractor } from '../types/membership.ts';
import confetti from 'canvas-confetti';
import { HardHat, Store as StoreIcon, ShieldCheck, Check, MessageSquare, ArrowRight, X } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStoreCode?: string;
  stores: Store[];
  onRegistrationSuccess: (newContractor: Contractor) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  preselectedStoreCode,
  stores,
  onRegistrationSuccess,
}) => {
  const [storeCode, setStoreCode] = useState<string>(preselectedStoreCode || stores[0]?.store_code || '');
  const [fullName, setFullName] = useState<string>('');
  const [phoneWa, setPhoneWa] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('Renovasi Rumah & Sipil');
  const [address, setAddress] = useState<string>('');

  // OTP flow state
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [simulatedOtp, setSimulatedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const matchedStore = stores.find(s => s.store_code.toUpperCase() === storeCode.toUpperCase());

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !phoneWa.trim()) {
      setErrorMsg('Nama lengkap dan nomor WhatsApp wajib diisi.');
      return;
    }

    if (!matchedStore) {
      setErrorMsg(`Kode toko "${storeCode}" tidak ditemukan.`);
      return;
    }

    // Generate random 4 digit OTP
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setSimulatedOtp(code);
    setStep('OTP');
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (enteredOtp !== simulatedOtp) {
      setErrorMsg('Kode OTP salah! Silakan periksa kembali kode yang dikirimkan.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/register-contractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_code: storeCode,
          full_name: fullName,
          phone_wa: phoneWa,
          specialty,
          address,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mendaftar');

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      onRegistrationSuccess(json.contractor);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat registrasi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 px-1.5 rounded-lg bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
              <img
                src="/assets/aistudio/logo_1bd731b1.png"
                alt="CSA Logo"
                className="h-5 w-auto object-contain"
              />
            </div>
            <div>
              <h4 className="font-black text-base text-slate-900 dark:text-slate-100 leading-tight">
                Registrasi Member Kontraktor
              </h4>
              <div className="text-[10px] text-slate-400">Program Loyalitas Mitra CSA</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Locked Store Banner */}
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs flex items-center gap-3">
          <StoreIcon className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
              Toko Bangunan Afiliasi (Terkunci Otomatis):
            </div>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {matchedStore ? matchedStore.name : `Kode: ${storeCode}`}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Parameter URL: ?toko={storeCode}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: FORM INPUT */}
        {step === 'FORM' && (
          <form onSubmit={handleRequestOtp} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Nama Lengkap:</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">No. WhatsApp Aktif (untuk login & OTP):</label>
              <input
                type="tel"
                required
                value={phoneWa}
                onChange={e => setPhoneWa(e.target.value)}
                placeholder="081234567890"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Spesialisasi / Bidang Pekerjaan:</label>
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="Renovasi Rumah & Sipil">Renovasi Rumah & Sipil</option>
                <option value="Konstruksi Baja Ringan & Atap">Konstruksi Baja Ringan & Atap</option>
                <option value="Interior, Plafon & Gypsum">Interior, Plafon & Gypsum</option>
                <option value="Instalasi ME & Sanitasi Air">Instalasi ME & Sanitasi Air</option>
                <option value="Pengecatan & Finishing">Pengecatan & Finishing</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Alamat Domisili Proyek (Opsional):</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Kota/Kecamatan domisili kerja"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                Lanjutkan Verifikasi WhatsApp OTP <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SIMULATED WHATSAPP OTP */}
        {step === 'OTP' && (
          <div className="space-y-4 text-xs">
            {/* Simulated WhatsApp notification preview */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Simulasi Pesan WhatsApp Masuk ke {phoneWa}:
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 font-mono text-xs border border-emerald-300/50 flex items-center justify-between">
                <span>Kode OTP Verifikasi Anda: <strong className="text-emerald-600 text-sm tracking-widest">{simulatedOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setEnteredOtp(simulatedOtp)}
                  className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]"
                >
                  Salin Otomatis
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Masukkan 4 Digit Kode OTP:</label>
              <input
                type="text"
                maxLength={4}
                value={enteredOtp}
                onChange={e => setEnteredOtp(e.target.value)}
                placeholder="4 digit angka"
                className="w-full mt-1.5 p-3 text-center tracking-widest text-lg font-black font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('FORM')}
                className="px-4 py-2.5 rounded-xl text-slate-500 font-semibold"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isLoading || enteredOtp.length < 4}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {isLoading ? 'Menerbitkan Member...' : 'Verifikasi & Terbitkan Kartu'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
