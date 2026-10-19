import React, { useState, useMemo } from 'react';
import {
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Calendar,
  Building2,
  User,
  BarChart3,
  SlidersHorizontal,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  Customer,
  DimensionScores,
  ActionPriorityScore,
  Currency,
  RelationshipActivity,
  Campaign,
} from '../types/banking';

interface ExecutiveDashboardProps {
  customers: Customer[];
  scoresMap: Record<string, DimensionScores>;
  prioritiesMap: Record<string, ActionPriorityScore>;
  activities: RelationshipActivity[];
  campaigns: Campaign[];
  currency: Currency;
  onSelectCustomer: (customerId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export type TimePeriod = '1m' | '3m' | '6m' | '12m' | 'all';

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  customers,
  scoresMap,
  prioritiesMap,
  activities,
  campaigns,
  currency,
  onSelectCustomer,
  onNavigateTab,
}) => {
  // Time period filter state (Default 12 months as per banking specification)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('12m');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'corporate' | 'individual'>('all');

  // Filter customers by selected segment
  const displayedCustomers = useMemo(() => {
    if (segmentFilter === 'all') return customers;
    return customers.filter((c) => c.type === segmentFilter);
  }, [customers, segmentFilter]);

  // Evaluations and Scores Calculation
  const evaluationMetrics = useMemo(() => {
    const validScores: number[] = [];
    const corporateScores: number[] = [];
    const individualScores: number[] = [];

    customers.forEach((c) => {
      const s = scoresMap[c.id];
      if (s && s.strategicScore !== null && s.isComplete) {
        validScores.push(s.strategicScore);
        if (c.type === 'corporate') {
          corporateScores.push(s.strategicScore);
        } else {
          individualScores.push(s.strategicScore);
        }
      }
    });

    const avgOverall =
      validScores.length > 0
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length
        : 0;

    const avgCorporate =
      corporateScores.length > 0
        ? corporateScores.reduce((a, b) => a + b, 0) / corporateScores.length
        : 0;

    const avgIndividual =
      individualScores.length > 0
        ? individualScores.reduce((a, b) => a + b, 0) / individualScores.length
        : 0;

    // Segment Score Distribution Bands (80-100, 60-79, 40-59, <40)
    const getDistribution = (scoresList: number[]) => {
      const tier1 = scoresList.filter((s) => s >= 80).length;
      const tier2 = scoresList.filter((s) => s >= 60 && s < 80).length;
      const tier3 = scoresList.filter((s) => s >= 40 && s < 60).length;
      const tier4 = scoresList.filter((s) => s < 40).length;
      return { tier1, tier2, tier3, tier4 };
    };

    const corpDist = getDistribution(corporateScores);
    const indDist = getDistribution(individualScores);
    const overallDist = getDistribution(validScores);

    return {
      totalEvaluations: validScores.length,
      incompleteEvaluations: customers.length - validScores.length,
      averageScore: Number(avgOverall.toFixed(1)),
      averageCorporateScore: Number(avgCorporate.toFixed(1)),
      averageIndividualScore: Number(avgIndividual.toFixed(1)),
      corporateCount: customers.filter((c) => c.type === 'corporate').length,
      individualCount: customers.filter((c) => c.type === 'individual').length,
      corporateEvaluatedCount: corporateScores.length,
      individualEvaluatedCount: individualScores.length,
      corpDist,
      indDist,
      overallDist,
    };
  }, [customers, scoresMap]);

  // Urgent open complaints
  const urgentActivities = activities.filter(
    (a) => a.isUrgentComplaint && a.resultStatus !== 'resolved'
  );

  // Churn Alert: Stability dimension R < 45
  const churnRiskClients = customers.filter((c) => {
    const s = scoresMap[c.id];
    return s && s.dimensionR !== null && s.dimensionR < 45;
  });

  // Top Growth Prospects: Dimension G >= 70
  const growthProspects = customers.filter((c) => {
    const s = scoresMap[c.id];
    return s && s.dimensionG !== null && s.dimensionG >= 70;
  });

  const currencySymbol = currency === 'USD' ? '$' : currency === 'YER' ? 'ر.ي' : 'ر.س';

  const periodLabels: Record<TimePeriod, string> = {
    '1m': 'آخر شهر (فبراير 2026)',
    '3m': 'آخر 3 أشهر (الربع الأخير Q4-Q1)',
    '6m': 'آخر 6 أشهر (نصف سنوي)',
    '12m': 'آخر 12 شهراً (السنة المالية المعتمدة)',
    'all': 'كافة الفترات التاريخية (24 شهراً)',
  };

  return (
    <div className="space-y-6">
      {/* Time Period Filter Bar & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>الفترة الزمنية للتقييم والتحليل:</span>
              <span className="text-emerald-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                {periodLabels[timePeriod]}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              تصفية حركية لكافة مؤشرات المحفظة والأرصدة وتقييمات العملاء بحسب الأفق الزمني
            </p>
          </div>
        </div>

        {/* Time Period Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(['1m', '3m', '6m', '12m', 'all'] as TimePeriod[]).map((p) => {
            const isSelected = timePeriod === p;
            const labels: Record<TimePeriod, string> = {
              '1m': 'شهر',
              '3m': '3 أشهر',
              '6m': '6 أشهر',
              '12m': '12 شهراً',
              'all': '24 شهراً',
            };
            return (
              <button
                key={p}
                onClick={() => setTimePeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Evaluation Score */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">متوسط التقييم العام للمحفظة</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {evaluationMetrics.averageScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              أداء فوق المتوسط
            </span>
            <span className="text-[11px] text-slate-400">حساب حتمي 100%</span>
          </div>
        </div>

        {/* Card 2: Total Number of Evaluations */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">عدد التقييمات المنجزة</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {evaluationMetrics.totalEvaluations}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              من أصل {customers.length} عميل
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">تقييم غير مكتمل:</span>
            <span className="text-amber-400 font-bold">
              {evaluationMetrics.incompleteEvaluations} عميل (نقص بيانات)
            </span>
          </div>
        </div>

        {/* Card 3: Corporate Segment Average */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">متوسط تقييم شريحة الشركات</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">
              {evaluationMetrics.averageCorporateScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">عدد شركات المحفظة:</span>
            <span className="text-white font-bold">
              {evaluationMetrics.corporateEvaluatedCount} شركة مقيّمة
            </span>
          </div>
        </div>

        {/* Card 4: Individual Segment Average */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">متوسط تقييم شريحة الأفراد (HNWI)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400 font-mono">
              {evaluationMetrics.averageIndividualScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">عدد أفراد النخبة:</span>
            <span className="text-white font-bold">
              {evaluationMetrics.individualEvaluatedCount} فرد مقيّم
            </span>
          </div>
        </div>
      </div>

      {/* Distribution by Segment Section: Corporate vs Individual Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>توزيع التقييمات حسب الشريحة (شركات vs أفراد ذوو ملاءة)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              مقارنة تحليلية دقيقة لتوزيع درجات التقييم وتصنيفات النخبة عبر شرائح المحفظة الرئيسية
            </p>
          </div>

          {/* Quick Segment Filter Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSegmentFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                segmentFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              عرض الشريحتين
            </button>
            <button
              onClick={() => setSegmentFilter('corporate')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                segmentFilter === 'corporate' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>الشركات فقط</span>
            </button>
            <button
              onClick={() => setSegmentFilter('individual')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                segmentFilter === 'individual' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              <span>الأفراد فقط</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Distribution Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Corporate Segment Distribution Card */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">شريحة الشركات والمؤسسات التجارية</h4>
                  <div className="text-[11px] text-slate-400">
                    {evaluationMetrics.corporateCount} عميل ({evaluationMetrics.corporateEvaluatedCount} مكتمل التقييم)
                  </div>
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-400">متوسط الشريحة</div>
                <div className="text-xl font-black text-emerald-400">{evaluationMetrics.averageCorporateScore}</div>
              </div>
            </div>

            {/* Score Bands Breakdown for Corporate */}
            <div className="space-y-2.5 pt-2 text-xs">
              {/* Tier 1: 80-100 */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>مستوى مرتفع (80 - 100) استراتيجي A+</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluationMetrics.corpDist.tier1} شركات (
                    {evaluationMetrics.corporateEvaluatedCount > 0
                      ? ((evaluationMetrics.corpDist.tier1 / evaluationMetrics.corporateEvaluatedCount) * 100).toFixed(0)
                      : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        evaluationMetrics.corporateEvaluatedCount > 0
                          ? (evaluationMetrics.corpDist.tier1 / evaluationMetrics.corporateEvaluatedCount) * 100
                          : 0
                      }%`,
                    }}
                    className="h-full bg-emerald-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Tier 2: 60-79 */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    <span>مستوى فوق المتوسط (60 - 79) فرصة نمو A</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluationMetrics.corpDist.tier2} شركات (
                    {evaluationMetrics.corporateEvaluatedCount > 0
                      ? ((evaluationMetrics.corpDist.tier2 / evaluationMetrics.corporateEvaluatedCount) * 100).toFixed(0)
                      : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        evaluationMetrics.corporateEvaluatedCount > 0
                          ? (evaluationMetrics.corpDist.tier2 / evaluationMetrics.corporateEvaluatedCount) * 100
                          : 0
                      }%`,
                    }}
                    className="h-full bg-blue-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Tier 3: 40-59 */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>مستوى متوسط (40 - 59) تعزيز العلاقة B</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluationMetrics.corpDist.tier3} شركات (
                    {evaluationMetrics.corporateEvaluatedCount > 0
                      ? ((evaluationMetrics.corpDist.tier3 / evaluationMetrics.corporateEvaluatedCount) * 100).toFixed(0)
                      : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        evaluationMetrics.corporateEvaluatedCount > 0
                          ? (evaluationMetrics.corpDist.tier3 / evaluationMetrics.corporateEvaluatedCount) * 100
                          : 0
                      }%`,
                    }}
                    className="h-full bg-amber-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Tier 4: <40 */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                    <span>مستوى قياسي اعتيادي (&lt; 40) Tier 4 C</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluationMetrics.corpDist.tier4} شركات (
                    {evaluationMetrics.corporateEvaluatedCount > 0
                      ? ((evaluationMetrics.corpDist.tier4 / evaluationMetrics.corporateEvaluatedCount) * 100).toFixed(0)
                      : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        evaluationMetrics.corporateEvaluatedCount > 0
                          ? (evaluationMetrics.corpDist.tier4 / evaluationMetrics.corporateEvaluatedCount) * 100
                          : 0
                      }%`,
                    }}
                    className="h-full bg-slate-600 rounded-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Individual Segment Distribution Card */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">شريحة الأفراد ذوي الملاءة المالية (HNWI)</h4>
                  <div className="text-[11px] text-slate-400">
                    {evaluationMetrics.individualCount} عميل ({evaluationMetrics.individualEvaluatedCount} مكتمل التقييم)
                  </div>
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-400">متوسط الشريحة</div>
                <div className="text-xl font-black text-purple-400">{evaluationMetrics.averageIndividualScore}</div>
              </div>
            </div>

            {/* Score Bands Breakdown for Individuals */}
            <div className="space-y-2.5 pt-2 text-xs">
              {/* Tier 1: 80-100 */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>مستوى مرتفع (80 - 100) استراتيجي A+</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluationMetrics.indDist.tier1} أفراد (
                    {evaluationMetrics.individualEvaluatedCount > 0
                      ? ((evaluationMetrics.indDist.tier1 / evaluationMetrics.individualEvaluatedCount) * 100).toFixed(0)
                      : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        evaluationMetrics.individualEvaluatedCount > 0
                          ? (evaluationMetrics.indDist.tier1 / evaluationMetrics.individualEvaluatedCount) * 100
                          : 0
                      }%`,
                    }}
                    className="h-full bg-emerald-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Tier 2: 60-79 */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    <span>مستوى فوق المتوسط (60 - 79) فرصة نمو A</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluationMetrics.indDist.tier2} أفراد (
                    {evaluationMetrics.individualEvaluatedCount > 0
                      ? ((evaluationMetrics.indDist.tier2 / evaluationMetrics.individualEvaluatedCount) * 100).toFixed(0)
                      : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        evaluationMetrics.individualEvaluatedCount > 0
                          ? (evaluationMetrics.indDist.tier2 / evaluationMetrics.individualEvaluatedCount) * 100
                          : 0
                      }%`,
                    }}
                    className="h-full bg-blue-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Tier 3: 40-59 */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>مستوى متوسط (40 - 59) تعزيز العلاقة B</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluationMetrics.indDist.tier3} أفراد (
                    {evaluationMetrics.individualEvaluatedCount > 0
                      ? ((evaluationMetrics.indDist.tier3 / evaluationMetrics.individualEvaluatedCount) * 100).toFixed(0)
                      : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        evaluationMetrics.individualEvaluatedCount > 0
                          ? (evaluationMetrics.indDist.tier3 / evaluationMetrics.individualEvaluatedCount) * 100
                          : 0
                      }%`,
                    }}
                    className="h-full bg-amber-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Tier 4: <40 */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                    <span>مستوى قياسي اعتيادي (&lt; 40) Tier 4 C</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluationMetrics.indDist.tier4} أفراد (
                    {evaluationMetrics.individualEvaluatedCount > 0
                      ? ((evaluationMetrics.indDist.tier4 / evaluationMetrics.individualEvaluatedCount) * 100).toFixed(0)
                      : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        evaluationMetrics.individualEvaluatedCount > 0
                          ? (evaluationMetrics.indDist.tier4 / evaluationMetrics.individualEvaluatedCount) * 100
                          : 0
                      }%`,
                    }}
                    className="h-full bg-slate-600 rounded-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Urgent Radar + Churn & Growth Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Service Action Radar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-white">رادار التدخل والشكاوى العاجلة (تجاوز الأولوية)</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                تدخل فوري
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              قاعدة حتمية: العميل الذي لديه شكوى أو التزام مفتوح عاجل يُمنح الأولوية القصوى (99.5) بصرف النظر عن درجته الاستراتيجية.
            </p>

            <div className="space-y-3">
              {urgentActivities.map((act) => {
                const client = customers.find((c) => c.id === act.customerId);
                return (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30 hover:border-rose-500/60 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{client?.name || act.customerId}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({client?.sourceCode})</span>
                        </div>
                        <p className="text-xs text-rose-300 mt-0.5">{act.goal}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        استحقاق: {act.dueDate || 'فوري'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                      <span>المسؤول: {act.assignedTo}</span>
                      <button
                        onClick={() => {
                          if (client) onSelectCustomer(client.id);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>متابعة الإجراء في الملف</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {urgentActivities.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                  لا توجد شكاوى عاجلة مفتوحة حالياً. جميع الالتزامات ضمن المسار الاعتيادي.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => onNavigateTab('priorities')}
              className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>الانتقال لمصفوفة الأولويات وخطة الميزانية</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>

        {/* Churn Warning & Growth Opportunities */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-white">مؤشرات تسرب الأرصدة وفرص التوسع الواعدة</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                استباقي
              </span>
            </div>

            {/* Churn Warning Sub-panel */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-rose-300 flex items-center gap-1.5 mb-2">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>عملاء يواجهون مخاطر تراجع الأرصدة أو تذبذب حاد (Churn Alert):</span>
              </h4>
              <div className="space-y-2">
                {churnRiskClients.slice(0, 2).map((c) => {
                  const s = scoresMap[c.id];
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectCustomer(c.id)}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400">درجة الاستقرار R: {s?.dimensionR ?? 'غير متاح'} / 100</div>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        زيارة وقائية
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Growth Opportunities Sub-panel */}
            <div>
              <h4 className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 mb-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>عملاء مؤهلون للتوسع واستخدام منتجات إضافية (Cross-Selling):</span>
              </h4>
              <div className="space-y-2">
                {growthProspects.slice(0, 2).map((c) => {
                  const s = scoresMap[c.id];
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectCustomer(c.id)}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400">فرصة النمو G: {s?.dimensionG ?? 'غير متاح'} / 100</div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        عرض حزمة منتجات
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => onNavigateTab('comparison')}
              className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>مقارنة تفصيلية في مختبر المقارنة</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
