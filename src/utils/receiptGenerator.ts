/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatRupiah } from './formatters.ts';

export interface ReceiptTicketData {
  storeName: string;
  storeAddress: string;
  receiptNumber: string;
  receiptDate: string;
  cashierName?: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
    isCSA?: boolean;
  }>;
  total: number;
  fraudWarningNotice?: string;
}

/**
 * Generates an SVG data URI representing a printed dot-matrix/thermal receipt
 */
export function generateReceiptSvgDataUrl(data: ReceiptTicketData): string {
  const itemRows = data.items.map((item, idx) => {
    const yBase = 160 + idx * 26;
    const itemTruncated = item.name.length > 22 ? item.name.substring(0, 20) + '..' : item.name;
    const csaStar = item.isCSA ? ' [CSA]' : '';
    return `
      <text x="25" y="${yBase}" font-family="Courier, monospace" font-size="12" fill="#1e293b" font-weight="bold">${itemTruncated}${csaStar}</text>
      <text x="25" y="${yBase + 13}" font-family="Courier, monospace" font-size="11" fill="#64748b">${item.qty} x ${formatRupiah(item.price)}</text>
      <text x="355" y="${yBase + 13}" font-family="Courier, monospace" font-size="12" fill="#0f172a" text-anchor="end" font-weight="bold">${formatRupiah(item.subtotal)}</text>
    `;
  }).join('');

  const totalY = 180 + data.items.length * 26;
  const height = totalY + 140;

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="380" height="${height}" viewBox="0 0 380 ${height}">
      <defs>
        <filter id="paper-shadow" x="-5%" y="-2%" width="110%" height="104%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.12"/>
        </filter>
        <pattern id="dot-matrix" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#f1f5f9"/>
        </pattern>
      </defs>

      <!-- Receipt Paper with zigzag perforated top and bottom -->
      <path d="M 15 20 
               L 365 20 
               L 365 ${height - 20} 
               L 15 ${height - 20} Z" 
            fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#paper-shadow)"/>
      <rect x="15" y="20" width="350" height="${height - 40}" fill="url(#dot-matrix)" opacity="0.3"/>

      <!-- Store Header -->
      <text x="190" y="52" font-family="'Courier New', Courier, monospace" font-size="16" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="1">
        ${data.storeName.toUpperCase()}
      </text>
      <text x="190" y="70" font-family="'Courier New', Courier, monospace" font-size="10" fill="#475569" text-anchor="middle">
        ${data.storeAddress}
      </text>

      <line x1="25" y1="84" x2="355" y2="84" stroke="#64748b" stroke-dasharray="3,3" stroke-width="1.2"/>

      <!-- Meta info -->
      <text x="25" y="102" font-family="Courier, monospace" font-size="11" fill="#334155">No: <tspan font-weight="bold">${data.receiptNumber}</tspan></text>
      <text x="355" y="102" font-family="Courier, monospace" font-size="11" fill="#334155" text-anchor="end">Tgl: ${data.receiptDate}</text>
      <text x="25" y="120" font-family="Courier, monospace" font-size="11" fill="#64748b">Kasir: ${data.cashierName || 'Kasir #01'}</text>
      <text x="355" y="120" font-family="Courier, monospace" font-size="10" fill="#0284c7" text-anchor="end" font-weight="bold">● STRUK ASLI TOKO</text>

      <line x1="25" y1="135" x2="355" y2="135" stroke="#0f172a" stroke-width="1.5"/>

      <!-- Items Section -->
      ${itemRows}

      <line x1="25" y1="${totalY}" x2="355" y2="${totalY}" stroke="#0f172a" stroke-width="1.5"/>

      <!-- Total -->
      <text x="25" y="${totalY + 24}" font-family="'Courier New', Courier, monospace" font-size="14" font-weight="900" fill="#0f172a">TOTAL BELANJA</text>
      <text x="355" y="${totalY + 24}" font-family="'Courier New', Courier, monospace" font-size="16" font-weight="900" fill="#0f172a" text-anchor="end">${formatRupiah(data.total)}</text>

      <!-- Stamp LUNAS -->
      <g transform="translate(240, ${totalY + 35}) rotate(-10)">
        <rect x="0" y="0" width="105" height="34" rx="4" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="1,1"/>
        <text x="52" y="23" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#dc2626" text-anchor="middle" letter-spacing="2">L U N A S</text>
      </g>

      <!-- Barcode simulation -->
      <g transform="translate(60, ${totalY + 45})">
        <rect x="0" y="0" width="2" height="22" fill="#0f172a"/>
        <rect x="4" y="0" width="3" height="22" fill="#0f172a"/>
        <rect x="9" y="0" width="1" height="22" fill="#0f172a"/>
        <rect x="12" y="0" width="4" height="22" fill="#0f172a"/>
        <rect x="18" y="0" width="2" height="22" fill="#0f172a"/>
        <rect x="23" y="0" width="1" height="22" fill="#0f172a"/>
        <rect x="26" y="0" width="3" height="22" fill="#0f172a"/>
        <rect x="31" y="0" width="2" height="22" fill="#0f172a"/>
        <rect x="35" y="0" width="1" height="22" fill="#0f172a"/>
        <rect x="39" y="0" width="3" height="22" fill="#0f172a"/>
        <rect x="44" y="0" width="2" height="22" fill="#0f172a"/>
        <rect x="48" y="0" width="4" height="22" fill="#0f172a"/>
        <rect x="54" y="0" width="1" height="22" fill="#0f172a"/>
        <rect x="58" y="0" width="3" height="22" fill="#0f172a"/>
        <rect x="63" y="0" width="2" height="22" fill="#0f172a"/>
        <rect x="67" y="0" width="1" height="22" fill="#0f172a"/>
        <rect x="71" y="0" width="3" height="22" fill="#0f172a"/>
        <rect x="76" y="0" width="4" height="22" fill="#0f172a"/>
        <rect x="82" y="0" width="2" height="22" fill="#0f172a"/>
        <rect x="86" y="0" width="1" height="22" fill="#0f172a"/>
        <rect x="90" y="0" width="3" height="22" fill="#0f172a"/>
        <rect x="95" y="0" width="2" height="22" fill="#0f172a"/>
        <rect x="100" y="0" width="4" height="22" fill="#0f172a"/>
      </g>

      <text x="190" y="${totalY + 86}" font-family="Courier, monospace" font-size="10" fill="#64748b" text-anchor="middle">
        * TERIMA KASIH ATAS KUNJUNGAN ANDA *
      </text>
      <text x="190" y="${totalY + 100}" font-family="Courier, monospace" font-size="9" fill="#94a3b8" text-anchor="middle">
        Upload nota ini di Aplikasi Membership Kontraktor CSA untuk Poin Hadiah
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

export async function computeSha256(textOrBuffer: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(textOrBuffer);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Simple deterministic fallback hash
  let hash = 0;
  for (let i = 0; i < textOrBuffer.length; i++) {
    const char = textOrBuffer.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'hash_' + Math.abs(hash).toString(16).padStart(16, '0');
}
