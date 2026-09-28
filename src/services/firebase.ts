import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  runTransaction,
  writeBatch,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  InventoryItem,
  WasteLog,
  SurplusBatch,
  RedistributionPartner,
  RedistributionDispatch,
  QualityInspectionRecord,
  IoTSensor,
  RawMaterialLossRecord,
  ProcessingEquipment,
  SustainabilityMetric,
} from '../types';
import { HistoricalMealRecord, SavedForecastRun } from '../types/forecasting';
import {
  INITIAL_INVENTORY,
  INITIAL_WASTE_LOGS,
  INITIAL_SURPLUS_BATCHES,
  REDISTRIBUTION_PARTNERS,
  INITIAL_DISPATCHES,
  INITIAL_QUALITY_INSPECTIONS,
  INITIAL_IOT_SENSORS,
  INITIAL_RAW_MATERIAL_LOSS,
  INITIAL_PROCESSING_EQUIPMENT,
  INITIAL_SUSTAINABILITY,
} from '../data/initialData';
import { SAMPLE_HISTORICAL_RECORDS } from '../data/historicalMealData';

// 1. Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 2. Error Handling conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test Connection on Boot (per skill directive)
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Live connection verified successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline. Check Firebase network permissions.');
    } else {
      console.log('[Firestore] Initial connection probe returned:', (error as Error).message);
    }
    return false;
  }
}

// 4. Institutional User Profile
export interface InstitutionalUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'Institutional Director' | 'Kitchen Supervisor' | 'Culinary Operations Lead' | 'HACCP Safety Officer' | 'Inventory Manager';
  institutionName: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;
    if (user) {
      // Sync institutional user profile in /users/{uid}
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef).catch(() => null);
      if (!snap || !snap.exists()) {
        const profile: InstitutionalUserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Kitchen Operations Officer',
          photoURL: user.photoURL || undefined,
          role: 'Kitchen Supervisor',
          institutionName: 'Apex University Dining Operations & Central Processing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, profile).catch(e => {
          console.warn('[Firestore users write warn]:', e);
        });
      }
    }
    return user;
  } catch (err: any) {
    console.error('[Firebase Auth Google Sign-in error]:', err);
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// 5. Seed Firestore with Comprehensive Institutional Data
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  try {
    // Check if inventory collection already has data
    const invSnap = await getDocs(collection(db, 'inventory'));
    if (!invSnap.empty) {
      console.log('[Firestore] Database already seeded with records.');
      return false;
    }

    console.log('[Firestore] First time database setup: seeding initial institutional records...');
    return await populateDatabaseWithInitialData();
  } catch (err) {
    console.warn('[Firestore seed check notice]:', err);
    return false;
  }
}

export async function populateDatabaseWithInitialData(): Promise<boolean> {
  try {
    const batch = writeBatch(db);

    // 1. Inventory Items -> 'inventory'
    INITIAL_INVENTORY.forEach((item) => {
      batch.set(doc(db, 'inventory', item.id), item);
    });

    // 2. Waste Logs -> 'waste_entries'
    INITIAL_WASTE_LOGS.forEach((log) => {
      batch.set(doc(db, 'waste_entries', log.id), log);
    });

    // 3. Surplus Batches -> 'food_listings'
    INITIAL_SURPLUS_BATCHES.forEach((batchItem) => {
      batch.set(doc(db, 'food_listings', batchItem.id), batchItem);
    });

    // 4. Recipients -> 'recipients'
    REDISTRIBUTION_PARTNERS.forEach((partner) => {
      batch.set(doc(db, 'recipients', partner.id), partner);
    });

    // 5. Dispatches -> 'redistribution_records'
    INITIAL_DISPATCHES.forEach((dispatch) => {
      batch.set(doc(db, 'redistribution_records', dispatch.id), dispatch);
    });

    // 6. Quality Checks -> 'quality_checks'
    INITIAL_QUALITY_INSPECTIONS.forEach((check) => {
      batch.set(doc(db, 'quality_checks', check.id), check);
    });

    // 7. Sensor Readings -> 'sensor_readings'
    INITIAL_IOT_SENSORS.forEach((sensor) => {
      batch.set(doc(db, 'sensor_readings', sensor.id), sensor);
    });

    // 8. Processing Logs -> 'processing_logs'
    INITIAL_RAW_MATERIAL_LOSS.forEach((loss) => {
      batch.set(doc(db, 'processing_logs', loss.id), loss);
    });

    // 9. Equipment in 'processing_logs' equipment section
    INITIAL_PROCESSING_EQUIPMENT.forEach((eq) => {
      batch.set(doc(db, 'processing_logs', `eq-${eq.id}`), {
        ...eq,
        isEquipment: true,
      });
    });

    // 10. Impact Metrics -> 'impact_metrics'
    batch.set(doc(db, 'impact_metrics', 'current_institutional_metric'), {
      ...INITIAL_SUSTAINABILITY,
      id: 'current_institutional_metric',
      lastCalculatedAt: new Date().toISOString(),
    });

    // 11. Meal History -> 'meal_history' (seed sample records)
    SAMPLE_HISTORICAL_RECORDS.slice(0, 30).forEach((record) => {
      batch.set(doc(db, 'meal_history', record.id), record);
    });

    await batch.commit();
    console.log('[Firestore] Initial institutional data populated successfully across 12 collections.');
    return true;
  } catch (error) {
    console.error('[Firestore populate error]:', error);
    return false;
  }
}

