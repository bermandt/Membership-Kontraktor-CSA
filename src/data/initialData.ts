/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  Redemption
} from '../types/membership.ts';

// 1. Master Toko Bangunan (stores)
export const initialStores: Store[] = [
  {
    id: 'store-1',
    csa_customer_id: 'CSA-CUST-8812',
    store_code: 'TOKO-MAKMUR-01',
    name: 'TB Makmur Jaya Abadi',
    owner_name: 'Haji Bambang Sutrisno',
    phone_wa: '081298765432',
    address: 'Jl. Raya Industri No. 45, Cikarang Barat',
    city: 'Bekasi',
    province: 'Jawa Barat',
    is_active: true,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'store-2',
    csa_customer_id: 'CSA-CUST-9941',
    store_code: 'TOKO-SBA-02',
    name: 'TB Sumber Bangunan Anugerah',
    owner_name: 'Ko Hendra Wijaya',
    phone_wa: '081387654321',
    address: 'Jl. Pemuda No. 128, Rawamangun',
    city: 'Jakarta Timur',
    province: 'DKI Jakarta',
    is_active: true,
    created_at: '2026-01-20T09:30:00Z',
    updated_at: '2026-01-20T09:30:00Z',
  },
  {
    id: 'store-3',
    csa_customer_id: 'CSA-CUST-7720',
    store_code: 'TOKO-MBU-03',
    name: 'CV Mega Baja & Material Utama',
    owner_name: 'Ibu Ratna Dewi',
    phone_wa: '081512345678',
    address: 'Jl. Soekarno Hatta No. 88',
    city: 'Bandung',
    province: 'Jawa Barat',
    is_active: true,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'store-4',
    csa_customer_id: 'CSA-CUST-6603',
    store_code: 'TOKO-STM-04',
    name: 'TB Sentosa Karya Mandiri',
    owner_name: 'Pak Sugeng Riyadi',
    phone_wa: '081723456789',
    address: 'Jl. Raya Bogor KM 31, Cimanggis',
    city: 'Depok',
    province: 'Jawa Barat',
    is_active: true,
    created_at: '2026-02-10T11:15:00Z',
    updated_at: '2026-02-10T11:15:00Z',
  }
];

// 6. Master Produk CSA (products_csa)
export const initialProductsCSA: ProductCSA[] = [
  {
    id: 'prod-1',
    sku_code: 'CSA-AQ-001',
    product_name: 'Aquaproof Waterproofing Abu-Abu 4kg',
    category: 'Pelapis Anti Bocor',
    brand: 'Aquaproof',
    ocr_keywords: ['aquaproof', 'aqprf', 'cat pelapis 4kg', 'aqua proof 4kg', 'waterproof csa'],
    base_point_multiplier: 1.5, // Sedang promo bonus pengali
    unit_price_estimate: 215000,
  },
  {
    id: 'prod-2',
    sku_code: 'CSA-AQ-002',
    product_name: 'Aquaproof Polyester Mesh 10cm x 10m',
    category: 'Pelapis Anti Bocor',
    brand: 'Aquaproof',
    ocr_keywords: ['poly mesh', 'polyester mesh', 'kasa aquaproof', 'mesh csa'],
    base_point_multiplier: 1.0,
    unit_price_estimate: 42000,
  },
  {
    id: 'prod-3',
    sku_code: 'CSA-SM-001',
    product_name: 'Semen Portland Composite CSA Ultra 40kg',
    category: 'Semen & Mortar',
    brand: 'CSA Cement',
    ocr_keywords: ['semen csa', 'csa ultra 40kg', 'smn csa', 'semen portland csa', 'csa cement'],
    base_point_multiplier: 1.0,
    unit_price_estimate: 68500,
  },
  {
    id: 'prod-4',
    sku_code: 'CSA-SM-002',
    product_name: 'CSA Tile Adhesive Mortar Instan 25kg',
    category: 'Semen & Mortar',
    brand: 'CSA Cement',
    ocr_keywords: ['mortar csa', 'tile adhesive', 'perekat keramik csa', 'semen instan csa'],
    base_point_multiplier: 1.2,
    unit_price_estimate: 95000,
  },
  {
    id: 'prod-5',
    sku_code: 'CSA-CT-001',
    product_name: 'Cat WeatherShield Eksterior CSA Brilliant White 20L',
    category: 'Cat & Finishing',
    brand: 'CSA Colors',
    ocr_keywords: ['weathershield csa', 'cat eksterior 20l', 'csa ws white', 'csa colors 20l'],
    base_point_multiplier: 1.2,
    unit_price_estimate: 1350000,
  },
  {
    id: 'prod-6',
    sku_code: 'CSA-PP-001',
    product_name: 'Pipa PVC CSA High-Flow AW 1/2 Inch 4M',
    category: 'Pipa & Sanitasi',
    brand: 'CSA Pipe',
    ocr_keywords: ['pipa csa 1/2', 'pvc aw 1/2 csa', 'pipa paralon csa', 'csa pipe aw'],
    base_point_multiplier: 1.0,
    unit_price_estimate: 38000,
  },
  {
    id: 'prod-7',
    sku_code: 'CSA-KR-001',
    product_name: 'Granit Tile Polished CSA Royal Ivory 60x60 (1.44m2)',
    category: 'Lantai & Dinding',
    brand: 'CSA Tile',
    ocr_keywords: ['granit 60x60', 'csa royal ivory', 'granit tile csa', 'keramik granit 60x60'],
    base_point_multiplier: 1.3,
    unit_price_estimate: 198000,
  }
];

