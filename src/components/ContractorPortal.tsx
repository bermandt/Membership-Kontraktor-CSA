/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import type {
  Contractor,
  Store,
  Receipt,
  Reward,
  PointLedger,
  ProductCSA,
  CampaignPromo,
  ReceiptItem,
} from '../types/membership.ts';
import { demoReceiptPresets, DemoReceiptPreset } from '../data/initialData.ts';
import { formatRupiah, formatNumber, formatDateIndo, formatDateTimeIndo, getTierBadgeColor } from '../utils/formatters.ts';
import { generateReceiptSvgDataUrl, computeSha256 } from '../utils/receiptGenerator.ts';
import { calculateReceiptPoints } from '../utils/ruleEngine.ts';
import {
  CreditCard,
  UploadCloud,
  Gift,
  History,
  QrCode,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Camera,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  Store as StoreIcon,
  HardHat,
  Search,
  Check,
  FileText,
  ScanLine
} from 'lucide-react';

interface ContractorPortalProps {
  contractor: Contractor;
  allContractors: Contractor[];
  stores: Store[];
  receipts: Receipt[];
  receiptItems: ReceiptItem[];
  rewards: Reward[];
  pointLedgers: PointLedger[];
  productsCSA: ProductCSA[];
  campaigns: CampaignPromo[];
  onSelectContractor: (c: Contractor) => void;
  onRefreshData: () => Promise<void>;
  onOpenRegisterWithStore?: (storeCode: string) => void;
}

