import { WasteCategory, SurplusBatch, WasteLog } from './index';

export type SustainabilityTimeResolution = 'day' | 'week' | 'month';

export interface ConversionFactor {
  category: string;
  factorValue: number; // e.g. 2.5 kg CO2e / kg or 140 L / kg
  unit: string; // e.g. 'kg CO2e / kg food' or 'L water / kg food'
  type: 'carbon' | 'water';
  sourceCitation: string;
  sourceAuthority: 'UNEP' | 'FAO' | 'Water Footprint Network' | 'WRI' | 'Science (Poore & Nemecek)' | 'WRAP UK';
  notes: string;
}

export interface DefensibleBaselineConfig {
  baselinePeriodName: string;
  auditedGramsPerMeal: number; // e.g. 84.5 g / meal
  auditStartDate: string;
  auditEndDate: string;
  auditedBy: string;
  minAuditedDaysRequired: number; // default 3 days
  methodologyDescription: string;
}

export interface CategorySustainabilityMetric {
  category: string;
  wasteKg: number;
  recoveredDeliveredKg: number;
  preventedKg: number | null;
  co2eAvoidedKg: number;
  waterSavedLitres: number;
  costImpactInr: number;
  carbonFactor: number;
  carbonFactorSource: string;
  waterFactor: number;
  waterFactorSource: string;
}

export interface TimeSeriesSustainabilityPoint {
  period: string; // e.g. '2026-09-24' or 'Wk 38' or 'Aug 2026'
  dateLabel: string;
  mealsPrepared: number;
  wasteKg: number;
  recoveredDeliveredKg: number;
  preventedKg: number | null;
  baselineWasteKg: number | null;
  co2eAvoidedKg: number;
  waterSavedLitres: number;
  prepWasteKg: number;
  plateWasteKg: number;
  spoilageKg: number;
  overproductionKg: number;
  processingLossKg: number;
}

export interface InstitutionPerformanceRecord {
  id: string;
  name: string;
  type: 'kitchen_station' | 'service_hall' | 'recipient_partner' | 'processing_line';
  location: string;
  mealsPreparedOrServed: number;
  wasteKg: number;
  wastePer100MealsKg: number;
  recoveredDeliveredKg: number;
  diversionRatePercent: number;
  haccpSafetyScorePercent: number;
  avgDispatchMinutes?: number;
  statusNotes: string;
}

export interface ResourceEfficiencyMetrics {
  prepScrapYieldPercent: number; // measured yield
  benchmarkYieldPercent: number;
  avoidedCookingEnergyKwh: number; // estimated from avoided overproduction batches
  avoidedEnergyEmissionsCo2Kg: number;
  organicCompostedKg: number; // sent to bio-enzyme composting
  kitchenOeePercent: number; // overall equipment effectiveness
  waterConservedDishwashingL: number; // avoided dirty service ware
}

export interface SustainabilityReportAuditSummary {
  reportId: string;
  generatedAt: string;
  fiscalPeriod: string;
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  facilityName: string;
  facilityLocation: string;
  accreditations: string[];

  // Key Metrics
  totalFoodWasteKg: number;
  foodRecoveredDeliveredKg: number;
  foodWastePreventedKg: number | null;
  hasDefensibleBaseline: boolean;
  baselineDefensibilityNote: string;
  estimatedCo2eAvoidedKg: number;
  estimatedWaterSavedLitres: number;
  estimatedCostSavingsInr: number;
  redistributionCompletionRatePercent: number;
  landfillDiversionRatePercent: number;
  totalMealsPrepared: number;

  // Breakdown records
  categoryBreakdown: CategorySustainabilityMetric[];
  timeSeriesData: Record<SustainabilityTimeResolution, TimeSeriesSustainabilityPoint[]>;
  institutionPerformance: InstitutionPerformanceRecord[];
  resourceEfficiency: ResourceEfficiencyMetrics;
  conversionFactorsUsed: ConversionFactor[];
  auditorSignoff: {
    auditorName: string;
    auditorTitle: string;
    licenseNumber: string;
    signoffDate: string;
    signatureVerified: boolean;
  };
}