// 2. Master Member Kontraktor (contractors)
export const initialContractors: Contractor[] = [
  {
    id: 'ktr-1',
    member_code: 'KTR-2026-0001',
    registered_store_id: 'store-1', // Terdaftar via TB Makmur Jaya Abadi
    full_name: 'Budi Santoso',
    phone_wa: '081234567890',
    specialty: 'Renovasi Rumah & Sipil',
    points_balance: 580,
    tier_level: 'GOLD',
    status: 'ACTIVE',
    created_at: '2026-01-18T14:20:00Z',
    updated_at: '2026-02-15T10:00:00Z',
  },
  {
    id: 'ktr-2',
    member_code: 'KTR-2026-0002',
    registered_store_id: 'store-2', // Terdaftar via TB Sumber Bangunan Anugerah
    full_name: 'Agus Prabowo',
    phone_wa: '085712349988',
    specialty: 'Interior & Finishing Kayu',
    points_balance: 1250,
    tier_level: 'PLATINUM',
    status: 'ACTIVE',
    created_at: '2026-01-25T11:00:00Z',
    updated_at: '2026-02-18T16:30:00Z',
  },
  {
    id: 'ktr-3',
    member_code: 'KTR-2026-0003',
    registered_store_id: 'store-1', // Terdaftar via TB Makmur Jaya Abadi
    full_name: 'Hendra Kusuma',
    phone_wa: '081987654320',
    specialty: 'Instalasi ME & Sanitasi Air',
    points_balance: 140,
    tier_level: 'SILVER',
    status: 'ACTIVE',
    created_at: '2026-02-05T09:10:00Z',
    updated_at: '2026-02-10T12:00:00Z',
  },
  {
    id: 'ktr-4',
    member_code: 'KTR-2026-0004',
    registered_store_id: 'store-3', // Terdaftar via CV Mega Baja
    full_name: 'Wawan Hermawan',
    phone_wa: '087811223344',
    specialty: 'Konstruksi Baja Ringan & Atap',
    points_balance: 320,
    tier_level: 'SILVER',
    status: 'ACTIVE',
    created_at: '2026-02-12T13:45:00Z',
    updated_at: '2026-02-14T15:20:00Z',
  }
];

// 3. Pengelola Backoffice CSA (users_admin)
export const initialAdmins: UserAdmin[] = [
  {
    id: 'adm-1',
    name: 'Faisal Siregar (Super Admin)',
    email: 'faisal.s@csagroup.co.id',
    phone_wa: '081122334455',
    role: 'SUPERADMIN',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'adm-2',
    name: 'Siti Rahmawati (Verifikator Struk)',
    email: 'siti.r@csagroup.co.id',
    phone_wa: '081133445566',
    role: 'VERIFIER',
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'adm-3',
    name: 'Dimas Prasetyo (BI & Analyst)',
    email: 'dimas.p@csagroup.co.id',
    phone_wa: '081144556677',
    role: 'ANALYST',
    created_at: '2026-01-05T00:00:00Z',
  }
];

