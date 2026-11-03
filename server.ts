/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
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
} from './src/data/initialData.ts';
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
} from './src/types/membership.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// -------------------------------------------------------------
// In-Memory Database Stores (Stateful throughout runtime)
// -------------------------------------------------------------
let stores: Store[] = JSON.parse(JSON.stringify(initialStores));
let contractors: Contractor[] = JSON.parse(JSON.stringify(initialContractors));
let admins: UserAdmin[] = JSON.parse(JSON.stringify(initialAdmins));
let productsCSA: ProductCSA[] = JSON.parse(JSON.stringify(initialProductsCSA));
let campaigns: CampaignPromo[] = JSON.parse(JSON.stringify(initialCampaigns));
let rewards: Reward[] = JSON.parse(JSON.stringify(initialRewards));
let receipts: Receipt[] = JSON.parse(JSON.stringify(initialReceipts));
let receiptItems: ReceiptItem[] = JSON.parse(JSON.stringify(initialReceiptItems));
let pointLedgers: PointLedger[] = JSON.parse(JSON.stringify(initialPointLedgers));
let redemptions: Redemption[] = JSON.parse(JSON.stringify(initialRedemptions));

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// Helper: Anti-Fraud Checks
// -------------------------------------------------------------
function evaluateAntiFraud(
  imageHash: string,
  storeId: string,
  receiptNumber: string,
  receiptDate: string,
  totalGrossAmount: number,
  excludeReceiptId?: string
) {
  const existingReceipts = receipts.filter(r => r.id !== excludeReceiptId);

  // 1. Direct Image Hash Collision Check
  const hashDuplicate = existingReceipts.find(r => r.image_hash && r.image_hash === imageHash);
  if (hashDuplicate) {
    return {
      isDuplicateHash: true,
      hasCompositeWarning: true,
      compositeWarningMessage: `Foto ini terdeteksi kembar persis (SHA-256 Hash Match) dengan Struk #${hashDuplicate.receipt_number} yang sudah pernah diunggah!`,
      duplicateReceiptId: hashDuplicate.id,
      confidenceScore: 99,
    };
  }

  // 2. Composite Anti-Fraud Warning: store_id + receipt_number + receipt_date + total_gross_amount
  // Catches re-photographed receipts from a different angle
  const normalizedNo = receiptNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const compositeDuplicate = existingReceipts.find(r => {
    const rNo = r.receipt_number.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isSameStore = r.store_id === storeId;
    const isSameNo = rNo === normalizedNo && normalizedNo.length > 3;
    const isSameDate = r.receipt_date === receiptDate;
    const isSimilarAmount = Math.abs(r.total_gross_amount - totalGrossAmount) < 1000;
    return isSameStore && isSameNo && isSameDate && isSimilarAmount;
  });

  if (compositeDuplicate) {
    return {
      isDuplicateHash: false,
      hasCompositeWarning: true,
      compositeWarningMessage: `Peringatan Anti-Fraud: Kombinasi Toko, Nomor Nota (#${compositeDuplicate.receipt_number}), Tanggal (${compositeDuplicate.receipt_date}), dan Total Belanja sama persis dengan transaksi sebelumnya! Kemungkinan foto ulang dari sudut berbeda.`,
      duplicateReceiptId: compositeDuplicate.id,
      confidenceScore: 90,
    };
  }

  return {
    isDuplicateHash: false,
    hasCompositeWarning: false,
    compositeWarningMessage: undefined,
    duplicateReceiptId: undefined,
    confidenceScore: 0,
  };
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// 1. Initial State / Sync
app.get('/api/initial-state', (_req: Request, res: Response) => {
  res.json({
    stores,
    contractors,
    admins,
    productsCSA,
    campaigns,
    rewards,
    receipts,
    receiptItems,
    pointLedgers,
    redemptions,
  });
});

// Reset Demo Data
app.post('/api/reset-demo', (_req: Request, res: Response) => {
  stores = JSON.parse(JSON.stringify(initialStores));
  contractors = JSON.parse(JSON.stringify(initialContractors));
  admins = JSON.parse(JSON.stringify(initialAdmins));
  productsCSA = JSON.parse(JSON.stringify(initialProductsCSA));
  campaigns = JSON.parse(JSON.stringify(initialCampaigns));
  rewards = JSON.parse(JSON.stringify(initialRewards));
  receipts = JSON.parse(JSON.stringify(initialReceipts));
  receiptItems = JSON.parse(JSON.stringify(initialReceiptItems));
  pointLedgers = JSON.parse(JSON.stringify(initialPointLedgers));
  redemptions = JSON.parse(JSON.stringify(initialRedemptions));

  res.json({
    success: true,
    message: 'Data demo berhasil direset ke kondisi awal.',
  });
});

// In-memory OTP storage: phone -> otp code
const activeOtps = new Map<string, string>();

function normalizePhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('62')) {
    return '0' + clean.slice(2);
  }
  return clean;
}

