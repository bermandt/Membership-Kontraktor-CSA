/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type {
  Store,
  Contractor,
  Receipt,
  ReceiptItem,
  ProductCSA,
  CampaignPromo,
  Reward,
  Redemption,
  PointLedger,
  UserAdmin,
} from '../types/membership.ts';
import { formatRupiah, formatNumber, formatDateIndo, formatDateTimeIndo } from '../utils/formatters.ts';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  Eye,
  FileCode,
  Tag,
  Building,
  Award,
  BarChart3,
  Sliders,
  Gift,
  Truck,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  LogOut,
} from 'lucide-react';

interface AdminCSAProps {
  admin: UserAdmin;
  stores: Store[];
  contractors: Contractor[];
  receipts: Receipt[];
  receiptItems: ReceiptItem[];
  productsCSA: ProductCSA[];
  campaigns: CampaignPromo[];
  rewards: Reward[];
  redemptions: Redemption[];
  pointLedgers: PointLedger[];
  onRefreshData: () => Promise<void>;
  onLogout?: () => void;
}

export const AdminCSA: React.FC<AdminCSAProps> = ({
  admin,
  stores,
  contractors,
  receipts,
  receiptItems,
  productsCSA,
  campaigns,
  rewards,
  redemptions,
  pointLedgers,
  onRefreshData,
  onLogout,
}) => {
  const [subTab, setSubTab] = useState<'moderation' | 'redemptions' | 'rules' | 'analytics'>('moderation');

  // Moderation state
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptItemsEditing, setReceiptItemsEditing] = useState<ReceiptItem[]>([]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('Nota buram atau tidak terbaca jelas');

  // Fulfillment state
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState<string>('');

  // New Store / Product / Campaign Modal states
  const [newStoreModal, setNewStoreModal] = useState<boolean>(false);
  const [newStoreName, setNewStoreName] = useState<string>('');
  const [newStoreCode, setNewStoreCode] = useState<string>('');
  const [newStoreOwner, setNewStoreOwner] = useState<string>('');
  const [newStorePhone, setNewStorePhone] = useState<string>('');
  const [newStoreAddress, setNewStoreAddress] = useState<string>('');

  const [newProductModal, setNewProductModal] = useState<boolean>(false);
  const [newProductSku, setNewProductSku] = useState<string>('');
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductCategory, setNewProductCategory] = useState<string>('Pelapis Anti Bocor');
  const [newProductKeywords, setNewProductKeywords] = useState<string>('');

  // Pending receipts queue
  const pendingReceipts = receipts.filter(r => r.status === 'PENDING');
  const allReceiptsSorted = [...receipts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Open moderation inspector
  const handleOpenModeration = (r: Receipt) => {
    setSelectedReceipt(r);
    // Find items belonging to this receipt
    const items = receiptItems.filter(item => item.receipt_id === r.id);
    setReceiptItemsEditing(JSON.parse(JSON.stringify(items)));
  };

  // Toggle item eligibility in verification modal
  const handleToggleEligibility = (idx: number) => {
    const next = [...receiptItemsEditing];
    next[idx].is_eligible = !next[idx].is_eligible;
    setReceiptItemsEditing(next);
  };

  // Associate product SKU with item in verification modal
  const handleSelectProduct = (idx: number, productId: string) => {
    const next = [...receiptItemsEditing];
    const prod = productsCSA.find(p => p.id === productId);
    next[idx].product_id = productId || undefined;
    next[idx].is_eligible = Boolean(prod);
    setReceiptItemsEditing(next);
  };

  // Calculate live preview points in verification inspector
  const currentEligibleAmount = receiptItemsEditing
    .filter(it => it.is_eligible)
    .reduce((sum, it) => sum + Number(it.subtotal || 0), 0);

  const previewPoints = Math.floor(currentEligibleAmount / 100000) * 10;

  // Approve Receipt
  const handleApproveReceipt = async () => {
    if (!selectedReceipt) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/receipts/${selectedReceipt.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          verified_by: admin.id,
          updated_items: receiptItemsEditing,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyetujui struk');

      alert(json.message);
      setSelectedReceipt(null);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses persetujuan');
    } finally {
      setIsVerifying(false);
    }
  };

  // Reject Receipt
  const handleRejectReceipt = async () => {
    if (!selectedReceipt) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/receipts/${selectedReceipt.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejection_reason: rejectionReason,
          verified_by: admin.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menolak struk');

      alert(json.message);
      setShowRejectModal(false);
      setSelectedReceipt(null);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses penolakan');
    } finally {
      setIsVerifying(false);
    }
  };

  // Update Redemption Status
  const handleUpdateRedemption = async (redemptionId: string, nextStatus: any) => {
    try {
      const res = await fetch(`/api/redemptions/${redemptionId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          tracking_number: trackingNumberInput || undefined,
          processed_by: admin.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal update status penukaran');

      setSelectedRedemption(null);
      setTrackingNumberInput('');
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  // Create New Store
  const handleCreateStore = async () => {
    if (!newStoreName || !newStoreCode) return;
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStoreName,
          store_code: newStoreCode,
          owner_name: newStoreOwner || 'Pemilik Toko',
          phone_wa: newStorePhone || '08123456789',
          address: newStoreAddress || 'Jl. Raya Mitra Bangunan No. 10',
          city: 'Bekasi',
          province: 'Jawa Barat',
        }),
      });
      if (!res.ok) throw new Error('Gagal menambah toko');
      setNewStoreModal(false);
      setNewStoreName('');
      setNewStoreCode('');
      await onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create New CSA Product
  const handleCreateProduct = async () => {
    if (!newProductName || !newProductSku) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku_code: newProductSku,
          product_name: newProductName,
          category: newProductCategory,
          brand: 'CSA Brand',
          ocr_keywords: newProductKeywords.split(',').map(s => s.trim()),
          base_point_multiplier: 1.0,
          unit_price_estimate: 150000,
        }),
      });
      if (!res.ok) throw new Error('Gagal menambah produk');
      setNewProductModal(false);
      setNewProductName('');
      setNewProductSku('');
      setNewProductKeywords('');
      await onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Analytics Aggregates
  const totalContractorsCount = contractors.length;
  const totalApprovedReceipts = receipts.filter(r => r.status === 'APPROVED');
  const totalSellOutRevenue = totalApprovedReceipts.reduce((sum, r) => sum + r.total_gross_amount, 0);
  const totalEligibleCSASales = totalApprovedReceipts.reduce((sum, r) => sum + r.total_eligible_amount, 0);
  const totalPointsDistributed = pointLedgers
    .filter(l => l.amount > 0)
    .reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-amber-400 text-xs font-semibold mb-2">
            <span className="h-5 px-1.5 rounded bg-white flex items-center justify-center">
              <img
                src="/assets/aistudio/logo_1bd731b1.png"
                alt="CSA Logo"
                className="h-3.5 w-auto object-contain"
              />
            </span>
            <span>Backoffice Principal CSA</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Pusat Kendali Membership Kontraktor</h2>
          <p className="text-slate-400 text-xs mt-1">
            Login sebagai: <strong className="text-slate-200">{admin.name}</strong> • Role: <span className="font-mono text-amber-400">{admin.role}</span>
          </p>
        </div>

        {/* Global Stats Snapshot & Logout */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="text-slate-400">Antrean Moderasi</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              {pendingReceipts.length} Struk
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="text-slate-400">Total Member</div>
            <div className="text-lg font-black text-slate-100 font-mono mt-0.5">
              {totalContractorsCount} Kontraktor
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Keluar dari sesi Admin CSA"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pb-1 text-xs font-bold uppercase tracking-wider overflow-x-auto">
        <button
          onClick={() => setSubTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            subTab === 'moderation'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Verifikasi Struk & Anti-Fraud
          {pendingReceipts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black">
              {pendingReceipts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('redemptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            subTab === 'redemptions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Gift className="w-4 h-4 text-purple-400" />
          Fulfillment Hadiah ({redemptions.filter(r => r.status === 'REQUESTED').length})
        </button>

        <button
          onClick={() => setSubTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            subTab === 'rules'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-400" />
          Master Data & Rule Engine
        </button>

        <button
          onClick={() => setSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            subTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Business Intelligence (Sell-In vs Sell-Out)
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: VERIFIKASI STRUK & MODERASI ANTI-FRAUD */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'moderation' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                Antrean Struk Belanja Kontraktor
              </h3>
              <p className="text-xs text-slate-500">
                Verifikasi keabsahan foto struk, pastikan kesesuaian produk CSA, dan cegah duplikasi atau kecurangan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">
                Otomatisasi Hash & Composite Check Aktif
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Waktu Upload</th>
                  <th className="py-2.5 px-3">Kontraktor</th>
                  <th className="py-2.5 px-3">Toko Belanja</th>
                  <th className="py-2.5 px-3">No. Nota & Tgl</th>
                  <th className="py-2.5 px-3 text-right">Total Nota</th>
                  <th className="py-2.5 px-3 text-center">Status Toko</th>
                  <th className="py-2.5 px-3 text-center">Status Moderasi</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allReceiptsSorted.map(rcp => {
                  const contractor = contractors.find(c => c.id === rcp.contractor_id);
                  const store = stores.find(s => s.id === rcp.store_id);

                  return (
                    <tr key={rcp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap">
                        {formatDateTimeIndo(rcp.created_at)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{contractor?.full_name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{contractor?.member_code}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{store?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{store?.store_code}</div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{rcp.receipt_number}</div>
                        <div className="text-[10px] text-slate-500">{rcp.receipt_date}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {formatRupiah(rcp.total_gross_amount)}
                        <div className="text-[10px] text-emerald-600 font-normal">
                          CSA: {formatRupiah(rcp.total_eligible_amount)}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {rcp.store_confirmed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            ✓ Toko Valid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            Belum Dikonfirmasi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {rcp.status === 'APPROVED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Disetujui (+{rcp.points_earned} Pts)
                          </span>
                        ) : rcp.status === 'REJECTED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Menunggu Review
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenModeration(rcp)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          {rcp.status === 'PENDING' ? 'Verifikasi' : 'Detail'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: FULFILLMENT PENUKARAN HADIAH (REDEMPTIONS) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'redemptions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                Fulfillment Permintaan Penukaran Poin
              </h3>
              <p className="text-xs text-slate-500">
                Klaim saldo e-wallet, voucher belanja, dan pengiriman barang fisik ke alamat kontraktor.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Kontraktor</th>
                  <th className="py-2.5 px-3">Hadiah</th>
                  <th className="py-2.5 px-3 text-center">Poin Dipakai</th>
                  <th className="py-2.5 px-3">Tujuan Pengiriman / E-Wallet</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {redemptions.map(rdm => {
                  const contractor = contractors.find(c => c.id === rdm.contractor_id);
                  const reward = rewards.find(r => r.id === rdm.reward_id);

                  return (
                    <tr key={rdm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap">
                        {formatDateTimeIndo(rdm.created_at)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{contractor?.full_name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{contractor?.phone_wa}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{reward?.name}</div>
                        <div className="text-[10px] text-slate-400">{reward?.category}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                        {rdm.points_used} Pts
                      </td>
                      <td className="py-3 px-3">
                        {rdm.delivery_info?.type === 'E-WALLET' ? (
                          <div>
                            <span className="font-bold text-blue-600">{rdm.delivery_info.target_wallet}</span>: {rdm.delivery_info.target_account_number}
                          </div>
                        ) : (
                          <div className="max-w-xs truncate" title={rdm.delivery_info?.delivery_address}>
                            {rdm.delivery_info?.delivery_address}
                          </div>
                        )}
                        {rdm.tracking_number && (
                          <div className="text-[10px] font-mono text-emerald-600 font-bold mt-0.5">
                            Ref/Resi: {rdm.tracking_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rdm.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : rdm.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rdm.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center space-x-1">
                        {rdm.status === 'REQUESTED' && (
                          <button
                            onClick={() => handleUpdateRedemption(rdm.id, 'SHIPPED')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                          >
                            Proses Kirim / Transfer
                          </button>
                        )}
                        {rdm.status === 'SHIPPED' && (
                          <button
                            onClick={() => handleUpdateRedemption(rdm.id, 'COMPLETED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                          >
                            Tandai Selesai
                          </button>
                        )}
                        {rdm.status === 'COMPLETED' && (
                          <span className="text-slate-400 text-xs">✓ Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: MASTER DATA & RULE ENGINE */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'rules' && (
        <div className="space-y-6">
          {/* Section: Aturan Promo & Konversi Poin CSA (campaigns_promo) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Rule Engine: Skema Konversi Poin & Promo Kontraktor
                </h3>
                <p className="text-xs text-slate-500">
                  Aturan dinamis yang digunakan oleh sistem untuk menghitung poin dari transaksi nota belanja.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {campaigns.map(camp => (
                <div
                  key={camp.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                      {camp.rule_type}
                    </span>
                    <span className="text-emerald-600 font-bold text-[10px]">● AKTIF</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{camp.title}</h4>
                  <div className="text-slate-600 dark:text-slate-300 space-y-1">
                    <div>Min. Belanja: <strong>{formatRupiah(camp.min_transaction_amount)}</strong></div>
                    <div>
                      Konversi: Setiap <strong>{formatRupiah(camp.conversion_rate_amount)}</strong> = <strong>{camp.points_rewarded} Poin</strong>
                    </div>
                    {camp.multiplier && (
                      <div className="text-amber-600 font-bold">
                        Multiplier Bonus: {camp.multiplier}x Lipat
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Master Produk CSA (products_csa) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Master Produk CSA & Kamus OCR Keywords ({productsCSA.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Katalog produk resmi CSA dengan singkatan kata kunci OCR untuk pencocokan otomatis pada nota toko.
                </p>
              </div>
              <button
                onClick={() => setNewProductModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4 text-amber-400" /> Tambah Produk CSA
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">SKU Code</th>
                    <th className="py-2 px-3">Nama Produk</th>
                    <th className="py-2 px-3">Kategori & Brand</th>
                    <th className="py-2 px-3">Kata Kunci Nota OCR (Kamus JSONB)</th>
                    <th className="py-2 px-3 text-right">Harga Patokan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productsCSA.map(prod => (
                    <tr key={prod.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {prod.sku_code}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {prod.product_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {prod.category} • <span className="font-bold text-slate-700 dark:text-slate-300">{prod.brand}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {prod.ocr_keywords.map((kw, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                              "{kw}"
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatRupiah(prod.unit_price_estimate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Master Toko Bangunan Mitra (stores) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Master Toko Bangunan Mitra ({stores.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar toko ritel terdaftar dengan kode unik referral dan integrasi ID Pelanggan ERP CSA.
                </p>
              </div>
              <button
                onClick={() => setNewStoreModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4 text-blue-400" /> Daftarkan Toko Mitra Baru
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Kode Toko</th>
                    <th className="py-2 px-3">ERP Cust ID (Sell-In)</th>
                    <th className="py-2 px-3">Nama Toko</th>
                    <th className="py-2 px-3">Pemilik / Kontak WA</th>
                    <th className="py-2 px-3">Wilayah</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stores.map(s => (
                    <tr key={s.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {s.store_code}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {s.csa_customer_id}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {s.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {s.owner_name} ({s.phone_wa})
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {s.city}, {s.province}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 4: BUSINESS INTELLIGENCE & ANALITIK (SELL-IN VS SELL-OUT) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Database Kontraktor</div>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100 mt-2">
                {totalContractorsCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Aset data strategis terverifikasi CSA</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Omzet Ritel Terdata (Sell-Out)</div>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                {formatRupiah(totalSellOutRevenue)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total belanja kontraktor di toko mitra</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Penjualan Produk CSA (Sell-Out)</div>
              <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-2 truncate">
                {formatRupiah(totalEligibleCSASales)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Nilai produk CSA yang terserap pasar</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Poin Loyalitas Beredar</div>
              <div className="text-2xl font-black font-mono text-amber-500 mt-2 truncate">
                {formatNumber(totalPointsDistributed)} Pts
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Insentif aktif untuk kontraktor</p>
            </div>
          </div>

          {/* Sell-In vs Sell-Out Comparison Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                    Keunggulan Arsitektur #2
                  </span>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Analitik Sell-In (Pembelian Toko dari CSA) vs Sell-Out (Penjualan Toko ke Kontraktor)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Membandingkan data ERP internal CSA dengan rekaman struk belanja riil di tingkat toko ritel.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Toko Bangunan Mitra</th>
                    <th className="py-2.5 px-3">ERP Customer ID</th>
                    <th className="py-2.5 px-3 text-center">Member Diakuisisi</th>
                    <th className="py-2.5 px-3 text-right">Nilai Sell-In (Toko beli ke CSA)</th>
                    <th className="py-2.5 px-3 text-right">Nilai Sell-Out (Kontraktor beli di Toko)</th>
                    <th className="py-2.5 px-3 text-center">Tingkat Penyerapan Pasar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stores.map((s, idx) => {
                    const storeReceipts = receipts.filter(r => r.store_id === s.id && r.status === 'APPROVED');
                    const sellOutAmount = storeReceipts.reduce((sum, r) => sum + r.total_eligible_amount, 0);
                    // Simulated sell-in based on ERP
                    const simulatedSellIn = sellOutAmount * 1.35 + 2500000;
                    const absorptionRatio = Math.round((sellOutAmount / simulatedSellIn) * 100);
                    const acquiredMembers = contractors.filter(c => c.registered_store_id === s.id).length;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{s.name}</div>
                          <div className="text-[10px] text-slate-500">{s.city}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                          {s.csa_customer_id}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-blue-600 font-mono">
                          {acquiredMembers} Orang
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {formatRupiah(simulatedSellIn)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(sellOutAmount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(absorptionRatio, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {absorptionRatio}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SIDE-BY-SIDE MODERATION INSPECTOR DIALOG */}
      {/* ------------------------------------------------------------- */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-500 text-white">
                  Verifikasi Struk
                </span>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Struk #{selectedReceipt.receipt_number}
                  </h4>
                  <div className="text-xs text-slate-500">
                    Tgl Nota: {selectedReceipt.receipt_date} • Diunggah: {formatDateTimeIndo(selectedReceipt.created_at)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: 2 Columns Side-by-Side */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Physical Struk Image Viewer */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Foto Bukti Asli Struk
                </div>
                <div className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50 dark:bg-slate-800/40 max-h-[500px] overflow-y-auto flex items-center justify-center">
                  <img
                    src={selectedReceipt.image_url}
                    alt="Nota Bukti"
                    className="max-w-full object-contain rounded-xl"
                  />
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-400 break-all text-center">
                  SHA-256 Hash: {selectedReceipt.image_hash?.substring(0, 32)}...
                </div>
              </div>

              {/* Right Column: Line-by-Line Item Verifier & Point Calculator */}
              <div className="lg:col-span-7 space-y-4">
                {/* Store Confirmation Alert */}
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  selectedReceipt.store_confirmed
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>
                      Validasi Pemilik Toko: {selectedReceipt.store_confirmed ? 'Sudah Dikonfirmasi Asli oleh Toko' : 'Belum Dikonfirmasi oleh Toko'}
                    </span>
                  </div>
                </div>

                {/* Items Verifier Table */}
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Rincian Barang & Verifikasi Kelayakan Poin CSA
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Item Nota</th>
                          <th className="py-2 px-3">Katalog Produk CSA</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                          <th className="py-2 px-2 text-center">Eligible?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {receiptItemsEditing.map((item, idx) => (
                          <tr key={idx} className={item.is_eligible ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{item.raw_item_name}</div>
                              <div className="text-[10px] text-slate-400">
                                {item.qty} x {formatRupiah(item.unit_price)}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={item.product_id || ''}
                                onChange={e => handleSelectProduct(idx, e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                              >
                                <option value="">-- Non-CSA / Bukan Produk CSA --</option>
                                {productsCSA.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.product_name} ({p.sku_code})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              {formatRupiah(item.subtotal)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.is_eligible}
                                onChange={() => handleToggleEligibility(idx)}
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Total Belanja CSA Sah:</span>
                    <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                      {formatRupiah(currentEligibleAmount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">Poin yang Diterbitkan:</span>
                    <div className="text-2xl font-black text-amber-500 font-mono mt-0.5">
                      +{previewPoints} Pts
                    </div>
                  </div>
                </div>

                {/* Raw OCR JSON Preview Accordion (Keunggulan Arsitektur #3) */}
                {selectedReceipt.ocr_raw_json && (
                  <details className="text-xs bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <summary className="font-bold cursor-pointer text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-blue-500" />
                      Inspeksi Raw JSONB OCR (Data Mentah AI)
                    </summary>
                    <pre className="mt-2 p-2 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-36">
                      {JSON.stringify(selectedReceipt.ocr_raw_json, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Tolak Nota...
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Tutup
                </button>
                <button
                  onClick={handleApproveReceipt}
                  disabled={isVerifying}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Setujui Struk & Terbitkan Poin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
              Pilih Alasan Penolakan Struk
            </h4>
            <div className="space-y-2 text-xs">
              {[
                'Foto buram atau tidak terbaca jelas',
                'Struk duplikat / sudah pernah diunggah',
                'Bukan nota dari toko bangunan terdaftar CSA',
                'Tidak terdapat produk CSA yang memenuhi syarat poin',
                'Tanggal nota sudah kadaluarsa (> 30 hari)',
              ].map((reason, idx) => (
                <label key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="reason"
                    checked={rejectionReason === reason}
                    onChange={() => setRejectionReason(reason)}
                    className="text-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Batal
              </button>
              <button
                onClick={handleRejectReceipt}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Konfirmasi Tolak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STORE MODAL */}
      {newStoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h4 className="font-black text-base text-slate-900 dark:text-slate-100">Daftarkan Toko Bangunan Mitra</h4>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Nama Toko:</label>
              <input
                type="text"
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                placeholder="Contoh: TB Sinar Mandiri"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Kode Unik Toko (untuk link & QR):</label>
              <input
                type="text"
                value={newStoreCode}
                onChange={e => setNewStoreCode(e.target.value.toUpperCase())}
                placeholder="Contoh: TOKO-SINAR-05"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Nama Pemilik:</label>
              <input
                type="text"
                value={newStoreOwner}
                onChange={e => setNewStoreOwner(e.target.value)}
                placeholder="Nama pemilik toko"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">No. WhatsApp Pemilik:</label>
              <input
                type="text"
                value={newStorePhone}
                onChange={e => setNewStorePhone(e.target.value)}
                placeholder="0812..."
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setNewStoreModal(false)} className="px-4 py-2 font-semibold text-slate-500">
                Batal
              </button>
              <button onClick={handleCreateStore} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold">
                Simpan Toko
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {newProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h4 className="font-black text-base text-slate-900 dark:text-slate-100">Tambah Master Produk CSA</h4>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">SKU Code:</label>
              <input
                type="text"
                value={newProductSku}
                onChange={e => setNewProductSku(e.target.value.toUpperCase())}
                placeholder="CSA-XX-001"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Nama Produk:</label>
              <input
                type="text"
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                placeholder="Aquaproof Primer 5kg"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Kata Kunci Nota OCR (Pisahkan dengan koma):</label>
              <input
                type="text"
                value={newProductKeywords}
                onChange={e => setNewProductKeywords(e.target.value)}
                placeholder="primer 5kg, primer csa, aqprf primer"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Kamus ini membantu AI mengenali singkatan yang ditulis kasir pada nota fisik.
              </p>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setNewProductModal(false)} className="px-4 py-2 font-semibold text-slate-500">
                Batal
              </button>
              <button onClick={handleCreateProduct} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold">
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
