import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  ActivityLogItem,
  AIInsight,
  DashboardKPIs,
  DateRange,
  DemandDataPoint,
  InventoryItem,
  IoTSensor,
  ManualSensorReadingPayload,
  NavigationTab,
  NotificationAlert,
  ProcessingEfficiencySummary,
  ProcessingEquipment,
  QualityInspectionRecord,
  QualityInspectionReviewStatus,
  RawMaterialLossRecord,
  RedistributionDispatch,
  RedistributionPartner,
  RedistributionSummaryData,
  SurplusBatch,
  SustainabilityMetric,
  WasteLog,
  WasteTrendPoint,
} from '../types';
import { ForecastResult, SavedForecastRun } from '../types/forecasting';
import {
  INITIAL_ACTIVITIES,
  INITIAL_AI_INSIGHTS,
  INITIAL_DISPATCHES,
  INITIAL_DEMAND_POINTS,
  INITIAL_INVENTORY,
  INITIAL_IOT_SENSORS,
  INITIAL_KPIS,
  INITIAL_NOTIFICATIONS,
  REDISTRIBUTION_PARTNERS,
  INITIAL_SURPLUS_BATCHES,
  INITIAL_SUSTAINABILITY,
  INITIAL_WASTE_LOGS,
  INITIAL_WASTE_TREND,
  DEMAND_DATA_BY_RANGE,
  WASTE_TREND_BY_RANGE,
  calculateKPIsForRange,
  calculateRedistributionSummary,
  INITIAL_QUALITY_INSPECTIONS,
  INITIAL_PROCESSING_EQUIPMENT,
  INITIAL_RAW_MATERIAL_LOSS,
  INITIAL_EFFICIENCY_SUMMARY,
} from '../data/initialData';
import { evaluateShelfLife, normalizeToKg } from '../utils/unitUtils';
import { calculateSustainabilityAudit } from '../utils/sustainabilityEngine';
import {
  auth,
  db,
  signInWithGoogle as authSignInWithGoogle,
  signOutUser,
  seedFirestoreIfEmpty,
  populateDatabaseWithInitialData,
  allocateSurplusBatchTransaction,
  createDispatchManifestTransaction,
  confirmBatchDeliveryTransaction,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType,
  InstitutionalUserProfile,
} from '../services/firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isLoadingData: boolean;

  // Firebase Auth & Cloud Firestore Persistence
  currentUser: FirebaseUser | null;
  userProfile: InstitutionalUserProfile | null;
  authLoading: boolean;
  isFirebaseConnected: boolean;
  isSeedingDatabase: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  seedDatabase: (force?: boolean) => Promise<void>;
  
  // Data entities
  kpis: DashboardKPIs;
  demandPoints: DemandDataPoint[];
  wasteTrends: WasteTrendPoint[];
  inventory: InventoryItem[];
  wasteLogs: WasteLog[];
  surplusBatches: SurplusBatch[];
  partners: RedistributionPartner[];
  dispatches: RedistributionDispatch[];
  sensors: IoTSensor[];
  sustainability: SustainabilityMetric;
  notifications: NotificationAlert[];
  activities: ActivityLogItem[];
  aiInsights: AIInsight[];
  redistributionSummary: RedistributionSummaryData;
  highlightedInventoryId: string | null;
  setHighlightedInventoryId: (id: string | null) => void;
  navigateToInventoryItem: (itemId: string) => void;
  
  // Demand Forecasting extensions
  savedForecasts: SavedForecastRun[];
  activeForecastResult: ForecastResult | null;
  saveForecastRun: (run: SavedForecastRun) => void;
  deleteSavedForecast: (id: string) => void;
  applyForecastToSchedule: (result: ForecastResult) => void;
  
  // Handlers
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  updateInventoryStock: (id: string, newStockKg: number) => void;
  transferInventoryZone: (id: string, newZone: InventoryItem['storageZone']) => void;
  addWasteLog: (log: Omit<WasteLog, 'id' | 'timestamp'>) => void;
  deleteWasteLog: (id: string) => void;
  resetDemoData: () => void;
  registerSurplusBatch: (batch: Omit<SurplusBatch, 'id' | 'batchNumber' | 'preparedAt' | 'redistributionStatus'>) => void;
  createSurplusBatch: (batch: Partial<SurplusBatch>) => void;
  updateSurplusBatch: (id: string, updates: Partial<SurplusBatch>) => void;
  deleteSurplusBatch: (id: string) => void;
  assignBatchToRecipient: (batchId: string, recipientId: string, assignedQuantity?: number) => boolean;
  schedulePickup: (batchId: string, pickupDetails: NonNullable<SurplusBatch['pickupDetails']>) => void;
  markBatchCollected: (batchId: string, tempAtPickup?: number) => void;
  confirmBatchDelivery: (batchId: string, deliveryDetails: NonNullable<SurplusBatch['deliveryDetails']>) => void;
  cancelBatch: (batchId: string, reason: string) => void;
  addRecipient: (recipient: Omit<RedistributionPartner, 'id'>) => void;
  updateRecipient: (id: string, updates: Partial<RedistributionPartner>) => void;
  deleteRecipient: (id: string) => void;
  createDispatchManifest: (
    batchIds: string[],
    partnerId: string,
    transitCarrier: RedistributionDispatch['transitCarrier']
  ) => void;
  updateDispatchStatus: (dispatchId: string, status: RedistributionDispatch['status']) => void;
  updateSensorReading: (sensorId: string, newValue: number) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  runForecastSimulation: (headcountDelta: number, rainExpected: boolean, specialEventFactor: number) => void;

  // Quality & IoT Monitoring
  qualityInspections: QualityInspectionRecord[];
  addQualityInspection: (
    inspection: Omit<QualityInspectionRecord, 'id' | 'inspectionTimestamp' | 'reviewStatus' | 'safetyDisclaimer'> & {
      inspectionTimestamp?: string;
      reviewStatus?: QualityInspectionReviewStatus;
      safetyDisclaimer?: string;
    }
  ) => QualityInspectionRecord;
  updateQualityInspectionReview: (
    id: string,
    reviewStatus: QualityInspectionReviewStatus,
    reviewerNotes?: string,
    reviewerName?: string
  ) => void;
  deleteQualityInspection: (id: string) => void;
  processingEquipment: ProcessingEquipment[];
  updateEquipmentStatus: (id: string, updates: Partial<ProcessingEquipment>) => void;
  rawMaterialLosses: RawMaterialLossRecord[];
  addRawMaterialLoss: (record: Omit<RawMaterialLossRecord, 'id' | 'timestamp'>) => void;
  efficiencySummary: ProcessingEfficiencySummary;
  submitManualSensorReading: (payload: ManualSensorReadingPayload) => void;
  simulateSensorReadingUpdate: (sensorId: string, value: number, note?: string) => void;
  simulateSensorAnomaly: (
    sensorId: string,
    anomalyType: 'door_ajar' | 'heat_loss' | 'high_humidity' | 'power_trip' | 'normal'
  ) => void;
  resetSensorsToNormal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [dateRange, setDateRangeState] = useState<DateRange>('7d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [highlightedInventoryId, setHighlightedInventoryId] = useState<string | null>(null);

  const [demandPointsState, setDemandPointsState] = useState<Record<DateRange, DemandDataPoint[]>>(DEMAND_DATA_BY_RANGE);
  const [wasteTrendsState, setWasteTrendsState] = useState<Record<DateRange, WasteTrendPoint[]>>(WASTE_TREND_BY_RANGE);

  // Persistent Demo Data Layer (localStorage)
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('foodwise_inventory');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read inventory from storage', e);
    }
    return INITIAL_INVENTORY;
  });

  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(() => {
    try {
      const saved = localStorage.getItem('foodwise_waste_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read waste logs from storage', e);
    }
    return INITIAL_WASTE_LOGS;
  });

  const [surplusBatches, setSurplusBatches] = useState<SurplusBatch[]>(() => {
    try {
      const saved = localStorage.getItem('foodwise_surplus_batches');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read surplus batches from storage', e);
    }
    return INITIAL_SURPLUS_BATCHES;
  });

  const [partners, setPartners] = useState<RedistributionPartner[]>(() => {
    try {
      const saved = localStorage.getItem('foodwise_partners');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read partners from storage', e);
    }
    return REDISTRIBUTION_PARTNERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('foodwise_inventory', JSON.stringify(inventory));
    } catch (e) {}
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem('foodwise_waste_logs', JSON.stringify(wasteLogs));
    } catch (e) {}
  }, [wasteLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('foodwise_surplus_batches', JSON.stringify(surplusBatches));
    } catch (e) {}
  }, [surplusBatches]);

  useEffect(() => {
    try {
      localStorage.setItem('foodwise_partners', JSON.stringify(partners));
    } catch (e) {}
  }, [partners]);

  const [dispatches, setDispatches] = useState<RedistributionDispatch[]>(INITIAL_DISPATCHES);
  const [sensors, setSensors] = useState<IoTSensor[]>(INITIAL_IOT_SENSORS);
  const [sustainability, setSustainability] = useState<SustainabilityMetric>(INITIAL_SUSTAINABILITY);
  const [notifications, setNotifications] = useState<NotificationAlert[]>(INITIAL_NOTIFICATIONS);
  const [activities, setActivities] = useState<ActivityLogItem[]>(INITIAL_ACTIVITIES);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>(INITIAL_AI_INSIGHTS);
  const [activeForecastResult, setActiveForecastResult] = useState<ForecastResult | null>(null);

  // Quality & IoT and Processing Efficiency State
  const [qualityInspections, setQualityInspections] = useState<QualityInspectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('foodwise_quality_inspections');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_QUALITY_INSPECTIONS;
  });

  const [processingEquipment, setProcessingEquipment] = useState<ProcessingEquipment[]>(() => {
    try {
      const saved = localStorage.getItem('foodwise_equipment');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PROCESSING_EQUIPMENT;
  });

  const [rawMaterialLosses, setRawMaterialLosses] = useState<RawMaterialLossRecord[]>(() => {
    try {
      const saved = localStorage.getItem('foodwise_raw_loss');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RAW_MATERIAL_LOSS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('foodwise_quality_inspections', JSON.stringify(qualityInspections));
    } catch (e) {}
  }, [qualityInspections]);

  useEffect(() => {
    try {
      localStorage.setItem('foodwise_equipment', JSON.stringify(processingEquipment));
    } catch (e) {}
  }, [processingEquipment]);

  useEffect(() => {
    try {
      localStorage.setItem('foodwise_raw_loss', JSON.stringify(rawMaterialLosses));
    } catch (e) {}
  }, [rawMaterialLosses]);

  // Initial previous saved forecast runs
  const [savedForecasts, setSavedForecasts] = useState<SavedForecastRun[]>([
    {
      id: 'saved-run-01',
      name: 'Mid-September OLS Baseline (Full 60-Day Train)',
      savedAt: '2026-09-22 14:30',
      forecastDateRange: '2026-09-24 to 2026-09-30',
      mealCategory: 'All Day Dining',
      modelType: 'Multiple Linear Regression (OLS Ridge)',
      recordsCount: 60,
      totalPredictedMeals: 16840,
      recommendedPrepMeals: 17220,
      mae: 86.4,
      r2Score: 0.92,
      notes: 'Calibrated with 12-day holdout validation. Thursday cut-off enabled.',
      result: {
        generatedAt: '2026-09-22T14:30:00.000Z',
        forecastDateRange: { startDate: '2026-09-24', endDate: '2026-09-30' },
        targetMealCategory: 'All Day Dining',
        summary: {
          totalPredictedDemand: 16840,
          totalRecommendedPrep: 17220,
          totalExpectedSurplus: 380,
          averageConfidencePercent: 93.8,
          overproductionRiskDays: 1,
        },
        metrics: {
          isTrained: true,
          modelType: 'Multiple Linear Regression (OLS Ridge)',
          trainingSetSize: 48,
          holdoutSetSize: 12,
          mae: 86.4,
          rmse: 112.0,
          mape: 3.6,
          r2Score: 0.92,
          baselineMae: 148.2,
          errorReductionPercent: 41.7,
          evaluationNote: '48 days training, 12 days holdout. OLS outperforms naive baseline by 41.7%.',
        },
        sevenDayForecast: [
          {
            date: '2026-09-24',
            dayOfWeek: 'Thursday',
            mealCategory: 'Lunch',
            expectedAttendance: 2420,
            predictedDemand: 2360,
            bufferPercent: 1.8,
            recommendedPrep: 2402,
            expectedSurplus: 42,
            confidenceScorePercent: 94.2,
            confidenceInterval: [2220, 2500],
            overproductionRisk: 'high',
            weather: 'Rain / Storm',
            batchCookingSchedule: 'Split-Batch: 60% @ 11:30 · 40% reserve @ 12:45',
          },
          {
            date: '2026-09-25',
            dayOfWeek: 'Friday',
            mealCategory: 'Lunch',
            expectedAttendance: 2580,
            predictedDemand: 2590,
            bufferPercent: 2.2,
            recommendedPrep: 2647,
            expectedSurplus: 57,
            confidenceScorePercent: 95.0,
            confidenceInterval: [2450, 2730],
            overproductionRisk: 'low',
            weather: 'Clear',
            batchCookingSchedule: 'Continuous rolling (65% / 35%)',
          },
          {
            date: '2026-09-26',
            dayOfWeek: 'Saturday',
            mealCategory: 'Lunch',
            expectedAttendance: 1650,
            predictedDemand: 1620,
            bufferPercent: 2.5,
            recommendedPrep: 1660,
            expectedSurplus: 40,
            confidenceScorePercent: 92.5,
            confidenceInterval: [1500, 1740],
            overproductionRisk: 'low',
            weather: 'Clear',
            batchCookingSchedule: 'Single continuous hot-hold',
          },
          {
            date: '2026-09-27',
            dayOfWeek: 'Sunday',
            mealCategory: 'Lunch',
            expectedAttendance: 1420,
            predictedDemand: 1390,
            bufferPercent: 2.5,
            recommendedPrep: 1425,
            expectedSurplus: 35,
            confidenceScorePercent: 91.8,
            confidenceInterval: [1280, 1500],
            overproductionRisk: 'low',
            weather: 'Clear',
            batchCookingSchedule: 'Thali batching @ 12:00',
          },
          {
            date: '2026-09-28',
            dayOfWeek: 'Monday',
            mealCategory: 'Lunch',
            expectedAttendance: 2450,
            predictedDemand: 2440,
            bufferPercent: 2.2,
            recommendedPrep: 2494,
            expectedSurplus: 54,
            confidenceScorePercent: 94.6,
            confidenceInterval: [2310, 2570],
            overproductionRisk: 'low',
            weather: 'Clear',
            batchCookingSchedule: 'Continuous rolling',
          },
          {
            date: '2026-09-29',
            dayOfWeek: 'Tuesday',
            mealCategory: 'Lunch',
            expectedAttendance: 2490,
            predictedDemand: 2480,
            bufferPercent: 2.2,
            recommendedPrep: 2535,
            expectedSurplus: 55,
            confidenceScorePercent: 94.8,
            confidenceInterval: [2350, 2610],
            overproductionRisk: 'low',
            weather: 'Clear',
            batchCookingSchedule: 'Continuous rolling',
          },
          {
            date: '2026-09-30',
            dayOfWeek: 'Wednesday',
            mealCategory: 'Lunch',
            expectedAttendance: 2400,
            predictedDemand: 2380,
            bufferPercent: 2.2,
            recommendedPrep: 2432,
            expectedSurplus: 52,
            confidenceScorePercent: 93.9,
            confidenceInterval: [2250, 2510],
            overproductionRisk: 'low',
            weather: 'Clear',
            batchCookingSchedule: 'Continuous rolling',
          },
        ],
        actualVsPredictedHistory: [],
        recommendations: [
          {
            id: 'rec-p1',
            title: 'Curtail Base Thursday Production by 140 Portions',
            type: 'cut_production',
            severity: 'high',
            category: 'Overproduction Elimination',
            impactDescription: 'Historical Thursday surplus averages 185 meals due to evening outings.',
            recommendedAction: 'Lower raw batch target by 140 portions; hold 40% on reserve.',
            potentialCostSavings: 18200,
            potentialFoodSavedKg: 42.5,
            applied: false,
          },
        ],
      },
    },
  ]);

  // --------------------------------------------------------------------------
  // Firebase Authentication & Cloud Firestore Persistence Layer
  // --------------------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<InstitutionalUserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isSeedingDatabase, setIsSeedingDatabase] = useState<boolean>(false);

  // Initialize and check Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection().then(connected => {
      setIsFirebaseConnected(connected);
    });

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setIsFirebaseConnected(true);
        // Automatic initial check and seed if collection empty
        seedFirestoreIfEmpty().catch(() => {});
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as InstitutionalUserProfile);
          } else {
            const initialProfile: InstitutionalUserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Kitchen Operations Officer',
              photoURL: user.photoURL || undefined,
              role: 'Kitchen Supervisor',
              institutionName: 'Apex University Dining Operations & Central Processing',
            };
            setUserProfile(initialProfile);
          }
        } catch (e) {
          console.warn('[Firestore profile fetch notice]:', e);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubAuth();
  }, []);

  // Real-time Firestore synchronizer when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    const unsubs: (() => void)[] = [];

    // 1. Inventory listener
    const unsubInv = onSnapshot(
      collection(db, 'inventory'),
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as InventoryItem));
          setInventory(items);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'inventory')
    );
    unsubs.push(unsubInv);

    // 2. Waste logs listener
    const unsubWaste = onSnapshot(
      collection(db, 'waste_entries'),
      (snap) => {
        if (!snap.empty) {
          const logs = snap.docs.map(d => ({ ...d.data(), id: d.id } as WasteLog));
          setWasteLogs(logs);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'waste_entries')
    );
    unsubs.push(unsubWaste);

    // 3. Surplus Batches listener
    const unsubSurplus = onSnapshot(
      collection(db, 'food_listings'),
      (snap) => {
        if (!snap.empty) {
          const batches = snap.docs.map(d => ({ ...d.data(), id: d.id } as SurplusBatch));
          setSurplusBatches(batches);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'food_listings')
    );
    unsubs.push(unsubSurplus);

    // 4. Recipients listener
    const unsubRecipients = onSnapshot(
      collection(db, 'recipients'),
      (snap) => {
        if (!snap.empty) {
          const parts = snap.docs.map(d => ({ ...d.data(), id: d.id } as RedistributionPartner));
          setPartners(parts);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'recipients')
    );
    unsubs.push(unsubRecipients);

    // 5. Redistribution Records listener
    const unsubRecords = onSnapshot(
      collection(db, 'redistribution_records'),
      (snap) => {
        if (!snap.empty) {
          const disps = snap.docs.map(d => ({ ...d.data(), id: d.id } as RedistributionDispatch));
          setDispatches(disps);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'redistribution_records')
    );
    unsubs.push(unsubRecords);

    // 6. Quality Checks listener
    const unsubQuality = onSnapshot(
      collection(db, 'quality_checks'),
      (snap) => {
        if (!snap.empty) {
          const checks = snap.docs.map(d => ({ ...d.data(), id: d.id } as QualityInspectionRecord));
          setQualityInspections(checks);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'quality_checks')
    );
    unsubs.push(unsubQuality);

    // 7. Sensor Readings listener
    const unsubSensors = onSnapshot(
      collection(db, 'sensor_readings'),
      (snap) => {
        if (!snap.empty) {
          const sens = snap.docs.map(d => ({ ...d.data(), id: d.id } as IoTSensor));
          setSensors(sens);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'sensor_readings')
    );
    unsubs.push(unsubSensors);

    // 8. Processing Logs listener
    const unsubProc = onSnapshot(
      collection(db, 'processing_logs'),
      (snap) => {
        if (!snap.empty) {
          const losses = snap.docs.filter(d => !d.data().isEquipment).map(d => ({ ...d.data(), id: d.id } as RawMaterialLossRecord));
          if (losses.length > 0) setRawMaterialLosses(losses);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'processing_logs')
    );
    unsubs.push(unsubProc);

    // 9. Forecasts listener
    const unsubForecasts = onSnapshot(
      collection(db, 'forecasts'),
      (snap) => {
        if (!snap.empty) {
          const fc = snap.docs.map(d => ({ ...d.data(), id: d.id } as SavedForecastRun));
          setSavedForecasts(fc);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'forecasts')
    );
    unsubs.push(unsubForecasts);

    return () => {
      unsubs.forEach(u => u());
    };
  }, [currentUser]);

  // Firebase auth & seed actions
  const signInWithGoogle = async () => {
    try {
      setIsLoadingData(true);
      const user = await authSignInWithGoogle();
      if (user) {
        setCurrentUser(user);
        setIsFirebaseConnected(true);
      }
    } catch (err: any) {
      console.error('[Google Sign-in error]:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('[Sign-out error]:', err);
    }
  };

  const seedDatabase = async (force: boolean = false) => {
    try {
      setIsSeedingDatabase(true);
      const ok = await populateDatabaseWithInitialData();
      if (ok) {
        setIsFirebaseConnected(true);
      }
    } catch (err) {
      console.error('[Seed database error]:', err);
    } finally {
      setIsSeedingDatabase(false);
    }
  };

  // Safe mutation helpers into Firestore
  const persistDoc = async (col: string, docId: string, data: any) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, col, docId), {
        ...data,
        updatedAt: new Date().toISOString(),
        createdByUser: currentUser.uid,
      });
    } catch (err) {
      console.warn(`[Firestore sync notice: ${col}/${docId}]:`, err);
    }
  };

  const updateDocInDb = async (col: string, docId: string, updates: any) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, col, docId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`[Firestore update notice: ${col}/${docId}]:`, err);
    }
  };

  const deleteDocFromDb = async (col: string, docId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, col, docId));
    } catch (err) {
      console.warn(`[Firestore delete notice: ${col}/${docId}]:`, err);
    }
  };

  const setDateRange = (range: DateRange) => {
    setIsLoadingData(true);
    setDateRangeState(range);
    setTimeout(() => {
      setIsLoadingData(false);
    }, 200);
  };

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  // Active demand points for the current date range
  const currentDemandPoints = useMemo(() => {
    return demandPointsState[dateRange] || INITIAL_DEMAND_POINTS;
  }, [demandPointsState, dateRange]);

  // Active waste trends for current date range
  const currentWasteTrends = useMemo(() => {
    return wasteTrendsState[dateRange] || INITIAL_WASTE_TREND;
  }, [wasteTrendsState, dateRange]);

  // Dynamic KPIs calculated from underlying data points for active date range
  const currentKPIs = useMemo(() => {
    return calculateKPIsForRange(
      dateRange,
      currentDemandPoints,
      currentWasteTrends,
      surplusBatches,
      dispatches
    );
  }, [dateRange, currentDemandPoints, currentWasteTrends, surplusBatches, dispatches]);

  // Dynamic redistribution summary
  const redistributionSummary = useMemo(() => {
    return calculateRedistributionSummary(surplusBatches, dispatches);
  }, [surplusBatches, dispatches]);

  // Dynamic sustainability metrics consistent with sustainability report engine
  const currentSustainability: SustainabilityMetric = useMemo(() => {
    const audit = calculateSustainabilityAudit({
      dateRange,
      categoryFilter: 'all',
      wasteLogs,
      surplusBatches,
      dispatches,
      demandPoints: currentDemandPoints,
      wasteTrends: currentWasteTrends,
      inventory,
      partners,
    });
    return {
      co2eAvoidedKg: audit.estimatedCo2eAvoidedKg,
      waterSavedLitres: audit.estimatedWaterSavedLitres,
      mealsDivertedCount: Math.round(audit.foodRecoveredDeliveredKg * 3.5),
      landfillDiversionRate: audit.landfillDiversionRatePercent,
      sdg12ProgressPercentage: Math.min(100, Number(((audit.landfillDiversionRatePercent / 90) * 75).toFixed(1))),
    };
  }, [dateRange, wasteLogs, surplusBatches, dispatches, currentDemandPoints, currentWasteTrends, inventory, partners]);

  const navigateToInventoryItem = (itemId: string) => {
    setHighlightedInventoryId(itemId);
    setActiveTab('inventory');
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const stockKg = item.currentStockKg ?? normalizeToKg(item.quantity, item.unit);
    const cost = item.cost ?? item.unitCost ?? 50;
    const shelfLife = item.shelfLifeStatus || evaluateShelfLife(item.expiryDate).status;
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      quantity: item.quantity ?? stockKg,
      unit: item.unit ?? 'kg',
      currentStockKg: stockKg,
      cost: cost,
      unitCost: cost,
      purchaseDate: item.purchaseDate || item.receivedDate || new Date().toISOString().slice(0, 10),
      receivedDate: item.receivedDate || item.purchaseDate || new Date().toISOString().slice(0, 10),
      storageLocation: item.storageLocation || item.storageZone,
      storageZone: item.storageZone || item.storageLocation,
      supplier: item.supplier || 'Local Institutional Supply',
      batchCode: item.batchCode || `LOT-${item.name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      shelfLifeStatus: shelfLife,
      reorderLevelKg: item.reorderLevelKg ?? Math.round(stockKg * 0.3),
    };
    setInventory(prev => [newItem, ...prev]);

    // Add activity
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Inventory Received: ${item.name}`,
      category: 'inventory',
      quantity: `${newItem.quantity} ${newItem.unit}`,
      quantityKg: stockKg,
      status: 'Completed',
      stationOrPartner: newItem.storageLocation,
      loggedBy: 'Chef V. Sharma',
      notes: `Batch ${newItem.batchCode} from ${newItem.supplier}. Expiry: ${newItem.expiryDate}.`,
      relatedTab: 'inventory',
      relatedId: newItem.id,
    };
    setActivities(prev => [newActivity, ...prev]);
    persistDoc('inventory', newItem.id, newItem);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const merged: InventoryItem = { ...item, ...updates };
        if (updates.quantity !== undefined || updates.unit !== undefined) {
          merged.currentStockKg = normalizeToKg(merged.quantity, merged.unit);
        }
        if (updates.expiryDate !== undefined) {
          merged.shelfLifeStatus = evaluateShelfLife(merged.expiryDate).status;
        }
        if (updates.cost !== undefined) {
          merged.unitCost = updates.cost;
        }
        if (updates.storageLocation !== undefined) {
          merged.storageZone = updates.storageLocation;
        }
        return merged;
      })
    );

    const target = inventory.find(i => i.id === id);
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Inventory Updated: ${updates.name || target?.name || 'Lot'}`,
      category: 'inventory',
      quantity: `${updates.quantity ?? target?.quantity ?? 0} ${updates.unit ?? target?.unit ?? 'kg'}`,
      quantityKg: normalizeToKg(updates.quantity ?? target?.quantity ?? 0, updates.unit ?? target?.unit ?? 'kg'),
      status: 'Completed',
      stationOrPartner: updates.storageLocation || target?.storageLocation || 'Inventory',
      loggedBy: 'Kitchen Supervisor',
      notes: `Updated record for batch ${target?.batchCode || id}.`,
      relatedTab: 'inventory',
      relatedId: id,
    };
    setActivities(prev => [newActivity, ...prev]);
    updateDocInDb('inventory', id, updates);
  };

  const deleteInventoryItem = (id: string) => {
    const target = inventory.find(i => i.id === id);
    setInventory(prev => prev.filter(item => item.id !== id));
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Inventory Disposed / Removed: ${target?.name || 'Item'}`,
      category: 'inventory',
      quantity: `${target?.quantity || 0} ${target?.unit || 'kg'}`,
      quantityKg: target?.currentStockKg || 0,
      status: 'Logged',
      stationOrPartner: target?.storageLocation || 'Kitchen',
      loggedBy: 'Kitchen Supervisor',
      notes: `Lot ${target?.batchCode || id} removed from operational inventory.`,
      relatedTab: 'inventory',
    };
    setActivities(prev => [newActivity, ...prev]);
    deleteDocFromDb('inventory', id);
  };

  const updateInventoryStock = (id: string, newStockKg: number) => {
    updateInventoryItem(id, { quantity: newStockKg, currentStockKg: Math.max(0, newStockKg) });
  };

  const transferInventoryZone = (id: string, newZone: InventoryItem['storageZone']) => {
    updateInventoryItem(id, { storageLocation: newZone, storageZone: newZone });
  };

  const addWasteLog = (log: Omit<WasteLog, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const weight = log.weightKg || normalizeToKg(log.quantity, log.unit);
    const cost = log.costLoss || Math.round(weight * 50);
    const foodName = log.foodItem || log.itemName || 'Food Scrap';

    const newEntry: WasteLog = {
      ...log,
      id: `wlog-${Date.now()}`,
      foodItem: foodName,
      itemName: foodName,
      quantity: log.quantity || weight,
      unit: log.unit || 'kg',
      weightKg: weight,
      costLoss: cost,
      date: log.date || now.toISOString().slice(0, 10),
      timestamp: timeStr,
      category: log.category || 'Preparation Waste',
      wasteStream: log.wasteStream || (log.category === 'Plate Waste' ? 'Post-consumer Plate Return' : log.category === 'Spoilage' ? 'Storage Spoilage' : log.category === 'Overproduction' ? 'Overproduction / Unserved' : 'Pre-consumer Prep Waste'),
      rootCause: log.rootCause || (log.category === 'Plate Waste' ? 'Plate Leftovers' : log.category === 'Spoilage' ? 'Cold Chain Fluctuation' : log.category === 'Overproduction' ? 'Forecast Variance' : 'Prep Trim Margin'),
      mealSession: log.mealSession || 'Lunch',
      kitchenStation: log.kitchenStation || 'Main Prep & Chop',
      loggedBy: log.loggedBy || 'Kitchen Staff',
    };
    setWasteLogs(prev => [newEntry, ...prev]);

    // Instantly update active waste trends for charts and KPI dynamic calculation!
    setWasteTrendsState(prev => {
      const next = { ...prev };
      // Today update
      if (next.today && next.today.length > 0) {
        const todayList = [...next.today];
        const lastIdx = todayList.length - 1;
        const lastPt = { ...todayList[lastIdx] };
        if (newEntry.category === 'Preparation Waste' || newEntry.category === 'Processing Loss') {
          lastPt.prepWasteKg = Number((lastPt.prepWasteKg + weight).toFixed(1));
        } else if (newEntry.category === 'Plate Waste') {
          lastPt.plateWasteKg = Number((lastPt.plateWasteKg + weight).toFixed(1));
        } else if (newEntry.category === 'Spoilage') {
          lastPt.spoilageKg = Number((lastPt.spoilageKg + weight).toFixed(1));
        } else if (newEntry.category === 'Overproduction') {
          lastPt.overproductionKg = Number((lastPt.overproductionKg + weight).toFixed(1));
        }
        lastPt.totalKg = Number((lastPt.totalKg + weight).toFixed(1));
        todayList[lastIdx] = lastPt;
        next.today = todayList;
      }
      // 7d update
      if (next['7d'] && next['7d'].length > 0) {
        const list7d = [...next['7d']];
        const lastIdx = list7d.length - 1;
        const lastPt = { ...list7d[lastIdx] };
        if (newEntry.category === 'Preparation Waste' || newEntry.category === 'Processing Loss') {
          lastPt.prepWasteKg = Number((lastPt.prepWasteKg + weight).toFixed(1));
        } else if (newEntry.category === 'Plate Waste') {
          lastPt.plateWasteKg = Number((lastPt.plateWasteKg + weight).toFixed(1));
        } else if (newEntry.category === 'Spoilage') {
          lastPt.spoilageKg = Number((lastPt.spoilageKg + weight).toFixed(1));
        } else if (newEntry.category === 'Overproduction') {
          lastPt.overproductionKg = Number((lastPt.overproductionKg + weight).toFixed(1));
        }
        lastPt.totalKg = Number((lastPt.totalKg + weight).toFixed(1));
        list7d[lastIdx] = lastPt;
        next['7d'] = list7d;
      }
      return next;
    });

    // Add activity
    const displayTime = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: displayTime,
      event: `Waste Logged: ${foodName}`,
      category: 'waste',
      quantity: `${newEntry.quantity} ${newEntry.unit} (${weight.toFixed(1)} kg)`,
      quantityKg: weight,
      status: 'Logged',
      stationOrPartner: newEntry.kitchenStation,
      loggedBy: newEntry.loggedBy,
      notes: `${newEntry.category} during ${newEntry.mealSession} - Reason: ${newEntry.reason}`,
      relatedTab: 'waste',
      relatedId: newEntry.id,
    };
    setActivities(prev => [newActivity, ...prev]);
    persistDoc('waste_entries', newEntry.id, newEntry);
  };

  const deleteWasteLog = (id: string) => {
    const target = wasteLogs.find(w => w.id === id);
    setWasteLogs(prev => prev.filter(w => w.id !== id));
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Waste Entry Removed: ${target?.foodItem || target?.itemName || 'Batch'}`,
      category: 'waste',
      quantity: `${target?.quantity || 0} ${target?.unit || 'kg'}`,
      quantityKg: target?.weightKg || 0,
      status: 'Logged',
      stationOrPartner: target?.kitchenStation || 'Kitchen',
      loggedBy: 'Kitchen Supervisor',
      notes: `Voided waste record from station log.`,
      relatedTab: 'waste',
    };
    setActivities(prev => [newActivity, ...prev]);
    deleteDocFromDb('waste_entries', id);
  };

  const resetDemoData = () => {
    try {
      localStorage.removeItem('foodwise_inventory');
      localStorage.removeItem('foodwise_waste_logs');
      localStorage.removeItem('foodwise_surplus_batches');
      localStorage.removeItem('foodwise_partners');
      localStorage.removeItem('foodwise_quality_inspections');
      localStorage.removeItem('foodwise_equipment');
      localStorage.removeItem('foodwise_raw_loss');
    } catch (e) {}
    setInventory(INITIAL_INVENTORY);
    setWasteLogs(INITIAL_WASTE_LOGS);
    setWasteTrendsState(WASTE_TREND_BY_RANGE);
    setSurplusBatches(INITIAL_SURPLUS_BATCHES);
    setPartners(REDISTRIBUTION_PARTNERS);
    setQualityInspections(INITIAL_QUALITY_INSPECTIONS);
    setProcessingEquipment(INITIAL_PROCESSING_EQUIPMENT);
    setRawMaterialLosses(INITIAL_RAW_MATERIAL_LOSS);
    setSensors(INITIAL_IOT_SENSORS);
  };

  const createSurplusBatch = (batchData: Partial<SurplusBatch>) => {
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const defaultDeadline = `${now.toISOString().slice(0, 10)} ${String(Math.min(23, now.getHours() + 4)).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const weight = Number(batchData.weightKg || batchData.quantity || 15);
    const name = batchData.foodName || batchData.dishName || 'Kitchen Surplus Meal';
    const batchCode = `SRP-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(
      surplusBatches.length + 1
    ).padStart(2, '0')}`;

    const newSurplus: SurplusBatch = {
      id: `srp-${Date.now()}`,
      batchNumber: batchCode,
      foodName: name,
      dishName: name,
      category: batchData.category || 'Cooked Main',
      quantity: weight,
      unit: batchData.unit || 'kg',
      portions: batchData.portions || Math.round(weight * 3.5),
      weightKg: weight,
      preparationTime: batchData.preparationTime || timeStr,
      preparedAt: batchData.preparationTime || timeStr,
      storageConditions: batchData.storageConditions || 'Hot Holding (>65°C)',
      collectionDeadline: batchData.collectionDeadline || defaultDeadline,
      safeConsumptionWindow: batchData.safeConsumptionWindow || `Safe until ${defaultDeadline.slice(11)} (4-hr HACCP window)`,
      location: batchData.location || 'Main Kitchen Service Bay',
      qualityReviewStatus: batchData.qualityReviewStatus || 'Passed HACCP Inspection',
      status: 'Available',
      redistributionStatus: 'staged',
      source: batchData.source || 'Manual Kitchen Entry',
      sourceRefId: batchData.sourceRefId,
      haccpClearance: batchData.haccpClearance || {
        temperatureLogged: batchData.storageConditions?.includes('Chilled') ? 3.2 : 68.4,
        passed: true,
        inspectedBy: 'Food Safety Lead P. Iyer (Cert #HACCP-441)',
      },
      notes: batchData.notes || 'Surplus staged for internal institutional routing.',
    };

    setSurplusBatches(prev => [newSurplus, ...prev]);

    // Add activity
    const displayTime = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: displayTime,
      event: `Surplus Listed: ${name}`,
      category: 'surplus',
      quantity: `${weight} kg (~${newSurplus.portions} portions)`,
      quantityKg: weight,
      status: 'Staged',
      stationOrPartner: newSurplus.location,
      loggedBy: newSurplus.haccpClearance?.inspectedBy || 'Culinary Staff',
      temperature: newSurplus.haccpClearance?.temperatureLogged,
      notes: `Registered batch ${batchCode} at ${newSurplus.storageConditions}. Deadline: ${newSurplus.collectionDeadline}.`,
      relatedTab: 'surplus',
      relatedId: newSurplus.id,
    };
    setActivities(prev => [newActivity, ...prev]);
    persistDoc('food_listings', newSurplus.id, newSurplus);
  };

  const updateSurplusBatch = (id: string, updates: Partial<SurplusBatch>) => {
    setSurplusBatches(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        const merged = { ...b, ...updates };
        if (updates.foodName && !updates.dishName) merged.dishName = updates.foodName;
        if (updates.dishName && !updates.foodName) merged.foodName = updates.dishName;
        if (updates.quantity && !updates.weightKg) merged.weightKg = updates.quantity;
        return merged;
      })
    );

    const target = surplusBatches.find(b => b.id === id);
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Surplus Batch Updated: ${updates.foodName || target?.foodName || 'Batch'}`,
      category: 'surplus',
      quantity: `${updates.weightKg ?? target?.weightKg ?? 0} kg`,
      quantityKg: updates.weightKg ?? target?.weightKg ?? 0,
      status: 'Staged',
      stationOrPartner: updates.location || target?.location || 'Kitchen',
      loggedBy: 'Kitchen Supervisor',
      notes: `Updated listing parameters for batch ${target?.batchNumber || id}.`,
      relatedTab: 'surplus',
      relatedId: id,
    };
    setActivities(prev => [newActivity, ...prev]);
    updateDocInDb('food_listings', id, updates);
  };

  const deleteSurplusBatch = (id: string) => {
    const target = surplusBatches.find(b => b.id === id);
    setSurplusBatches(prev => prev.filter(b => b.id !== id));
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Surplus Listing Removed: ${target?.foodName || 'Batch'}`,
      category: 'surplus',
      quantity: `${target?.weightKg ?? 0} kg`,
      quantityKg: target?.weightKg ?? 0,
      status: 'Logged',
      stationOrPartner: target?.location || 'Kitchen',
      loggedBy: 'Kitchen Supervisor',
      notes: `Surplus batch ${target?.batchNumber || id} de-listed.`,
      relatedTab: 'surplus',
    };
    setActivities(prev => [newActivity, ...prev]);
    deleteDocFromDb('food_listings', id);
  };

  const assignBatchToRecipient = (
    batchId: string,
    recipientId: string,
    assignedQuantity?: number
  ): boolean => {
    const batch = surplusBatches.find(b => b.id === batchId);
    const partner = partners.find(p => p.id === recipientId);
    if (!batch || !partner) return false;

    const qtyToAssign = assignedQuantity || batch.weightKg || batch.quantity;
    if (qtyToAssign > (batch.weightKg || batch.quantity)) {
      return false; // Prevent multiple assignments exceeding available surplus quantity!
    }

    setSurplusBatches(prev =>
      prev.map(b =>
        b.id === batchId
          ? {
              ...b,
              status: 'Matched',
              redistributionStatus: 'allocated',
              assignedRecipientId: recipientId,
              assignedRecipientName: partner.name,
              assignedPartnerId: recipientId,
              assignedQuantity: qtyToAssign,
            }
          : b
      )
    );

    // Update recipient's allocated today count
    setPartners(prev =>
      prev.map(p =>
        p.id === recipientId
          ? {
              ...p,
              allocatedTodayKg: (p.allocatedTodayKg || 0) + qtyToAssign,
            }
          : p
      )
    );

    // Add activity
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Surplus Matched: ${batch.foodName || batch.dishName}`,
      category: 'surplus',
      quantity: `${qtyToAssign} kg`,
      quantityKg: qtyToAssign,
      status: 'Staged',
      stationOrPartner: partner.name,
      loggedBy: 'AI Matching Engine',
      notes: `Allocated ${qtyToAssign} kg to ${partner.name}. Awaiting pickup scheduling.`,
      relatedTab: 'surplus',
      relatedId: batchId,
    };
    setActivities(prev => [newActivity, ...prev]);

    // Atomic transaction update on Cloud Firestore if authenticated
    if (currentUser) {
      allocateSurplusBatchTransaction(batchId, recipientId, partner.name, qtyToAssign).catch(err => {
        console.warn('[Firestore surplus allocation notice]:', err);
      });
    }

    return true;
  };

  const schedulePickup = (
    batchId: string,
    pickupDetails: NonNullable<SurplusBatch['pickupDetails']>
  ) => {
    const batch = surplusBatches.find(b => b.id === batchId);
    setSurplusBatches(prev =>
      prev.map(b =>
        b.id === batchId
          ? {
              ...b,
              status: 'Pickup Scheduled',
              pickupDetails,
            }
          : b
      )
    );

    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Pickup Scheduled: ${batch?.foodName || batch?.dishName}`,
      category: 'dispatch',
      quantity: `${batch?.weightKg ?? 0} kg`,
      quantityKg: batch?.weightKg ?? 0,
      status: 'Staged',
      stationOrPartner: batch?.assignedRecipientName || 'Internal Logistics',
      loggedBy: 'Logistics Lead',
      notes: `Pickup window: ${pickupDetails.scheduledTime} via ${pickupDetails.carrier}. Driver: ${pickupDetails.driverContact || 'Assigned'}.`,
      relatedTab: 'surplus',
      relatedId: batchId,
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const markBatchCollected = (batchId: string, tempAtPickup?: number) => {
    const batch = surplusBatches.find(b => b.id === batchId);
    setSurplusBatches(prev =>
      prev.map(b =>
        b.id === batchId
          ? {
              ...b,
              status: 'Collected',
              redistributionStatus: 'dispatched',
              pickupDetails: b.pickupDetails
                ? { ...b.pickupDetails, tempAtPickup: tempAtPickup || b.pickupDetails.tempAtPickup || 66.0 }
                : undefined,
            }
          : b
      )
    );

    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Surplus Collected / Dispatched: ${batch?.foodName || batch?.dishName}`,
      category: 'dispatch',
      quantity: `${batch?.weightKg ?? 0} kg`,
      quantityKg: batch?.weightKg ?? 0,
      status: 'In-Transit',
      stationOrPartner: batch?.assignedRecipientName || 'Dock 1',
      loggedBy: 'Loading Officer',
      temperature: tempAtPickup || 66.0,
      notes: `Vehicle departed dock at ${timeStr}. Thermal box temperature verified at ${tempAtPickup || 66.0}°C.`,
      relatedTab: 'surplus',
      relatedId: batchId,
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const confirmBatchDelivery = (
    batchId: string,
    deliveryDetails: NonNullable<SurplusBatch['deliveryDetails']>
  ) => {
    const batch = surplusBatches.find(b => b.id === batchId);
    if (!batch) return;

    const deliveredWeight = Number(deliveryDetails.deliveredKg || batch.weightKg || batch.quantity);

    setSurplusBatches(prev =>
      prev.map(b =>
        b.id === batchId
          ? {
              ...b,
              status: 'Delivered',
              redistributionStatus: 'completed',
              deliveryDetails,
            }
          : b
      )
    );

    // CRITICAL: Connect surplus quantities to dashboard & sustainability analytics!
    // ONLY count food as recovered after delivery confirmation.
    setSustainability(prev => ({
      ...prev,
      mealsDivertedCount: prev.mealsDivertedCount + Math.round(deliveredWeight / 0.35),
      co2eAvoidedKg: Number((prev.co2eAvoidedKg + deliveredWeight * 2.5).toFixed(1)),
      waterSavedLitres: prev.waterSavedLitres + Math.round(deliveredWeight * 290),
    }));

    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Delivery Confirmed & Food Recovered: ${batch.foodName || batch.dishName}`,
      category: 'dispatch',
      quantity: `${deliveredWeight} kg (~${Math.round(deliveredWeight * 3.5)} meals)`,
      quantityKg: deliveredWeight,
      status: 'Verified',
      stationOrPartner: batch.assignedRecipientName || 'Recipient Facility',
      loggedBy: deliveryDetails.receivingOfficer,
      temperature: deliveryDetails.tempAtDelivery || 65.0,
      notes: `Verified by ${deliveryDetails.receivingOfficer} (Code: ${deliveryDetails.signatureVerificationCode || 'VERIF-HACCP'}). Successfully diverted from landfill.`,
      relatedTab: 'surplus',
      relatedId: batchId,
    };
    setActivities(prev => [newActivity, ...prev]);

    // Add high-priority notification
    const newNotification: NotificationAlert = {
      id: `notif-deliv-${Date.now()}`,
      title: 'Food Recovery Completed & Verified',
      message: `${deliveredWeight} kg (${batch.foodName}) delivered and verified at ${batch.assignedRecipientName}. Sustainability impact updated.`,
      time: 'Just now',
      type: 'success',
      read: false,
      navTarget: 'surplus',
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Atomic delivery confirmation and audit lock in Firestore
    if (currentUser) {
      confirmBatchDeliveryTransaction(batchId, deliveryDetails).catch(err => {
        console.warn('[Firestore delivery confirmation notice]:', err);
      });
    }
  };

  const cancelBatch = (batchId: string, reason: string) => {
    const batch = surplusBatches.find(b => b.id === batchId);
    if (!batch) return;

    setSurplusBatches(prev =>
      prev.map(b =>
        b.id === batchId
          ? {
              ...b,
              status: 'Cancelled',
              notes: `${b.notes || ''} [Cancelled: ${reason}]`,
            }
          : b
      )
    );

    // If batch was assigned to a recipient, reverse their allocatedTodayKg
    if (batch.assignedRecipientId) {
      setPartners(prev =>
        prev.map(p =>
          p.id === batch.assignedRecipientId
            ? {
                ...p,
                allocatedTodayKg: Math.max(0, (p.allocatedTodayKg || 0) - (batch.assignedQuantity || batch.weightKg)),
              }
            : p
        )
      );
    }

    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Surplus Batch Cancelled: ${batch.foodName || batch.dishName}`,
      category: 'surplus',
      quantity: `${batch.weightKg} kg`,
      quantityKg: batch.weightKg,
      status: 'Logged',
      stationOrPartner: batch.location,
      loggedBy: 'Kitchen Supervisor',
      notes: `Cancellation reason: ${reason}.`,
      relatedTab: 'surplus',
      relatedId: batchId,
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // Internal Recipient Directory handlers
  const addRecipient = (recipient: Omit<RedistributionPartner, 'id'>) => {
    const newPartner: RedistributionPartner = {
      ...recipient,
      id: `prt-${Date.now()}`,
      typicalCapacityKg: recipient.serviceCapacity || recipient.typicalCapacityKg || 50,
      preferredPickupWindow: recipient.preferredPickupWindow || recipient.operatingHours || '12:00 - 18:00',
      isActive: true,
      allocatedTodayKg: 0,
    };
    setPartners(prev => [newPartner, ...prev]);

    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Recipient Partner Added: ${recipient.name}`,
      category: 'surplus',
      quantity: `${newPartner.serviceCapacity} kg/day capacity`,
      quantityKg: newPartner.serviceCapacity,
      status: 'Completed',
      stationOrPartner: newPartner.location,
      loggedBy: 'Institutional Admin',
      notes: `Enrolled ${newPartner.name} as ${newPartner.verificationStatus}.`,
      relatedTab: 'surplus',
      relatedId: newPartner.id,
    };
    setActivities(prev => [newActivity, ...prev]);
    persistDoc('recipients', newPartner.id, newPartner);
  };

  const updateRecipient = (id: string, updates: Partial<RedistributionPartner>) => {
    setPartners(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );

    const target = partners.find(p => p.id === id);
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Recipient Record Updated: ${updates.name || target?.name}`,
      category: 'surplus',
      quantity: `${updates.serviceCapacity ?? target?.serviceCapacity ?? 0} kg/day`,
      quantityKg: updates.serviceCapacity ?? target?.serviceCapacity ?? 0,
      status: 'Completed',
      stationOrPartner: updates.location || target?.location || 'Internal Directory',
      loggedBy: 'Institutional Admin',
      notes: `Updated recipient profile for ${target?.name || id}.`,
      relatedTab: 'surplus',
      relatedId: id,
    };
    setActivities(prev => [newActivity, ...prev]);
    updateDocInDb('recipients', id, updates);
  };

  const deleteRecipient = (id: string) => {
    const target = partners.find(p => p.id === id);
    setPartners(prev => prev.filter(p => p.id !== id));
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      event: `Recipient Removed: ${target?.name}`,
      category: 'surplus',
      quantity: `0 kg`,
      quantityKg: 0,
      status: 'Logged',
      stationOrPartner: target?.location || 'Internal Directory',
      loggedBy: 'Institutional Admin',
      notes: `De-registered ${target?.name} from active distribution network.`,
      relatedTab: 'surplus',
    };
    setActivities(prev => [newActivity, ...prev]);
    deleteDocFromDb('recipients', id);
  };

  const registerSurplusBatch = (
    batch: Omit<SurplusBatch, 'id' | 'batchNumber' | 'preparedAt' | 'redistributionStatus'>
  ) => {
    createSurplusBatch(batch);
  };

  const createDispatchManifest = (
    batchIds: string[],
    partnerId: string,
    transitCarrier: RedistributionDispatch['transitCarrier']
  ) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    const selectedBatches = surplusBatches.filter(b => batchIds.includes(b.id));
    const totalKg = selectedBatches.reduce((acc, curr) => acc + curr.weightKg, 0);
    const dishSummary = selectedBatches.map(b => `${b.dishName} (${b.weightKg}kg)`).join(', ');

    const now = new Date();
    const dispatchCode = `DISP-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const arrivalTime = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newDispatch: RedistributionDispatch = {
      id: `disp-${Date.now()}`,
      manifestCode: dispatchCode,
      surplusBatchIds: batchIds,
      dishSummary,
      totalKg: Number(totalKg.toFixed(1)),
      destinationPartner: partner.name,
      destinationType: partner.type,
      transitCarrier,
      dispatchTime: timeStr,
      estimatedArrival: arrivalTime,
      status: 'In-Transit',
      tempAtDispatch: 67.5,
      authorizedOfficer: 'V. Sharma (Culinary Ops Head)',
    };

    setDispatches(prev => [newDispatch, ...prev]);

    // Update surplus batches: transition status to Collected and redistributionStatus to dispatched
    setSurplusBatches(prev =>
      prev.map(b =>
        batchIds.includes(b.id)
          ? {
              ...b,
              status: 'Collected',
              redistributionStatus: 'dispatched',
              assignedPartnerId: partnerId,
              assignedRecipientId: partnerId,
              assignedRecipientName: partner.name,
              dispatchManifestId: dispatchCode,
              pickupDetails: {
                carrier: transitCarrier,
                scheduledTime: timeStr,
                tempAtPickup: 67.5,
              },
            }
          : b
      )
    );

    // Update recipient partner's allocatedTodayKg
    setPartners(prev =>
      prev.map(p =>
        p.id === partnerId
          ? {
              ...p,
              allocatedTodayKg: (p.allocatedTodayKg || 0) + totalKg,
            }
          : p
      )
    );

    // Persist updates to Firestore
    batchIds.forEach(id => {
      updateDocInDb('food_listings', id, {
        status: 'Collected',
        redistributionStatus: 'dispatched',
        assignedPartnerId: partnerId,
        assignedRecipientId: partnerId,
        assignedRecipientName: partner.name,
        dispatchManifestId: dispatchCode,
        pickupDetails: {
          carrier: transitCarrier,
          scheduledTime: timeStr,
          tempAtPickup: 67.5,
        },
      });
    });
    updateDocInDb('recipients', partnerId, {
      allocatedTodayKg: (partner.allocatedTodayKg || 0) + totalKg,
    });

    // Add activity
    const displayTime = `Today ${timeStr}`;
    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: displayTime,
      event: `Dispatch En Route: Manifest ${dispatchCode}`,
      category: 'dispatch',
      quantity: `${totalKg.toFixed(1)} kg`,
      quantityKg: totalKg,
      status: 'In-Transit',
      stationOrPartner: partner.name,
      loggedBy: 'V. Sharma (Culinary Ops Head)',
      temperature: 67.5,
      notes: `Vehicle: ${transitCarrier}. Destination: ${partner.name}. Dishes: ${dishSummary}`,
      relatedTab: 'surplus',
      relatedId: newDispatch.id,
    };
    setActivities(prev => [newActivity, ...prev]);

    // Notification
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Dispatch Manifest Created',
        message: `Manifest ${dispatchCode} allocated to ${partner.name} (${totalKg.toFixed(1)} kg).`,
        time: 'Just now',
        type: 'success',
        read: false,
        navTarget: 'surplus',
      },
      ...prev,
    ]);

    // Atomic manifest transaction on Cloud Firestore
    if (currentUser) {
      createDispatchManifestTransaction(newDispatch).catch(err => {
        console.warn('[Firestore dispatch transaction notice]:', err);
      });
    }
  };

  const updateDispatchStatus = (dispatchId: string, status: RedistributionDispatch['status']) => {
    setDispatches(prev =>
      prev.map(d => (d.id === dispatchId ? { ...d, status } : d))
    );

    const d = dispatches.find(item => item.id === dispatchId);
    if (d && status === 'Received & Verified') {
      const now = new Date();
      const displayTime = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newActivity: ActivityLogItem = {
        id: `act-${Date.now()}`,
        timestamp: displayTime,
        event: `Handover Verified: Manifest ${d.manifestCode}`,
        category: 'dispatch',
        quantity: `${d.totalKg} kg`,
        quantityKg: d.totalKg,
        status: 'Verified',
        stationOrPartner: d.destinationPartner,
        loggedBy: 'Partner Authorized Officer',
        notes: `Confirmed receipt and verified safe handover of ${d.dishSummary}.`,
        relatedTab: 'surplus',
        relatedId: d.id,
      };
      setActivities(prev => [newActivity, ...prev]);
    }
  };

  const updateSensorReading = (sensorId: string, newValue: number) => {
    setSensors(prev =>
      prev.map(s => {
        if (s.id === sensorId) {
          const isOptimal = newValue >= s.minSafe && newValue <= s.maxSafe;
          const status = isOptimal ? 'optimal' : 'critical';
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          return {
            ...s,
            currentValue: newValue,
            status,
            lastPing: 'Just now',
            history: [...s.history.slice(1), { time: timeStr, value: newValue }],
          };
        }
        return s;
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const runForecastSimulation = (headcountDelta: number, rainExpected: boolean, specialEventFactor: number) => {
    setDemandPointsState(prev => {
      const currentRangeList = prev[dateRange] || INITIAL_DEMAND_POINTS;
      const updated = currentRangeList.map(pt => {
        if (pt.day.includes('Today') || pt.day.includes('Dinner')) {
          const base = 2600;
          const weatherMod = rainExpected ? -120 : 50;
          const eventMod = specialEventFactor * 180;
          const newPredicted = Math.round(base + headcountDelta + weatherMod + eventMod);
          const recommendation = Math.round(newPredicted * 1.02);
          return {
            ...pt,
            predictedMeals: newPredicted,
            prepRecommendation: recommendation,
            overproductionRisk: newPredicted > 2700 ? 'moderate' : 'low',
            weather: rainExpected ? 'Heavy Rain (Simulated), 22°C' : 'Clear & Dry (Simulated), 27°C',
          };
        }
        return pt;
      });
      return {
        ...prev,
        [dateRange]: updated,
      };
    });
  };

  const saveForecastRun = (run: SavedForecastRun) => {
    setSavedForecasts(prev => [run, ...prev.filter(r => r.id !== run.id)]);
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-save-${Date.now()}`,
      timestamp: timeStr,
      event: `Forecast Run Saved: ${run.name}`,
      category: 'inventory',
      quantity: `${run.totalPredictedMeals.toLocaleString()} meals`,
      quantityKg: Math.round(run.totalPredictedMeals * 0.45),
      status: 'Verified',
      stationOrPartner: 'Forecasting Studio',
      loggedBy: 'Kitchen Supervisor',
      notes: `Saved regression run (${run.modelType}, MAE: ${run.mae}) for dates ${run.forecastDateRange}.`,
      relatedTab: 'demand',
    };
    setActivities(prev => [newActivity, ...prev]);
    persistDoc('forecasts', run.id, run);
  };

  const deleteSavedForecast = (id: string) => {
    setSavedForecasts(prev => prev.filter(r => r.id !== id));
    deleteDocFromDb('forecasts', id);
  };

  const applyForecastToSchedule = (result: ForecastResult) => {
    setActiveForecastResult(result);

    // Map 7-day forecast items into DemandDataPoint
    const updatedDemandPoints: DemandDataPoint[] = result.sevenDayForecast.map(item => ({
      date: item.date,
      day: `${item.dayOfWeek.slice(0, 3)} ${item.date.slice(5)}`,
      predictedMeals: item.predictedDemand,
      actualConsumption: Math.round(item.predictedDemand * 0.98),
      prepRecommendation: item.recommendedPrep,
      overproductionRisk: item.overproductionRisk,
      weather: item.weather || 'Clear',
      specialEvent: item.specialEvent,
    }));

    setDemandPointsState(prev => ({
      ...prev,
      '7d': updatedDemandPoints,
      today: prev.today.map(pt => {
        if (pt.day.includes('Dinner')) {
          const dinnerForecast = result.sevenDayForecast[0];
          const newPrep = dinnerForecast ? Math.round(dinnerForecast.recommendedPrep * 0.38) : pt.prepRecommendation;
          const newPred = dinnerForecast ? Math.round(dinnerForecast.predictedDemand * 0.38) : pt.predictedMeals;
          return {
            ...pt,
            prepRecommendation: newPrep,
            predictedMeals: newPred,
          };
        }
        return pt;
      }),
    }));

    // Add activity
    const now = new Date();
    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newActivity: ActivityLogItem = {
      id: `act-forecast-${Date.now()}`,
      timestamp: timeStr,
      event: `AI Demand Plan Published (${result.metrics.modelType})`,
      category: 'inventory',
      quantity: `${result.summary.totalRecommendedPrep.toLocaleString()} meals`,
      quantityKg: Math.round(result.summary.totalRecommendedPrep * 0.45),
      status: 'Completed',
      stationOrPartner: 'Central Kitchen Line',
      loggedBy: 'AI Demand Engine',
      notes: `Target prep published for next 7 days with ${result.metrics.mae} MAE confidence buffer.`,
      relatedTab: 'demand',
    };
    setActivities(prev => [newActivity, ...prev]);

    // Add notification
    const newNotification: NotificationAlert = {
      id: `notif-forecast-${Date.now()}`,
      title: 'AI Production Schedule Committed',
      message: `Published ${result.summary.totalRecommendedPrep.toLocaleString()} meals 7-day target to kitchen displays. Expected surplus: ${result.summary.totalExpectedSurplus} meals.`,
      time: 'Just now',
      type: 'success',
      read: false,
      navTarget: 'demand',
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // ----------------------------------------------------
  // Quality & IoT and Processing Efficiency
  // ----------------------------------------------------
  const efficiencySummary: ProcessingEfficiencySummary = useMemo(() => {
    const totalEquipment = processingEquipment.length || 1;
    const avgScore = Math.round(
      processingEquipment.reduce((acc, eq) => acc + (eq.efficiencyScore || 85), 0) / totalEquipment
    );
    const totalLossKg = rawMaterialLosses.reduce((acc, r) => acc + r.lossKg, 0);
    const totalInputKg = rawMaterialLosses.reduce((acc, r) => acc + r.inputWeightKg, 0);
    const avgLossPct = totalInputKg > 0 ? Number(((totalLossKg / totalInputKg) * 100).toFixed(1)) : 8.4;
    const totalDowntimeMin = processingEquipment.reduce((acc, eq) => acc + (eq.downtimeMinutesToday || 0), 0);
    const totalEnergyKwh = processingEquipment.reduce((acc, eq) => acc + (eq.energyTodayKwh || 0), 0);

    const operationalAlerts: string[] = [];
    processingEquipment.forEach(eq => {
      if (eq.status === 'Fault') {
        operationalAlerts.push(`CRITICAL: Machine Fault on ${eq.name} (${eq.line}). Immediate maintenance ticket dispatched.`);
      } else if (eq.status === 'Maintenance') {
        operationalAlerts.push(`SCHEDULED: Maintenance servicing on ${eq.name}.`);
      }
    });

    rawMaterialLosses.forEach(loss => {
      if (loss.lossPercentage > 12) {
        operationalAlerts.push(`RAW MATERIAL LOSS SPIKE: ${loss.ingredient} loss at ${loss.lossPercentage}% during ${loss.processStep} exceeds 12% operational tolerance.`);
      }
    });

    return {
      overallOeePercent: avgScore,
      totalRawMaterialLossKg: Number(totalLossKg.toFixed(1)),
      averageLossPercentage: avgLossPct,
      activeMachineDowntimeMinutes: totalDowntimeMin,
      dailyEnergyConsumptionKwh: Number(totalEnergyKwh.toFixed(1)),
      efficiencyTrend: '+2.4% vs last shift',
      operationalAlerts,
    };
  }, [processingEquipment, rawMaterialLosses]);

  const addQualityInspection = (
    inspectionData: Omit<QualityInspectionRecord, 'id' | 'inspectionTimestamp' | 'reviewStatus' | 'safetyDisclaimer'> & {
      inspectionTimestamp?: string;
      reviewStatus?: QualityInspectionReviewStatus;
      safetyDisclaimer?: string;
    }
  ): QualityInspectionRecord => {
    const now = new Date();
    const id = `qi-${Date.now()}`;
    const timestamp =
      inspectionData.inspectionTimestamp ||
      `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const reviewStatus: QualityInspectionReviewStatus = inspectionData.reviewStatus || 'Pending';

    const newRecord: QualityInspectionRecord = {
      ...inspectionData,
      id,
      inspectionTimestamp: timestamp,
      reviewStatus,
      safetyDisclaimer:
        'DISCLAIMER: AI visual analysis provides preliminary visual observations only. Visual assessment cannot certify microbiological safety, detect toxic chemical contamination, or replace official Food Safety / HACCP lab protocols.',
    };

    setQualityInspections(prev => [newRecord, ...prev]);

    const isConcern =
      reviewStatus === 'Flagged' ||
      reviewStatus === 'Rejected' ||
      newRecord.detectedObservations.safetyClearance === 'Blocked / Unsafe' ||
      newRecord.detectedObservations.safetyClearance === 'Manual Review Required';

    if (isConcern) {
      if (newRecord.linkedSurplusBatchId || newRecord.batchCode) {
        setSurplusBatches(prev =>
          prev.map(batch => {
            if (
              (newRecord.linkedSurplusBatchId && batch.id === newRecord.linkedSurplusBatchId) ||
              (newRecord.batchCode && batch.batchNumber === newRecord.batchCode) ||
              batch.foodName.toLowerCase() === newRecord.itemName.toLowerCase()
            ) {
              return {
                ...batch,
                qualityReviewStatus: 'Failed / Rejected',
                notes: `${batch.notes || ''} [MANDATORY SAFETY HOLD: Visual inspection flagged quality anomaly. Redistribution strictly prohibited.]`.trim(),
              };
            }
            return batch;
          })
        );
      }

      setNotifications(prev => [
        {
          id: `notif-qi-${Date.now()}`,
          title: `Quality Alert: ${newRecord.itemName}`,
          message: `Visual inspection flagged potential quality concern (${newRecord.detectedObservations.overallObservationSummary}). Redistribution blocked pending human verification.`,
          time: 'Just now',
          type: 'critical',
          read: false,
          navTarget: 'quality',
        },
        ...prev,
      ]);
    }

    const timeStr = `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setActivities(prev => [
      {
        id: `act-qi-${Date.now()}`,
        timestamp: timeStr,
        event: `Visual Inspection: ${newRecord.itemName}`,
        category: 'quality',
        quantity: '1 Sample',
        quantityKg: 0,
        status: isConcern ? 'Flagged' : 'Inspected',
        stationOrPartner: newRecord.location || 'Quality Lab',
        loggedBy: newRecord.inspectedBy || 'Staff Reviewer',
        notes: `AI observations: ${newRecord.detectedObservations.overallObservationSummary}. Status: ${reviewStatus}.`,
        relatedTab: 'quality',
        relatedId: id,
      },
      ...prev,
    ]);

    persistDoc('quality_checks', newRecord.id, newRecord);
    return newRecord;
  };

  const updateQualityInspectionReview = (
    id: string,
    reviewStatus: QualityInspectionReviewStatus,
    reviewerNotes?: string,
    reviewerName?: string
  ) => {
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const reviewer = reviewerName || 'P. Iyer (Lead HACCP Auditor)';

    setQualityInspections(prev =>
      prev.map(qi => {
        if (qi.id !== id) return qi;
        return {
          ...qi,
          reviewStatus,
          reviewerNotes: reviewerNotes || qi.reviewerNotes,
          reviewedBy: reviewer,
          reviewedAt: timeStr,
        };
      })
    );

    updateDocInDb('quality_checks', id, {
      reviewStatus,
      reviewerNotes: reviewerNotes || '',
      reviewedBy: reviewer,
      reviewedAt: timeStr,
    });

    const target = qualityInspections.find(q => q.id === id);
    const itemName = target?.itemName || 'Food Item';

    if (reviewStatus === 'Flagged' || reviewStatus === 'Rejected') {
      if (target?.linkedSurplusBatchId || target?.batchCode || target?.itemName) {
        setSurplusBatches(prev =>
          prev.map(batch => {
            if (
              (target.linkedSurplusBatchId && batch.id === target.linkedSurplusBatchId) ||
              (target.batchCode && batch.batchNumber === target.batchCode) ||
              batch.foodName.toLowerCase() === target.itemName.toLowerCase()
            ) {
              return {
                ...batch,
                qualityReviewStatus: 'Failed / Rejected',
                notes: `${batch.notes || ''} [QUARANTINE: Marked ${reviewStatus} by human reviewer ${reviewer} on ${timeStr}].`.trim(),
              };
            }
            return batch;
          })
        );
      }

      setNotifications(prev => [
        {
          id: `notif-rev-${Date.now()}`,
          title: `Food Safety Quarantine: ${itemName}`,
          message: `Human reviewer marked inspection #${id} as ${reviewStatus}. Item blocked from human redistribution.`,
          time: 'Just now',
          type: 'critical',
          read: false,
          navTarget: 'quality',
        },
        ...prev,
      ]);
    } else if (reviewStatus === 'Reviewed') {
      setNotifications(prev => [
        {
          id: `notif-rev-${Date.now()}`,
          title: `Inspection Verified: ${itemName}`,
          message: `Human safety review logged by ${reviewer}. Notes: ${reviewerNotes || 'Standard kitchen procedures verified.'}`,
          time: 'Just now',
          type: 'success',
          read: false,
          navTarget: 'quality',
        },
        ...prev,
      ]);
    }

    setActivities(prev => [
      {
        id: `act-rev-${Date.now()}`,
        timestamp: `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        event: `Quality Review: ${itemName} → ${reviewStatus}`,
        category: 'quality',
        quantity: '1 Item',
        quantityKg: 0,
        status: reviewStatus === 'Reviewed' ? 'Verified' : 'Flagged',
        stationOrPartner: target?.location || 'QA Station',
        loggedBy: reviewer,
        notes: reviewerNotes || `Updated review status to ${reviewStatus}.`,
        relatedTab: 'quality',
        relatedId: id,
      },
      ...prev,
    ]);
  };

  const deleteQualityInspection = (id: string) => {
    setQualityInspections(prev => prev.filter(q => q.id !== id));
    deleteDocFromDb('quality_checks', id);
  };

  const updateEquipmentStatus = (id: string, updates: Partial<ProcessingEquipment>) => {
    setProcessingEquipment(prev =>
      prev.map(eq => (eq.id === id ? { ...eq, ...updates } : eq))
    );
  };

  const addRawMaterialLoss = (record: Omit<RawMaterialLossRecord, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newRecord: RawMaterialLossRecord = {
      ...record,
      id: `loss-${Date.now()}`,
      timestamp: timeStr,
    };
    setRawMaterialLosses(prev => [newRecord, ...prev]);

    setActivities(prev => [
      {
        id: `act-loss-${Date.now()}`,
        timestamp: `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        event: `Raw Material Loss Logged: ${newRecord.ingredient}`,
        category: 'waste',
        quantity: `${newRecord.lossKg} kg (${newRecord.lossPercentage}%)`,
        quantityKg: newRecord.lossKg,
        status: newRecord.lossPercentage > 12 ? 'Flagged' : 'Logged',
        stationOrPartner: newRecord.productionLine,
        loggedBy: newRecord.loggedBy,
        notes: `${newRecord.processStep} on ${newRecord.equipmentUsed || 'Line'}: ${newRecord.notes || 'Routine prep trimming'}.`,
        relatedTab: 'quality',
      },
      ...prev,
    ]);
    persistDoc('processing_logs', newRecord.id, newRecord);
  };

  const submitManualSensorReading = (payload: ManualSensorReadingPayload) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const targetSensor = sensors.find(s => s.id === payload.sensorId);
    if (!targetSensor) return;

    const val = payload.value;
    const isOptimal = val >= targetSensor.minSafe && val <= targetSensor.maxSafe;
    const isWarning =
      !isOptimal &&
      ((val > targetSensor.maxSafe && val <= targetSensor.maxSafe * 1.15) ||
        (val < targetSensor.minSafe && val >= targetSensor.minSafe * 0.85));
    const newStatus: IoTSensor['status'] = isOptimal ? 'optimal' : isWarning ? 'warning' : 'critical';

    setSensors(prev =>
      prev.map(s => {
        if (s.id !== payload.sensorId) return s;
        return {
          ...s,
          currentValue: val,
          status: newStatus,
          lastPing: `Manual Entry (${payload.calibratedBy || 'Staff'}) at ${timeStr}`,
          history: [...s.history.slice(1), { time: timeStr, value: val }],
        };
      })
    );

    updateDocInDb('sensor_readings', payload.sensorId, {
      currentValue: val,
      status: newStatus,
      lastPing: `Manual Entry (${payload.calibratedBy || 'Staff'}) at ${timeStr}`,
    });

    if (newStatus !== 'optimal') {
      setNotifications(prev => [
        {
          id: `notif-sensor-${Date.now()}`,
          title: `Sensor Alert: ${targetSensor.name}`,
          message: `Manual reading recorded ${val}${targetSensor.unit} at ${targetSensor.location} (${newStatus.toUpperCase()}). Safe range: ${targetSensor.minSafe} - ${targetSensor.maxSafe}${targetSensor.unit}.`,
          time: 'Just now',
          type: newStatus === 'critical' ? 'critical' : 'warning',
          read: false,
          navTarget: 'quality',
        },
        ...prev,
      ]);
    }

    setActivities(prev => [
      {
        id: `act-manual-sensor-${Date.now()}`,
        timestamp: `Today ${timeStr}`,
        event: `Manual Sensor Entry: ${targetSensor.name}`,
        category: 'quality',
        quantity: `${val} ${targetSensor.unit}`,
        quantityKg: 0,
        status: newStatus === 'optimal' ? 'Optimal' : 'Flagged',
        stationOrPartner: targetSensor.location,
        loggedBy: payload.calibratedBy || 'Kitchen Technician',
        temperature: targetSensor.unit.includes('°C') ? val : undefined,
        notes: payload.notes || `Manual probe calibrated and verified against target range ${targetSensor.targetRange}.`,
        relatedTab: 'quality',
        relatedId: targetSensor.id,
      },
      ...prev,
    ]);
  };

  const simulateSensorReadingUpdate = (sensorId: string, value: number, note?: string) => {
    updateSensorReading(sensorId, value);
    if (note) {
      setNotifications(prev => [
        {
          id: `notif-sim-${Date.now()}`,
          title: 'Sensor Simulator Value Updated',
          message: note,
          time: 'Just now',
          type: 'info',
          read: false,
          navTarget: 'quality',
        },
        ...prev,
      ]);
    }
  };

  const simulateSensorAnomaly = (
    sensorId: string,
    anomalyType: 'door_ajar' | 'heat_loss' | 'high_humidity' | 'power_trip' | 'normal'
  ) => {
    const target = sensors.find(s => s.id === sensorId);
    if (!target) return;

    let targetVal = target.currentValue;
    let anomalyNote = '';

    switch (anomalyType) {
      case 'door_ajar':
        targetVal = 8.8;
        anomalyNote = 'SIMULATED ANOMALY: Walk-in chiller gasket seal compromised / door left ajar for 35 min.';
        break;
      case 'heat_loss':
        targetVal = 52.5;
        anomalyNote = 'SIMULATED ANOMALY: Hot holding steam element power drop; temperature fallen into danger zone (<60°C).';
        break;
      case 'high_humidity':
        targetVal = 82;
        anomalyNote = 'SIMULATED ANOMALY: Humidity spike in storage facility; microbial mold danger elevated.';
        break;
      case 'power_trip':
        targetVal = 14.5;
        anomalyNote = 'SIMULATED ANOMALY: Compressor breaker tripped; thermal loss in progress.';
        break;
      case 'normal':
        targetVal = target.unit.includes('°C')
          ? target.location.includes('Freeze')
            ? -19
            : target.location.includes('Hot')
            ? 68.5
            : 2.8
          : 50;
        anomalyNote = 'SIMULATED RESTORATION: Operational parameters recalibrated to safe baseline.';
        break;
    }

    submitManualSensorReading({
      sensorId,
      value: targetVal,
      calibratedBy: 'IoT Simulation Engine',
      notes: anomalyNote,
    });
  };

  const resetSensorsToNormal = () => {
    setSensors(INITIAL_IOT_SENSORS);
    setNotifications(prev => [
      {
        id: `notif-reset-sensors-${Date.now()}`,
        title: 'IoT Sensor Baseline Restored',
        message: 'All kitchen temperature and humidity probes recalibrated to nominal baseline values.',
        time: 'Just now',
        type: 'info',
        read: false,
        navTarget: 'quality',
      },
      ...prev,
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        dateRange,
        setDateRange,
        searchQuery,
        setSearchQuery,
        sidebarCollapsed,
        toggleSidebar,
        isLoadingData,
        // Firebase Auth & Cloud Firestore Persistence
        currentUser,
        userProfile,
        authLoading,
        isFirebaseConnected,
        isSeedingDatabase,
        signInWithGoogle,
        signOut,
        seedDatabase,
        kpis: currentKPIs,
        demandPoints: currentDemandPoints,
        wasteTrends: currentWasteTrends,
        inventory,
        wasteLogs,
        surplusBatches,
        partners,
        dispatches,
        sensors,
        sustainability: currentSustainability,
        notifications,
        activities,
        aiInsights,
        redistributionSummary,
        highlightedInventoryId,
        setHighlightedInventoryId,
        navigateToInventoryItem,
        savedForecasts,
        activeForecastResult,
        saveForecastRun,
        deleteSavedForecast,
        applyForecastToSchedule,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        updateInventoryStock,
        transferInventoryZone,
        addWasteLog,
        deleteWasteLog,
        resetDemoData,
        registerSurplusBatch,
        createSurplusBatch,
        updateSurplusBatch,
        deleteSurplusBatch,
        assignBatchToRecipient,
        schedulePickup,
        markBatchCollected,
        confirmBatchDelivery,
        cancelBatch,
        addRecipient,
        updateRecipient,
        deleteRecipient,
        createDispatchManifest,
        updateDispatchStatus,
        updateSensorReading,
        markNotificationRead,
        clearAllNotifications,
        runForecastSimulation,
        // Quality & IoT and Processing Efficiency
        qualityInspections,
        addQualityInspection,
        updateQualityInspectionReview,
        deleteQualityInspection,
        processingEquipment,
        updateEquipmentStatus,
        rawMaterialLosses,
        addRawMaterialLoss,
        efficiencySummary,
        submitManualSensorReading,
        simulateSensorReadingUpdate,
        simulateSensorAnomaly,
        resetSensorsToNormal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