// 7. Aturan Promo & Konversi Poin CSA (campaigns_promo)
export const initialCampaigns: CampaignPromo[] = [
  {
    id: 'camp-1',
    title: 'Program Poin Standar Kontraktor CSA 2026',
    rule_type: 'NOMINAL_CONVERSION',
    min_transaction_amount: 100000,
    conversion_rate_amount: 100000,
    points_rewarded: 10, // Setiap Rp 100.000 belanja produk CSA = 10 Poin
    start_date: '2026-01-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    is_active: true,
  },
  {
    id: 'camp-2',
    title: 'Double Point Musim Hujan: Aquaproof Series',
    rule_type: 'PRODUCT_BONUS',
    min_transaction_amount: 200000,
    conversion_rate_amount: 100000,
    points_rewarded: 20, // 2x lipat untuk kategori Aquaproof
    sku_target: 'CSA-AQ-001',
    multiplier: 2.0,
    start_date: '2026-02-01T00:00:00Z',
    end_date: '2026-04-30T23:59:59Z',
    is_active: true,
  },
  {
    id: 'camp-3',
    title: 'Loyalty Booster: Member Platinum +20% Poin',
    rule_type: 'TIER_MULTIPLIER',
    min_transaction_amount: 500000,
    conversion_rate_amount: 100000,
    points_rewarded: 12,
    multiplier: 1.2,
    start_date: '2026-01-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    is_active: true,
  }
];

// 9. Katalog Hadiah Penukaran Poin (rewards)
export const initialRewards: Reward[] = [
  {
    id: 'rew-1',
    name: 'Saldo E-Wallet GoPay / OVO Rp 100.000',
    category: 'E-WALLET',
    points_required: 100,
    stock_qty: 150,
    image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=60',
    description: 'Pencairan instan saldo digital GoPay, OVO, atau DANA ke nomor WhatsApp aktif.',
    is_active: true,
  },
  {
    id: 'rew-2',
    name: 'Saldo E-Wallet GoPay / OVO Rp 300.000',
    category: 'E-WALLET',
    points_required: 280, // Ada diskon poin paket besar
    stock_qty: 85,
    image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=60',
    description: 'Pencairan saldo digital Rp 300.000 ke akun e-wallet kontraktor.',
    is_active: true,
  },
  {
    id: 'rew-3',
    name: 'Jaket Safety Proyek Exclusive CSA',
    category: 'MERCHANDISE',
    points_required: 250,
    stock_qty: 40,
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60',
    description: 'Jaket kerja lapangan tahan angin, reflektif scotchlite malam hari, bordir logo CSA.',
    is_active: true,
  },
  {
    id: 'rew-4',
    name: 'Mesin Bor Cordless Impact Driver 20V Heavy Duty',
    category: 'ALAT_KERJA',
    points_required: 850,
    stock_qty: 18,
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60',
    description: 'Mesin bor baterai tanpa kabel 20V lengkap 2 baterai lithium dan set mata bor.',
    is_active: true,
  },
  {
    id: 'rew-5',
    name: 'Voucher Belanja Material Toko Bangunan Rp 500.000',
    category: 'VOUCHER',
    points_required: 480,
    stock_qty: 60,
    image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=60',
    description: 'Dapat digunakan langsung untuk potongan belanja material di toko tempat Anda terdaftar.',
    is_active: true,
  },
  {
    id: 'rew-6',
    name: 'Meteran Laser Digital Jarak Jauh 60 Meter',
    category: 'ALAT_KERJA',
    points_required: 420,
    stock_qty: 25,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    description: 'Alat ukur laser presisi untuk survei denah, perhitungan luas dan volume otomatis.',
    is_active: true,
  }
];

