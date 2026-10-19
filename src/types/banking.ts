/**
 * Private Client Intelligence & Strategic Prioritization Platform (PCIS)
 * Type Definitions conforming strictly to Banking Evaluation Standards
 */

export type ClientType = 'corporate' | 'individual';

export type Currency = 'YER' | 'USD' | 'SAR';

export type OperationalStatus = 'active' | 'dormant' | 'under_review' | 'restricted';

export type StrategicTier =
  | 'strategic_tier1'      // استراتيجي (80-100)
  | 'growth_opportunity'   // فرصة نمو (60-79)
  | 'relationship_reinforce' // تعزيز العلاقة (40-59)
  | 'standard_vip'         // خدمة اعتيادية محسّنة (<40)
  | 'incomplete_evaluation'; // تقييم غير مكتمل (بيانات ناقصة)

export type ActionCategory =
  | 'periodic_relationship_visit' // زيارة علاقة دورية
  | 'growth_development_visit'    // زيارة تطويرية
  | 'churn_remedy_followup'       // متابعة تراجع النشاط
  | 'bespoke_product_offer'       // عرض منتج مخصص
  | 'urgent_complaint_resolution' // معالجة شكوى عاجلة
  | 'executive_networking_event'  // دعوة لفعالية كبار الشخصيات
  | 'service_renewal_negotiation'; // متابعة تجديد وديعة / تسهيل

export interface ProcurementRecord {
  month: string; // M01 to M18
  piNumber: string;
  poNumber: string;
  lcStatus: 'Opened' | 'Settled' | 'Draft' | 'Issued' | 'Documents Presented' | 'Paid';
  blNumber: string;
  procurementValueUSD: number;
  freightUSD: number;
  customsUSD: number;
  deliveryStatus: 'Delivered' | 'In Transit';
  deliveryDays: number;
  customerInvoiceUSD: number;
  customerPaymentsUSD: number;
  closingOutstandingUSD: number;
  evaluation: 'Excellent' | 'Good';
}

export interface DocumentTrackingStage {
  stageNumber: number;
  stageName: string;
  requiredDocument: string;
  outputRecord: string;
  notes: string;
}

export interface Customer {
  id: string; // المعرف الداخلي الفريد
  sourceCode: string; // رمز العميل المصرفي المستعار (e.g. VIP-CORP-101)
  name: string; // اسم العميل أو اسم المؤسسة
  type: ClientType; // شركات أو أفراد
  sector: string; // القطاع (تجاري، صناعي، مصرفي، خدمات، أفراد ذوو ملاءة)
  relationshipStartDate: string; // تاريخ بدء العلاقة (YYYY-MM-DD)
  assignedManager: string; // مدير العلاقة المسؤول
  branch: string; // الفرع التابع له
  operationalStatus: OperationalStatus;
  currentTier: StrategicTier;
  createdAt: string;
  updatedAt: string;
  isSynthetic: boolean; // وسم البيانات الاصطناعية
}

export interface MonthlyBalance {
  customerId: string;
  month: string; // YYYY-MM
  currency: Currency;
  averageBalance: number; // متوسط الرصيد الشهري
  closingBalance: number; // رصيد نهاية الشهر
  termDeposits: number; // ودائع لأجل
  newDepositsOrRenewals: number; // ودائع جديدة واستحقاقات
  isEstimated?: boolean;
}

export interface MonthlyTransaction {
  customerId: string;
  month: string; // YYYY-MM
  currency: Currency;
  inboundLocalVolume: number;
  inboundLocalCount: number;
  outboundLocalVolume: number;
  outboundLocalCount: number;
  inboundIntlVolume: number;
  inboundIntlCount: number;
  outboundIntlVolume: number;
  outboundIntlCount: number;
  intlCardPurchaseVolume: number;
  intlCardPurchaseCount: number;
  feeRevenue: number; // رسوم الخدمات والعمليات
  isEstimated?: boolean;
}

export interface CustomerEconomics {
  customerId: string;
  period: string; // YYYY-Qx or YYYY-MM
  currency: Currency;
  attributedRevenue: number; // الإيرادات المنسوبة
  serviceCosts: number; // كلفة تقديم الخدمة
  allocatedOverhead: number; // التكاليف العامة الموزعة
  netContribution: number; // صافي المساهمة الاقتصادية
  isAvailable: boolean; // هل تم احتسابها فعلياً أم غير متاحة
  sourceDefinition: string;
}