export const ContractorPortal: React.FC<ContractorPortalProps> = ({
  contractor,
  allContractors,
  stores,
  receipts,
  receiptItems,
  rewards,
  pointLedgers,
  productsCSA,
  campaigns,
  onSelectContractor,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'upload' | 'rewards' | 'ledger' | 'history'>('card');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Upload & OCR states
  const [selectedPreset, setSelectedPreset] = useState<DemoReceiptPreset | null>(null);
  const [receiptImagePreview, setReceiptImagePreview] = useState<string>('');
  const [isScanningOCR, setIsScanningOCR] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customFile, setCustomFile] = useState<File | null>(null);

  // Redeem modal states
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [walletType, setWalletType] = useState<string>('GoPay');
  const [walletNumber, setWalletNumber] = useState<string>(contractor.phone_wa);
  const [recipientName, setRecipientName] = useState<string>(contractor.full_name);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Jl. Proyek Perumahan Griya Indah Blok C No. 12');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);

  // Receipt detail view modal
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

  // Generate real QR code for contractor member code
  useEffect(() => {
    QRCode.toDataURL(contractor.member_code, {
      width: 240,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error(err));
  }, [contractor.member_code]);

  const registeredStore = stores.find(s => s.id === contractor.registered_store_id) || stores[0];

  // Contractor-specific receipts and ledgers
  const myReceipts = receipts.filter(r => r.contractor_id === contractor.id);
  const myLedgers = pointLedgers.filter(l => l.contractor_id === contractor.id);

  // Function to process preset or custom receipt image
  const handleSelectPreset = async (preset: DemoReceiptPreset) => {
    setSelectedPreset(preset);
    setUploadError('');
    setUploadSuccess('');
    setIsScanningOCR(true);
    setOcrResult(null);

    const store = stores.find(s => s.id === preset.store_id) || stores[0];
    const totalAmount = preset.items.reduce((sum, it) => sum + (it.qty * it.price), 0);

    // Generate realistic SVG receipt ticket
    const ticketSvg = generateReceiptSvgDataUrl({
      storeName: store.name,
      storeAddress: store.address,
      receiptNumber: preset.receipt_number,
      receiptDate: preset.receipt_date,
      items: preset.items.map(it => ({
        name: it.raw_name,
        qty: it.qty,
        price: it.price,
        subtotal: it.qty * it.price,
        isCSA: Boolean(it.csa_sku),
      })),
      total: totalAmount,
    });

    setReceiptImagePreview(ticketSvg);

    try {
      // Call server OCR
      const res = await fetch('/api/ocr-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: ticketSvg,
          preset_hint: {
            store_name: store.name,
            receipt_number: preset.receipt_number,
            receipt_date: preset.receipt_date,
            items: preset.items,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memproses OCR');

      setOcrResult(json.data);
    } catch (err: any) {
      setUploadError(err.message || 'Gagal menjalankan OCR');
    } finally {
      setIsScanningOCR(false);
    }
  };

  // Custom file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomFile(file);
    setSelectedPreset(null);
    setUploadError('');
    setUploadSuccess('');
    setIsScanningOCR(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setReceiptImagePreview(base64Data);

      try {
        const res = await fetch('/api/ocr-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: base64Data,
            mime_type: file.type || 'image/jpeg',
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal menjalankan OCR');
        setOcrResult(json.data);
      } catch (err: any) {
        setUploadError(err.message || 'Gagal memindai nota');
      } finally {
        setIsScanningOCR(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Receipt into Moderation Queue
  const handleSubmitReceipt = async () => {
    if (!ocrResult || !receiptImagePreview) return;

    setIsSubmitting(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      // Compute SHA-256
      let hash = '';
      if (selectedPreset?.is_fraud_sample && selectedPreset.fraud_type === 'DUPLICATE_HASH') {
        // Deliberately trigger duplicate hash from initialReceipts[0]
        hash = receipts[0]?.image_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      } else {
        hash = await computeSha256(receiptImagePreview + (selectedPreset ? selectedPreset.id : Date.now()));
      }

      const payload = {
        contractor_id: contractor.id,
        store_id: ocrResult.store_id || registeredStore.id,
        receipt_number: ocrResult.receipt_number,
        receipt_date: ocrResult.receipt_date,
        image_url: receiptImagePreview,
        image_hash: hash,
        total_gross_amount: ocrResult.total_gross_amount,
        items: ocrResult.items,
        ocr_raw_json: ocrResult.ocr_raw_json,
      };

      const res = await fetch('/api/receipts/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengunggah struk');
      }

      if (json.fraudCheck?.hasCompositeWarning) {
        setUploadSuccess(
          `Struk terkirim dengan peringatan: ${json.fraudCheck.compositeWarningMessage}. Admin CSA akan memverifikasi keabsahannya.`
        );
      } else {
        setUploadSuccess(
          `Struk #${ocrResult.receipt_number} berhasil dikirim! Status: Menunggu Verifikasi Admin CSA.`
        );
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      await onRefreshData();
      // Reset form
      setOcrResult(null);
      setSelectedPreset(null);
      setReceiptImagePreview('');
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengirim struk');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Point Redemption
  const handleRedeemReward = async () => {
    if (!selectedReward) return;

    setIsRedeeming(true);
    try {
      const payload = {
        contractor_id: contractor.id,
        reward_id: selectedReward.id,
        delivery_info: {
          recipient_name: recipientName,
          phone_wa: walletNumber,
          type: selectedReward.category === 'E-WALLET' ? 'E-WALLET' : 'ALAMAT_PENGIRIMAN',
          target_wallet: walletType,
          target_account_number: walletNumber,
          delivery_address: deliveryAddress,
        },
      };

      const res = await fetch('/api/redemptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menukarkan poin');

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });

      alert(json.message);
      setSelectedReward(null);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menukarkan poin');
    } finally {
      setIsRedeeming(false);
    }
  };

  const tierColors = getTierBadgeColor(contractor.tier_level);

  return (
    <div className="space-y-6">
      {/* Contractor Top Bar / Persona Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{contractor.full_name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}>
                {contractor.tier_level}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>{contractor.specialty}</span>
              <span>•</span>
              <span className="font-mono">{contractor.member_code}</span>
            </p>
          </div>
        </div>

        {/* Quick persona select */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Ganti Member:</span>
          <select
            value={contractor.id}
            onChange={e => {
              const c = allContractors.find(x => x.id === e.target.value);
              if (c) onSelectContractor(c);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
          >
            {allContractors.map(c => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.tier_level} - {c.points_balance} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('card')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'card'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Kartu Member & Poin
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'upload'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" /> Upload Struk Belanja
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'rewards'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" /> Katalog Hadiah
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'ledger'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Buku Besar Poin ({myLedgers.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Riwayat Struk ({myReceipts.length})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: KARTU MEMBER DIGITAL & AFILIASI TOKO */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Digital Member Card Visual */}
          <div className="md:col-span-2">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white p-7 shadow-2xl border border-amber-500/30">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 px-2 rounded-lg bg-white flex items-center justify-center shadow-md">
                    <img
                      src="/assets/aistudio/logo_1bd731b1.png"
                      alt="CSA Logo"
                      className="h-6 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-extrabold tracking-wider text-sm">MEMBERSHIP KONTRAKTOR</div>
                    <div className="text-[10px] text-amber-300/80">PT Cipta Sentosa Abadi • Program Loyalitas Ritel</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}>
                  {contractor.tier_level} MEMBER
                </span>
              </div>

              {/* Points Big Display */}
              <div className="mt-8">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Saldo Poin Aktif</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-black text-amber-400 tracking-tight font-mono">
                    {formatNumber(contractor.points_balance)}
                  </span>
                  <span className="text-lg font-bold text-amber-200">POIN</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Setara dengan ± {formatRupiah(contractor.points_balance * 1000)} voucher belanja material atau pencairan e-wallet.
                </p>
              </div>

              {/* Bottom Details & Store Affiliation */}
              <div className="mt-8 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-slate-400">Nama Kontraktor</div>
                  <div className="font-bold text-base text-slate-100">{contractor.full_name}</div>
                  <div className="font-mono text-xs text-amber-300 mt-0.5">{contractor.member_code}</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
                  <div className="text-[10px] text-amber-200 uppercase font-semibold flex items-center gap-1">
                    <StoreIcon className="w-3 h-3" /> Toko Afiliasi Pendaftaran:
                  </div>
                  <div className="font-bold text-sm text-white mt-0.5">{registeredStore.name}</div>
                  <div className="text-[11px] text-slate-300 font-mono">Kode: {registeredStore.store_code}</div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => setActiveTab('upload')}
                className="p-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <UploadCloud className="w-5 h-5" /> Upload Nota Belanja Baru
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Gift className="w-5 h-5 text-amber-400" /> Tukar Poin Hadiah
              </button>
            </div>
          </div>

          {/* Digital QR Code Badge */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-amber-500" /> QR Member Digital
            </div>
            
            <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-inner mt-2">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code Member" className="w-44 h-44 object-contain" />
              ) : (
                <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  Membuat QR...
                </div>
              )}
            </div>

            <div className="font-mono font-bold text-base text-slate-900 dark:text-slate-100 mt-3">
              {contractor.member_code}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              Tunjukkan QR ini ke kasir toko bangunan mitra untuk pencatatan transaksi langsung.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: UPLOAD STRUK BELANJA & DIGITALISASI OCR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Digitalisasi Struk OCR Cerdas:</span> Foto nota belanja toko bangunan Anda. 
              Sistem akan otomatis mengekstrak nama toko, tanggal, nomor nota, dan mengenali produk CSA 
              (Aquaproof, Semen CSA, WeatherShield, Granit, Pipa PVC) untuk perhitungan poin loyalitas.
            </div>
          </div>

          {/* Preset Samples Selector for Testing Workflow */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-500" /> Pilih Contoh Nota Fisik Toko Bangunan (Demo Cepat):
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Klik untuk simulasi scan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {demoReceiptPresets.map(preset => {
                const isSelected = selectedPreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left p-3.5 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 shadow-sm ring-2 ring-amber-500/20'
                        : preset.is_fraud_sample
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-400'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{preset.title}</div>
                    <div className="text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between text-[11px]">
                      <span>{preset.store_name}</span>
                      <span className="font-mono font-semibold">{preset.receipt_number}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Image Upload Option */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">Atau gunakan file gambar struk dari perangkat Anda:</span>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer transition-all">
                <UploadCloud className="w-4 h-4 text-amber-500" /> Pilih File Gambar / Foto
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {/* OCR Processing Indicator */}
          {isScanningOCR && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-amber-500 animate-pulse" /> Memindai Nota Belanja dengan Mesin OCR Gemini...
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Membaca header toko, tanggal, item pembelian, dan mencocokkan kata kunci produk CSA resmi.
              </p>
            </div>
          )}

          {/* Feedback Messages */}
          {uploadError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold">Penolakan / Kesalahan Sistem:</div>
                <div className="mt-0.5">{uploadError}</div>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold">Berhasil Dikirim!</div>
                <div className="mt-0.5">{uploadSuccess}</div>
              </div>
            </div>
          )}

          {/* OCR Extracted Results & Review Before Sending */}
          {ocrResult && receiptImagePreview && !isScanningOCR && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              {/* Left Column: Visual Struk Ticket */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Preview Struk Fisik
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-md max-h-[520px] overflow-y-auto bg-slate-50">
                  <img
                    src={receiptImagePreview}
                    alt="Nota Belanja"
                    className="w-full object-contain"
                  />
                </div>
              </div>

              {/* Right Column: OCR Extracted Form & Eligible Items */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      OCR BERHASIL TERBACA
                    </span>
                    <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                      {ocrResult.store_name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">No. Nota</div>
                    <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                      {ocrResult.receipt_number}
                    </div>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400">Tanggal Nota:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {ocrResult.receipt_date}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Kotor Nota:</span>
                    <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatRupiah(ocrResult.total_gross_amount)}
                    </div>
                  </div>
                </div>

                {/* Itemized Table */}
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Daftar Barang & Deteksi Produk CSA
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Item Nota</th>
                          <th className="py-2 px-2 text-center">Qty</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                          <th className="py-2 px-3 text-center">Status CSA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {ocrResult.items?.map((item: any, idx: number) => (
                          <tr key={idx} className={item.is_eligible ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}>
                            <td className="py-2 px-3">
                              <div className="font-medium text-slate-800 dark:text-slate-200">{item.raw_item_name}</div>
                              {item.csa_name && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                  ✓ Cocok: {item.csa_name} ({item.csa_sku})
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-600 font-mono">{item.qty}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                              {formatRupiah(item.subtotal)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.is_eligible ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  Eligible Poin
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  Non-CSA
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Points Estimation Summary */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-amber-900 dark:text-amber-200 font-semibold">
                      Total Belanja Khusus Produk CSA:
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                      {formatRupiah(ocrResult.total_eligible_amount || 0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-amber-900 dark:text-amber-200 font-semibold">
                      Estimasi Perolehan Poin:
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      +{Math.floor((ocrResult.total_eligible_amount || 0) / 100000) * 10} POIN
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSubmitReceipt}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Mengirim ke Antrean Verifikasi CSA...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" /> Kirim Nota & Ajukan Klaim Poin
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Nota akan langsung masuk ke Modul Moderasi Admin CSA untuk diverifikasi keabsahannya.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: KATALOG HADIAH & REDEEM */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Katalog Promo & Hadiah CSA</h3>
              <p className="text-xs text-slate-500">Tukarkan poin aktif Anda dengan saldo digital atau perlengkapan kerja proyek.</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 font-mono text-xs">
              Saldo Anda: <span className="font-black text-amber-600 dark:text-amber-400 text-sm">{formatNumber(contractor.points_balance)}</span> Poin
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rewards.map(reward => {
              const canRedeem = contractor.points_balance >= reward.points_required && reward.stock_qty > 0;
              return (
                <div
                  key={reward.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={reward.image_url}
                      alt={reward.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs font-mono font-bold">
                      {reward.points_required} Poin
                    </div>
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/90 text-slate-700 shadow-sm">
                      {reward.category}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{reward.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{reward.description}</p>
                      <div className="mt-2 text-[11px] text-slate-400">
                        Sisa Stok: <span className="font-bold text-slate-700 dark:text-slate-300">{reward.stock_qty} pcs</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedReward(reward)}
                      disabled={!canRedeem}
                      className={`mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        canRedeem
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {contractor.points_balance < reward.points_required ? (
                        <>Kurang {reward.points_required - contractor.points_balance} Poin</>
                      ) : reward.stock_qty <= 0 ? (
                        <>Stok Habis</>
                      ) : (
                        <>
                          <Gift className="w-4 h-4" /> Tukar Sekarang
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: BUKU BESAR MUTASI POIN (POINT_LEDGERS - IMMUTABLE) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  Buku Besar Immutable
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Buku Besar Mutasi Poin</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Riwayat perolehan (+) dan penukaran (-) poin yang tersimpan secara akurat dan tidak dapat diubah (auditable).
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Saldo Akhir:</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatNumber(contractor.points_balance)} Pts
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Tipe Mutasi</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3 text-right">Perubahan</th>
                  <th className="py-2.5 px-3 text-right">Saldo Setelah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myLedgers.map(l => {
                  const isPositive = l.amount > 0;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap">
                        {formatDateTimeIndo(l.created_at)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPositive
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          {l.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {l.description}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold text-sm ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isPositive ? `+${l.amount}` : l.amount} Pts
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatNumber(l.balance_after)} Pts
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
      {/* TAB 5: RIWAYAT STRUK BELANJA */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Riwayat Struk Belanja</h3>
              <p className="text-xs text-slate-500">Daftar semua struk yang pernah Anda unggah beserta status verifikasinya.</p>
            </div>
          </div>

          <div className="space-y-3">
            {myReceipts.map(rcp => {
              const store = stores.find(s => s.id === rcp.store_id);
              return (
                <div
                  key={rcp.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          #{rcp.receipt_number}
                        </span>
                        {rcp.status === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Disetujui (+{rcp.points_earned} Pts)
                          </span>
                        ) : rcp.status === 'REJECTED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Menunggu Verifikasi
                          </span>
                        )}
                        {rcp.store_confirmed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            ✓ Dikonfirmasi Toko
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>Toko: <strong>{store?.name || 'Toko Mitra'}</strong></span>
                        <span>•</span>
                        <span>Tgl Nota: {formatDateIndo(rcp.receipt_date)}</span>
                        <span>•</span>
                        <span>Total: <strong>{formatRupiah(rcp.total_gross_amount)}</strong></span>
                      </div>
                      {rcp.rejection_reason && (
                        <div className="text-xs text-rose-600 mt-1 font-medium">
                          Alasan Penolakan: {rcp.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingReceipt(rcp)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0"
                  >
                    Lihat Bukti Struk
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REDEEM REWARD MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                Konfirmasi Penukaran Hadiah
              </h4>
              <button
                onClick={() => setSelectedReward(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <img
                src={selectedReward.image_url}
                alt={selectedReward.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div>
                <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedReward.name}</h5>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-bold font-mono mt-0.5">
                  {selectedReward.points_required} Poin
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Saldo Anda setelah penukaran: {contractor.points_balance - selectedReward.points_required} Poin
                </div>
              </div>
            </div>

            {selectedReward.category === 'E-WALLET' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Pilih E-Wallet Tujuan:</label>
                  <select
                    value={walletType}
                    onChange={e => setWalletType(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="GoPay">GoPay</option>
                    <option value="OVO">OVO</option>
                    <option value="DANA">DANA</option>
                    <option value="ShopeePay">ShopeePay</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Nomor Akun / No HP E-Wallet:</label>
                  <input
                    type="text"
                    value={walletNumber}
                    onChange={e => setWalletNumber(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Nama Penerima & No WhatsApp:</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Alamat Pengiriman / Alamat Proyek:</label>
                  <textarea
                    rows={3}
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="Tulis alamat lengkap pengiriman paket hadiah..."
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedReward(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleRedeemReward}
                disabled={isRedeeming}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md"
              >
                {isRedeeming ? 'Memproses...' : 'Potong Poin & Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW RECEIPT MODAL */}
      {/* ------------------------------------------------------------- */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Bukti Struk #{viewingReceipt.receipt_number}
                </h4>
                <div className="text-xs text-slate-400">
                  {formatDateIndo(viewingReceipt.receipt_date)} • {formatRupiah(viewingReceipt.total_gross_amount)}
                </div>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-2">
              <img
                src={viewingReceipt.image_url}
                alt="Nota Fisik"
                className="max-h-96 object-contain"
              />
            </div>

            <div className="text-right">
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