// 4. Header Struk Belanja (receipts)
export const initialReceipts: Receipt[] = [
  {
    id: 'rcp-101',
    contractor_id: 'ktr-1',
    store_id: 'store-1', // TB Makmur Jaya
    receipt_number: 'NOTA-MJ-88910',
    receipt_date: '2026-02-12',
    image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
    image_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ocr_raw_json: {
      toko: 'TB Makmur Jaya Abadi',
      no_nota: 'NOTA-MJ-88910',
      tanggal: '12-02-2026',
      kasir: 'Dewi',
      items: [
        { text: 'Aquaproof Abu 4kg x 4', harga: 215000, subtotal: 860000, csa_match: 'CSA-AQ-001' },
        { text: 'Semen CSA Ultra 40kg x 10', harga: 68500, subtotal: 685000, csa_match: 'CSA-SM-001' },
        { text: 'Paku Triplek 2 dus', harga: 25000, subtotal: 50000, csa_match: null }
      ],
      total: 1595000,
      total_csa: 1545000
    },
    total_gross_amount: 1595000,
    total_eligible_amount: 1545000,
    points_earned: 238, // Termasuk bonus double point aquaproof
    status: 'APPROVED',
    store_confirmed: true,
    verified_by: 'adm-2',
    verified_at: '2026-02-12T16:20:00Z',
    created_at: '2026-02-12T14:10:00Z',
    updated_at: '2026-02-12T16:20:00Z',
  },
  {
    id: 'rcp-102',
    contractor_id: 'ktr-2',
    store_id: 'store-2', // TB Sumber Bangunan
    receipt_number: 'SBA/2026/02/094',
    receipt_date: '2026-02-16',
    image_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=60',
    image_hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    ocr_raw_json: {
      toko: 'TB Sumber Bangunan Anugerah',
      no_nota: 'SBA/2026/02/094',
      tanggal: '16-02-2026',
      kasir: 'Kiki',
      items: [
        { text: 'Cat WeatherShield CSA 20L x 2', harga: 1350000, subtotal: 2700000, csa_match: 'CSA-CT-001' },
        { text: 'Rol Cat Ace 9 inch x 3', harga: 35000, subtotal: 105000, csa_match: null }
      ],
      total: 2805000,
      total_csa: 2700000
    },
    total_gross_amount: 2805000,
    total_eligible_amount: 2700000,
    points_earned: 324, // Platinum +20% booster
    status: 'APPROVED',
    store_confirmed: true,
    verified_by: 'adm-2',
    verified_at: '2026-02-16T18:00:00Z',
    created_at: '2026-02-16T15:30:00Z',
    updated_at: '2026-02-16T18:00:00Z',
  },
  {
    id: 'rcp-103',
    contractor_id: 'ktr-1',
    store_id: 'store-1', // TB Makmur Jaya
    receipt_number: 'NOTA-MJ-89022',
    receipt_date: '2026-02-18',
    image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=60',
    image_hash: '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
    ocr_raw_json: {
      toko: 'TB Makmur Jaya Abadi',
      no_nota: 'NOTA-MJ-89022',
      tanggal: '18-02-2026',
      kasir: 'Dewi',
      items: [
        { text: 'Aquaproof 4kg x 2', harga: 215000, subtotal: 430000, csa_match: 'CSA-AQ-001' },
        { text: 'Aquaproof Mesh 10m x 4', harga: 42000, subtotal: 168000, csa_match: 'CSA-AQ-002' },
        { text: 'Semen CSA Ultra 40kg x 5', harga: 68500, subtotal: 342500, csa_match: 'CSA-SM-001' }
      ],
      total: 940500,
      total_csa: 940500
    },
    total_gross_amount: 940500,
    total_eligible_amount: 940500,
    points_earned: 137,
    status: 'PENDING',
    store_confirmed: false, // Menunggu verifikasi
    created_at: '2026-02-18T10:15:00Z',
    updated_at: '2026-02-18T10:15:00Z',
  },
  {
    id: 'rcp-104',
    contractor_id: 'ktr-3',
    store_id: 'store-1', // TB Makmur Jaya (Belanja di toko terafiliasi)
    receipt_number: 'NOTA-MJ-89055',
    receipt_date: '2026-02-19',
    image_url: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=600&auto=format&fit=crop&q=60',
    image_hash: 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
    ocr_raw_json: {
      toko: 'TB Makmur Jaya Abadi',
      no_nota: 'NOTA-MJ-89055',
      tanggal: '19-02-2026',
      kasir: 'Rudi',
      items: [
        { text: 'Pipa PVC CSA 1/2 AW x 20 btg', harga: 38000, subtotal: 760000, csa_match: 'CSA-PP-001' },
        { text: 'Lem Pipa Isarplas x 3', harga: 12000, subtotal: 36000, csa_match: null }
      ],
      total: 796000,
      total_csa: 760000
    },
    total_gross_amount: 796000,
    total_eligible_amount: 760000,
    points_earned: 76,
    status: 'PENDING',
    store_confirmed: true, // Toko sudah konfirmasi, tinggal approval Admin CSA
    created_at: '2026-02-19T08:45:00Z',
    updated_at: '2026-02-19T09:00:00Z',
  }
];