export interface CustomerProduct {
  id: string;
  customerId: string;
  productType: string; // اعتماد مستندي، كشوف رواتب، نقاط بيع، حسابات جارية، خزينة، محفظة إلكترونية
  status: 'active' | 'dormant' | 'cancelled' | 'eligible_not_used';
  startDate: string;
  monthlyRevenueEstimate?: number;
  lastUsedDate?: string;
}

export interface RelationshipActivity {
  id: string;
  customerId: string;
  date: string;
  type: 'visit' | 'call' | 'complaint' | 'event' | 'meeting' | 'review';
  goal: string;
  assignedTo: string;
  cost: number;
  resultStatus: 'resolved' | 'pending' | 'in_progress' | 'escalated';
  nextStep?: string;
  dueDate?: string;
  isUrgentComplaint?: boolean; // شكوى عاجلة توجب التدخل الفوري
}

export interface Campaign {
  id: string;
  title: string;
  category: ActionCategory;
  approvedBudget: number;
  actualCost: number;
  currency: Currency;
  startDate: string;
  endDate: string;
  targetCustomerIds: string[];
  incrementalRevenueDocumented: number;
  attributionReliability: 'high' | 'medium' | 'estimated' | 'unverified';
  status: 'planned' | 'in_progress' | 'completed' | 'evaluated';
  notes: string;
}

export interface DimensionScores {
  dimensionA: number | null; // القيمة الاقتصادية الحالية (0-100)
  dimensionG: number | null; // فرصة النمو (0-100)
  dimensionR: number | null; // استقرار العلاقة (0-100)
  dimensionE: number | null; // التفاعل واحتياجات الخدمة (0-100)
  strategicScore: number | null; // 0.35*A + 0.25*G + 0.20*R + 0.20*E
  isComplete: boolean;
  completenessNotes: string[];
  calculatedAt: string;
}

export interface ActionPriorityScore {
  customerId: string;
  strategicRelevance: number; // 0-100
  needFit: number; // 0-100
  urgency: number; // 0-100
  resourceEfficiency: number; // 0-100
  compositeActionPriority: number; // 0-100
  recommendedAction: ActionCategory;
  recommendedActionLabel: string;
  estimatedActionCost: number;
  hasUrgentOverride: boolean; // تخطي للأولوية القصوى بسبب شكوى عاجلة
}

export interface ForecastPoint {
  month: string; // YYYY-MM
  forecastBalance: number;
  lowerBound: number;
  upperBound: number;
  confidence: number; // e.g. 0.85
}

export interface CustomerForecast {
  customerId: string;
  targetMetric: 'averageBalance' | 'transactionVolume';
  currency: Currency;
  horizons: {
    m3: ForecastPoint[];
    m6: ForecastPoint[];
    m12: ForecastPoint[];
  };
  backtestMetrics: {
    mae: number;
    wape: number; // %
    mase: number;
    modelType: 'baseline_recent_mean' | 'linear_trend' | 'insufficient_data';
    isReliable: boolean;
    unreliabilityReason?: string;
  };
  disclaimer: string;
}

export interface MethodologyConfig {
  versionId: string;
  effectiveDate: string;
  approvedBy: string;
  weightA: number; // default 0.35
  weightG: number; // default 0.25
  weightR: number; // default 0.20
  weightE: number; // default 0.20
  actionWeightStrategic: number; // default 0.35
  actionWeightNeed: number; // default 0.30
  actionWeightUrgency: number; // default 0.20
  actionWeightEfficiency: number; // default 0.15
  tierThresholds: {
    strategicTier1Min: number; // 80
    growthOpportunityMin: number; // 60
    relationshipReinforceMin: number; // 40
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  actionType: 'IMPORT' | 'CALCULATE' | 'METHODOLOGY_CHANGE' | 'EXPORT' | 'ACTIVITY_CREATE' | 'BACKUP_RESTORE';
  description: string;
  metadata?: Record<string, any>;
}