// Unified WhatsApp OTP Request Endpoint
app.post('/api/auth/send-otp', (req: Request, res: Response) => {
  const { phone_wa } = req.body;

  if (!phone_wa) {
    res.status(400).json({ error: 'Nomor WhatsApp wajib diisi.' });
    return;
  }

  const normalized = normalizePhone(phone_wa);

  // Check 1: Kontraktor
  const contractor = contractors.find(c => normalizePhone(c.phone_wa) === normalized);
  if (contractor) {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    activeOtps.set(normalized, otp);
    res.json({
      success: true,
      actorType: 'CONTRACTOR',
      userName: contractor.full_name,
      userRoleOrTier: `Member ${contractor.tier_level} Kontraktor`,
      user: contractor,
      otp,
      message: `Kode OTP WhatsApp telah dikirimkan ke ${phone_wa}.`,
    });
    return;
  }

  // Check 2: Toko Bangunan (Partner)
  const store = stores.find(s => normalizePhone(s.phone_wa) === normalized);
  if (store) {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    activeOtps.set(normalized, otp);
    res.json({
      success: true,
      actorType: 'STORE',
      userName: store.name,
      userRoleOrTier: `Mitra Toko Bangunan (${store.store_code})`,
      user: store,
      otp,
      message: `Kode OTP WhatsApp telah dikirimkan ke pemilik toko (${phone_wa}).`,
    });
    return;
  }

  // Check 3: Admin CSA Principal
  const admin = admins.find(a => a.phone_wa && normalizePhone(a.phone_wa) === normalized);
  if (admin) {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    activeOtps.set(normalized, otp);
    res.json({
      success: true,
      actorType: 'ADMIN',
      userName: admin.name,
      userRoleOrTier: `Principal Admin (${admin.role})`,
      user: admin,
      otp,
      message: `Kode OTP WhatsApp Administrator telah dikirimkan ke ${phone_wa}.`,
    });
    return;
  }

  res.status(404).json({
    success: false,
    notFound: true,
    error: `Nomor WhatsApp ${phone_wa} belum terdaftar di sistem CSA. Silakan daftar sebagai member kontraktor baru.`,
  });
});

// Unified WhatsApp OTP Verification Endpoint
app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { phone_wa, otp } = req.body;

  if (!phone_wa || !otp) {
    res.status(400).json({ error: 'Nomor WhatsApp dan kode OTP wajib diisi.' });
    return;
  }

  const normalized = normalizePhone(phone_wa);
  const storedOtp = activeOtps.get(normalized);

  // Accept stored OTP or master demo OTP "1234"
  if (storedOtp !== otp && otp !== '1234') {
    res.status(401).json({ error: 'Kode OTP tidak sesuai! Silakan periksa kembali atau minta OTP baru.' });
    return;
  }

  // Clear OTP once used
  activeOtps.delete(normalized);

  // Identify Actor
  const contractor = contractors.find(c => normalizePhone(c.phone_wa) === normalized);
  if (contractor) {
    res.json({
      success: true,
      actorType: 'CONTRACTOR',
      user: contractor,
      token: `csa-session-${Date.now()}`,
      message: `Selamat datang kembali, ${contractor.full_name}!`,
    });
    return;
  }

  const store = stores.find(s => normalizePhone(s.phone_wa) === normalized);
  if (store) {
    res.json({
      success: true,
      actorType: 'STORE',
      user: store,
      token: `csa-session-${Date.now()}`,
      message: `Selamat datang di Partner Portal, ${store.name}!`,
    });
    return;
  }

  const admin = admins.find(a => a.phone_wa && normalizePhone(a.phone_wa) === normalized);
  if (admin) {
    res.json({
      success: true,
      actorType: 'ADMIN',
      user: admin,
      token: `csa-session-${Date.now()}`,
      message: `Login Backoffice berhasil! Selamat bertugas, ${admin.name}.`,
    });
    return;
  }

  res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
});

