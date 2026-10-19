/**
 * Deterministic Banking Calculation Engine for PCIS
 * Strictly adheres to auditability, deterministic mathematical formulas,
 * and zero reliance on generative AI for numerical scores.
 */

import {
  Currency,
  Customer,
  MonthlyBalance,
  MonthlyTransaction,
  CustomerEconomics,
  CustomerProduct,
  RelationshipActivity,
  DimensionScores,
  ActionPriorityScore,
  ActionCategory,
  MethodologyConfig,
  CustomerForecast,
  ForecastPoint,
} from '../types/banking';

export const DEFAULT_METHODOLOGY: MethodologyConfig = {
  versionId: 'PCIS-METH-V1.0-OFFICIAL',
  effectiveDate: '2026-01-01',
  approvedBy: 'مدير إدارة كبار العملاء - البنك',
  weightA: 0.35,
  weightG: 0.25,
  weightR: 0.20,
  weightE: 0.20,
  actionWeightStrategic: 0.35,
  actionWeightNeed: 0.30,
  actionWeightUrgency: 0.20,
  actionWeightEfficiency: 0.15,
  tierThresholds: {
    strategicTier1Min: 80,
    growthOpportunityMin: 60,
    relationshipReinforceMin: 40,
  },
};

/**
 * 1. Strict Deterministic Percentile Rank:
 * percentile_rank(x) = 100 * (rank_mid(x) - 1) / (n - 1)
 * Where rank_mid is average rank in case of ties (1-indexed, ascending).
 * If n < 2, returns null.
 * If all values equal, returns 50.
 */
export function calculatePercentileRank(values: number[], target: number): number | null {
  const validValues = values.filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v));
  const n = validValues.length;

  if (n < 2) return null;

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  if (min === max) return 50.0;

  // Sort ascending
  const sorted = [...validValues].sort((a, b) => a - b);

  // Find all 1-based indices where item equals target
  const indices: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (Math.abs(sorted[i] - target) < 1e-9) {
      indices.push(i + 1);
    }
  }

  let rankMid: number;
  if (indices.length > 0) {
    const sum = indices.reduce((acc, curr) => acc + curr, 0);
    rankMid = sum / indices.length;
  } else {
    // If target is between values, find interpolated position
    let countLesser = 0;
    for (const v of sorted) {
      if (v < target) countLesser++;
    }
    rankMid = countLesser + 0.5;
  }

  const pRank = (100 * (rankMid - 1)) / (n - 1);
  return Math.min(100, Math.max(0, Number(pRank.toFixed(2))));
}

/**
 * 2. Log-transformed Percentile Rank for heavily skewed financial values:
 * log1p(x) after verifying x >= 0
 */
export function calculateLogPercentileRank(values: number[], target: number): number | null {
  const nonNegative = values.filter((v) => typeof v === 'number' && !isNaN(v) && v >= 0);
  if (target < 0 || nonNegative.length < 2) return null;

  const logValues = nonNegative.map((v) => Math.log1p(v));
  const logTarget = Math.log1p(target);
  return calculatePercentileRank(logValues, logTarget);
}

/**
 * 3. Growth Rate Calculation with strict status classification:
 * Growth Rate = (current - prev) / prev
 */
export interface GrowthResult {
  growthRate: number | null; // e.g. 0.15 for +15%
  status: 'VALID' | 'NEW_ACTIVITY' | 'CEASED_ACTIVITY' | 'UNCOMPUTABLE';
  labelArabic: string;
}

