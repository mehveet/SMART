import { InventoryItem, InventoryUnit, WasteLog } from '../types';

/**
 * Standard conversion factors to kilograms for unified mass calculations.
 * Used to avoid adding incompatible units while allowing apples-to-apples analytics.
 */
export const UNIT_TO_KG_FACTORS: Record<string, number> = {
  kg: 1.0,
  g: 0.001,
  l: 1.0, // Liquid basis (water/broth density ~ 1kg/L)
  ml: 0.001,
  portion: 0.35, // Average meal portion weight ~ 350 grams
  portions: 0.35,
  crate: 20.0, // Standard crate ~ 20kg
  crates: 20.0,
  pack: 1.0,
  packs: 1.0,
  unit: 0.5,
  units: 0.5,
  bag: 25.0, // Bulk institutional bag ~ 25kg
  bags: 25.0,
};

/**
 * Normalizes any quantity and unit to equivalent kilograms.
 */
export function normalizeToKg(quantity: number, unit: string): number {
  if (!quantity || isNaN(quantity) || quantity <= 0) return 0;
  const cleanUnit = unit.toLowerCase().trim();
  const factor = UNIT_TO_KG_FACTORS[cleanUnit] ?? 1.0;
  return Number((quantity * factor).toFixed(2));
}

/**
 * Groups items by their native unit to present an uncorrupted multi-unit summary,
 * guaranteeing incompatible units are never blindly summed into a single number.
 */
export function groupQuantitiesByUnit(
  items: Array<{ quantity: number; unit: string }>
): Record<string, number> {
  const summary: Record<string, number> = {};
  items.forEach(item => {
    const key = (item.unit || 'kg').toLowerCase().trim();
    summary[key] = (summary[key] || 0) + (Number(item.quantity) || 0);
  });
  return summary;
}

/**
 * Formats a native unit summary into human-readable text, e.g. "1,240 kg · 85 L · 12 crates"
 */
export function formatMultiUnitSummary(grouped: Record<string, number>): string {
  const parts = Object.entries(grouped).map(
    ([unit, total]) => `${total.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`
  );
  return parts.length > 0 ? parts.join(' · ') : '0 kg';
}

/**
 * Evaluates shelf life status relative to current date (2026-09-24 simulation anchor).
 */
export function evaluateShelfLife(
  expiryDateStr: string,
  referenceDateStr = '2026-09-24'
): {
  status: 'expired' | 'critical' | 'near-term' | 'safe';
  daysRemaining: number;
  label: string;
} {
  const refDate = new Date(referenceDateStr);
  refDate.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDateStr);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - refDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      daysRemaining: diffDays,
      label: `Expired (${Math.abs(diffDays)}d ago)`,
    };
  }
  if (diffDays <= 1) {
    return {
      status: 'critical',
      daysRemaining: diffDays,
      label: diffDays === 0 ? 'Expires Today (<12h)' : 'Expires Tomorrow (<24h)',
    };
  }
  if (diffDays <= 3) {
    return {
      status: 'near-term',
      daysRemaining: diffDays,
      label: `Near Expiry (${diffDays}d left)`,
    };
  }
  return {
    status: 'safe',
    daysRemaining: diffDays,
    label: `Safe (${diffDays}d left)`,
  };
}

/**
 * Sorts inventory items by First Expired, First Out (FEFO) principle
 * and attaches actionable rotation recommendations.
 */
export function applyFEFORotation(items: InventoryItem[]): InventoryItem[] {
  // Sort ascending by expiry date (oldest/soonest expiry first)
  const sorted = [...items].sort((a, b) => {
    const timeA = new Date(a.expiryDate).getTime();
    const timeB = new Date(b.expiryDate).getTime();
    return timeA - timeB;
  });

  return sorted.map((item, index) => {
    const { status, daysRemaining } = evaluateShelfLife(item.expiryDate);
    let recommendation = item.fefoRecommendation;

    if (!recommendation) {
      if (status === 'expired') {
        recommendation = 'EXPIRED: Segregate immediately. Quarantine lot for return or compost.';
      } else if (status === 'critical') {
        recommendation = `FEFO Priority #${index + 1}: High Urgency! Dispense for today’s immediate production.`;
      } else if (status === 'near-term') {
        recommendation = `FEFO Priority #${index + 1}: Next in rotation. Stage for upcoming ${daysRemaining}-day menu cycle.`;
      } else {
        recommendation = `FEFO Standard Rotation: Safe inventory lot (${daysRemaining} days remaining).`;
      }
    }

    return {
      ...item,
      shelfLifeStatus: status,
      fefoRecommendation: recommendation,
    };
  });
}
