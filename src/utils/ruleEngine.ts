/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CampaignPromo, ProductCSA, TierLevel } from '../types/membership.ts';

export interface CalculationItemInput {
  raw_item_name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  product_id?: string;
  is_eligible: boolean;
}

export interface PointsCalculationResult {
  totalGrossAmount: number;
  totalEligibleAmount: number;
  basePoints: number;
  productBonusPoints: number;
  tierBonusPoints: number;
  totalPoints: number;
  appliedCampaigns: string[];
}

export function calculateReceiptPoints(
  items: CalculationItemInput[],
  campaigns: CampaignPromo[],
  products: ProductCSA[],
  contractorTier: TierLevel = 'SILVER'
): PointsCalculationResult {
  const activeCampaigns = campaigns.filter(c => c.is_active);
  const totalGrossAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Filter only eligible CSA products
  const eligibleItems = items.filter(item => item.is_eligible);
  const totalEligibleAmount = eligibleItems.reduce((sum, item) => sum + item.subtotal, 0);

  let basePoints = 0;
  let productBonusPoints = 0;
  let tierBonusPoints = 0;
  const appliedCampaigns: string[] = [];

  // 1. Standard Nominal Conversion Rule
  const nominalCampaign = activeCampaigns.find(c => c.rule_type === 'NOMINAL_CONVERSION');
  if (nominalCampaign && totalEligibleAmount >= nominalCampaign.min_transaction_amount) {
    const rate = nominalCampaign.conversion_rate_amount || 100000;
    const pts = nominalCampaign.points_rewarded || 10;
    basePoints = Math.floor(totalEligibleAmount / rate) * pts;
    appliedCampaigns.push(nominalCampaign.title);
  } else if (totalEligibleAmount >= 100000) {
    // Default fallback: 100k = 10 pts
    basePoints = Math.floor(totalEligibleAmount / 100000) * 10;
  }

  // 2. Product Specific Multiplier / Bonus
  const productCampaigns = activeCampaigns.filter(c => c.rule_type === 'PRODUCT_BONUS');
  for (const item of eligibleItems) {
    if (!item.product_id) continue;
    const prod = products.find(p => p.id === item.product_id);
    if (!prod) continue;

    // Check campaign target SKU
    for (const c of productCampaigns) {
      if (c.sku_target === prod.sku_code || prod.ocr_keywords.some(k => c.title.toLowerCase().includes(k))) {
        const itemPoints = Math.floor(item.subtotal / (c.conversion_rate_amount || 100000)) * (c.points_rewarded || 10);
        const bonus = Math.floor(itemPoints * ((c.multiplier || 1.5) - 1.0));
        if (bonus > 0) {
          productBonusPoints += bonus;
          if (!appliedCampaigns.includes(c.title)) {
            appliedCampaigns.push(c.title);
          }
        }
      }
    }
  }

  // 3. Tier Multiplier
  const subtotalBeforeTier = basePoints + productBonusPoints;
  const tierCampaign = activeCampaigns.find(c => c.rule_type === 'TIER_MULTIPLIER');
  
  if (contractorTier === 'PLATINUM') {
    const multiplier = tierCampaign?.multiplier || 1.25;
    tierBonusPoints = Math.round(subtotalBeforeTier * (multiplier - 1.0));
    if (tierCampaign && !appliedCampaigns.includes(tierCampaign.title)) {
      appliedCampaigns.push(`${tierCampaign.title} (+${Math.round((multiplier - 1) * 100)}%)`);
    }
  } else if (contractorTier === 'GOLD') {
    tierBonusPoints = Math.round(subtotalBeforeTier * 0.10); // +10% for Gold
    appliedCampaigns.push('Gold Member Privilege (+10%)');
  }

  const totalPoints = basePoints + productBonusPoints + tierBonusPoints;

  return {
    totalGrossAmount,
    totalEligibleAmount,
    basePoints,
    productBonusPoints,
    tierBonusPoints,
    totalPoints,
    appliedCampaigns
  };
}
