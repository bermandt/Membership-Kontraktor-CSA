/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type {
  Store,
  Contractor,
  UserAdmin,
  ProductCSA,
  CampaignPromo,
  Reward,
  Receipt,
  ReceiptItem,
  PointLedger,
  Redemption,
  ActorType,
} from './types/membership.ts';
import {
  initialStores,
  initialContractors,
  initialAdmins,
  initialProductsCSA,
  initialCampaigns,
  initialRewards,
  initialReceipts,
  initialReceiptItems,
  initialPointLedgers,
  initialRedemptions,
} from './data/initialData.ts';
import { ContractorPortal } from './components/ContractorPortal.tsx';
import { StorePortal } from './components/StorePortal.tsx';
import { AdminCSA } from './components/AdminCSA.tsx';
import { UnifiedLoginPanel } from './components/UnifiedLoginPanel.tsx';
import { RegisterModal } from './components/RegisterModal.tsx';
import {
  HardHat,
  Store as StoreIcon,
  Building,
  RotateCcw,
  Smartphone,
  Monitor,
  UserPlus,
  Bell,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export default function App() {
  // Main Data States
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [contractors, setContractors] = useState<Contractor[]>(initialContractors);
  const [admins, setAdmins] = useState<UserAdmin[]>(initialAdmins);
  const [productsCSA, setProductsCSA] = useState<ProductCSA[]>(initialProductsCSA);
  const [campaigns, setCampaigns] = useState<CampaignPromo[]>(initialCampaigns);
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>(initialReceiptItems);
  const [pointLedgers, setPointLedgers] = useState<PointLedger[]>(initialPointLedgers);
  const [redemptions, setRedemptions] = useState<Redemption[]>(initialRedemptions);

  // Active Actor Mode
  const [activePortal, setActivePortal] = useState<'contractor' | 'store' | 'admin'>('contractor');

  // Active Personas
  const [currentContractor, setCurrentContractor] = useState<Contractor>(initialContractors[0]);
  const [currentStore, setCurrentStore] = useState<Store>(initialStores[0]);
  const [currentAdmin, setCurrentAdmin] = useState<UserAdmin>(initialAdmins[0]);

  // Unified Single User Session for Contractor, Store, and Admin
  const [userSession, setUserSession] = useState<{
    actorType: ActorType;
    user: Contractor | Store | UserAdmin;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('csa_unified_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Mobile Device Simulation Toggle for Contractor
  const [simulateMobileFrame, setSimulateMobileFrame] = useState<boolean>(false);

  // Registration Modal State
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);
  const [registerStoreCode, setRegisterStoreCode] = useState<string>('TOKO-MAKMUR-01');

  // Status Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUnifiedLoginSuccess = (actorType: ActorType, user: Contractor | Store | UserAdmin) => {
    const session = { actorType, user };
    setUserSession(session);
    try {
      localStorage.setItem('csa_unified_session', JSON.stringify(session));
    } catch {}

    if (actorType === 'CONTRACTOR') {
      setCurrentContractor(user as Contractor);
      setActivePortal('contractor');
    } else if (actorType === 'STORE') {
      setCurrentStore(user as Store);
      setActivePortal('store');
    } else if (actorType === 'ADMIN') {
      setCurrentAdmin(user as UserAdmin);
      setActivePortal('admin');
    }

    const displayName = 'full_name' in user ? user.full_name : user.name;
    showToast(`Login berhasil! Selamat datang, ${displayName}.`);
  };

  const handleLogout = () => {
    setUserSession(null);
    try {
      localStorage.removeItem('csa_unified_session');
    } catch {}
    setActivePortal('contractor');
    showToast('Anda telah keluar dari akun.');
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    if (!window.confirm('Reset semua data demo ke kondisi awal?')) return;
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        setUserSession(null);
        try {
          localStorage.removeItem('csa_unified_session');
        } catch {}
        await fetchState();
        showToast('Data demo berhasil direset ke kondisi awal.');
      }
    } catch {
      showToast('Gagal reset data.');
    }
  };

  // Open register with specific store
  const handleOpenRegisterWithStore = (storeCode: string) => {
    setRegisterStoreCode(storeCode);
    setRegisterModalOpen(true);
  };

  // When new contractor is registered
  const handleRegistrationSuccess = (newContractor: Contractor) => {
    setCurrentContractor(newContractor);
    const session = { actorType: 'CONTRACTOR' as ActorType, user: newContractor };
    setUserSession(session);
    try {
      localStorage.setItem('csa_unified_session', JSON.stringify(session));
    } catch {}
    setActivePortal('contractor');
    fetchState();
    showToast(`Pendaftaran sukses! Selamat datang ${newContractor.full_name}.`);
  };

  // Fetch initial / synced state from backend
  const fetchState = async () => {
    try {
      const res = await fetch('/api/initial-state');
      if (res.ok) {
        const data = await res.json();
        if (data.stores) setStores(data.stores);
        if (data.contractors) {
          setContractors(data.contractors);
          // Keep current contractor updated
          const updated = data.contractors.find((c: Contractor) => c.id === currentContractor.id);
          if (updated) setCurrentContractor(updated);
        }
        if (data.admins) setAdmins(data.admins);
        if (data.productsCSA) setProductsCSA(data.productsCSA);
        if (data.campaigns) setCampaigns(data.campaigns);
        if (data.rewards) setRewards(data.rewards);
        if (data.receipts) setReceipts(data.receipts);
        if (data.receiptItems) setReceiptItems(data.receiptItems);
        if (data.pointLedgers) setPointLedgers(data.pointLedgers);
        if (data.redemptions) setRedemptions(data.redemptions);
      }
    } catch {
      // Offline / fallback to local state
    }
  };

  useEffect(() => {
    fetchState();

    // Check URL search parameters (e.g., ?toko=TOKO-MAKMUR-01)
    const urlParams = new URLSearchParams(window.location.search);
    const tokoParam = urlParams.get('toko');
    if (tokoParam) {
      setRegisterStoreCode(tokoParam.toUpperCase());
      setRegisterModalOpen(true);
    }
  }, []);

  // Pending moderation count for badge
  const pendingReceiptsCount = receipts.filter(r => r.status === 'PENDING').length;

  const currentUserName = userSession
    ? ('full_name' in userSession.user ? userSession.user.full_name : userSession.user.name)
    : '';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="h-10 px-2.5 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                <img
                  src="/assets/aistudio/logo_1bd731b1.png"
                  alt="CSA Logo"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                  Membership Kontraktor
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Satu Akses: Kontraktor • Toko Bangunan • Admin CSA
                </div>
              </div>
            </div>

            {/* Navigation / Actor Mode Bar */}
            {userSession ? (
              <div className="flex items-center gap-2">
                <nav className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
                  {/* ADMIN CSA */}
                  {userSession.actorType === 'ADMIN' ? (
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-900 dark:text-slate-100 font-bold">
                      <Building className="w-4 h-4" />
                      <span>Admin CSA</span>
                      {pendingReceiptsCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
                      )}
                    </div>
                  ) : userSession.actorType === 'CONTRACTOR' ? (
                    /* KONTRAKTOR */
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 text-amber-600 dark:text-amber-400 font-bold">
                      <HardHat className="w-4 h-4" />
                      <span>Portal Member Kontraktor</span>
                    </div>
                  ) : (
                    /* TOKO BANGUNAN */
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 text-blue-600 dark:text-blue-400 font-bold">
                      <StoreIcon className="w-4 h-4" />
                      <span>Portal Toko Bangunan</span>
                    </div>
                  )}
                </nav>

                {/* Logged in User Badge & Logout */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <div className="hidden xl:block text-right">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {currentUserName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {userSession.actorType}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Keluar / Ganti Akun"
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Right Utilities */}
            <div className="flex items-center gap-2">
              {userSession && activePortal === 'contractor' && (
                <button
                  onClick={() => setSimulateMobileFrame(!simulateMobileFrame)}
                  title={simulateMobileFrame ? 'Tampilan Desktop Lebar' : 'Simulasi Layar Smartphone'}
                  className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                >
                  {simulateMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  <span>{simulateMobileFrame ? 'Full Width' : 'Simulasi HP'}</span>
                </button>
              )}

              <button
                onClick={() => handleOpenRegisterWithStore('TOKO-MAKMUR-01')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Daftar Member</span>
              </button>

              <button
                onClick={handleResetDemo}
                title="Reset Data Demo"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If user is NOT logged in: Always render Single Unified Login Panel */}
        {!userSession && (
          <UnifiedLoginPanel
            contractors={contractors}
            stores={stores}
            admins={admins}
            onLoginSuccess={handleUnifiedLoginSuccess}
            onOpenRegisterModal={() => setRegisterModalOpen(true)}
          />
        )}

        {/* When user IS logged in: Render the active portal */}
        {userSession && activePortal === 'contractor' && (
          <div>
            {simulateMobileFrame ? (
              <div className="flex justify-center py-4">
                <div className="w-full max-w-md bg-slate-950 p-3 rounded-[40px] shadow-2xl border-4 border-slate-800">
                  <div className="w-32 h-5 bg-slate-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-slate-950" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-[30px] p-4 max-h-[820px] overflow-y-auto">
                    <ContractorPortal
                      contractor={currentContractor}
                      allContractors={contractors}
                      stores={stores}
                      receipts={receipts}
                      receiptItems={receiptItems}
                      rewards={rewards}
                      pointLedgers={pointLedgers}
                      productsCSA={productsCSA}
                      campaigns={campaigns}
                      onSelectContractor={setCurrentContractor}
                      onRefreshData={fetchState}
                      onOpenRegisterWithStore={handleOpenRegisterWithStore}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <ContractorPortal
                contractor={currentContractor}
                allContractors={contractors}
                stores={stores}
                receipts={receipts}
                receiptItems={receiptItems}
                rewards={rewards}
                pointLedgers={pointLedgers}
                productsCSA={productsCSA}
                campaigns={campaigns}
                onSelectContractor={setCurrentContractor}
                onRefreshData={fetchState}
                onOpenRegisterWithStore={handleOpenRegisterWithStore}
              />
            )}
          </div>
        )}

        {/* STORE PARTNER PORTAL */}
        {userSession && activePortal === 'store' && (
          <StorePortal
            store={currentStore}
            allStores={stores}
            contractors={contractors}
            receipts={receipts}
            productsCSA={productsCSA}
            onSelectStore={setCurrentStore}
            onRefreshData={fetchState}
            onOpenContractorRegisterModal={handleOpenRegisterWithStore}
          />
        )}

        {/* ADMIN CSA BACKOFFICE */}
        {userSession && userSession.actorType === 'ADMIN' && activePortal === 'admin' && (
          <AdminCSA
            admin={currentAdmin}
            stores={stores}
            contractors={contractors}
            receipts={receipts}
            receiptItems={receiptItems}
            productsCSA={productsCSA}
            campaigns={campaigns}
            rewards={rewards}
            redemptions={redemptions}
            pointLedgers={pointLedgers}
            onRefreshData={fetchState}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* REGISTRATION MODAL WITH LOCKED STORE REFERRAL */}
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        preselectedStoreCode={registerStoreCode}
        stores={stores}
        onRegistrationSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