export function calculateGrowthRate(currentVal: number | null, prevVal: number | null): GrowthResult {
  if (prevVal === null || currentVal === null || isNaN(prevVal) || isNaN(currentVal)) {
    return { growthRate: null, status: 'UNCOMPUTABLE', labelArabic: 'بيانات غير متوفرة' };
  }

  if (prevVal === 0) {
    if (currentVal > 0) {
      return { growthRate: null, status: 'NEW_ACTIVITY', labelArabic: 'نشاط جديد (المقام صفر)' };
    } else if (currentVal === 0) {
      return { growthRate: 0, status: 'VALID', labelArabic: '0.00% (ثبات)' };
    } else {
      return { growthRate: null, status: 'UNCOMPUTABLE', labelArabic: 'غير قابل للحساب' };
    }
  }

  if (prevVal > 0 && currentVal === 0) {
    return { growthRate: -1.0, status: 'CEASED_ACTIVITY', labelArabic: '-100.00% (نشاط متوقف)' };
  }

  if (prevVal < 0) {
    return { growthRate: null, status: 'UNCOMPUTABLE', labelArabic: 'قيمة سالبة غير معيارية' };
  }

  const rate = (currentVal - prevVal) / prevVal;
  return {
    growthRate: Number(rate.toFixed(4)),
    status: 'VALID',
    labelArabic: `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(2)}%`,
  };
}

/**
 * 4. Balance Volatility (Coefficient of Variation = StdDev / Mean):
 * Calculated only when Mean > 0 and at least 3 valid observations.
 */
export function calculateBalanceVolatility(balances: number[]): number | null {
  const valid = balances.filter((b) => typeof b === 'number' && !isNaN(b) && isFinite(b) && b >= 0);
  if (valid.length < 3) return null;

  const n = valid.length;
  const mean = valid.reduce((sum, b) => sum + b, 0) / n;
  if (mean <= 0) return null;

  const variance = valid.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return Number(cv.toFixed(4));
}

/**
 * 5. Net Economic Contribution:
 * Net Contribution = Attributed Revenue - Attributed Service Costs - Allocated Overhead
 */
export function calculateNetContribution(
  revenue: number | null,
  serviceCosts: number | null,
  allocatedOverhead: number | null
): number | null {
  if (revenue === null || serviceCosts === null || allocatedOverhead === null) return null;
  if (isNaN(revenue) || isNaN(serviceCosts) || isNaN(allocatedOverhead)) return null;
  return Number((revenue - serviceCosts - allocatedOverhead).toFixed(2));
}

/**
 * 6. Four Dimension Scoring Engine (A, G, R, E)
 */
export interface DimensionCalculationContext {
  customer: Customer;
  balances: MonthlyBalance[];
  transactions: MonthlyTransaction[];
  economics?: CustomerEconomics;
  products: CustomerProduct[];
  activities: RelationshipActivity[];
  peerAverageBalances: number[];
  peerNetContributions: number[];
  peerTransactionVolumes: number[];
}

