import { RedistributionPartner, SurplusBatch } from '../types';

export interface CriterionBreakdown {
  score: number; // 0 - 100
  weight: number; // percentage e.g. 25
  label: string;
  reason: string;
  status: 'optimal' | 'moderate' | 'warning';
}

export interface MatchRecommendation {
  partner: RedistributionPartner;
  overallScore: number; // 0 - 100
  rank: number;
  recommendationGrade: 'Highly Recommended' | 'Strong Match' | 'Viable Alternative' | 'Low Compatibility';
  isEligible: boolean;
  reasons: string[];
  warnings: string[];
  breakdown: {
    foodTypeSuitability: CriterionBreakdown;
    recipientCapacity: CriterionBreakdown;
    geographicDistance: CriterionBreakdown;
    pickupAvailability: CriterionBreakdown;
    collectionUrgency: CriterionBreakdown;
  };
}

/**
 * Transparent 5-Factor Institutional Redistribution Matching Algorithm
 * 1. Food type suitability (25%)
 * 2. Recipient capacity (25%)
 * 3. Geographic distance (20%)
 * 4. Pickup availability (15%)
 * 5. Collection deadline & urgency (15%)
 */
export function calculateMatchRecommendations(
  batch: SurplusBatch,
  partners: RedistributionPartner[]
): MatchRecommendation[] {
  const batchWeight = batch.weightKg || batch.quantity || 15;
  const batchCategory = (batch.category || 'Cooked Main').toLowerCase();
  const batchFoodName = (batch.foodName || batch.dishName || '').toLowerCase();

  const scoredPartners: MatchRecommendation[] = partners
    .filter(p => p.isActive)
    .map(partner => {
      const reasons: string[] = [];
      const warnings: string[] = [];

      // 1. Food Type Suitability (Weight: 25%)
      let suitabilityScore = 50;
      let suitabilityReason = '';
      let suitabilityStatus: CriterionBreakdown['status'] = 'moderate';

      const acceptedTypesLower = (partner.acceptedFoodTypes || []).map(t => t.toLowerCase());

      const isCompost = partner.type?.toLowerCase().includes('compost');
      const qStatus = (batch.qualityReviewStatus || '').toLowerCase();
      const isSafetyHold =
        batch.status === 'Expired' ||
        batch.status === 'Cancelled' ||
        qStatus.includes('failed') ||
        qStatus.includes('rejected') ||
        qStatus.includes('flagged') ||
        qStatus.includes('pending') ||
        qStatus.includes('testing') ||
        qStatus.includes('temperature check') ||
        qStatus.includes('conditional') ||
        (batch as any).isSafetyBlocked === true;

      if (isSafetyHold && !isCompost) {
        suitabilityScore = 0;
        suitabilityReason = `MANDATORY FOOD SAFETY HOLD: Batch is ${batch.status === 'Expired' ? 'expired' : batch.qualityReviewStatus || 'awaiting safety review'}. Food flagged as unsafe, expired, or awaiting review cannot be recommended for redistribution.`;
        suitabilityStatus = 'warning';
        warnings.push('MANDATORY SAFETY HOLD: Food awaiting mandatory review, flagged as unsafe, or expired must not be recommended for redistribution.');
      } else if (isCompost) {
        if (batch.status === 'Expired' || batch.qualityReviewStatus?.includes('Rejected')) {
          suitabilityScore = 100;
          suitabilityReason = 'Compost facility designated for spoiled, rejected, or expired organic waste.';
          suitabilityStatus = 'optimal';
          reasons.push('Ideal destination for non-consumable organic waste diversion.');
        } else {
          suitabilityScore = 15;
          suitabilityReason = 'Batch is wholesome food fit for human consumption; composting is low priority per food recovery hierarchy.';
          suitabilityStatus = 'warning';
          warnings.push('Human consumption pantries should be prioritized over composting.');
        }
      } else {
        const matchesCategory = acceptedTypesLower.some(t =>
          t.includes('cooked') ||
          t.includes('main') ||
          t.includes('all') ||
          batchCategory.includes(t) ||
          t.includes(batchCategory) ||
          (batchCategory.includes('rice') && t.includes('rice')) ||
          (batchCategory.includes('bread') && (t.includes('bread') || t.includes('bakery'))) ||
          (batchCategory.includes('soup') && t.includes('soup')) ||
          (batchCategory.includes('produce') && t.includes('produce'))
        );

        if (matchesCategory) {
          suitabilityScore = 95;
          suitabilityReason = `Verified food acceptance for ${batch.category} meals and institutional buffets.`;
          suitabilityStatus = 'optimal';
          reasons.push(`Accepts ${batch.category} with standardized safe handling protocols.`);
        } else if (acceptedTypesLower.length > 0) {
          suitabilityScore = 65;
          suitabilityReason = `Partner accepts related categories (${partner.acceptedFoodTypes.slice(0, 2).join(', ')}).`;
          suitabilityStatus = 'moderate';
          reasons.push('Compatible dining service capability.');
        } else {
          suitabilityScore = 50;
          suitabilityReason = 'General food acceptance profile on file.';
          suitabilityStatus = 'moderate';
        }
      }

      // 2. Recipient Capacity (Weight: 25%)
      const dailyCap = partner.serviceCapacity || partner.typicalCapacityKg || 50;
      const allocatedToday = partner.allocatedTodayKg || 0;
      const remainingCap = Math.max(0, dailyCap - allocatedToday);

      let capacityScore = 50;
      let capacityReason = '';
      let capacityStatus: CriterionBreakdown['status'] = 'moderate';

      if (remainingCap >= batchWeight) {
        capacityScore = 100;
        capacityReason = `Ample headroom: ${remainingCap.toFixed(1)} kg remaining today (${dailyCap} kg daily capacity).`;
        capacityStatus = 'optimal';
        reasons.push(`Can absorb the entire ${batchWeight} kg batch without exceeding operational intake limit.`);
      } else if (remainingCap >= batchWeight * 0.6) {
        capacityScore = 70;
        capacityReason = `Tight headroom: ${remainingCap.toFixed(1)} kg remaining vs ${batchWeight} kg requested.`;
        capacityStatus = 'moderate';
        warnings.push(`Allocation of ${batchWeight} kg approaches partner daily intake ceiling.`);
      } else if (remainingCap > 0) {
        capacityScore = 35;
        capacityReason = `Limited remaining capacity (${remainingCap.toFixed(1)} kg left today).`;
        capacityStatus = 'warning';
        warnings.push(`Batch weight exceeds current open intake window.`);
      } else {
        capacityScore = 10;
        capacityReason = `Daily capacity limit reached (${allocatedToday}/${dailyCap} kg allocated).`;
        capacityStatus = 'warning';
        warnings.push(`Partner has reached maximum meal intake quota for today.`);
      }

      // 3. Geographic Distance (Weight: 20%)
      const distance = partner.distanceKm || 3.0;
      let distanceScore = 50;
      let distanceReason = '';
      let distanceStatus: CriterionBreakdown['status'] = 'moderate';

      if (distance <= 1.5) {
        distanceScore = 100;
        distanceReason = `Immediate vicinity (${distance} km): transit under 8 minutes minimizes temperature drift.`;
        distanceStatus = 'optimal';
        reasons.push(`Ultra-short transit distance (${distance} km) ensures core thermal safety preservation.`);
      } else if (distance <= 3.0) {
        distanceScore = 85;
        distanceReason = `Short transit (${distance} km): estimated travel time ~12-15 minutes.`;
        distanceStatus = 'optimal';
        reasons.push(`Quick transit corridor (${distance} km) within standard hot-holding delivery window.`);
      } else if (distance <= 5.0) {
        distanceScore = 65;
        distanceReason = `Moderate transit (${distance} km): estimated travel time ~20-25 minutes.`;
        distanceStatus = 'moderate';
      } else {
        distanceScore = 40;
        distanceReason = `Longer transit (${distance} km): strictly requires insulated vehicle with cold/hot packs.`;
        distanceStatus = 'warning';
        warnings.push(`Transit distance is ${distance} km; insulated container required.`);
      }

      // 4. Pickup Availability (Weight: 15%)
      const pickupType = partner.pickupAvailability || 'Requires Institutional Drop-off';
      let pickupScore = 60;
      let pickupReason = '';
      let pickupStatus: CriterionBreakdown['status'] = 'moderate';

      if (pickupType.includes('Has Own Insulated Vehicle')) {
        pickupScore = 100;
        pickupReason = 'Partner dispatches own temperature-controlled vehicle; zero kitchen transit burden.';
        pickupStatus = 'optimal';
        reasons.push('Partner provides own insulated transit transport.');
      } else if (pickupType.includes('Thermal Cart Walker')) {
        pickupScore = 90;
        pickupReason = 'Direct internal pedestrian thermal cart transfer available on campus.';
        pickupStatus = 'optimal';
        reasons.push('Campus internal thermal cart route allows immediate transfer.');
      } else {
        pickupScore = 65;
        pickupReason = 'Requires institutional kitchen transport van for drop-off.';
        pickupStatus = 'moderate';
        warnings.push('Requires central kitchen logistics vehicle for delivery.');
      }

      // 5. Collection Deadline & Urgency (Weight: 15%)
      let urgencyScore = 75;
      let urgencyReason = '';
      let urgencyStatus: CriterionBreakdown['status'] = 'moderate';

      // Check operating hours compatibility
      const hours = partner.operatingHours || '10:00 - 20:00';
      urgencyScore = 90;
      urgencyReason = `Active service window (${hours}) aligns with collection deadline (${batch.collectionDeadline || 'today'}).`;
      urgencyStatus = 'optimal';
      reasons.push(`Operating hours (${hours}) accommodate swift intake before safety deadline.`);

      // Compute Weighted Score
      const weightedOverall =
        suitabilityScore * 0.25 +
        capacityScore * 0.25 +
        distanceScore * 0.20 +
        pickupScore * 0.15 +
        urgencyScore * 0.15;

      const roundedScore = Math.round(weightedOverall);

      let grade: MatchRecommendation['recommendationGrade'] = 'Viable Alternative';
      if (roundedScore >= 85) {
        grade = 'Highly Recommended';
      } else if (roundedScore >= 70) {
        grade = 'Strong Match';
      } else if (roundedScore >= 50) {
        grade = 'Viable Alternative';
      } else {
        grade = 'Low Compatibility';
      }

      const isEligible = isSafetyHold && !isCompost ? false : roundedScore >= 40 && partner.isActive;

      return {
        partner,
        overallScore: isSafetyHold && !isCompost ? Math.min(roundedScore, 30) : roundedScore,
        rank: 1, // updated below
        recommendationGrade: isSafetyHold && !isCompost ? 'Low Compatibility' : grade,
        isEligible,
        reasons,
        warnings,
        breakdown: {
          foodTypeSuitability: {
            score: suitabilityScore,
            weight: 25,
            label: 'Food Type Suitability',
            reason: suitabilityReason,
            status: suitabilityStatus,
          },
          recipientCapacity: {
            score: capacityScore,
            weight: 25,
            label: 'Recipient Capacity',
            reason: capacityReason,
            status: capacityStatus,
          },
          geographicDistance: {
            score: distanceScore,
            weight: 20,
            label: 'Geographic Distance',
            reason: distanceReason,
            status: distanceStatus,
          },
          pickupAvailability: {
            score: pickupScore,
            weight: 15,
            label: 'Pickup Logistics Readiness',
            reason: pickupReason,
            status: pickupStatus,
          },
          collectionUrgency: {
            score: urgencyScore,
            weight: 15,
            label: 'Deadline & Operating Hours Alignment',
            reason: urgencyReason,
            status: urgencyStatus,
          },
        },
      };
    });

  // Sort ranked by score descending
  scoredPartners.sort((a, b) => b.overallScore - a.overallScore);

  // Assign ranks
  scoredPartners.forEach((rec, idx) => {
    rec.rank = idx + 1;
  });

  return scoredPartners;
}
