import React, { useState } from 'react';
import {
  Flame,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Sliders,
  Filter,
  UserCheck,
  Send,
  Plus,
  AlertTriangle,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import {
  Customer,
  ActionPriorityScore,
  Campaign,
  Currency,
  RelationshipActivity,
  DimensionScores,
} from '../types/banking';
import { calculateCampaignROI } from '../engine/deterministicMath';

interface PrioritizationMatrixViewProps {
  customers: Customer[];
  prioritiesMap: Record<string, ActionPriorityScore>;
  scoresMap: Record<string, DimensionScores>;
  activities: RelationshipActivity[];
  campaigns: Campaign[];
  currency: Currency;
  onSelectCustomer: (id: string) => void;
  onAddCampaign: (campaign: Campaign) => void;
}

export const PrioritizationMatrixView: React.FC<PrioritizationMatrixViewProps> = ({
  customers,
  prioritiesMap,
  scoresMap,
  activities,
  campaigns,
  currency,
  onSelectCustomer,
  onAddCampaign,
}) => {
  // Budget allocation simulator
  const [allocatedBudgetLimit, setAllocatedBudgetLimit] = useState<number>(25000);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // New Campaign Modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campTitle, setCampTitle] = useState('');
  const [campBudget, setCampBudget] = useState(5000);
  const [campCategory, setCampCategory] = useState<Campaign['category']>('growth_development_visit');
  const [campNotes, setCampNotes] = useState('');

  const currencySymbol = currency === 'USD' ? '$' : currency === 'YER' ? 'ر.ي' : 'ر.س';

  // Urgent complaints that bypass marketing ranking
  const urgentActions = customers.filter((c) => {
    const p = prioritiesMap[c.id];
    return p?.hasUrgentOverride;
  });

  // Regular prioritized actions (sorted by composite priority descending)
  const prioritizedClients = [...customers]
    .filter((c) => {
      const p = prioritiesMap[c.id];
      if (selectedCategoryFilter === 'all') return true;
      return p?.recommendedAction === selectedCategoryFilter;
    })
    .sort((a, b) => {
      const pA = prioritiesMap[a.id]?.compositeActionPriority ?? 0;
      const pB = prioritiesMap[b.id]?.compositeActionPriority ?? 0;
      return pB - pA;
    });

  // Simulate Budget Distribution
  let runningBudget = 0;
  const budgetedActions = prioritizedClients.map((c) => {
    const p = prioritiesMap[c.id];
    const cost = p?.estimatedActionCost ?? 300;
    const canAfford = runningBudget + cost <= allocatedBudgetLimit;
    if (canAfford) {
      runningBudget += cost;
    }
    return {
      customer: c,
      priority: p,
      cost,
      funded: canAfford,
    };
  });

  const fundedCount = budgetedActions.filter((b) => b.funded).length;
  const remainingBudget = Math.max(0, allocatedBudgetLimit - runningBudget);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle) return;

    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      title: campTitle,
      category: campCategory,
      approvedBudget: Number(campBudget) || 1000,
      actualCost: 0,
      currency,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      targetCustomerIds: budgetedActions.filter((b) => b.funded).slice(0, 5).map((b) => b.customer.id),
      incrementalRevenueDocumented: 0,
      attributionReliability: 'high',
      status: 'planned',
      notes: campNotes || 'مبادرة تسويقية معتمدة ضمن الميزانية المرصودة لإدارة كبار العملاء',
    };

    onAddCampaign(newCamp);
    setCampTitle('');
    setShowCampaignModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Principle Banner: Separation of Urgent Service vs Marketing Ranking */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            قواعد محرك الأولويات وتوزيع الموارد (Action Prioritization & Resource Efficiency)
          </h3>
          <p className="text-xs text-slate-300">
            أولوية الإجراء مستقلة تماماً عن التصنيف الاستراتيجي: يُقاس الإجراء بمعادلة (0.35 الأهمية + 0.30 ملاءمة الحاجة + 0.20 الاستعجال + 0.15 كفاءة الموارد). وتُعالج الشكاوى والالتزامات العاجلة فوراً دون انتظار ترتيب تسويقي.
          </p>
        </div>
      </div>

      {/* Urgent Intervention Section */}
      {urgentActions.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
              <h3 className="text-sm font-black text-white">
                تجاوز الأولوية القصوى: شكاوى والتزامات تشغيلية عاجلة ({urgentActions.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              أولوية 99.5 (إلزامية التدخل)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentActions.map((c) => {
              const p = prioritiesMap[c.id];
              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/40 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({c.sourceCode})</span>
                    </div>
                    <div className="text-xs text-rose-300 font-medium mt-1">
                      {p?.recommendedActionLabel}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectCustomer(c.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    معالجة فورية
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Budget Allocator Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>محاكي التخصيص الذكي للميزانية (Dynamic Resource Allocator)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              حدد سقف الميزانية المعتمدة ليقوم المحرك تلقائياً بحجز وتغطية الإجراءات ذات العائد وكفاءة الموارد الأعلى دون تجاوز السقف.
            </p>
          </div>

          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>اعتماد مبادرة / حملة رسمية جديدة</span>
          </button>
        </div>

        {/* Budget Slider & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">سقف الميزانية المستهدفة للإدارة:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {currencySymbol}{allocatedBudgetLimit.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={100000}
              step={2500}
              value={allocatedBudgetLimit}
              onChange={(e) => setAllocatedBudgetLimit(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{currencySymbol}5,000</span>
              <span>{currencySymbol}25,000</span>
              <span>{currencySymbol}50,000</span>
              <span>{currencySymbol}100,000</span>
            </div>
          </div>

          {/* Budget Utilization Meter */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">التكلفة المحجوزة:</span>
              <span className="font-mono font-bold text-white">
                {currencySymbol}{runningBudget.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-400">المتبقي غير الموزع:</span>
              <span className="font-mono font-bold text-emerald-400">
                {currencySymbol}{remainingBudget.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">العملاء المغطون:</span>
              <span className="font-bold text-white">{fundedCount} عميل مميز</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prioritized Actions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              قائمة الإجراءات والزيارات مرتبة بحسب كفاءة الموارد والأولوية
            </h3>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كافة أنواع الإجراءات</option>
            <option value="urgent_complaint_resolution">معالجة شكاوى عاجلة</option>
            <option value="churn_remedy_followup">متابعة تراجع النشاط (وقائي)</option>
            <option value="bespoke_product_offer">عرض حزم منتجات مخصصة</option>
            <option value="periodic_relationship_visit">زيارات علاقة دورية</option>
            <option value="executive_networking_event">فعاليات كبار العملاء</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">الترتيب</th>
                <th className="py-3 px-4">رمز العميل</th>
                <th className="py-3 px-4">اسم العميل</th>
                <th className="py-3 px-3 text-center">درجة الأولوية</th>
                <th className="py-3 px-4">الإجراء المقترح</th>
                <th className="py-3 px-3 text-center">التكلفة التقديرية</th>
                <th className="py-3 px-3 text-center">الأهمية</th>
                <th className="py-3 px-3 text-center">ملاءمة الحاجة</th>
                <th className="py-3 px-3 text-center">الاستعجال</th>
                <th className="py-3 px-3 text-center">التغطية بالميزانية</th>
                <th className="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {budgetedActions.map((item, idx) => (
                <tr
                  key={item.customer.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    !item.funded ? 'opacity-50' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{item.customer.sourceCode}</td>
                  <td className="py-3 px-4 font-bold text-white">
                    <button
                      onClick={() => onSelectCustomer(item.customer.id)}
                      className="hover:text-emerald-400 cursor-pointer text-right"
                    >
                      {item.customer.name}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-emerald-400">
                    {item.priority?.compositeActionPriority}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {item.priority?.recommendedActionLabel}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                    {currencySymbol}{item.cost}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {item.priority?.strategicRelevance}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {item.priority?.needFit}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {item.priority?.urgency}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.funded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        <span>مغطى بالميزانية</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                        <span>خارج السقف</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onSelectCustomer(item.customer.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                    >
                      تنسيق الزيارة
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaigns & Documented Commercial ROI Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>سجل المبادرات والحملات المنفذة وقياس العائد التجاري الحقيقي (ROI)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          يُحسب العائد على الاستثمار بالمعادلة: ROI = (الإيراد الإضافي المنسوب - التكلفة) / التكلفة. ولا يُحتسب العائد إذا كانت التكلفة صفراً أو الإيراد غير موثق.
        </p>

        <div className="space-y-3">
          {campaigns.map((camp) => {
            const roiResult = calculateCampaignROI(
              camp.incrementalRevenueDocumented,
              camp.actualCost
            );

            return (
              <div
                key={camp.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">{camp.title}</div>
                  <div className="text-slate-400 flex items-center gap-2">
                    <span>الفترة: {camp.startDate} إلى {camp.endDate}</span>
                    <span>•</span>
                    <span>العملاء المستهدفون: {camp.targetCustomerIds.length} عميل</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">{camp.notes}</div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-left font-mono">
                    <div className="text-[10px] text-slate-400">التكلفة الفعلية</div>
                    <div className="font-bold text-white">
                      {currencySymbol}{camp.actualCost.toLocaleString()}
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <div className="text-[10px] text-slate-400">الإيراد الإضافي الموثق</div>
                    <div className="font-bold text-emerald-400">
                      {currencySymbol}{camp.incrementalRevenueDocumented.toLocaleString()}
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <div className="text-[10px] text-slate-400">العائد المحسوب (ROI)</div>
                    <div className={`font-black text-sm ${
                      roiResult.roiPercent !== null && roiResult.roiPercent > 0
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}>
                      {roiResult.statusArabic}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    camp.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {camp.status === 'completed' ? 'مكتملة ومقاسة' : 'جارية التنفيذ'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">اعتماد حملة / مبادرة تسويقية جديدة</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">عنوان المبادرة:</label>
                <input
                  type="text"
                  required
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  placeholder="مثلاً: برنامج تنشيط الحسابات الجارية للشركات المستوردة"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">الميزانية المعتمدة ({currencySymbol}):</label>
                <input
                  type="number"
                  required
                  value={campBudget}
                  onChange={(e) => setCampBudget(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">فئة الإجراء:</label>
                <select
                  value={campCategory}
                  onChange={(e) => setCampCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="growth_development_visit">زيارات تطوير ونمو العلاقات</option>
                  <option value="bespoke_product_offer">عرض حزم منتجات وتمويل مخصصة</option>
                  <option value="periodic_relationship_visit">برنامج زيارات الرعاية الدورية</option>
                  <option value="executive_networking_event">فعالية أو ملتقى كبار العملاء</option>
                  <option value="churn_remedy_followup">حملة حماية ومنع تسرب العملاء</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">ملاحظات وآلية إسناد الإيراد:</label>
                <textarea
                  rows={2}
                  value={campNotes}
                  onChange={(e) => setCampNotes(e.target.value)}
                  placeholder="حدد معايير قياس النجاح والإيراد المنسوب بدقة..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  اعتماد المبادرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