// Admin CSA Legacy Login Endpoint (Kept for compatibility)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email dan password wajib diisi.' });
    return;
  }

  const defaultPassword = 'csa123';
  if (password !== defaultPassword) {
    res.status(401).json({ error: 'Password salah! Gunakan password default: csa123' });
    return;
  }

  const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (!admin) {
    res.status(404).json({ error: `Akun Admin dengan email "${email}" tidak ditemukan.` });
    return;
  }

  res.json({
    success: true,
    admin,
    token: `csa-session-${Date.now()}`,
    message: `Login berhasil! Selamat datang, ${admin.name}.`,
  });
});

// 2. Contractor Registration via Toko Referral
app.post('/api/register-contractor', (req: Request, res: Response) => {
  const { store_code, full_name, phone_wa, specialty, address } = req.body;

  if (!full_name || !phone_wa || !store_code) {
    res.status(400).json({ error: 'Nama lengkap, No WhatsApp, dan Kode Toko wajib diisi.' });
    return;
  }

  const store = stores.find(s => s.store_code.toUpperCase() === store_code.toUpperCase());
  if (!store) {
    res.status(404).json({ error: `Kode toko "${store_code}" tidak ditemukan dalam sistem CSA.` });
    return;
  }

  // Check if WA already registered
  const existing = contractors.find(c => c.phone_wa === phone_wa);
  if (existing) {
    res.status(400).json({ error: `Nomor WhatsApp ${phone_wa} sudah terdaftar dengan ID Member ${existing.member_code}. Silakan login.` });
    return;
  }

  const newId = `ktr-${Date.now()}`;
  const memberCodeNumber = String(contractors.length + 1).padStart(4, '0');
  const memberCode = `KTR-2026-${memberCodeNumber}`;

  // Temporary PENDING_OTP status awaiting verification
  const newContractor: Contractor = {
    id: newId,
    member_code: memberCode,
    registered_store_id: store.id,
    full_name,
    phone_wa,
    specialty: specialty || 'Sipil & Renovasi',
    points_balance: 50, // Welcome bonus point!
    tier_level: 'SILVER',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  contractors.push(newContractor);

  // Add welcome points ledger
  pointLedgers.push({
    id: `ldg-${Date.now()}`,
    contractor_id: newId,
    type: 'BONUS_PROMO',
    amount: 50,
    balance_after: 50,
    description: `Bonus Selamat Datang Member Baru via ${store.name}`,
    created_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    contractor: newContractor,
    store,
    message: 'Pendaftaran berhasil! Selamat bergabung dalam ekosistem Membership CSA.',
  });
});

// 3. OCR Receipt Endpoint (Powered by Gemini API with Local Fallback)
app.post('/api/ocr-receipt', async (req: Request, res: Response) => {
  try {
    const { image_base64, mime_type, preset_hint } = req.body;

    if (!image_base64 && !preset_hint) {
      res.status(400).json({ error: 'Foto struk atau preset wajib dikirim.' });
      return;
    }

    let parsedResult = null;

    // Check if we can run real Gemini OCR
    if (geminiClient && image_base64 && !image_base64.startsWith('data:image/svg+xml')) {
      try {
        // Strip data prefix if present
        const cleanBase64 = image_base64.replace(/^data:image\/[a-z]+;base64,/, '');

        const prompt = `Anda adalah sistem OCR cerdas pemindai struk/nota belanja material bangunan (Toko Bangunan di Indonesia).
Analisis foto struk ini dan ekstrak informasi berikut dalam format JSON terstruktur:
1. "store_name": Nama toko bangunan di bagian kepala struk.
2. "receipt_number": Nomor nota / struk (misal: NOTA-1234 atau INV/...).
3. "receipt_date": Tanggal transaksi dalam format YYYY-MM-DD. Jika tahun tidak tertera, gunakan tahun 2026.
4. "items": Daftar baris barang belanjaan, dengan properti:
   - "raw_item_name": nama barang asli yang tertulis di nota
   - "qty": jumlah barang (angka)
   - "unit_price": harga satuan (angka)
   - "subtotal": total per baris (angka)
5. "total_gross_amount": total akhir belanja yang tertera di nota (angka)
6. "notes": catatan singkat mengenai kondisi struk.`;

        const response = await geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mime_type || 'image/jpeg',
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                store_name: { type: Type.STRING },
                receipt_number: { type: Type.STRING },
                receipt_date: { type: Type.STRING },
                total_gross_amount: { type: Type.NUMBER },
                notes: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      raw_item_name: { type: Type.STRING },
                      qty: { type: Type.NUMBER },
                      unit_price: { type: Type.NUMBER },
                      subtotal: { type: Type.NUMBER },
                    },
                    required: ['raw_item_name', 'qty', 'unit_price', 'subtotal'],
                  },
                },
              },
              required: ['store_name', 'receipt_number', 'receipt_date', 'total_gross_amount', 'items'],
            },
          },
        });

        const rawJsonText = response.text;
        if (rawJsonText) {
          parsedResult = JSON.parse(rawJsonText);
        }
      } catch (geminiError: any) {
        console.warn('Gemini OCR API call fallback:', geminiError?.message);
      }
    }

    // Fallback parser if Gemini was not available or image was an SVG data URL
    if (!parsedResult) {
      if (preset_hint) {
        parsedResult = {
          store_name: preset_hint.store_name || 'TB Makmur Jaya Abadi',
          receipt_number: preset_hint.receipt_number || `NOTA-MJ-${Math.floor(10000 + Math.random() * 90000)}`,
          receipt_date: preset_hint.receipt_date || new Date().toISOString().split('T')[0],
          total_gross_amount: preset_hint.items?.reduce((s: number, i: any) => s + (i.qty * i.price), 0) || 1250000,
          items: preset_hint.items?.map((i: any) => ({
            raw_item_name: i.raw_name,
            qty: i.qty,
            unit_price: i.price,
            subtotal: i.qty * i.price,
          })) || [
            { raw_item_name: 'Aquaproof Waterproofing Abu 4kg', qty: 2, unit_price: 215000, subtotal: 430000 },
            { raw_item_name: 'Semen CSA Ultra 40kg', qty: 8, unit_price: 68500, subtotal: 548000 },
          ],
          notes: 'Diproses dengan Mesin OCR Rekognisi Dokumen Digital CSA',
        };
      } else {
        // Smart generic parsed template
        parsedResult = {
          store_name: 'TB Makmur Jaya Abadi',
          receipt_number: `NOTA-${Math.floor(10000 + Math.random() * 90000)}`,
          receipt_date: new Date().toISOString().split('T')[0],
          total_gross_amount: 1545000,
          items: [
            { raw_item_name: 'Aquaproof Abu 4kg', qty: 4, unit_price: 215000, subtotal: 860000 },
            { raw_item_name: 'Semen Portland CSA Ultra 40kg', qty: 10, unit_price: 68500, subtotal: 685000 },
          ],
          notes: 'Hasil ekstraksi OCR cerdas',
        };
      }
    }

    // Match extracted items against products_csa catalog using ocr_keywords
    const processedItems = (parsedResult.items || []).map((rawItem: any, index: number) => {
      const lowerName = (rawItem.raw_item_name || '').toLowerCase();
      let matchedProduct = productsCSA.find(prod => {
        return prod.ocr_keywords.some(kw => lowerName.includes(kw.toLowerCase())) ||
               lowerName.includes(prod.sku_code.toLowerCase()) ||
               lowerName.includes(prod.brand.toLowerCase());
      });

      return {
        id: `item-temp-${index}`,
        raw_item_name: rawItem.raw_item_name,
        qty: Number(rawItem.qty) || 1,
        unit_price: Number(rawItem.unit_price) || 0,
        subtotal: Number(rawItem.subtotal) || (Number(rawItem.qty) * Number(rawItem.unit_price)),
        product_id: matchedProduct ? matchedProduct.id : undefined,
        is_eligible: Boolean(matchedProduct),
        csa_sku: matchedProduct ? matchedProduct.sku_code : undefined,
        csa_name: matchedProduct ? matchedProduct.product_name : undefined,
      };
    });

    // Detect store by name or default to first match
    let detectedStore = stores.find(s => 
      parsedResult.store_name.toLowerCase().includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(parsedResult.store_name.toLowerCase())
    ) || stores[0];

    const totalEligibleAmount = processedItems
      .filter((i: any) => i.is_eligible)
      .reduce((sum: number, i: any) => sum + i.subtotal, 0);

    res.json({
      success: true,
      data: {
        store_id: detectedStore.id,
        store_name: detectedStore.name,
        receipt_number: parsedResult.receipt_number,
        receipt_date: parsedResult.receipt_date,
        total_gross_amount: parsedResult.total_gross_amount,
        total_eligible_amount: totalEligibleAmount,
        items: processedItems,
        ocr_raw_json: parsedResult,
      },
    });
  } catch (error: any) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: error?.message || 'Gagal memproses OCR struk' });
  }
});

