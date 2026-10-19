import React, { useState } from 'react';
import {
  GitCompare,
  CheckCircle,
  AlertTriangle,
  Building2,
  TrendingUp,
  Briefcase,
  Calendar,
  X,
  Plus,
  HelpCircle,
} from 'lucide-react';
import {
  Customer,
  DimensionScores,
  ActionPriorityScore,
  MonthlyBalance,
  CustomerProduct,
  RelationshipActivity,
  Currency,
} from '../types/banking';

interface ComparisonLabProps {
  customers: Customer[];
  scoresMap: Record<string, DimensionScores>;
  prioritiesMap: Record<string, ActionPriorityScore>;
  balances: MonthlyBalance[];
  products: CustomerProduct[];
  activities: RelationshipActivity[];
  currency: Currency;
  onSelectCustomer: (id: string) => void;
}

export const ComparisonLab: React.FC<ComparisonLabProps> = ({
  customers,
  scoresMap,
  prioritiesMap,
  balances,
  products,
  activities,
  currency,
  onSelectCustomer,
}) => {
  // Pre-select 2-3 interesting comparison cases (e.g. strategic vs growth vs urgent)
  const [selectedIds, setSelectedIds] = useState<string[]>([
    customers[0]?.id || '',
    customers[1]?.id || '',
    customers[6]?.id || '',
  ].filter(Boolean));

  const currencySymbol = currency === 'USD' ? '$' : currency === 'YER' ? 'ر.ي' : 'ر.س';

  const handleAddClient = (id: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRemoveClient = (id: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter((cid) => cid !== id));
    }
  };

  const comparedClients = selectedIds
    .map((id) => customers.find((c) => c.id === id))
    .filter(Boolean) as Customer[];

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 mt-0.5">
          <GitCompare className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            مختبر المقارنة المتعددة وتفسير تباين الأولويات (Explainable Multi-Client Comparison)
          </h3>
          <p className="text-xs text-slate-300">
            مقارنة جنباً إلى جنب توضح سبب اختلاف احتياجات وتصنيفات العملاء؛ حيث يمكن لعميل ذي درجة استراتيجية أقل أن يحصل على أولوية تدخل أعلى فوراً بسبب وجود شكوى عاجلة أو خطر تراجع حاد.
          </p>
        </div>
      </div>

      {/* Client Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">العملاء المحدَّدون للمقارنة (حتى 4):</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {comparedClients.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <span>{c.sourceCode} - {c.name.substring(0, 18)}...</span>
                <button
                  onClick={() => handleRemoveClient(c.id)}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Add Dropdown */}
        {selectedIds.length < 4 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">إضافة عميل:</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleAddClient(e.target.value);
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">اختر عميلاً من القائمة...</option>
              {customers
                .filter((c) => !selectedIds.includes(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.sourceCode} - {c.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Comparison Matrix Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-44">محور المقارنة</th>
                {comparedClients.map((c) => (
                  <th key={c.id} className="py-3 px-4 min-w-[200px]">
                    <div className="font-mono text-emerald-400 font-bold">{c.sourceCode}</div>
                    <div className="text-white text-xs font-bold mt-0.5">{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {/* Row: Sector & Branch */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-bold text-slate-400">القطاع والفرع</td>
                {comparedClients.map((c) => (
                  <td key={c.id} className="py-3 px-4">
                    <div>{c.sector}</div>
                    <div className="text-[11px] text-slate-400">{c.branch}</div>
                  </td>
                ))}
              </tr>

              {/* Row: Strategic Tier */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-bold text-slate-400">التصنيف الاستراتيجي</td>
                {comparedClients.map((c) => (
                  <td key={c.id} className="py-3 px-4">
                    <span className="font-semibold text-emerald-400">
                      {c.currentTier === 'strategic_tier1'
                        ? 'استراتيجي (Tier 1 A+)'
                        : c.currentTier === 'growth_opportunity'
                        ? 'فرصة نمو (Tier 2 A)'
                        : c.currentTier === 'relationship_reinforce'
                        ? 'تعزيز العلاقة (Tier 3 B)'
                        : c.currentTier === 'standard_vip'
                        ? 'خدمة اعتيادية (Tier 4 C)'
                        : 'تقييم غير مكتمل'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Dimension A */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-bold text-slate-400">البعد A: القيمة الاقتصادية (35%)</td>
                {comparedClients.map((c) => {
                  const s = scoresMap[c.id];
                  return (
                    <td key={c.id} className="py-3 px-4 font-mono font-bold text-slate-200">
                      {s?.dimensionA !== null && s?.dimensionA !== undefined ? `${s.dimensionA} / 100` : 'غير متاح'}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Dimension G */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-bold text-slate-400">البعد G: فرصة النمو (25%)</td>
                {comparedClients.map((c) => {
                  const s = scoresMap[c.id];
                  return (
                    <td key={c.id} className="py-3 px-4 font-mono font-bold text-slate-200">
                      {s?.dimensionG !== null && s?.dimensionG !== undefined ? `${s.dimensionG} / 100` : 'غير متاح'}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Dimension R */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-bold text-slate-400">البعد R: استقرار العلاقة (20%)</td>
                {comparedClients.map((c) => {
                  const s = scoresMap[c.id];
                  return (
                    <td key={c.id} className="py-3 px-4 font-mono font-bold text-slate-200">
                      {s?.dimensionR !== null && s?.dimensionR !== undefined ? `${s.dimensionR} / 100` : 'غير متاح'}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Dimension E */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-bold text-slate-400">البعد E: التفاعل والخدمة (20%)</td>
                {comparedClients.map((c) => {
                  const s = scoresMap[c.id];
                  return (
                    <td key={c.id} className="py-3 px-4 font-mono font-bold text-slate-200">
                      {s?.dimensionE !== null && s?.dimensionE !== undefined ? `${s.dimensionE} / 100` : 'غير متاح'}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Total Strategic Score */}
              <tr className="bg-slate-950 font-bold">
                <td className="py-3 px-4 text-emerald-400">الدرجة الاستراتيجية المركبة</td>
                {comparedClients.map((c) => {
                  const s = scoresMap[c.id];
                  return (
                    <td key={c.id} className="py-3 px-4 font-mono text-base text-white">
                      {s?.strategicScore !== null && s?.strategicScore !== undefined ? s.strategicScore : 'غير مكتمل'}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Action Priority */}
              <tr className="bg-slate-950/80 font-bold border-t border-slate-800">
                <td className="py-3 px-4 text-amber-400">درجة أولوية الإجراء (Action Priority)</td>
                {comparedClients.map((c) => {
                  const p = prioritiesMap[c.id];
                  return (
                    <td key={c.id} className="py-3 px-4 font-mono text-base text-amber-300">
                      {p?.compositeActionPriority ?? '-'}
                      {p?.hasUrgentOverride && (
                        <span className="mr-2 text-[10px] px-2 py-0.5 rounded bg-rose-500 text-white font-sans">
                          شكوى عاجلة
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Recommended Action */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-bold text-slate-400">الإجراء الموصى به</td>
                {comparedClients.map((c) => {
                  const p = prioritiesMap[c.id];
                  return (
                    <td key={c.id} className="py-3 px-4 font-semibold text-slate-200">
                      {p?.recommendedActionLabel || '-'}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Products Comparison */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-bold text-slate-400">المنتجات المؤهلة غير المستخدمة</td>
                {comparedClients.map((c) => {
                  const cProds = products.filter(
                    (p) => p.customerId === c.id && p.status === 'eligible_not_used'
                  );
                  return (
                    <td key={c.id} className="py-3 px-4">
                      {cProds.length > 0 ? (
                        <ul className="list-disc list-inside text-[11px] text-amber-300 space-y-0.5">
                          {cProds.map((cp) => (
                            <li key={cp.id}>{cp.productType}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 text-[11px]">يستخدم كافة الخدمات المؤهلة</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Explainability Rationale */}
              <tr className="bg-slate-950/60 text-[11px]">
                <td className="py-3 px-4 font-bold text-slate-300">تفسير التباين الإداري</td>
                {comparedClients.map((c) => {
                  const p = prioritiesMap[c.id];
                  const s = scoresMap[c.id];
                  return (
                    <td key={c.id} className="py-3 px-4 text-slate-300 leading-relaxed">
                      {p?.hasUrgentOverride
                        ? 'تجاوز طارئ: العميل يواجه عائقاً تشغيلياً أو شكوى عاجلة تقتضي سرعة المعالجة لمنع تفاقم المشكلة.'
                        : (s?.dimensionG ?? 0) >= 70
                        ? 'فرصة توسع: العميل يمتلك وتيرة نمو سريعة ومنتجات غير مفعلة، مما يجعله مثالياً لعروض التسهيلات والاعتمادات.'
                        : (s?.dimensionR ?? 0) < 45
                        ? 'مخاطر تسرب: تراجع في متوسط الأرصدة يستوجب زيارة وقائية لتعزيز الثقة وتقديم حلول سيولة.'
                        : 'علاقة مستقرة: العميل يحقق استقراراً وربحية ممتازة، والتركيز ينصب على الرعاية الدورية.'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
