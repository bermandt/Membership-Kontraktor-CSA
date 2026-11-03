/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { Store, Contractor, Receipt, ProductCSA } from '../types/membership.ts';
import { formatRupiah, formatNumber, formatDateIndo, formatDateTimeIndo } from '../utils/formatters.ts';
import {
  Store as StoreIcon,
  QrCode,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronRight,
  Package,
  Building2
} from 'lucide-react';

interface StorePortalProps {
  store: Store;
  allStores: Store[];
  contractors: Contractor[];
  receipts: Receipt[];
  productsCSA: ProductCSA[];
  onSelectStore: (s: Store) => void;
  onRefreshData: () => Promise<void>;
  onOpenContractorRegisterModal: (storeCode: string) => void;
}

export const StorePortal: React.FC<StorePortalProps> = ({
  store,
  allStores,
  contractors,
  receipts,
  productsCSA,
  onSelectStore,
  onRefreshData,
  onOpenContractorRegisterModal,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [confirmingReceiptId, setConfirmingReceiptId] = useState<string | null>(null);
  const [restockModalOpen, setRestockModalOpen] = useState<boolean>(false);
  const [selectedRestockProduct, setSelectedRestockProduct] = useState<ProductCSA>(productsCSA[0]);
  const [restockQty, setRestockQty] = useState<number>(50);
  const [restockSuccess, setRestockSuccess] = useState<string>('');

  const referralUrl = `${window.location.origin}/?toko=${store.store_code}`;

  // Generate QR for store referral
  useEffect(() => {
    QRCode.toDataURL(referralUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff',
      },
    })
      .then(url => setQrUrl(url))
      .catch(err => console.error(err));
  }, [referralUrl]);

  // Contractors registered through this store (Acquisition)
  const acquiredContractors = contractors.filter(c => c.registered_store_id === store.id);

  // Receipts from shopping at this store (Transactions)
  const storeReceipts = receipts.filter(r => r.store_id === store.id);

  // Total Sell-Out turnover
  const totalSellOut = storeReceipts
    .filter(r => r.status === 'APPROVED')
    .reduce((sum, r) => sum + r.total_gross_amount, 0);

  // Handle Toko Confirm Receipt (Workflow Sisi Toko - Opsi A)
  const handleStoreConfirm = async (receiptId: string, confirmed: boolean) => {
    setConfirmingReceiptId(receiptId);
    try {
      const res = await fetch(`/api/receipts/${receiptId}/store-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal konfirmasi');

      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status konfirmasi toko');
    } finally {
      setConfirmingReceiptId(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintTentCard = () => {
    window.print();
  };

  const handleSendRestockOrder = () => {
    setRestockSuccess(
      `Pesanan restock ${restockQty} unit ${selectedRestockProduct.product_name} berhasil dikirim ke Admin Sales Principal CSA!`
    );
    setTimeout(() => {
      setRestockModalOpen(false);
      setRestockSuccess('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Store Header & Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
            <StoreIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{store.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Mitra Toko CSA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Pemilik: <strong>{store.owner_name}</strong></span>
              <span>•</span>
              <span>No. WA: <strong>{store.phone_wa}</strong></span>
              <span>•</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                ERP Cust ID: {store.csa_customer_id}
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{store.address}, {store.city}, {store.province}</p>
          </div>
        </div>

        {/* Switch store persona */}
        <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-slate-500 font-medium">Ganti Toko:</span>
          <select
            value={store.id}
            onChange={e => {
              const s = allStores.find(x => x.id === e.target.value);
              if (s) onSelectStore(s);
            }}
            className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold"
          >
            {allStores.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.store_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Kontraktor Terdaftar</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            {acquiredContractors.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Terakuisisi via Kode {store.store_code}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Struk Belanja Masuk</span>
            <ShoppingBag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            {storeReceipts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {storeReceipts.filter(r => r.status === 'PENDING').length} menunggu moderasi CSA
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Nilai Sell-Out Ritel</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2 truncate">
            {formatRupiah(totalSellOut)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Transaksi member kontraktor di toko
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Restock Barang ke CSA</span>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          <button
            onClick={() => setRestockModalOpen(true)}
            className="mt-2 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Package className="w-3.5 h-3.5" /> Ajukan Repeat Order
          </button>
        </div>
      </div>

      {/* Main Grid: Tent Card / Akuisisi QR vs Validasi Transaksi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Kit Promosi Meja Kasir (Tent Card Display) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Kit Meja Kasir (Tent Card)
                </h3>
              </div>
              <button
                onClick={handlePrintTentCard}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak
              </button>
            </div>

            {/* Simulated Printed Tent Card */}
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 text-white text-center shadow-lg border border-blue-500/30 flex flex-col items-center">
              <div className="mb-2 px-3 py-1 rounded-full bg-white flex items-center justify-center shadow-md">
                <img
                  src="/assets/aistudio/logo_1bd731b1.png"
                  alt="CSA Logo"
                  className="h-5 w-auto object-contain"
                />
              </div>
              <h4 className="text-base font-black tracking-tight text-white">
                GABUNG MEMBERSHIP KONTRAKTOR
              </h4>
              <p className="text-xs text-blue-200 mt-0.5">
                Belanja di <span className="font-bold underline">{store.name}</span>, Kumpulkan Poin & Dapatkan Hadiah!
              </p>

              {/* QR Image Box */}
              <div className="mt-4 p-3 bg-white rounded-2xl shadow-inner inline-block">
                {qrUrl ? (
                  <img src={qrUrl} alt="Store QR Referral" className="w-44 h-44 object-contain" />
                ) : (
                  <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    Membuat QR...
                  </div>
                )}
              </div>

              <div className="mt-3 font-mono font-bold text-amber-300 text-xs">
                KODE TOKO: {store.store_code}
              </div>

              <p className="text-[10px] text-slate-300 mt-2 max-w-xs">
                Scan QR ini dengan kamera HP untuk pendaftaran otomatis yang langsung terafiliasi dengan {store.name}.
              </p>
            </div>

            {/* Referral Link Copy & Direct Simulator */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Tersalin' : 'Salin'}
                </button>
              </div>

              <button
                onClick={() => onOpenContractorRegisterModal(store.store_code)}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-100/50 transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Uji Coba Registrasi Kontraktor via Toko Ini
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Daftar Kontraktor Terdaftar & Validasi Transaksi */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section: Validasi Transaksi Struk (Opsi A vs Opsi B) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                    Workflow Sisi Toko (Opsi A)
                  </span>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Validasi Struk Belanja dari Toko Ini
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toko menerima notifikasi saat kontraktor mengunggah nota toko Anda untuk memastikan keaslian transaksi.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {storeReceipts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada struk belanja yang diunggah untuk {store.name}.
                </div>
              ) : (
                storeReceipts.map(rcp => {
                  const contractor = contractors.find(c => c.id === rcp.contractor_id);
                  return (
                    <div
                      key={rcp.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                            #{rcp.receipt_number}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {contractor?.full_name || 'Kontraktor'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({contractor?.member_code})
                          </span>
                        </div>
                        <div className="text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>Tgl Nota: <strong>{formatDateIndo(rcp.receipt_date)}</strong></span>
                          <span>•</span>
                          <span>Total Nota: <strong>{formatRupiah(rcp.total_gross_amount)}</strong></span>
                          <span>•</span>
                          <span>Produk CSA: <strong className="text-blue-600">{formatRupiah(rcp.total_eligible_amount)}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {rcp.store_confirmed ? (
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" /> Dikonfirmasi Asli
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStoreConfirm(rcp.id, true)}
                            disabled={confirmingReceiptId === rcp.id}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4" /> Konfirmasi Struk Asli
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Kontraktor Terdaftar (Akuisisi Toko) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Daftar Kontraktor Terakuisisi ({acquiredContractors.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Kontraktor yang mendaftar melalui QR Code atau link referral {store.name}.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Bidang / Spesialisasi</th>
                    <th className="py-2.5 px-3">No. WhatsApp</th>
                    <th className="py-2.5 px-3 text-right">Saldo Poin</th>
                    <th className="py-2.5 px-3 text-center">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {acquiredContractors.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{c.full_name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{c.member_code}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{c.specialty}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{c.phone_wa}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {formatNumber(c.points_balance)} Pts
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {c.tier_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RESTOCK ORDER MODAL */}
      {/* ------------------------------------------------------------- */}
      {restockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                Pengajuan Repeat Order Restock ke CSA
              </h4>
              <button
                onClick={() => setRestockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {restockSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {restockSuccess}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500">
                  Berdasarkan tren belanja kontraktor di toko Anda, ajukan pembelian kembali (Sell-In) langsung ke distributor CSA:
                </p>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Pilih Produk CSA:</label>
                  <select
                    value={selectedRestockProduct.id}
                    onChange={e => {
                      const p = productsCSA.find(x => x.id === e.target.value);
                      if (p) setSelectedRestockProduct(p);
                    }}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {productsCSA.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({p.sku_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Jumlah Pesanan (Qty):</label>
                  <input
                    type="number"
                    min={1}
                    value={restockQty}
                    onChange={e => setRestockQty(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                  <div className="font-bold">Estimasi Nilai Pembelian Toko:</div>
                  <div className="text-base font-black font-mono mt-0.5">
                    {formatRupiah(restockQty * selectedRestockProduct.unit_price_estimate * 0.85)} (Diskon Mitra 15%)
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setRestockModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSendRestockOrder}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Kirim Order ke CSA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
