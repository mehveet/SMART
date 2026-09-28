export type NavigationTab =
  | 'overview'
  | 'demand'
  | 'inventory'
  | 'waste'
  | 'surplus'
  | 'iot'
  | 'quality'
  | 'sustainability'
  | 'settings';

export type DateRange = 'today' | '7d' | '30d' | '90d';

export interface DashboardKPIs {
  mealsPrepared: number;
  mealsPreparedChange: number; // percentage
  foodWasteKg: number;
  foodWasteKgChange: number; // percentage
  surplusAvailableKg: number;
  surplusAvailableCount: number;
  foodRecoveredKg: number;
  foodRecoveredChange: number;
  estimatedCostSavings: number; // in INR / currency
  costSavingsChange: number;
}

export interface DemandDataPoint {
  date: string;
  day: string;
  predictedMeals: number;
  actualConsumption: number;
  prepRecommendation: number;
  overproductionRisk: 'low' | 'moderate' | 'high';
  weather: string;
  specialEvent?: string;
}

export interface WasteTrendPoint {
  period: string;
  prepWasteKg: number;
  plateWasteKg: number;
  spoilageKg: number;
  overproductionKg: number;
  totalKg: number;
}

export type InventoryCategory =
  | 'Produce'
  | 'Dairy & Poultry'
  | 'Grains & Pulses'
  | 'Prepared Bases'
  | 'Proteins'
  | 'Dry Goods'
  | 'Bakery'
  | 'Condiments & Spices';

export type InventoryUnit = 'kg' | 'g' | 'L' | 'crates' | 'packs' | 'units' | 'bags';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: InventoryUnit;
  currentStockKg: number;
  reorderLevelKg: number;
  cost: number; // cost per unit in ₹
  unitCost: number; // backward compatibility
  purchaseDate: string; // YYYY-MM-DD
  receivedDate: string; // backward compatibility
  expiryDate: string; // YYYY-MM-DD
  storageLocation: string;
  storageZone: 'Walk-in Chiller (2-4°C)' | 'Deep Freezer (-18°C)' | 'Dry Pantry Zone' | 'Cooked Hot-Hold Area' | string;
  supplier: string;
  batchCode: string;
  shelfLifeStatus: 'expired' | 'critical' | 'near-term' | 'safe'; // expired: <today, critical: <=24h, near-term: 1-3d, safe: >3d
  fefoRecommendation?: string;
}

export type WasteCategory =
  | 'Preparation Waste'
  | 'Spoilage'
  | 'Overproduction'
  | 'Plate Waste'
  | 'Processing Loss';

export type MealSession = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'All-Day Prep';

export interface WasteLog {
  id: string;
  foodItem: string;
  itemName: string;
  quantity: number;
  unit: string;
  weightKg: number; // normalized weight in kg for total charts & metrics
  category: WasteCategory;
  wasteStream: 'Pre-consumer Prep Waste' | 'Overproduction / Unserved' | 'Post-consumer Plate Return' | 'Storage Spoilage' | string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  reason: string;
  rootCause: 'Portion Overfill' | 'Forecast Variance' | 'Prep Trim Margin' | 'Cold Chain Fluctuation' | 'Plate Leftovers' | string;
  mealSession: MealSession;
  costLoss: number;
  kitchenStation: 'Main Prep & Chop' | 'Bakery & Dessert' | 'Hot Line & Curry' | 'Dishwashing & Scraping' | 'Cold Larder' | string;
  loggedBy: string;
  actionRecommended?: string;
}

export type SurplusStatus =
  | 'Available'
  | 'Matched'
  | 'Pickup Scheduled'
  | 'Collected'
  | 'Delivered'
  | 'Cancelled'
  | 'Expired';

export type QualityReviewStatus =
  | 'Passed HACCP Inspection'
  | 'Pending Temperature Check'
  | 'Conditional (Rapid Chilling Required)'
  | 'Failed / Rejected';

