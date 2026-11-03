/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, ArrowRight, ShieldCheck, BarChart3, FileCode, CheckCircle2, Key, Link2 } from 'lucide-react';

export const ErdArchitectureViewer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('receipts');

  const tables = [
    {
      id: 'stores',
      name: 'stores (Toko Bangunan)',
      badge: 'Mitra Ritel',
      color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
      description: 'Menyimpan data toko bangunan yang membeli barang dari CSA dan menjadi titik akuisisi kontraktor.',
      fields: [
        { name: 'id', type: 'BIGINT / UUID', key: 'PK' },
        { name: 'csa_customer_id', type: 'VARCHAR (UK)', desc: 'ID ERP CSA (Sell-In)' },
        { name: 'store_code', type: 'VARCHAR (UK, IDX)', desc: 'Kode QR/URL Referral' },
        { name: 'name', type: 'VARCHAR', desc: 'Nama Toko Bangunan' },
        { name: 'owner_name', type: 'VARCHAR' },
        { name: 'phone_wa', type: 'VARCHAR (UK)' },
        { name: 'address, city, province', type: 'TEXT' },
        { name: 'qr_code_url', type: 'VARCHAR' },
        { name: 'is_active', type: 'BOOLEAN' },
      ],
      relations: [
        '1:N dengan contractors (registered_store_id)',
        '1:N dengan receipts (store_id - tempat belanja)',
      ],
    },
    {
      id: 'contractors',
      name: 'contractors (Member Kontraktor)',
      badge: 'Loyalty Member',
      color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
      description: 'Menyimpan profil kontraktor beserta afiliasi toko tempat pertama kali mendaftar.',
      fields: [
        { name: 'id', type: 'BIGINT / UUID', key: 'PK' },
        { name: 'member_code', type: 'VARCHAR (UK)', desc: 'ID Member Digital' },
        { name: 'registered_store_id', type: 'BIGINT', key: 'FK -> stores.id' },
        { name: 'full_name', type: 'VARCHAR' },
        { name: 'phone_wa', type: 'VARCHAR (UK, IDX)' },
        { name: 'specialty', type: 'VARCHAR', desc: 'Sipil, ME, Interior, dll' },
        { name: 'points_balance', type: 'INT', desc: 'Cache saldo poin aktif' },
        { name: 'tier_level', type: 'ENUM', desc: 'SILVER / GOLD / PLATINUM' },
        { name: 'status', type: 'ENUM', desc: 'PENDING_OTP / ACTIVE / SUSPENDED' },
      ],
      relations: [
        'N:1 dengan stores (asal toko pendaftaran)',
        '1:N dengan receipts (transaksi belanja)',
        '1:N dengan point_ledgers (buku mutasi poin)',
        '1:N dengan redemptions (penukaran hadiah)',
      ],
    },
    {
      id: 'users_admin',
      name: 'users_admin (Admin CSA)',
      badge: 'Principal Backoffice',
      color: 'border-slate-500 bg-slate-50 dark:bg-slate-900/40',
      description: 'Pengelola pusat kendali program promo, tim verifikator struk, dan analis data.',
      fields: [
        { name: 'id', type: 'BIGINT', key: 'PK' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'email', type: 'VARCHAR (UK)' },
        { name: 'role', type: 'ENUM', desc: 'SUPERADMIN / VERIFIER / ANALYST' },
      ],
      relations: [
        '1:N dengan receipts (verified_by)',
        '1:N dengan redemptions (processed_by)',
      ],
    },
    {
      id: 'receipts',
      name: 'receipts (Header Struk Belanja)',
      badge: 'Digitalisasi & Anti-Fraud',
      color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
      description: 'Bukti transaksi fisik yang diunggah kontraktor, dipindai via OCR, dan diverifikasi.',
      fields: [
        { name: 'id', type: 'BIGINT / UUID', key: 'PK' },
        { name: 'contractor_id', type: 'BIGINT', key: 'FK -> contractors.id' },
        { name: 'store_id', type: 'BIGINT', key: 'FK -> stores.id (Toko Belanja)' },
        { name: 'receipt_number', type: 'VARCHAR (IDX)' },
        { name: 'receipt_date', type: 'DATE (IDX)' },
        { name: 'image_url', type: 'VARCHAR' },
        { name: 'image_hash', type: 'VARCHAR(64) (UK)', desc: 'SHA-256 Anti-Duplicate' },
        { name: 'ocr_raw_json', type: 'JSONB', desc: 'Raw AI OCR dump' },
        { name: 'total_gross_amount', type: 'DECIMAL(15,2)' },
        { name: 'total_eligible_amount', type: 'DECIMAL(15,2)', desc: 'Khusus produk CSA' },
        { name: 'points_earned', type: 'INT' },
        { name: 'status', type: 'ENUM', desc: 'PENDING / PROCESSING / APPROVED / REJECTED' },
        { name: 'rejection_reason', type: 'VARCHAR' },
        { name: 'verified_by', type: 'BIGINT', key: 'FK -> users_admin.id' },
      ],
      relations: [
        '1:N dengan receipt_items (rincian produk nota)',
        '1:1 dengan point_ledgers (saat status APPROVED)',
      ],
    },
    {
      id: 'receipt_items',
      name: 'receipt_items (Detail Barang Struk)',
      badge: 'Line-Item Analytics',
      color: 'border-teal-500 bg-teal-50 dark:bg-teal-950/30',
      description: 'Pecahan baris belanja di nota untuk mengidentifikasi produk CSA dan menghitung poin.',
      fields: [
        { name: 'id', type: 'BIGINT', key: 'PK' },
        { name: 'receipt_id', type: 'BIGINT', key: 'FK -> receipts.id' },
        { name: 'product_id', type: 'BIGINT', key: 'FK -> products_csa.id (Nullable)' },
        { name: 'raw_item_name', type: 'VARCHAR', desc: 'Teks asli nota' },
        { name: 'qty', type: 'DECIMAL(10,2)' },
        { name: 'unit_price', type: 'DECIMAL(15,2)' },
        { name: 'subtotal', type: 'DECIMAL(15,2)' },
        { name: 'is_eligible', type: 'BOOLEAN', desc: 'Berhak dapat poin CSA' },
      ],
      relations: [
        'N:1 dengan receipts',
        'N:1 dengan products_csa',
      ],
    },
    {
      id: 'products_csa',
      name: 'products_csa (Master Produk CSA)',
      badge: 'Principal Catalog',
      color: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
      description: 'Katalog produk resmi CSA yang memiliki insentif poin dan kamus kata kunci OCR.',
      fields: [
        { name: 'id', type: 'BIGINT', key: 'PK' },
        { name: 'sku_code', type: 'VARCHAR (UK)' },
        { name: 'product_name', type: 'VARCHAR' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'brand', type: 'VARCHAR' },
        { name: 'ocr_keywords', type: 'JSONB', desc: 'Kamus singkatan nota toko' },
        { name: 'base_point_multiplier', type: 'DECIMAL(5,2)' },
      ],
      relations: [
        '1:N dengan receipt_items',
      ],
    },
    {
      id: 'campaigns_promo',
      name: 'campaigns_promo (Aturan Promo & Poin)',
      badge: 'Rule Engine',
      color: 'border-rose-500 bg-rose-50 dark:bg-rose-950/30',
      description: 'Skema konversi nominal belanja menjadi poin dan promosi multiplier khusus.',
      fields: [
        { name: 'id', type: 'BIGINT', key: 'PK' },
        { name: 'title', type: 'VARCHAR' },
        { name: 'rule_type', type: 'ENUM', desc: 'NOMINAL / PRODUCT_BONUS / TIER' },
        { name: 'min_transaction_amount', type: 'DECIMAL(15,2)' },
        { name: 'conversion_rate_amount', type: 'DECIMAL(15,2)', desc: 'Kelipatan nominal (Rp 100k)' },
        { name: 'points_rewarded', type: 'INT', desc: 'Jumlah poin (10 Poin)' },
        { name: 'is_active', type: 'BOOLEAN' },
      ],
      relations: [
        'Digunakan oleh Rule Engine saat verifikasi struk',
      ],
    },
    {
      id: 'point_ledgers',
      name: 'point_ledgers (Buku Besar Mutasi Poin)',
      badge: 'Immutable Ledger',
      color: 'border-amber-600 bg-amber-50 dark:bg-amber-950/40',
      description: 'Buku besar mutasi poin anti-fraud. Bersifat append-only (tidak boleh UPDATE/DELETE).',
      fields: [
        { name: 'id', type: 'BIGINT', key: 'PK' },
        { name: 'contractor_id', type: 'BIGINT', key: 'FK -> contractors.id' },
        { name: 'type', type: 'ENUM', desc: 'EARN_RECEIPT / BONUS / REDEEM' },
        { name: 'reference_id', type: 'BIGINT', desc: 'receipts.id atau redemptions.id' },
        { name: 'amount', type: 'INT', desc: 'Positif (+) atau Negatif (-)' },
        { name: 'balance_after', type: 'INT', desc: 'Saldo tepat setelah mutasi' },
        { name: 'description', type: 'VARCHAR' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ],
      relations: [
        'N:1 dengan contractors',
      ],
    },
    {
      id: 'rewards',
      name: 'rewards (Katalog Hadiah)',
      badge: 'Redeem Catalog',
      color: 'border-violet-500 bg-violet-50 dark:bg-violet-950/30',
      description: 'Katalog reward hadiah: E-Wallet, Voucher Toko, Alat Proyek, dan Merchandise.',
      fields: [
        { name: 'id', type: 'BIGINT', key: 'PK' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'points_required', type: 'INT' },
        { name: 'stock_qty', type: 'INT' },
        { name: 'image_url', type: 'VARCHAR' },
        { name: 'is_active', type: 'BOOLEAN' },
      ],
      relations: [
        '1:N dengan redemptions',
      ],
    },
    {
      id: 'redemptions',
      name: 'redemptions (Transaksi Penukaran)',
      badge: 'Fulfillment',
      color: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
      description: 'Catatan permintaan redeem hadiah dari kontraktor beserta status fulfillment.',
      fields: [
        { name: 'id', type: 'BIGINT', key: 'PK' },
        { name: 'contractor_id', type: 'BIGINT', key: 'FK -> contractors.id' },
        { name: 'reward_id', type: 'BIGINT', key: 'FK -> rewards.id' },
        { name: 'points_used', type: 'INT' },
        { name: 'status', type: 'ENUM', desc: 'REQUESTED / APPROVED / SHIPPED / COMPLETED' },
        { name: 'delivery_info', type: 'JSONB', desc: 'Rekening e-wallet / alamat kirim' },
        { name: 'processed_by', type: 'BIGINT', key: 'FK -> users_admin.id' },
      ],
      relations: [
        'N:1 dengan contractors',
        'N:1 dengan rewards',
        '1:1 dengan point_ledgers (amount negatif)',
      ],
    },
  ];

  const currentTable = tables.find(t => t.id === selectedTable) || tables[3];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5" /> Skema Database & Workflow Terpadu
            </div>
            <h2 className="text-2xl font-black tracking-tight">Entity Relationship Diagram (ERD) & Business Architecture</h2>
            <p className="text-slate-300 text-sm max-w-2xl mt-1">
              Dirancang untuk mendigitalisasi pencatatan transaksi ritel (Sell-Out), otomatisasi OCR struk dengan anti-fraud, 
              serta menyandingkan data sell-in toko dengan loyalitas kontraktor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 10 Entitas Lengkap
            </span>
          </div>
        </div>

        {/* 3 Keunggulan Arsitektur Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-indigo-800/40 text-xs">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1 text-sm">
              <Link2 className="w-4 h-4" /> 1. Pemisahan Toko Akuisisi vs Belanja
            </div>
            <p className="text-slate-300 leading-relaxed">
              <code className="text-indigo-200">contractors.registered_store_id</code> vs <code className="text-indigo-200">receipts.store_id</code> memungkinkan CSA melacak kontraktor yang direkrut Toko A namun berbelanja lintas toko di Toko B.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1 text-sm">
              <BarChart3 className="w-4 h-4" /> 2. Analitik Sell-In vs Sell-Out
            </div>
            <p className="text-slate-300 leading-relaxed">
              <code className="text-indigo-200">stores.csa_customer_id</code> (ERP Sell-In) disandingkan dengan rincian barang <code className="text-indigo-200">receipt_items.product_id</code> (Sell-Out ritel kontraktor).
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1 text-sm">
              <FileCode className="w-4 h-4" /> 3. Penyimpanan ocr_raw_json (JSONB)
            </div>
            <p className="text-slate-300 leading-relaxed">
              Menyimpan teks mentah hasil pembacaan AI OCR struk toko bangunan guna melatih dan memperkaya kamus kata kunci <code className="text-indigo-200">products_csa.ocr_keywords</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tables.map(t => {
          const isSelected = selectedTable === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTable(t.id)}
              className={`text-left p-3.5 rounded-xl border-2 transition-all relative ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-[10px] text-slate-500 uppercase">{t.id}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {t.fields.length} col
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{t.name.split(' ')[0]}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{t.badge}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Table Inspector Detail */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {currentTable.badge}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {currentTable.name}
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{currentTable.description}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Key className="w-3.5 h-3.5 text-amber-500" /> PK = Primary Key</span>
            <span className="flex items-center gap-1 ml-2"><Link2 className="w-3.5 h-3.5 text-blue-500" /> FK = Foreign Key</span>
          </div>
        </div>

        {/* Fields table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Kolom (Field)</th>
                <th className="py-2.5 px-3">Tipe Data & Index</th>
                <th className="py-2.5 px-3">Kunci (Key)</th>
                <th className="py-2.5 px-3">Fungsi Bisnis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {currentTable.fields.map((f, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{f.name}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{f.type}</td>
                  <td className="py-2.5 px-3">
                    {f.key ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.key.includes('PK')
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {f.key}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-sans">{f.desc || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Relations */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500" /> Relasi Terkait:
          </h4>
          <div className="flex flex-wrap gap-2">
            {currentTable.relations.map((rel, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono">
                {rel}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