// 5. Detail Item Belanja pada Struk (receipt_items)
export const initialReceiptItems: ReceiptItem[] = [
  {
    id: 'item-1',
    receipt_id: 'rcp-101',
    product_id: 'prod-1',
    raw_item_name: 'Aquaproof Abu 4kg',
    qty: 4,
    unit_price: 215000,
    subtotal: 860000,
    is_eligible: true,
  },
  {
    id: 'item-2',
    receipt_id: 'rcp-101',
    product_id: 'prod-3',
    raw_item_name: 'Semen CSA Ultra 40kg',
    qty: 10,
    unit_price: 68500,
    subtotal: 685000,
    is_eligible: true,
  },
  {
    id: 'item-3',
    receipt_id: 'rcp-101',
    product_id: undefined,
    raw_item_name: 'Paku Triplek 2 dus',
    qty: 2,
    unit_price: 25000,
    subtotal: 50000,
    is_eligible: false,
  },
  {
    id: 'item-4',
    receipt_id: 'rcp-102',
    product_id: 'prod-5',
    raw_item_name: 'Cat WeatherShield CSA 20L',
    qty: 2,
    unit_price: 1350000,
    subtotal: 2700000,
    is_eligible: true,
  },
  {
    id: 'item-5',
    receipt_id: 'rcp-102',
    product_id: undefined,
    raw_item_name: 'Rol Cat Ace 9 inch',
    qty: 3,
    unit_price: 35000,
    subtotal: 105000,
    is_eligible: false,
  },
  {
    id: 'item-6',
    receipt_id: 'rcp-103',
    product_id: 'prod-1',
    raw_item_name: 'Aquaproof 4kg',
    qty: 2,
    unit_price: 215000,
    subtotal: 430000,
    is_eligible: true,
  },
  {
    id: 'item-7',
    receipt_id: 'rcp-103',
    product_id: 'prod-2',
    raw_item_name: 'Aquaproof Mesh 10m',
    qty: 4,
    unit_price: 42000,
    subtotal: 168000,
    is_eligible: true,
  },
  {
    id: 'item-8',
    receipt_id: 'rcp-103',
    product_id: 'prod-3',
    raw_item_name: 'Semen CSA Ultra 40kg',
    qty: 5,
    unit_price: 68500,
    subtotal: 342500,
    is_eligible: true,
  },
  {
    id: 'item-9',
    receipt_id: 'rcp-104',
    product_id: 'prod-6',
    raw_item_name: 'Pipa PVC CSA 1/2 AW (4M)',
    qty: 20,
    unit_price: 38000,
    subtotal: 760000,
    is_eligible: true,
  },
  {
    id: 'item-10',
    receipt_id: 'rcp-104',
    product_id: undefined,
    raw_item_name: 'Lem Pipa Isarplas 45g',
    qty: 3,
    unit_price: 12000,
    subtotal: 36000,
    is_eligible: false,
  }
];