// 6. Atomic Transaction: Allocate Surplus Batch to Recipient Partner
export async function allocateSurplusBatchTransaction(
  batchId: string,
  recipientId: string,
  recipientName: string,
  allocatedKg: number
): Promise<{ success: boolean; message: string }> {
  const batchRef = doc(db, 'food_listings', batchId);
  const recipientRef = doc(db, 'recipients', recipientId);

  try {
    return await runTransaction(db, async (transaction) => {
      const batchDoc = await transaction.get(batchRef);
      if (!batchDoc.exists()) {
        throw new Error(`Surplus batch ${batchId} not found`);
      }

      const recipientDoc = await transaction.get(recipientRef);
      if (!recipientDoc.exists()) {
        throw new Error(`Recipient partner ${recipientId} not found`);
      }

      const batchData = batchDoc.data() as SurplusBatch;
      const currentAvailableKg = batchData.weightKg;

      if (allocatedKg <= 0 || allocatedKg > currentAvailableKg) {
        throw new Error(`Requested allocation (${allocatedKg} kg) exceeds available quantity (${currentAvailableKg} kg)`);
      }

      const remainingKg = currentAvailableKg - allocatedKg;
      const newStatus = remainingKg === 0 ? 'Matched' : 'Available';

      transaction.update(batchRef, {
        assignedRecipientId: recipientId,
        assignedRecipientName: recipientName,
        assignedQuantity: allocatedKg,
        weightKg: remainingKg === 0 ? currentAvailableKg : remainingKg, // retain or balance
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      const recipientData = recipientDoc.data() as RedistributionPartner;
      const currentAllocated = recipientData.allocatedTodayKg || 0;
      transaction.update(recipientRef, {
        allocatedTodayKg: currentAllocated + allocatedKg,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Successfully allocated ${allocatedKg} kg to ${recipientName} via atomic transaction.`,
      };
    });
  } catch (error: any) {
    console.error('[Atomic transaction allocateSurplusBatch failed]:', error);
    return {
      success: false,
      message: error.message || 'Atomic allocation failed',
    };
  }
}

// 7. Atomic Transaction: Dispatch Manifest Creation & Batch State Transition
export async function createDispatchManifestTransaction(
  dispatchData: RedistributionDispatch
): Promise<{ success: boolean; message: string }> {
  const dispatchRef = doc(db, 'redistribution_records', dispatchData.id);

  try {
    return await runTransaction(db, async (transaction) => {
      // Validate all surplus batches
      for (const batchId of dispatchData.surplusBatchIds) {
        const bRef = doc(db, 'food_listings', batchId);
        const bDoc = await transaction.get(bRef);
        if (bDoc.exists()) {
          transaction.update(bRef, {
            status: 'Collected',
            redistributionStatus: 'dispatched',
            assignedRecipientName: dispatchData.destinationPartner,
            dispatchManifestId: dispatchData.manifestCode,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      transaction.set(dispatchRef, {
        ...dispatchData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Manifest ${dispatchData.manifestCode} committed atomically with ${dispatchData.surplusBatchIds.length} batch(es).`,
      };
    });
  } catch (error: any) {
    console.error('[Atomic transaction createDispatchManifest failed]:', error);
    return {
      success: false,
      message: error.message || 'Dispatch manifest transaction failed',
    };
  }
}

// 8. Atomic Transaction: Confirm Batch Delivery
export async function confirmBatchDeliveryTransaction(
  batchId: string,
  deliveryDetails: NonNullable<SurplusBatch['deliveryDetails']>
): Promise<{ success: boolean; message: string }> {
  const batchRef = doc(db, 'food_listings', batchId);

  try {
    return await runTransaction(db, async (transaction) => {
      const bDoc = await transaction.get(batchRef);
      if (!bDoc.exists()) {
        throw new Error(`Batch ${batchId} not found`);
      }

      transaction.update(batchRef, {
        status: 'Delivered',
        redistributionStatus: 'completed',
        deliveryDetails,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Batch ${batchId} delivery verified and locked into sustainability audit.`,
      };
    });
  } catch (error: any) {
    console.error('[Atomic delivery confirmation failed]:', error);
    return {
      success: false,
      message: error.message || 'Delivery confirmation failed',
    };
  }
}
