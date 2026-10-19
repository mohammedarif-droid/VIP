import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Building2,
  User,
  ArrowUpDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Briefcase,
  TrendingUp,
  X,
  Plus,
  ShieldCheck,
  Send,
  Ship,
  ArrowRight,
} from 'lucide-react';
import {
  Customer,
  DimensionScores,
  ActionPriorityScore,
  MonthlyBalance,
  MonthlyTransaction,
  CustomerProduct,
  RelationshipActivity,
  Currency,
  StrategicTier,
} from '../types/banking';

interface CustomerIntelligenceListProps {
  customers: Customer[];
  scoresMap: Record<string, DimensionScores>;
  prioritiesMap: Record<string, ActionPriorityScore>;
  balances: MonthlyBalance[];
  transactions: MonthlyTransaction[];
  products: CustomerProduct[];
  activities: RelationshipActivity[];
  currency: Currency;
  selectedCustomerId?: string | null;
  onSelectCustomer: (id: string | null) => void;
  onAddActivity: (activity: RelationshipActivity) => void;
  onOpenProcurement?: () => void;
}

export const CustomerIntelligenceList: React.FC<CustomerIntelligenceListProps> = ({
  customers,
  scoresMap,
  prioritiesMap,
  balances,
  transactions,
  products,
  activities,
  currency,
  selectedCustomerId,
  onSelectCustomer,
  onAddActivity,
  onOpenProcurement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'corporate' | 'individual'>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'strategicScore' | 'actionPriority' | 'name'>('strategicScore');
  const [sortAsc, setSortAsc] = useState(false);

  // New activity form modal state
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [newActivityGoal, setNewActivityGoal] = useState('');
  const [newActivityType, setNewActivityType] = useState<RelationshipActivity['type']>('visit');
  const [newActivityAssignedTo, setNewActivityAssignedTo] = useState('مدير العلاقة المسؤول');
  const [newActivityCost, setNewActivityCost] = useState(150);
  const [newActivityIsUrgent, setNewActivityIsUrgent] = useState(false);

  // Filtered customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sourceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.branch.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || c.type === selectedType;
    const matchesTier = selectedTier === 'all' || c.currentTier === selectedTier;

    return matchesSearch && matchesType && matchesTier;
  });

  // Sort
  filteredCustomers.sort((a, b) => {
    if (sortBy === 'strategicScore') {
      const sA = scoresMap[a.id]?.strategicScore ?? -1;
      const sB = scoresMap[b.id]?.strategicScore ?? -1;
      return sortAsc ? sA - sB : sB - sA;
    } else if (sortBy === 'actionPriority') {
      const pA = prioritiesMap[a.id]?.compositeActionPriority ?? -1;
      const pB = prioritiesMap[b.id]?.compositeActionPriority ?? -1;
      return sortAsc ? pA - pB : pB - pA;
    } else {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
  });

  const selectedClient = customers.find((c) => c.id === selectedCustomerId);
  const clientBalances = balances.filter((b) => b.customerId === selectedCustomerId);
  const clientTransactions = transactions.filter((t) => t.customerId === selectedCustomerId);
  const clientProducts = products.filter((p) => p.customerId === selectedCustomerId);
  const clientActivities = activities.filter((a) => a.customerId === selectedCustomerId);
  const clientScores = selectedCustomerId ? scoresMap[selectedCustomerId] : null;
  const clientPriority = selectedCustomerId ? prioritiesMap[selectedCustomerId] : null;

  const currencySymbol = currency === 'USD' ? '$' : currency === 'YER' ? 'ر.ي' : 'ر.س';

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newActivityGoal) return;

    const newAct: RelationshipActivity = {
      id: `act-${Date.now()}`,
      customerId: selectedCustomerId,
      date: new Date().toISOString().split('T')[0],
      type: newActivityType,
      goal: newActivityGoal,
      assignedTo: newActivityAssignedTo,
      cost: Number(newActivityCost) || 0,
      resultStatus: newActivityIsUrgent ? 'in_progress' : 'pending',
      isUrgentComplaint: newActivityIsUrgent,
      nextStep: 'متابعة تنفيذ التوصية وإدراج النتيجة في السجل',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    };

    onAddActivity(newAct);
    setNewActivityGoal('');
    setShowAddActivityModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برمز العميل المصرفي، الاسم، القطاع، أو الفرع..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedType('corporate')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                selectedType === 'corporate' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>شركات</span>
            </button>
            <button
              onClick={() => setSelectedType('individual')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                selectedType === 'individual' ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              <span>أفراد ذوو ملاءة</span>
            </button>
          </div>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كافة الفئات الاستراتيجية</option>
            <option value="strategic_tier1">استراتيجي (Tier 1 A+)</option>
            <option value="growth_opportunity">فرصة نمو (Tier 2 A)</option>
            <option value="relationship_reinforce">تعزيز العلاقة (Tier 3 B)</option>
            <option value="standard_vip">خدمة اعتيادية (Tier 4 C)</option>
            <option value="incomplete_evaluation">تقييم غير مكتمل</option>
          </select>

          {/* Sort Switcher */}
          <button
            onClick={() => {
              if (sortBy === 'strategicScore') setSortBy('actionPriority');
              else if (sortBy === 'actionPriority') setSortBy('name');
              else setSortBy('strategicScore');
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white"
          >
            <ArrowUpDown className="w-3 h-3 text-emerald-400" />
            <span>
              ترتيب:{' '}
              {sortBy === 'strategicScore'
                ? 'الدرجة الاستراتيجية'
                : sortBy === 'actionPriority'
                ? 'أولوية الإجراء'
                : 'الاسم'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">رمز العميل</th>
                <th className="py-3 px-4">اسم العميل / المؤسسة</th>
                <th className="py-3 px-3 text-center">النوع</th>
                <th className="py-3 px-3 text-center">البعد A (القيمة)</th>
                <th className="py-3 px-3 text-center">البعد G (النمو)</th>
                <th className="py-3 px-3 text-center">البعد R (الاستقرار)</th>
                <th className="py-3 px-3 text-center">البعد E (الخدمة)</th>
                <th className="py-3 px-3 text-center">الدرجة الاستراتيجية</th>
                <th className="py-3 px-4 text-center">التصنيف</th>
                <th className="py-3 px-3 text-center">أولوية الإجراء</th>
                <th className="py-3 px-4 text-center">الإجراء الموصى به</th>
                <th className="py-3 px-4 text-center">ملف 360°</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredCustomers.map((c) => {
                const s = scoresMap[c.id];
                const p = prioritiesMap[c.id];

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      p?.hasUrgentOverride ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      <div className="flex items-center gap-1.5">
                        {p?.hasUrgentOverride && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="شكوى عاجلة" />
                        )}
                        <span>{c.sourceCode}</span>
                      </div>
                    </td>

                    {/* Name & Sector */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white hover:text-emerald-400 cursor-pointer" onClick={() => onSelectCustomer(c.id)}>
                        {c.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{c.sector}</span>
                        <span>•</span>
                        <span>{c.branch}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.type === 'corporate'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                      }`}>
                        {c.type === 'corporate' ? 'شركة' : 'فرد'}
                      </span>
                    </td>

                    {/* Dimension A */}
                    <td className="py-3 px-3 text-center font-mono">
                      {s?.dimensionA !== null && s?.dimensionA !== undefined ? (
                        <span className="font-semibold text-slate-200">{s.dimensionA}</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">غير متاح</span>
                      )}
                    </td>

                    {/* Dimension G */}
                    <td className="py-3 px-3 text-center font-mono">
                      {s?.dimensionG !== null && s?.dimensionG !== undefined ? (
                        <span className="font-semibold text-slate-200">{s.dimensionG}</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">غير متاح</span>
                      )}
                    </td>

                    {/* Dimension R */}
                    <td className="py-3 px-3 text-center font-mono">
                      {s?.dimensionR !== null && s?.dimensionR !== undefined ? (
                        <span className={`font-semibold ${s.dimensionR < 45 ? 'text-amber-400' : 'text-slate-200'}`}>
                          {s.dimensionR}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">غير متاح</span>
                      )}
                    </td>

                    {/* Dimension E */}
                    <td className="py-3 px-3 text-center font-mono">
                      {s?.dimensionE !== null && s?.dimensionE !== undefined ? (
                        <span className="font-semibold text-slate-200">{s.dimensionE}</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">غير متاح</span>
                      )}
                    </td>

                    {/* Strategic Score */}
                    <td className="py-3 px-3 text-center font-mono">
                      {s?.strategicScore !== null && s?.strategicScore !== undefined ? (
                        <span className="font-black text-white text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                          {s.strategicScore}
                        </span>
                      ) : (
                        <span className="text-rose-400 text-[11px] font-medium">غير مكتمل</span>
                      )}
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-4 text-center">
                      {renderTierBadge(c.currentTier)}
                    </td>

                    {/* Action Priority Score */}
                    <td className="py-3 px-3 text-center font-mono">
                      {p ? (
                        <span className={`font-black text-sm px-2 py-0.5 rounded ${
                          p.hasUrgentOverride
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : p.compositeActionPriority >= 70
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {p.compositeActionPriority}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3 px-4 text-center">
                      {p ? (
                        <div className="text-[11px] text-slate-300 max-w-[190px] truncate mx-auto" title={p.recommendedActionLabel}>
                          {p.recommendedActionLabel}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* 360 Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 font-semibold text-xs transition-all flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>فتح</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360° Detailed Profile Drawer / Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-3xl bg-slate-900 border-r border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      {selectedClient.sourceCode}
                    </span>
                    {renderTierBadge(selectedClient.currentTier)}
                    {selectedClient.isSynthetic && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        بيانات اصطناعية موثقة
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-white mt-1.5">{selectedClient.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedClient.sector} • الفرع: {selectedClient.branch} • المسؤول: {selectedClient.assignedManager}
                  </p>
                </div>
                <button
                  onClick={() => onSelectCustomer(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Special International Procurement & LC Tracker for Customer 1 */}
              {selectedClient.sourceCode === 'VIP-CORP-101' && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-lg flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Ship className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        تقرير المشتريات والاعتمادات الدولية (18 شهراً) — دورة الشراء والتمويل التجاري
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        إجمالي المشتريات: $904,000 • المحصل: $901,000 • المتبقي التراكمي: $3,000 • الشحن: $63,800 • الجمارك: $42,400
                      </p>
                    </div>
                  </div>
                  {onOpenProcurement && (
                    <button
                      onClick={() => {
                        onSelectCustomer(null);
                        onOpenProcurement();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>عرض التقرير وجدول الـ 18 شهراً</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  )}
                </div>
              )}

              {/* 4 Dimension Score Breakdown Box */}
              <div className="my-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>بطاقة التقييم الحتمي المعتمدة (Four Dimensions & Strategic Score)</span>
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    الدرجة الكلية: {clientScores?.strategicScore ?? 'غير مكتمل'} / 100
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">البعد A: القيمة (35%)</div>
                    <div className="text-base font-bold text-white mt-1">
                      {clientScores?.dimensionA ?? 'غير متاح'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">البعد G: النمو (25%)</div>
                    <div className="text-base font-bold text-white mt-1">
                      {clientScores?.dimensionG ?? 'غير متاح'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">البعد R: الاستقرار (20%)</div>
                    <div className="text-base font-bold text-white mt-1">
                      {clientScores?.dimensionR ?? 'غير متاح'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">البعد E: الخدمة (20%)</div>
                    <div className="text-base font-bold text-white mt-1">
                      {clientScores?.dimensionE ?? 'غير متاح'}
                    </div>
                  </div>
                </div>

                {/* Audit & Completeness Notes */}
                {clientScores?.completenessNotes && clientScores.completenessNotes.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    {clientScores.completenessNotes.map((note, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Priority Box */}
              {clientPriority && (
                <div className={`p-4 rounded-xl border mb-5 ${
                  clientPriority.hasUrgentOverride
                    ? 'bg-rose-950/40 border-rose-500/50'
                    : 'bg-emerald-950/20 border-emerald-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400">الإجراء الموصى به من محرك الأولويات:</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{clientPriority.recommendedActionLabel}</h4>
                    </div>
                    <div className="text-left font-mono">
                      <div className="text-[11px] text-slate-400">درجة الأولوية</div>
                      <div className="text-lg font-black text-emerald-400">{clientPriority.compositeActionPriority}</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span>التكلفة التقديرية للإجراء: {currencySymbol}{clientPriority.estimatedActionCost}</span>
                    <span>الاستعجال: {clientPriority.urgency} / 100</span>
                  </div>
                </div>
              )}

              {/* Balances History Table */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>السجل التاريخي للأرصدة الشهرية ({clientBalances.length} شهر مسجل)</span>
                </h4>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2">الشهر</th>
                        <th className="p-2 text-center">العملة</th>
                        <th className="p-2 text-left">متوسط الرصيد</th>
                        <th className="p-2 text-left">رصيد نهاية الشهر</th>
                        <th className="p-2 text-left">ودائع لأجل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {clientBalances.map((b, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="p-2 text-slate-300">{b.month}</td>
                          <td className="p-2 text-center text-slate-400">{b.currency}</td>
                          <td className="p-2 text-left font-bold text-emerald-400">{currencySymbol}{b.averageBalance.toLocaleString()}</td>
                          <td className="p-2 text-left text-slate-300">{currencySymbol}{b.closingBalance.toLocaleString()}</td>
                          <td className="p-2 text-left text-slate-400">{b.termDeposits ? `${currencySymbol}${b.termDeposits.toLocaleString()}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Products Matrix */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  <span>المنتجات والخدمات المستخدمة والفرص المؤهلة</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {clientProducts.map((p) => (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        p.status === 'active'
                          ? 'bg-slate-950 border-emerald-500/30'
                          : p.status === 'eligible_not_used'
                          ? 'bg-slate-950 border-amber-500/30'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{p.productType}</div>
                        <div className="text-[10px] text-slate-400">منذ: {p.startDate}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : p.status === 'eligible_not_used'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.status === 'active' ? 'نشط' : p.status === 'eligible_not_used' ? 'فرصة مؤهلة' : 'ملغي'}
                      </span>
                    </div>
                  ))}
                  {clientProducts.length === 0 && (
                    <div className="col-span-2 text-slate-400 text-xs py-3 text-center bg-slate-950 rounded-lg">
                      لا توجد سجلات منتجات مخصصة لهذا العميل
                    </div>
                  )}
                </div>
              </div>

              {/* Activities & Complaints */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>سجل الزيارات والشكاوى والتفاعلات</span>
                  </h4>
                  <button
                    onClick={() => setShowAddActivityModal(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>تسجيل نشاط / زيارة جديدة</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {clientActivities.map((act) => (
                    <div
                      key={act.id}
                      className={`p-3 rounded-xl border text-xs ${
                        act.isUrgentComplaint
                          ? 'bg-rose-950/30 border-rose-500/40'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{act.goal}</span>
                            {act.isUrgentComplaint && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-rose-500 text-white">
                                شكوى عاجلة
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            التاريخ: {act.date} • المسؤول: {act.assignedTo} • الكلفة: {currencySymbol}{act.cost}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          act.resultStatus === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : act.resultStatus === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {act.resultStatus === 'resolved' ? 'منجز' : act.resultStatus === 'in_progress' ? 'قيد المعالجة' : 'معلق'}
                        </span>
                      </div>
                      {act.nextStep && (
                        <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-300">
                          الخطوة القادمة: {act.nextStep} {act.dueDate && `(استحقاق: ${act.dueDate})`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-mono">
                المعرف الفريد: {selectedClient.id}
              </span>
              <button
                onClick={() => onSelectCustomer(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                إغلاق الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>تسجيل نشاط أو زيارة أو شكوى جديدة</span>
              </h3>
              <button onClick={() => setShowAddActivityModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">نوع الإجراء:</label>
                <select
                  value={newActivityType}
                  onChange={(e) => setNewActivityType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="visit">زيارة ميدانية / مكتبية</option>
                  <option value="meeting">اجتماع مع الإدارة العليا</option>
                  <option value="call">اتصال هاتفي متابعة</option>
                  <option value="complaint">شكوى أو اعتراض تشغيلي</option>
                  <option value="event">دعوة لفعالية كبار العملاء</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">هدف الزيارة أو موضوع التفاعل:</label>
                <input
                  type="text"
                  required
                  value={newActivityGoal}
                  onChange={(e) => setNewActivityGoal(e.target.value)}
                  placeholder="مثلاً: مناقشة تسهيل خطابات الضمان وتجديد الوديعة..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">المسؤول:</label>
                  <input
                    type="text"
                    value={newActivityAssignedTo}
                    onChange={(e) => setNewActivityAssignedTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">التكلفة الفعلية ({currencySymbol}):</label>
                  <input
                    type="number"
                    value={newActivityCost}
                    onChange={(e) => setNewActivityCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">هل تعتبر هذه شكوى عاجلة؟</div>
                  <div className="text-[10px] text-slate-400">ستمنح العميل أولوية تدخل قصوى فوراً</div>
                </div>
                <input
                  type="checkbox"
                  checked={newActivityIsUrgent}
                  onChange={(e) => setNewActivityIsUrgent(e.target.checked)}
                  className="w-4 h-4 accent-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddActivityModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  حفظ النشاط في السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function renderTierBadge(tier: StrategicTier) {
  switch (tier) {
    case 'strategic_tier1':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          استراتيجي (Tier 1 A+)
        </span>
      );
    case 'growth_opportunity':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          فرصة نمو (Tier 2 A)
        </span>
      );
    case 'relationship_reinforce':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          تعزيز العلاقة (Tier 3 B)
        </span>
      );
    case 'standard_vip':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600">
          خدمة اعتيادية (Tier 4 C)
        </span>
      );
    case 'incomplete_evaluation':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          تقييم غير مكتمل
        </span>
      );
    default:
      return null;
  }
}
