export interface HistoricalMealRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Monday, Tuesday, etc.
  mealCategory: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  menuName?: string;
  attendance: number; // expected or registered footfall
  mealsPrepared: number;
  mealsServed: number;
  surplusMeals: number; // mealsPrepared - mealsServed
  wasteKg: number; // plate + unserved scrap in kg
  specialEvent: 'None' | 'Exam Week' | 'Cultural Fest' | 'Tech Expo' | 'Alumni Meet' | 'Holiday' | 'Sports Day';
  weather: 'Clear' | 'Rain / Storm' | 'Extreme Heat' | 'Overcast';
}

export interface ModelPerformanceMetrics {
  isTrained: boolean;
  modelType: 'Multiple Linear Regression (OLS Ridge)' | 'Moving Average Baseline (Demo)';
  trainingSetSize: number;
  holdoutSetSize: number;
  mae: number; // Mean Absolute Error in meals
  rmse: number; // Root Mean Square Error
  mape: number; // Mean Absolute Percentage Error (e.g., 3.8%)
  r2Score: number; // Coefficient of Determination (e.g., 0.88)
  baselineMae: number; // Naive Moving Average MAE for comparison
  errorReductionPercent: number; // Improvement over baseline
  evaluationNote: string;
}

export interface DayForecastItem {
  date: string;
  dayOfWeek: string;
  mealCategory: 'Breakfast' | 'Lunch' | 'Dinner' | 'All Day';
  expectedAttendance: number;
  predictedDemand: number;
  bufferPercent: number;
  recommendedPrep: number;
  expectedSurplus: number;
  confidenceScorePercent: number;
  confidenceInterval: [number, number]; // [low, high]
  overproductionRisk: 'low' | 'moderate' | 'high';
  specialEvent?: string;
  weather?: string;
  batchCookingSchedule: string; // e.g., "Batch 1: 60% @ 11:30 · Batch 2: 40% @ 12:45"
}

export interface ActionableRecommendation {
  id: string;
  title: string;
  type: 'cut_production' | 'split_batch' | 'buffer_adjustment' | 'weather_alert' | 'event_boost';
  severity: 'high' | 'medium' | 'info';
  category: string;
  impactDescription: string;
  recommendedAction: string;
  potentialCostSavings: number; // in INR
  potentialFoodSavedKg: number;
  applied: boolean;
}

export interface ForecastResult {
  generatedAt: string;
  forecastDateRange: {
    startDate: string;
    endDate: string;
  };
  targetMealCategory: string;
  summary: {
    totalPredictedDemand: number;
    totalRecommendedPrep: number;
    totalExpectedSurplus: number;
    averageConfidencePercent: number;
    overproductionRiskDays: number;
  };
  metrics: ModelPerformanceMetrics;
  sevenDayForecast: DayForecastItem[];
  actualVsPredictedHistory: {
    date: string;
    day: string;
    actualMeals: number;
    predictedMeals: number;
    recommendedPrep: number;
    isHoldoutTest: boolean;
    residual: number;
  }[];
  recommendations: ActionableRecommendation[];
  aiExplanation?: string;
}

export interface SavedForecastRun {
  id: string;
  name: string;
  savedAt: string;
  forecastDateRange: string;
  mealCategory: string;
  modelType: string;
  recordsCount: number;
  totalPredictedMeals: number;
  recommendedPrepMeals: number;
  mae: number;
  r2Score: number;
  notes?: string;
  result: ForecastResult;
}

export interface CSVValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: HistoricalMealRecord[];
  errors: string[];
  warnings: string[];
}