// 8. Buku Besar Mutasi Poin (point_ledgers) - Immutable ledger
export const initialPointLedgers: PointLedger[] = [
  {
    id: 'ldg-1',
    contractor_id: 'ktr-1',
    type: 'EARN_RECEIPT',
    reference_id: 'rcp-101',
    amount: 238,
    balance_after: 238,
    description: 'Poin Belanja Struk NOTA-MJ-88910 di TB Makmur Jaya (Produk CSA Rp 1.545.000)',
    created_at: '2026-02-12T16:20:00Z',
  },
  {
    id: 'ldg-2',
    contractor_id: 'ktr-1',
    type: 'BONUS_PROMO',
    reference_id: 'camp-2',
    amount: 50,
    balance_after: 288,
    description: 'Bonus Tambahan Promo Musim Hujan Aquaproof Special Februari',
    created_at: '2026-02-13T09:00:00Z',
  },
  {
    id: 'ldg-3',
    contractor_id: 'ktr-1',
    type: 'EARN_RECEIPT',
    amount: 392,
    balance_after: 680,
    description: 'Poin Belanja Struk NOTA-MJ-88740 di TB Makmur Jaya (Produk CSA Rp 2.800.000)',
    created_at: '2026-02-14T11:30:00Z',
  },
  {
    id: 'ldg-4',
    contractor_id: 'ktr-1',
    type: 'REDEEM_REWARD',
    reference_id: 'rdm-1',
    amount: -100,
    balance_after: 580,
    description: 'Penukaran Saldo GoPay Rp 100.000 (RDM-2026-001)',
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: 'ldg-5',
    contractor_id: 'ktr-2',
    type: 'EARN_RECEIPT',
    reference_id: 'rcp-102',
    amount: 324,
    balance_after: 1250,
    description: 'Poin Belanja Struk SBA/2026/02/094 di TB Sumber Bangunan (Tier Platinum +20%)',
    created_at: '2026-02-16T18:00:00Z',
  },
  {
    id: 'ldg-6',
    contractor_id: 'ktr-3',
    type: 'EARN_RECEIPT',
    amount: 140,
    balance_after: 140,
    description: 'Poin Belanja Awal Produk Pipa PVC CSA & Keramik Granit',
    created_at: '2026-02-10T12:00:00Z',
  }
];

// 10. Transaksi Penukaran Poin (redemptions)
export const initialRedemptions: Redemption[] = [
  {
    id: 'rdm-1',
    contractor_id: 'ktr-1',
    reward_id: 'rew-1', // GoPay 100k
    points_used: 100,
    status: 'COMPLETED',
    delivery_info: {
      recipient_name: 'Budi Santoso',
      phone_wa: '081234567890',
      type: 'E-WALLET',
      target_wallet: 'GoPay',
      target_account_number: '081234567890',
      notes: 'Saldo sukses ditransfer via BCA CSA Disbursement #TRX-9921',
    },
    tracking_number: 'E-WALLET-GOPAY-9921',
    processed_by: 'adm-1',
    created_at: '2026-02-15T10:00:00Z',
    updated_at: '2026-02-15T10:30:00Z',
  },
  {
    id: 'rdm-2',
    contractor_id: 'ktr-2',
    reward_id: 'rew-3', // Jaket safety
    points_used: 250,
    status: 'SHIPPED',
    delivery_info: {
      recipient_name: 'Agus Prabowo',
      phone_wa: '085712349988',
      type: 'ALAMAT_PENGIRIMAN',
      delivery_address: 'Proyek Cluster Villa Melati No. B3, Jl. Cempaka Putih Tengah, Jakarta Pusat',
      notes: 'Ukuran Jaket: XL',
    },
    tracking_number: 'JNE-REG-01192837465',
    processed_by: 'adm-2',
    created_at: '2026-02-17T11:20:00Z',
    updated_at: '2026-02-18T09:15:00Z',
  }
];

// Presets for Demo Receipts to simulate real scans
export interface DemoReceiptPreset {
  id: string;
  title: string;
  store_id: string;
  store_name: string;
  receipt_number: string;
  receipt_date: string;
  items: Array<{
    raw_name: string;
    qty: number;
    price: number;
    csa_sku?: string;
  }>;
  is_fraud_sample?: boolean;
  fraud_type?: 'DUPLICATE_HASH' | 'COMPOSITE_REPHOTO';
}

