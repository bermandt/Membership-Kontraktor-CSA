/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 1. Master Toko Bangunan (stores)
export interface Store {
  id: string;
  csa_customer_id: string; // ID Pelanggan di ERP CSA (misal: CSA-CUST-8812)
  store_code: string;      // Kode unik registrasi (misal: TOKO-MAKMUR-01)
  name: string;
  owner_name: string;
  phone_wa: string;
  address: string;
  city: string;
  province: string;
  qr_code_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 2. Master Member Kontraktor (contractors)
export type TierLevel = 'SILVER' | 'GOLD' | 'PLATINUM';
export type ContractorStatus = 'PENDING_OTP' | 'ACTIVE' | 'SUSPENDED';

export interface Contractor {
  id: string;
  member_code: string;        // ID Member digital (misal: KTR-2026-0001)
  registered_store_id: string;// Mengunci asal toko tempat kontraktor mendaftar
  full_name: string;
  phone_wa: string;
  specialty: string;          // Sipil, Interior, ME, Renovasi, Atap & Baja Ringan, dll.
  points_balance: number;     // Cache saldo poin aktif
  tier_level: TierLevel;
  status: ContractorStatus;
  created_at: string;
  updated_at: string;
}

// 3. Pengelola Backoffice CSA (users_admin)
export type AdminRole = 'SUPERADMIN' | 'VERIFIER' | 'ANALYST';

export interface UserAdmin {
  id: string;
  name: string;
  email: string;
  phone_wa?: string;
  role: AdminRole;
  created_at: string;
}

export type ActorType = 'CONTRACTOR' | 'STORE' | 'ADMIN';

export interface AuthSession {
  actorType: ActorType;
  user: Contractor | Store | UserAdmin;
  token: string;
}

// 6. Master Produk CSA (products_csa)
export interface ProductCSA {
  id: string;
  sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  ocr_keywords: string[];     // Kata kunci singkatan nota untuk pencocokan otomatis
  base_point_multiplier: number; // Pengali poin khusus jika ada promo
  unit_price_estimate: number;
}

// 4. Header Struk Belanja (receipts)
export type ReceiptStatus = 'PENDING' | 'PROCESSING_OCR' | 'APPROVED' | 'REJECTED';

export interface Receipt {
  id: string;
  contractor_id: string;
  store_id: string;
  receipt_number: string;
  receipt_date: string;
  image_url: string;
  image_hash: string;         // SHA-256 hash untuk mencegah upload foto kembar persis
  ocr_raw_json?: Record<string, any>;
  total_gross_amount: number;
  total_eligible_amount: number;
  points_earned: number;
  status: ReceiptStatus;
  store_confirmed?: boolean;  // Validasi dari pemilik toko (Opsi A)
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

// 5. Detail Item Belanja pada Struk (receipt_items)
export interface ReceiptItem {
  id: string;
  receipt_id: string;
  product_id?: string;        // Terisi jika cocok dengan products_csa.id
  raw_item_name: string;      // Teks asli nota
  qty: number;
  unit_price: number;
  subtotal: number;
  is_eligible: boolean;       // Dihitung dalam perolehan poin
}

// 7. Aturan Promo & Konversi Poin CSA (campaigns_promo)
export type RuleType = 'NOMINAL_CONVERSION' | 'PRODUCT_BONUS' | 'TIER_MULTIPLIER';

export interface CampaignPromo {
  id: string;
  title: string;
  rule_type: RuleType;
  min_transaction_amount: number;
  conversion_rate_amount: number; // Misal: 100000 (setiap kelipatan Rp 100.000)
  points_rewarded: number;        // Misal: 10 poin
  sku_target?: string;            // Jika PRODUCT_BONUS
  multiplier?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

// 8. Buku Besar Mutasi Poin (point_ledgers) - Immutable
export type LedgerType = 'EARN_RECEIPT' | 'BONUS_PROMO' | 'REDEEM_REWARD' | 'ADJUSTMENT_ADMIN' | 'EXPIRED';

export interface PointLedger {
  id: string;
  contractor_id: string;
  type: LedgerType;
  reference_id?: string;
  amount: number;             // Positif (+) saat dapat poin, Negatif (-) saat redeem
  balance_after: number;
  description: string;
  created_at: string;
}

// 9. Katalog Hadiah Penukaran Poin (rewards)
export interface Reward {
  id: string;
  name: string;
  category: 'E-WALLET' | 'ALAT_KERJA' | 'VOUCHER' | 'MERCHANDISE';
  points_required: number;
  stock_qty: number;
  image_url: string;
  description: string;
  is_active: boolean;
}

// 10. Transaksi Penukaran Poin (redemptions)
export type RedemptionStatus = 'REQUESTED' | 'APPROVED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface Redemption {
  id: string;
  contractor_id: string;
  reward_id: string;
  points_used: number;
  status: RedemptionStatus;
  delivery_info: {
    recipient_name: string;
    phone_wa: string;
    type: 'E-WALLET' | 'ALAMAT_PENGIRIMAN';
    target_wallet?: string; // GoPay, OVO, DANA
    target_account_number?: string;
    delivery_address?: string;
    notes?: string;
  };
  tracking_number?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
}

// Anti-Fraud composite check result
export interface AntiFraudCheckResult {
  isDuplicateHash: boolean;
  hasCompositeWarning: boolean;
  compositeWarningMessage?: string;
  duplicateReceiptId?: string;
  confidenceScore: number;
}

export const MEMBERSHIP_SCHEMA_VERSION = '1.0.0';