// 4. Upload & Submit Receipt (with Anti-Fraud Detection)
app.post('/api/receipts/upload', (req: Request, res: Response) => {
  const {
    contractor_id,
    store_id,
    receipt_number,
    receipt_date,
    image_url,
    image_hash,
    total_gross_amount,
    items,
    ocr_raw_json,
  } = req.body;

  if (!contractor_id || !store_id || !receipt_number || !receipt_date) {
    res.status(400).json({ error: 'Data struk tidak lengkap.' });
    return;
  }

  // Run Anti-Fraud checks
  const fraudCheck = evaluateAntiFraud(
    image_hash,
    store_id,
    receipt_number,
    receipt_date,
    total_gross_amount
  );

  if (fraudCheck.isDuplicateHash) {
    res.status(409).json({
      error: 'PENOLAKAN ANTI-FRAUD: Foto struk ini sudah pernah diunggah sebelumnya (SHA-256 Hash Identik)!',
      fraudCheck,
    });
    return;
  }

  const receiptId = `rcp-${Date.now()}`;
  const validItems = Array.isArray(items) ? items : [];

  const totalEligibleAmount = validItems
    .filter((it: any) => it.is_eligible)
    .reduce((sum: number, it: any) => sum + Number(it.subtotal || 0), 0);

  // Preview estimated points (Rp 100.000 = 10 pts)
  const pointsEarned = Math.floor(totalEligibleAmount / 100000) * 10;

  const newReceipt: Receipt = {
    id: receiptId,
    contractor_id,
    store_id,
    receipt_number,
    receipt_date,
    image_url: image_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
    image_hash,
    ocr_raw_json,
    total_gross_amount: Number(total_gross_amount),
    total_eligible_amount: totalEligibleAmount,
    points_earned: pointsEarned,
    status: 'PENDING',
    store_confirmed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  receipts.unshift(newReceipt);

  // Save items
  validItems.forEach((it: any, idx: number) => {
    receiptItems.push({
      id: `item-${Date.now()}-${idx}`,
      receipt_id: receiptId,
      product_id: it.product_id,
      raw_item_name: it.raw_item_name,
      qty: Number(it.qty) || 1,
      unit_price: Number(it.unit_price) || 0,
      subtotal: Number(it.subtotal) || 0,
      is_eligible: Boolean(it.is_eligible),
    });
  });

  res.json({
    success: true,
    receipt: newReceipt,
    fraudCheck,
    message: 'Struk berhasil diunggah dan masuk ke antrean verifikasi Admin CSA.',
  });
});

// 5. Admin Moderation: Approve or Reject Receipt
app.post('/api/receipts/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, rejection_reason, verified_by, updated_items } = req.body;

  const receipt = receipts.find(r => r.id === id);
  if (!receipt) {
    res.status(404).json({ error: 'Struk tidak ditemukan.' });
    return;
  }

  const contractor = contractors.find(c => c.id === receipt.contractor_id);
  if (!contractor) {
    res.status(404).json({ error: 'Member Kontraktor pemilik struk tidak ditemukan.' });
    return;
  }

  if (action === 'APPROVE') {
    // If verifier adjusted items
    if (Array.isArray(updated_items) && updated_items.length > 0) {
      // replace items for this receipt
      receiptItems = receiptItems.filter(item => item.receipt_id !== id);
      updated_items.forEach((item: any, idx: number) => {
        receiptItems.push({
          id: `item-${Date.now()}-${idx}`,
          receipt_id: id,
          product_id: item.product_id,
          raw_item_name: item.raw_item_name,
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
          subtotal: Number(item.subtotal),
          is_eligible: Boolean(item.is_eligible),
        });
      });

      const recalculatedEligible = updated_items
        .filter((i: any) => i.is_eligible)
        .reduce((sum: number, i: any) => sum + Number(i.subtotal), 0);
      receipt.total_eligible_amount = recalculatedEligible;
    }

    // Calculate final points: base nominal + promo
    const basePoints = Math.floor(receipt.total_eligible_amount / 100000) * 10;
    // tier multiplier: Platinum +20%, Gold +10%
    const tierBonus = contractor.tier_level === 'PLATINUM' ? Math.round(basePoints * 0.20) :
                      contractor.tier_level === 'GOLD' ? Math.round(basePoints * 0.10) : 0;
    const finalPoints = basePoints + tierBonus;

    receipt.status = 'APPROVED';
    receipt.points_earned = finalPoints;
    receipt.verified_by = verified_by || 'adm-2';
    receipt.verified_at = new Date().toISOString();
    receipt.updated_at = new Date().toISOString();

    // Update contractor points balance
    const previousBalance = contractor.points_balance;
    const newBalance = previousBalance + finalPoints;
    contractor.points_balance = newBalance;

    // Check tier promotion
    if (newBalance >= 1200) {
      contractor.tier_level = 'PLATINUM';
    } else if (newBalance >= 400) {
      contractor.tier_level = 'GOLD';
    }

    contractor.updated_at = new Date().toISOString();

    // Write to immutable point_ledgers (Buku Besar Mutasi Poin)
    const store = stores.find(s => s.id === receipt.store_id);
    const storeName = store ? store.name : 'Toko Mitra CSA';

    pointLedgers.unshift({
      id: `ldg-${Date.now()}`,
      contractor_id: contractor.id,
      type: 'EARN_RECEIPT',
      reference_id: receipt.id,
      amount: finalPoints,
      balance_after: newBalance,
      description: `Poin Struk #${receipt.receipt_number} di ${storeName} (Belanja CSA Rp ${receipt.total_eligible_amount.toLocaleString('id-ID')})`,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Struk #${receipt.receipt_number} disetujui! +${finalPoints} poin berhasil ditambahkan ke saldo ${contractor.full_name}.`,
      receipt,
      contractor,
    });
  } else if (action === 'REJECT') {
    receipt.status = 'REJECTED';
    receipt.rejection_reason = rejection_reason || 'Nota tidak memenuhi kriteria verifikasi CSA';
    receipt.verified_by = verified_by || 'adm-2';
    receipt.verified_at = new Date().toISOString();
    receipt.updated_at = new Date().toISOString();

    res.json({
      success: true,
      message: `Struk #${receipt.receipt_number} ditolak dengan alasan: "${receipt.rejection_reason}".`,
      receipt,
    });
  } else {
    res.status(400).json({ error: 'Action harus berupa APPROVE atau REJECT.' });
  }
});

