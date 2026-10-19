import React from 'react';
import {
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Lock,
} from 'lucide-react';
import { Currency, MethodologyConfig } from '../types/banking';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: Currency;
  setCurrency: (cur: Currency) => void;
  methodology: MethodologyConfig;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onResetBenchmark: () => void;
  urgentAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  methodology,
  onExportExcel,
  onExportPDF,
  onResetBenchmark,
  urgentAlertsCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'لوحة الإدارة التنفيذية' },
    { id: 'clients', label: 'ملفات كبار العملاء 360°' },
    { id: 'procurement', label: 'المشتريات والاعتمادات الدولية (18M)' },
    { id: 'forecast', label: 'التوقعات الإحصائية' },
    { id: 'priorities', label: 'الأولويات والميزانيات' },
    { id: 'comparison', label: 'مختبر المقارنة' },
    { id: 'import', label: 'استيراد البيانات والجودة' },
    { id: 'governance', label: 'الحوكمة وسجل التدقيق' },
    { id: 'manual', label: 'دليل التشغيل والمعادلات' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl">
      {/* Top Bar: Bank Identity & Security Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-lg shadow-emerald-950/50 text-white font-black text-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-wide">بنك التسليف التعاوني والزراعي | CAC Bank</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                إدارة كبار العملاء (VIP)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              منصة ذكاء وتقييم وتصنيف كبار العملاء الاستراتيجية — PCIS Platform v1.0
            </p>
          </div>
        </div>

        {/* Right Info: Confidentiality, Methodology Version & Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>سري ومصرفي داخلي</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>المنهجية: {methodology.versionId}</span>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
            {(['USD', 'YER', 'SAR'] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  currency === c
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c === 'USD' ? 'دولار ($)' : c === 'YER' ? 'ريال يمني' : 'ريال سعودي'}
              </button>
            ))}
          </div>

          {/* Quick Export Actions */}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium shadow transition-all hover:scale-105 cursor-pointer"
            title="تصدير مصنف إكسل كامل متعدد الصفحات"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={onExportPDF}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700/80 hover:bg-blue-600 text-white font-medium shadow transition-all hover:scale-105 cursor-pointer"
            title="تصدير تقرير تنفيذي PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>تقرير PDF</span>
          </button>

          <button
            onClick={onResetBenchmark}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="إعادة تعيين البيانات المعيارية للاختبار"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center overflow-x-auto scrollbar-none py-1 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isPrioritiesTab = tab.id === 'priorities';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 shadow-inner font-semibold border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.label}</span>
              {isPrioritiesTab && urgentAlertsCount > 0 && (
                <span className="mr-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                  {urgentAlertsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