export const demoReceiptPresets: DemoReceiptPreset[] = [
  {
    id: 'demo-rcp-1',
    title: 'Nota TB Makmur Jaya (Belanja Aquaproof & Semen)',
    store_id: 'store-1',
    store_name: 'TB Makmur Jaya Abadi',
    receipt_number: 'NOTA-MJ-89114',
    receipt_date: '2026-02-20',
    items: [
      { raw_name: 'Aquaproof Waterproofing Abu 4kg', qty: 3, price: 215000, csa_sku: 'CSA-AQ-001' },
      { raw_name: 'Aquaproof Polyester Mesh 10m', qty: 2, price: 42000, csa_sku: 'CSA-AQ-002' },
      { raw_name: 'Semen Portland CSA Ultra 40kg', qty: 8, price: 68500, csa_sku: 'CSA-SM-001' },
      { raw_name: 'Kuas Cat 3 Inch Eterna', qty: 4, price: 15000 }
    ]
  },
  {
    id: 'demo-rcp-2',
    title: 'Nota TB Sumber Bangunan (Cat WeatherShield 20L)',
    store_id: 'store-2',
    store_name: 'TB Sumber Bangunan Anugerah',
    receipt_number: 'SBA/2026/02/142',
    receipt_date: '2026-02-21',
    items: [
      { raw_name: 'Cat WeatherShield CSA White 20L', qty: 2, price: 1350000, csa_sku: 'CSA-CT-001' },
      { raw_name: 'CSA Tile Adhesive Mortar 25kg', qty: 5, price: 95000, csa_sku: 'CSA-SM-002' },
      { raw_name: 'Ember Cor Hitam Anti Pecah', qty: 6, price: 12500 }
    ]
  },
  {
    id: 'demo-rcp-3',
    title: 'Nota CV Mega Baja (Granit & Pipa Conduit CSA)',
    store_id: 'store-3',
    store_name: 'CV Mega Baja & Material Utama',
    receipt_number: 'MB-INV-9904',
    receipt_date: '2026-02-22',
    items: [
      { raw_name: 'Granit Tile Polished 60x60 CSA Royal Ivory', qty: 15, price: 198000, csa_sku: 'CSA-KR-001' },
      { raw_name: 'Pipa PVC CSA High-Flow AW 1/2 (4M)', qty: 12, price: 38000, csa_sku: 'CSA-PP-001' },
      { raw_name: 'Besi Beton 10mm SNI', qty: 10, price: 82000 }
    ]
  },
  {
    id: 'demo-rcp-fraud-1',
    title: '⚠️ [Uji Anti-Fraud] Foto Struk Duplikat (Hash Sama Persis)',
    store_id: 'store-1',
    store_name: 'TB Makmur Jaya Abadi',
    receipt_number: 'NOTA-MJ-88910',
    receipt_date: '2026-02-12',
    is_fraud_sample: true,
    fraud_type: 'DUPLICATE_HASH',
    items: [
      { raw_name: 'Aquaproof Abu 4kg', qty: 4, price: 215000, csa_sku: 'CSA-AQ-001' },
      { raw_name: 'Semen CSA Ultra 40kg', qty: 10, price: 68500, csa_sku: 'CSA-SM-001' }
    ]
  },
  {
    id: 'demo-rcp-fraud-2',
    title: '🚨 [Uji Anti-Fraud] Foto Ulang Sudut Miring (Nomor & Nilai Kembar)',
    store_id: 'store-2',
    store_name: 'TB Sumber Bangunan Anugerah',
    receipt_number: 'SBA/2026/02/094',
    receipt_date: '2026-02-16',
    is_fraud_sample: true,
    fraud_type: 'COMPOSITE_REPHOTO',
    items: [
      { raw_name: 'Cat WeatherShield CSA 20L', qty: 2, price: 1350000, csa_sku: 'CSA-CT-001' },
      { raw_name: 'Rol Cat Ace 9 inch', qty: 3, price: 35000 }
    ]
  }
];