export interface SurplusBatch {
  id: string;
  batchNumber: string;
  foodName: string;
  dishName: string; // backward compatibility
  category: 'Cooked Main' | 'Steamed Rice & Breads' | 'Soups & Gravies' | 'Baked Goods' | 'Fresh Cut Produce' | string;
  quantity: number;
  unit: string;
  portions: number;
  weightKg: number;
  preparationTime: string; // YYYY-MM-DD HH:mm
  preparedAt: string; // backward compatibility
  storageConditions: 'Hot Holding (>65°C)' | 'Chilled (2-4°C)' | 'Deep Freezer (-18°C)' | 'Ambient Dry' | string;
  collectionDeadline: string; // YYYY-MM-DD HH:mm
  safeConsumptionWindow: string; // backward compatibility
  location: string;
  qualityReviewStatus: QualityReviewStatus;
  status: SurplusStatus;
  redistributionStatus: 'staged' | 'allocated' | 'dispatched' | 'completed'; // backward compatibility
  haccpClearance?: {
    temperatureLogged: number; // in Celsius
    passed: boolean;
    inspectedBy: string;
  };
  assignedRecipientId?: string;
  assignedRecipientName?: string;
  assignedPartnerId?: string; // backward compatibility
  assignedQuantity?: number;
  dispatchManifestId?: string;
  pickupDetails?: {
    scheduledTime: string;
    carrier: string;
    vehicleCode?: string;
    driverContact?: string;
    tempAtPickup?: number;
    notes?: string;
  };
  deliveryDetails?: {
    deliveredAt: string;
    receivingOfficer: string;
    tempAtDelivery?: number;
    deliveredKg?: number;
    signatureVerificationCode?: string;
    notes?: string;
  };
  source?: 'Overproduction' | 'Expiring Inventory' | 'Manual Kitchen Entry';
  sourceRefId?: string;
  notes?: string;
}

export type RecipientVerificationStatus =
  | 'Verified Institutional Partner'
  | 'Pending Annual Audit'
  | 'Conditional Clearance'
  | 'Inactive / Suspended';

export interface RedistributionPartner {
  id: string;
  name: string;
  type:
    | 'Campus Student Pantry'
    | 'Community Kitchen'
    | 'Elder Care Home'
    | 'Shelter / Welfare Center'
    | 'Partner Health Center'
    | 'Sister Facility Dining'
    | 'Municipal Community Center'
    | 'Eco-Compost Facility'
    | string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  serviceCapacity: number; // in kg/day
  typicalCapacityKg: number; // backward compatibility
  acceptedFoodTypes: string[];
  operatingHours: string;
  verificationStatus: RecipientVerificationStatus;
  contactPerson: string;
  phone: string;
  pickupAvailability: 'Has Own Insulated Vehicle' | 'Requires Institutional Drop-off' | 'Thermal Cart Walker Available' | string;
  distanceKm: number;
  preferredPickupWindow: string; // backward compatibility
  isActive: boolean;
  allocatedTodayKg?: number;
  notes?: string;
}

export interface RedistributionDispatch {
  id: string;
  manifestCode: string;
  surplusBatchIds: string[];
  dishSummary: string;
  totalKg: number;
  destinationPartner: string;
  destinationType: string;
  transitCarrier: 'Insulated Thermal Box (Van A)' | 'Refrigerated Shuttle B' | 'On-site Thermal Cart';
  dispatchTime: string;
  estimatedArrival: string;
  status: 'Staged' | 'Vehicle Loading' | 'In-Transit' | 'Received & Verified';
  tempAtDispatch: number;
  authorizedOfficer: string;
}

export interface IoTSensor {
  id: string;
  name: string;
  location: string;
  type: 'Cold Room Temperature' | 'Deep Freezer Temperature' | 'Hot Holding Cabinet' | 'Ambient Humidity & Air';
  currentValue: number;
  unit: string;
  targetRange: string;
  minSafe: number;
  maxSafe: number;
  status: 'optimal' | 'warning' | 'critical';
  lastPing: string;
  batteryPercent: number;
  history: { time: string; value: number }[];
}

export interface SustainabilityMetric {
  co2eAvoidedKg: number;
  waterSavedLitres: number;
  mealsDivertedCount: number;
  landfillDiversionRate: number; // e.g. 92.4%
  sdg12ProgressPercentage: number;
}

export type TimeResolution = 'daily' | 'weekly' | 'monthly';

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  event: string;
  category: 'waste' | 'surplus' | 'dispatch' | 'inventory' | 'iot' | 'quality';
  quantity: string;
  quantityKg: number;
  status:
    | 'Completed'
    | 'In-Transit'
    | 'Staged'
    | 'Logged'
    | 'Verified'
    | 'Attention'
    | 'Flagged'
    | 'Inspected'
    | 'Optimal';
  stationOrPartner: string;
  loggedBy: string;
  notes: string;
  temperature?: number;
  relatedTab?: NavigationTab;
  relatedId?: string;
}

export interface AIInsight {
  id: string;
  title: string;
  category: 'Production Optimization' | 'Waste Prevention' | 'Inventory Risk' | 'Cold Chain Integrity';
  severity: 'high' | 'medium' | 'positive';
  impact: string;
  description: string;
  actionLabel: string;
  targetTab: NavigationTab;
  targetId?: string;
}