export function computeDimensionScores(
  ctx: DimensionCalculationContext,
  config: MethodologyConfig = DEFAULT_METHODOLOGY
): DimensionScores {
  const notes: string[] = [];

  // --- Dimension A: Current Economic Value (الوزن 35%) ---
  let dimA: number | null = null;
  if (ctx.economics && ctx.economics.isAvailable && ctx.peerNetContributions.length >= 2) {
    const netCont = ctx.economics.netContribution;
    const pRank = calculateLogPercentileRank(ctx.peerNetContributions, Math.max(0, netCont));
    if (pRank !== null) {
      dimA = pRank;
      notes.push('البعد A: مبني على صافي المساهمة الاقتصادية الموثقة');
    }
  }

  // Fallback to Activity Proxy if net contribution is unavailable
  if (dimA === null && ctx.balances.length > 0 && ctx.peerAverageBalances.length >= 2) {
    const recentBalances = ctx.balances.slice(-3).map((b) => b.averageBalance);
    const avgRecent = recentBalances.reduce((a, b) => a + b, 0) / Math.max(1, recentBalances.length);
    const balRank = calculateLogPercentileRank(ctx.peerAverageBalances, avgRecent) ?? 50;

    // Transaction fee component
    const totalFees = ctx.transactions.reduce((acc, t) => acc + (t.feeRevenue || 0), 0);
    const feeRank = calculateLogPercentileRank(ctx.peerTransactionVolumes, totalFees) ?? 50;

    dimA = Number((balRank * 0.7 + feeRank * 0.3).toFixed(2));
    notes.push('البعد A: محسوب عبر مؤشر قيمة النشاط البديل (أرصدة + رسوم) لعدم توفر صافي المساهمة الكامل');
  }

  // --- Dimension G: Growth Opportunity (الوزن 25%) ---
  let dimG: number | null = null;
  if (ctx.balances.length >= 2) {
    // 1. Balance Trend
    const sortedBalances = [...ctx.balances].sort((a, b) => a.month.localeCompare(b.month));
    const recentBal = sortedBalances[sortedBalances.length - 1]?.averageBalance ?? 0;
    const prevBal = sortedBalances[0]?.averageBalance ?? 0;
    const growth = calculateGrowthRate(recentBal, prevBal);

    let growthScore = 50;
    if (growth.status === 'VALID' && growth.growthRate !== null) {
      // Map -50%..+50% to 10..90
      growthScore = Math.min(95, Math.max(10, 50 + growth.growthRate * 80));
    } else if (growth.status === 'NEW_ACTIVITY') {
      growthScore = 80;
    }

    // 2. Unused Eligible Products
    const unusedEligible = ctx.products.filter((p) => p.status === 'eligible_not_used').length;
    const productOpportunityScore = Math.min(95, 30 + unusedEligible * 15);

    // 3. Positive Engagement History
    const successfulEvents = ctx.activities.filter((a) => a.resultStatus === 'resolved').length;
    const engagementScore = Math.min(90, 40 + successfulEvents * 10);

    dimG = Number((growthScore * 0.45 + productOpportunityScore * 0.35 + engagementScore * 0.20).toFixed(2));
    notes.push('البعد G: تم تقييم اتجاه النمو وفرص المنتجات المؤهلة');
  } else {
    notes.push('البعد G: غير مكتمل بسبب نقص السلسلة الزمنية للأرصدة');
  }

  // --- Dimension R: Relationship Stability (الوزن 20%) ---
  let dimR: number | null = null;
  if (ctx.balances.length >= 3) {
    const balValues = ctx.balances.map((b) => b.averageBalance);
    const cv = calculateBalanceVolatility(balValues);

    let volatilityScore = 60;
    if (cv !== null) {
      // Lower volatility (CV < 0.2) is very stable -> score 90. High volatility (CV > 0.8) -> score 20
      volatilityScore = Math.min(95, Math.max(15, 95 - cv * 80));
    }

    // Relationship tenure in years
    const startYear = new Date(ctx.customer.relationshipStartDate).getFullYear() || 2020;
    const currentYear = 2026;
    const tenureYears = Math.max(0, currentYear - startYear);
    const tenureScore = Math.min(95, 40 + tenureYears * 7);

    // Continuity (months without zero activity)
    const activeMonths = ctx.balances.filter((b) => b.averageBalance > 0).length;
    const continuityRatio = activeMonths / Math.max(1, ctx.balances.length);
    const continuityScore = continuityRatio * 90;

    dimR = Number((volatilityScore * 0.45 + tenureScore * 0.35 + continuityScore * 0.20).toFixed(2));
    notes.push('البعد R: محسوب من تذبذب الأرصدة (CV) وعمر العلاقة واستمرارية النشاط');
  } else {
    notes.push('البعد R: بيانات الأرصدة غير كافية لحساب معامل التذبذب');
  }

  // --- Dimension E: Engagement & Service Needs (الوزن 20%) ---
  let dimE: number | null = null;
  const recentActivities = ctx.activities;
  const openComplaints = recentActivities.filter(
    (a) => a.type === 'complaint' && (a.resultStatus === 'pending' || a.resultStatus === 'in_progress' || a.resultStatus === 'escalated')
  );
  const urgentComplaints = openComplaints.filter((c) => c.isUrgentComplaint);

  // If client has urgent unaddressed complaint, service engagement score reflects critical need
  const pendingVisits = recentActivities.filter((a) => a.type === 'visit').length;
  const totalTouchpoints = recentActivities.length;

  let baseE = 65;
  if (urgentComplaints.length > 0) {
    baseE = 95; // High urgency/need attention
    notes.push('البعد E: توجد شكوى عاجلة أو التزام مفتوح يتطلب تدخل فوري');
  } else if (openComplaints.length > 0) {
    baseE = 80;
  } else {
    baseE = Math.min(90, 50 + totalTouchpoints * 6 + pendingVisits * 5);
  }
  dimE = Number(baseE.toFixed(2));

  // --- Overall Strategic Score ---
  // Mandatory rule: Do NOT calculate strategic score if any dimension is missing!
  const isComplete = dimA !== null && dimG !== null && dimR !== null && dimE !== null;
  let strategicScore: number | null = null;

  if (isComplete) {
    const rawScore =
      config.weightA * (dimA as number) +
      config.weightG * (dimG as number) +
      config.weightR * (dimR as number) +
      config.weightE * (dimE as number);
    strategicScore = Number(rawScore.toFixed(2));
  } else {
    notes.push('الدرجة الاستراتيجية الكلية: غير متاحة لأن أحد الأبعاد ناقص ولا يتم التعويض بقيمة صفر');
  }

  return {
    dimensionA: dimA,
    dimensionG: dimG,
    dimensionR: dimR,
    dimensionE: dimE,
    strategicScore,
    isComplete,
    completenessNotes: notes,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 7. Strategic Tier Assignment based on Rules and Dimensions
 */
export function determineStrategicTier(
  scores: DimensionScores,
  config: MethodologyConfig = DEFAULT_METHODOLOGY
): { tier: Customer['currentTier']; reasonArabic: string } {
  if (!scores.isComplete || scores.strategicScore === null) {
    return {
      tier: 'incomplete_evaluation',
      reasonArabic: 'تقييم غير مكتمل نظراً لنقص بعض الأبعاد الأساسية في البيانات',
    };
  }

  const s = scores.strategicScore;
  const a = scores.dimensionA ?? 0;
  const g = scores.dimensionG ?? 0;

  if (s >= config.tierThresholds.strategicTier1Min && a >= 75) {
    return {
      tier: 'strategic_tier1',
      reasonArabic: 'عميل استراتيجي (Tier 1 A+) يحقق أعلى قيمة اقتصادية واستقرار استثنائي',
    };
  }

  if (s >= config.tierThresholds.growthOpportunityMin || g >= 75) {
    return {
      tier: 'growth_opportunity',
      reasonArabic: 'فرصة نمو واعدة (Tier 2 A) تمتلك إمكانات توسع قوية أو اتجاه نمو نشط',
    };
  }

  if (s >= config.tierThresholds.relationshipReinforceMin) {
    return {
      tier: 'relationship_reinforce',
      reasonArabic: 'تعزيز العلاقة (Tier 3 B) يتطلب متابعة للحفاظ على النشاط والحد من التراجع',
    };
  }

  return {
    tier: 'standard_vip',
    reasonArabic: 'خدمة اعتيادية محسّنة (Tier 4 C) كبار عملاء ضمن نطاق الخدمة القياسي',
  };
}

/**
 * 8. Marketing & Service Action Prioritization Engine
 * Action Priority = 0.35*Strategic Relevance + 0.30*Need Fit + 0.20*Urgency + 0.15*Resource Efficiency
 * Independent from Strategic Score!
 * Urgent complaints override marketing prioritization!
 */
export function calculateActionPriority(
  customer: Customer,
  scores: DimensionScores,
  activities: RelationshipActivity[],
  products: CustomerProduct[],
  config: MethodologyConfig = DEFAULT_METHODOLOGY
): ActionPriorityScore {
  const hasUrgentComplaint = activities.some(
    (a) => a.isUrgentComplaint && a.resultStatus !== 'resolved'
  );

  const strategicRelevance = scores.strategicScore ?? 50;

  // Need Fit: Based on missing eligible services or churn signs
  const unusedEligible = products.filter((p) => p.status === 'eligible_not_used').length;
  const needFit = Math.min(100, 40 + unusedEligible * 18);

  // Urgency: Urgent complaints give 100, open complaints give 85, regular scheduled touchpoints give 45
  let urgency = 40;
  if (hasUrgentComplaint) {
    urgency = 100;
  } else if (activities.some((a) => a.type === 'complaint' && a.resultStatus !== 'resolved')) {
    urgency = 85;
  } else if (scores.dimensionR !== null && scores.dimensionR < 40) {
    urgency = 75; // Churn risk warning
  }

  // Expected Resource Efficiency: Balance expected outcome against estimated cost
  const resourceEfficiency = 70; // Normalized baseline

  // Composite calculation
  let composite =
    config.actionWeightStrategic * strategicRelevance +
    config.actionWeightNeed * needFit +
    config.actionWeightUrgency * urgency +
    config.actionWeightEfficiency * resourceEfficiency;

  let recommendedAction: ActionCategory = 'periodic_relationship_visit';
  let recommendedActionLabel = 'زيارة علاقة دورية لتوثيق الصلة';
  let estimatedCost = 350; // default estimated in USD or equiv

  if (hasUrgentComplaint) {
    composite = 99.5; // Top priority override
    recommendedAction = 'urgent_complaint_resolution';
    recommendedActionLabel = 'معالجة شكوى عاجلة وحل المشكلة التشغيلية فوراً';
    estimatedCost = 150;
  } else if (scores.dimensionR !== null && scores.dimensionR < 40) {
    recommendedAction = 'churn_remedy_followup';
    recommendedActionLabel = 'زيارة استباقية لمعالجة مؤشرات تراجع النشاط';
    estimatedCost = 400;
  } else if (unusedEligible >= 2) {
    recommendedAction = 'bespoke_product_offer';
    recommendedActionLabel = 'عرض حزمة خدمات مخصصة (اعتمادات، خزينة، رواتب)';
    estimatedCost = 500;
  } else if (strategicRelevance >= 80) {
    recommendedAction = 'executive_networking_event';
    recommendedActionLabel = 'دعوة حصرية لمأدبة كبار العملاء مع الإدارة العليا';
    estimatedCost = 800;
  } else {
    recommendedAction = 'periodic_relationship_visit';
    recommendedActionLabel = 'زيارة دورية مجدولة لمدير العلاقة المصرفية';
    estimatedCost = 250;
  }

  return {
    customerId: customer.id,
    strategicRelevance: Number(strategicRelevance.toFixed(2)),
    needFit: Number(needFit.toFixed(2)),
    urgency: Number(urgency.toFixed(2)),
    resourceEfficiency: Number(resourceEfficiency.toFixed(2)),
    compositeActionPriority: Number(composite.toFixed(2)),
    recommendedAction,
    recommendedActionLabel,
    estimatedActionCost: estimatedCost,
    hasUrgentOverride: hasUrgentComplaint,
  };
}

/**
 * 9. Rolling-Origin Backtesting & Statistical Forecasting Engine
 * Produces 3-month, 6-month, 12-month forecasts.
 * Backtests baseline vs linear trend using MAE and WAPE.
 * Explicitly marks if forecast is unreliable.
 */
export function generateCustomerForecast(
  customerId: string,
  balances: MonthlyBalance[],
  currency: Currency = 'USD'
): CustomerForecast {
  const sorted = [...balances].sort((a, b) => a.month.localeCompare(b.month));
  const series = sorted.map((s) => s.averageBalance);

  if (series.length < 4) {
    return {
      customerId,
      targetMetric: 'averageBalance',
      currency,
      horizons: { m3: [], m6: [], m12: [] },
      backtestMetrics: {
        mae: 0,
        wape: 0,
        mase: 0,
        modelType: 'insufficient_data',
        isReliable: false,
        unreliabilityReason: 'بيانات غير كافية (يتطلب 4 أشهر على الأقل لإجراء الاختبار الزمني)',
      },
      disclaimer: 'تنبيه: التوقعات إحصائية تقديرية ولا تمثل ضماناً مصرفياً أو أرباحاً محققة.',
    };
  }

  // Rolling-origin backtest: test on last 2 periods
  const trainSeries = series.slice(0, series.length - 2);
  const testSeries = series.slice(series.length - 2);

  // Model A: Baseline Recent Mean
  const baselinePred = trainSeries.slice(-3).reduce((a, b) => a + b, 0) / Math.max(1, trainSeries.slice(-3).length);

  // Model B: Linear Trend Regression
  const n = trainSeries.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += trainSeries[i];
    sumXY += i * trainSeries[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / Math.max(1, n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Evaluate errors on test series
  let baselineErrors = 0;
  let trendErrors = 0;
  let sumActual = 0;

  for (let i = 0; i < testSeries.length; i++) {
    const actual = testSeries[i];
    sumActual += actual;
    const tPred = Math.max(0, intercept + slope * (n + i));
    baselineErrors += Math.abs(actual - baselinePred);
    trendErrors += Math.abs(actual - tPred);
  }

  const useTrend = trendErrors < baselineErrors && Math.abs(slope) > 10;
  const chosenModel = useTrend ? 'linear_trend' : 'baseline_recent_mean';
  const chosenError = useTrend ? trendErrors : baselineErrors;

  const mae = chosenError / testSeries.length;
  const wape = sumActual > 0 ? (chosenError / sumActual) * 100 : 999;
  const isReliable = wape <= 25 && series.length >= 6;

  // Generate Future Months
  const lastDate = new Date(`${sorted[sorted.length - 1].month}-01`);
  const generateHorizon = (monthsCount: number): ForecastPoint[] => {
    const points: ForecastPoint[] = [];
    for (let m = 1; m <= monthsCount; m++) {
      const fDate = new Date(lastDate);
      fDate.setMonth(fDate.getMonth() + m);
      const monthStr = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}`;

      let fVal = chosenModel === 'linear_trend'
        ? Math.max(0, intercept + slope * (series.length + m - 1))
        : baselinePred;

      // Confidence Interval based on MAE
      const margin = mae * Math.sqrt(m) * 1.1;
      points.push({
        month: monthStr,
        forecastBalance: Math.round(fVal),
        lowerBound: Math.max(0, Math.round(fVal - margin)),
        upperBound: Math.round(fVal + margin),
        confidence: isReliable ? 0.85 : 0.60,
      });
    }
    return points;
  };

  return {
    customerId,
    targetMetric: 'averageBalance',
    currency,
    horizons: {
      m3: generateHorizon(3),
      m6: generateHorizon(6),
      m12: generateHorizon(12),
    },
    backtestMetrics: {
      mae: Number(mae.toFixed(2)),
      wape: Number(wape.toFixed(2)),
      mase: Number((mae / Math.max(1, baselinePred * 0.1)).toFixed(2)),
      modelType: chosenModel,
      isReliable,
      unreliabilityReason: !isReliable
        ? `نسبة الخطأ النسبي WAPE مرتفعة (${wape.toFixed(1)}%) أو تذبذب شديد في السلسلة الزمنية`
        : undefined,
    },
    disclaimer: 'تنبيه: التوقعات إحصائية استرشادية مبنية على بيانات تاريخية، ولا تعتبر إيرادات متحققة.',
  };
}

/**
 * 10. Campaign ROI:
 * ROI = (Attributed Incremental Net Benefit - Campaign Cost) / Campaign Cost
 */
export function calculateCampaignROI(
  incrementalBenefit: number | null,
  campaignCost: number | null
): { roiPercent: number | null; statusArabic: string } {
  if (campaignCost === null || campaignCost <= 0 || incrementalBenefit === null) {
    return {
      roiPercent: null,
      statusArabic: 'غير قابل للحساب (التكلفة صفر أو العائد غير محدد بدقة)',
    };
  }

  const roi = (incrementalBenefit - campaignCost) / campaignCost;
  return {
    roiPercent: Number((roi * 100).toFixed(2)),
    statusArabic: `${roi >= 0 ? '+' : ''}${(roi * 100).toFixed(1)}%`,
  };
}
