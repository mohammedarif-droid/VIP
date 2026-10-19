import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  Customer,
  MonthlyBalance,
  CustomerForecast,
  Currency,
} from '../types/banking';
import { generateCustomerForecast } from '../engine/deterministicMath';

interface ForecastingEngineViewProps {
  customers: Customer[];
  balances: MonthlyBalance[];
  currency: Currency;
  selectedCustomerId?: string | null;
  onSelectCustomer: (id: string | null) => void;
}

export const ForecastingEngineView: React.FC<ForecastingEngineViewProps> = ({
  customers,
  balances,
  currency,
  selectedCustomerId,
  onSelectCustomer,
}) => {
  const [activeCustomerId, setActiveCustomerId] = useState<string>(
    selectedCustomerId || (customers[0]?.id ?? '')
  );
  const [activeHorizon, setActiveHorizon] = useState<'m3' | 'm6' | 'm12'>('m6');

  const client = customers.find((c) => c.id === activeCustomerId);
  const clientBalances = balances.filter((b) => b.customerId === activeCustomerId);

  // Generate deterministic forecast
  const forecast: CustomerForecast = generateCustomerForecast(
    activeCustomerId,
    clientBalances,
    currency
  );

  const forecastPoints =
    activeHorizon === 'm3'
      ? forecast.horizons.m3
      : activeHorizon === 'm6'
      ? forecast.horizons.m6
      : forecast.horizons.m12;

  const sortedHistorical = [...clientBalances].sort((a, b) => a.month.localeCompare(b.month));

  const currencySymbol = currency === 'USD' ? '$' : currency === 'YER' ? 'ر.ي' : 'ر.س';

  // Compute maximum balance for SVG chart scaling
  const allValues = [
    ...sortedHistorical.map((b) => b.averageBalance),
    ...forecastPoints.map((p) => p.upperBound),
  ];
  const maxVal = Math.max(...allValues, 1000);

  return (
    <div className="space-y-6">
      {/* Governance Banner: Forecasting Separation Principle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-start gap-3">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            محددات الحوكمة لمحرّك التوقع الإحصائي (Statistical Forecasting Framework)
          </h3>
          <p className="text-xs text-slate-300">
            تخضع التوقعات لاختبار زمني متدرج (Rolling-Origin Backtesting) لحساب نسبة الخطأ (WAPE %) ومقارنتها بالنموذج المرجعي (Baseline). تُعرض حدود عدم اليقين (Confidence Bounds) صراحةً، ولا تُقيد هذه التقديرات كأرباح أو إيرادات متحققة في حسابات البنك.
          </p>
        </div>
      </div>

      {/* Selector & Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">اختر العميل للتحليل التنبؤي:</span>
          <select
            value={activeCustomerId}
            onChange={(e) => {
              setActiveCustomerId(e.target.value);
              onSelectCustomer(e.target.value);
            }}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.sourceCode} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Horizon Picker */}
        <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 text-[11px]">أفق التوقع:</span>
          <button
            onClick={() => setActiveHorizon('m3')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              activeHorizon === 'm3' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            3 أشهر
          </button>
          <button
            onClick={() => setActiveHorizon('m6')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              activeHorizon === 'm6' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            6 أشهر
          </button>
          <button
            onClick={() => setActiveHorizon('m12')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              activeHorizon === 'm12' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            12 شهراً
          </button>
        </div>
      </div>

      {/* Model Backtest Quality Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-slate-400 text-[11px]">النموذج الإحصائي المعتمد</div>
          <div className="text-sm font-bold text-white mt-1">
            {forecast.backtestMetrics.modelType === 'linear_trend'
              ? 'انحدار الاتجاه الخطي (Linear Trend)'
              : forecast.backtestMetrics.modelType === 'baseline_recent_mean'
              ? 'المتوسط المرجعي الحديث (Baseline Mean)'
              : 'بيانات غير كافية (Insufficient Data)'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">تم اختياره حتمياً بناءً على تقليل الخطأ</div>
        </div>

        {/* WAPE Error */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-slate-400 text-[11px]">نسبة الخطأ النسبي المتدرج (WAPE)</div>
          <div className="text-lg font-mono font-black text-white mt-1">
            {forecast.backtestMetrics.wape.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {forecast.backtestMetrics.wape <= 20
              ? 'دقة ممتازة (أقل من 20%)'
              : forecast.backtestMetrics.wape <= 30
              ? 'دقة مقبولة'
              : 'خطأ مرتفع (تذبذب حاد)'}
          </div>
        </div>

        {/* MAE */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-slate-400 text-[11px]">متوسط الخطأ المطلق (MAE)</div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
            {currencySymbol}{forecast.backtestMetrics.mae.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">هامش الانحراف التقديري للأرصدة</div>
        </div>

        {/* Reliability Status */}
        <div className={`border rounded-xl p-3.5 ${
          forecast.backtestMetrics.isReliable
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div className="text-slate-400 text-[11px]">حالة موثوقية التوقع</div>
          <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
            forecast.backtestMetrics.isReliable ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {forecast.backtestMetrics.isReliable ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>توقع موثوق إحصائياً</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>توقع غير موثوق</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {forecast.backtestMetrics.unreliabilityReason || 'استقرار تاريخي يسمح بالتنبؤ'}
          </div>
        </div>
      </div>

      {/* Forecast Visual Chart and Trajectory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>
                مسار الأرصدة التاريخية الفعلي مقابل التوقعات المستقبلية ({activeHorizon.toUpperCase()})
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              يعرض المسار الأزرق القيم الفعلية المعتمدة، بينما يمثل المسار الأخضر التوقعات مع نطاق عدم اليقين (العالي والأدنى).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span>بيانات تاريخية فعلية</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span>توقع إحصائي</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-3 h-3 rounded bg-slate-700/60 inline-block" />
              <span>نطاق عدم اليقين (CI)</span>
            </span>
          </div>
        </div>

        {/* Visual Bar / Point Chart */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
          <div className="grid grid-cols-12 gap-2 items-end h-56 pt-6 pb-2 border-b border-slate-800">
            {/* Historical points */}
            {sortedHistorical.slice(-6).map((h, i) => {
              const heightPct = Math.min(100, Math.max(10, (h.averageBalance / maxVal) * 100));
              return (
                <div key={i} className="flex flex-col items-center justify-end h-full gap-1 group">
                  <div className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {currencySymbol}{(h.averageBalance / 1000).toFixed(0)}k
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] bg-blue-600/70 group-hover:bg-blue-500 rounded-t-md transition-all shadow"
                  />
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{h.month.slice(5)}</div>
                </div>
              );
            })}

            {/* Forecast points */}
            {forecastPoints.map((f, i) => {
              const heightPct = Math.min(100, Math.max(10, (f.forecastBalance / maxVal) * 100));
              return (
                <div key={`f-${i}`} className="flex flex-col items-center justify-end h-full gap-1 group">
                  <div className="text-[10px] text-emerald-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {currencySymbol}{(f.forecastBalance / 1000).toFixed(0)}k
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] bg-emerald-500/80 group-hover:bg-emerald-400 rounded-t-md transition-all border border-dashed border-emerald-300 shadow"
                  />
                  <div className="text-[10px] text-emerald-400 font-mono font-bold mt-1">{f.month.slice(5)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 px-1">
            <span>الشهور التاريخية السابقة (الفعلية)</span>
            <span>الشهور المستقبلية المتوقعة (الإحصائية)</span>
          </div>
        </div>

        {/* Detailed Table of Future Points */}
        <div className="mt-5">
          <h4 className="text-xs font-bold text-slate-300 mb-2">
            جدول تفاصيل التوقعات ونطاقات الثقة:
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">الشهر المستهدف</th>
                  <th className="py-2.5 px-3">القيمة المتوقعة لمتوسط الرصيد</th>
                  <th className="py-2.5 px-3">الحد الأدنى (Lower Bound)</th>
                  <th className="py-2.5 px-3">الحد الأعلى (Upper Bound)</th>
                  <th className="py-2.5 px-3">مستوى الثقة</th>
                  <th className="py-2.5 px-3">التصنيف الإحصائي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                {forecastPoints.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{p.month}</td>
                    <td className="py-2.5 px-3 font-black text-white text-sm">
                      {currencySymbol}{p.forecastBalance.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {currencySymbol}{p.lowerBound.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {currencySymbol}{p.upperBound.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{(p.confidence * 100).toFixed(0)}%</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        تقدير إحصائي غير محقق
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