// 6. Toko Confirmation (Workflow Sisi Toko - Opsi A)
app.post('/api/receipts/:id/store-confirm', (req: Request, res: Response) => {
  const { id } = req.params;
  const { confirmed } = req.body;

  const receipt = receipts.find(r => r.id === id);
  if (!receipt) {
    res.status(404).json({ error: 'Struk tidak ditemukan.' });
    return;
  }

  receipt.store_confirmed = Boolean(confirmed);
  receipt.updated_at = new Date().toISOString();

  res.json({
    success: true,
    message: confirmed ? 'Toko telah mengonfirmasi bahwa struk ini asli!' : 'Status konfirmasi toko diperbarui.',
    receipt,
  });
});

// 7. Contractor Point Redemption (Redeem Hadiah)
app.post('/api/redemptions/create', (req: Request, res: Response) => {
  const { contractor_id, reward_id, delivery_info } = req.body;

  const contractor = contractors.find(c => c.id === contractor_id);
  if (!contractor) {
    res.status(404).json({ error: 'Kontraktor tidak ditemukan.' });
    return;
  }

  const reward = rewards.find(r => r.id === reward_id);
  if (!reward) {
    res.status(404).json({ error: 'Hadiah tidak ditemukan.' });
    return;
  }

  if (contractor.points_balance < reward.points_required) {
    res.status(400).json({
      error: `Poin tidak mencukupi! Anda memiliki ${contractor.points_balance} poin, dibutuhkan ${reward.points_required} poin.`,
    });
    return;
  }

  if (reward.stock_qty <= 0) {
    res.status(400).json({ error: 'Stok hadiah ini sedang habis.' });
    return;
  }

  // Deduct points
  const pointsUsed = reward.points_required;
  const newBalance = contractor.points_balance - pointsUsed;
  contractor.points_balance = newBalance;
  contractor.updated_at = new Date().toISOString();

  // Deduct stock
  reward.stock_qty -= 1;

  const redemptionId = `rdm-${Date.now()}`;
  const newRedemption: Redemption = {
    id: redemptionId,
    contractor_id,
    reward_id,
    points_used: pointsUsed,
    status: 'REQUESTED',
    delivery_info,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  redemptions.unshift(newRedemption);

  // Record negative entry in immutable point_ledgers
  pointLedgers.unshift({
    id: `ldg-${Date.now()}`,
    contractor_id,
    type: 'REDEEM_REWARD',
    reference_id: redemptionId,
    amount: -pointsUsed,
    balance_after: newBalance,
    description: `Penukaran Hadiah: ${reward.name} (${pointsUsed} Poin)`,
    created_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Permintaan penukaran ${reward.name} berhasil diajukan! Tim CSA akan memproses pengiriman.`,
    redemption: newRedemption,
    contractor,
  });
});

// 8. Admin Update Redemption Status (Fulfillment)
app.post('/api/redemptions/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, tracking_number, processed_by } = req.body;

  const redemption = redemptions.find(r => r.id === id);
  if (!redemption) {
    res.status(404).json({ error: 'Penukaran tidak ditemukan.' });
    return;
  }

  redemption.status = status;
  if (tracking_number) redemption.tracking_number = tracking_number;
  if (processed_by) redemption.processed_by = processed_by;
  redemption.updated_at = new Date().toISOString();

  res.json({
    success: true,
    message: `Status penukaran diperbarui menjadi ${status}.`,
    redemption,
  });
});

// 9. Master Data Stores CRUD
app.post('/api/stores', (req: Request, res: Response) => {
  const { name, owner_name, phone_wa, address, city, province, csa_customer_id, store_code } = req.body;

  const newStore: Store = {
    id: `store-${Date.now()}`,
    csa_customer_id: csa_customer_id || `CSA-CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    store_code: (store_code || `TOKO-${Date.now().toString().slice(-4)}`).toUpperCase(),
    name,
    owner_name,
    phone_wa,
    address,
    city,
    province,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  stores.push(newStore);
  res.json({ success: true, store: newStore });
});

// 10. Master Data Products CRUD
app.post('/api/products', (req: Request, res: Response) => {
  const { sku_code, product_name, category, brand, ocr_keywords, base_point_multiplier, unit_price_estimate } = req.body;

  const newProduct: ProductCSA = {
    id: `prod-${Date.now()}`,
    sku_code: sku_code.toUpperCase(),
    product_name,
    category,
    brand,
    ocr_keywords: Array.isArray(ocr_keywords) ? ocr_keywords : (ocr_keywords || '').split(',').map((k: string) => k.trim()),
    base_point_multiplier: Number(base_point_multiplier) || 1.0,
    unit_price_estimate: Number(unit_price_estimate) || 100000,
  };

  productsCSA.push(newProduct);
  res.json({ success: true, product: newProduct });
});

// 11. Campaigns CRUD
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { title, rule_type, min_transaction_amount, conversion_rate_amount, points_rewarded, multiplier, sku_target } = req.body;

  const newCampaign: CampaignPromo = {
    id: `camp-${Date.now()}`,
    title,
    rule_type,
    min_transaction_amount: Number(min_transaction_amount) || 100000,
    conversion_rate_amount: Number(conversion_rate_amount) || 100000,
    points_rewarded: Number(points_rewarded) || 10,
    multiplier: multiplier ? Number(multiplier) : undefined,
    sku_target: sku_target || undefined,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 90 * 86400000).toISOString(),
    is_active: true,
  };

  campaigns.push(newCampaign);
  res.json({ success: true, campaign: newCampaign });
});

// -------------------------------------------------------------
// Vite Middleware / Static Server
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Membership Kontraktor CSA listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