export interface ExpiryAlertItem {
  id: string;
  name: string;
  category: string;
  quantityKg: number;
  expiryDate: string;
  severity: 'critical' | 'high' | 'moderate';
  hoursRemaining: number;
  storageZone: string;
  batchCode: string;
}

export interface RedistributionSummaryData {
  availableKg: number;
  matchedKg: number;
  collectedKg: number;
  deliveredKg: number;
  totalKg: number;
  recoveryRatePercent: number;
}

export interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'warning' | 'critical' | 'success' | 'info';
  read: boolean;
  navTarget?: NavigationTab;
}

export type QualityInspectionReviewStatus = 'Pending' | 'Reviewed' | 'Flagged' | 'Rejected';

export interface QualityObservationsDetail {
  colorAnalysis: string;
  textureAndMoisture: string;
  foreignObjectRisk: 'Low' | 'Moderate' | 'High' | string;
  spoilageRiskRating: 'Low' | 'Moderate' | 'High' | string;
  thermalHoldingSuitability: string;
  overallObservationSummary: string;
  visualDefectsDetected: string[];
  suggestedAction: string;
  safetyClearance: 'Passed' | 'Manual Review Required' | 'Blocked / Unsafe' | string;
}

export interface QualityInspectionRecord {
  id: string;
  itemName: string;
  batchCode?: string;
  category: string;
  location: string;
  storageCondition: string;
  imageUrl: string;
  inspectionTimestamp: string;
  inspectedBy: string;
  reviewStatus: QualityInspectionReviewStatus;
  reviewedBy?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  aiConfidence: number;
  detectedObservations: QualityObservationsDetail;
  safetyDisclaimer: string;
  linkedSurplusBatchId?: string;
}

export interface ProcessingEquipment {
  id: string;
  name: string;
  line: string;
  status: 'Running' | 'Idle' | 'Maintenance' | 'Fault';
  powerDrawKw: number;
  energyTodayKwh: number;
  downtimeMinutesToday: number;
  efficiencyScore: number;
  notes?: string;
}

export interface RawMaterialLossRecord {
  id: string;
  timestamp: string;
  productionLine: string;
  processStep:
    | 'Peeling'
    | 'Trimming'
    | 'Slicing'
    | 'Cooking Shrinkage'
    | 'Portioning'
    | 'Packaging'
    | string;
  ingredient: string;
  inputWeightKg: number;
  lossKg: number;
  lossPercentage: number;
  equipmentUsed?: string;
  notes?: string;
  loggedBy: string;
}

export interface ProcessingEfficiencySummary {
  overallOeePercent: number;
  totalRawMaterialLossKg: number;
  averageLossPercentage: number;
  activeMachineDowntimeMinutes: number;
  dailyEnergyConsumptionKwh: number;
  efficiencyTrend: string;
  operationalAlerts: string[];
}

export interface ManualSensorReadingPayload {
  sensorId: string;
  value: number;
  calibratedBy?: string;
  notes?: string;
}

// Food Distribution: Automatic vs Manual Options
export type DistributionMode = 'automatic' | 'manual';

export interface AutoDistributionSettings {
  mode: DistributionMode;
  enabled: boolean;
  confidenceThreshold: number; // e.g. 70, 75, 80%
  autoDispatchImmediate: boolean; // if true: create manifest & dispatch right away; if false: match and stage for review
  priorityCriterion: 'balanced' | 'distance' | 'capacity' | 'urgency';
  preferredCarrier: RedistributionDispatch['transitCarrier'];
  autoNotifyStaff: boolean;
  autoDivertCompost: boolean; // non-consumable batches automatically route to compost facility
  autoExecuteOnNewBatch: boolean; // automatically run engine when new surplus is created
}

export interface AutoDistributionExecutionLog {
  id: string;
  timestamp: string;
  batchId: string;
  batchName: string;
  weightKg: number;
  partnerId: string;
  partnerName: string;
  score: number;
  action: 'dispatched' | 'matched_staged';
  manifestCode?: string;
  carrier?: string;
  reason: string;
}

export interface AutoDistributionSummary {
  timestamp: string;
  mode: DistributionMode;
  totalBatchesEvaluated: number;
  totalBatchesProcessed: number;
  totalKgDistributed: number;
  matchedCount: number;
  skippedCount: number;
  logs: AutoDistributionExecutionLog[];
  skippedReasons: { batchId: string; batchName: string; reason: string }[];
}
