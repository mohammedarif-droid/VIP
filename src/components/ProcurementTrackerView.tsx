import React, { useState } from 'react';
import {
  Ship,
  FileCheck2,
  Download,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Award,
  AlertCircle,
  Truck,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { VIP1_PROCUREMENT_DATA, DOCUMENT_TRACKING_STAGES } from '../data/syntheticBenchmarkData';
import { ProcurementRecord } from '../types/banking';

interface ProcurementTrackerViewProps {
  onBackToClients?: () => void;
}

export const ProcurementTrackerView: React.FC<ProcurementTrackerViewProps> = ({ onBackToClients }) => {
  const [filterDelivery, setFilterDelivery] = useState<'all' | 'Delivered' | 'In Transit'>('all');
  const [filterLC, setFilterLC] = useState<'all' | 'Opened' | 'Settled'>('all');

  const filteredData = VIP1_PROCUREMENT_DATA.filter((item) => {
    const matchesDelivery = filterDelivery === 'all' || item.deliveryStatus === filterDelivery;
    const matchesLC = filterLC === 'all' || item.lcStatus === filterLC;
    return matchesDelivery && matchesLC;
  });

  // Aggregate Metrics (18 Months)
  const totalProcurement = VIP1_PROCUREMENT_DATA.reduce((sum, r) => sum + r.procurementValueUSD, 0);
  const totalPayments = VIP1_PROCUREMENT_DATA.reduce((sum, r) => sum + r.customerPaymentsUSD, 0);
  const closingOutstanding = VIP1_PROCUREMENT_DATA[VIP1_PROCUREMENT_DATA.length - 1].closingOutstandingUSD;
  const totalFreight = VIP1_PROCUREMENT_DATA.reduce((sum, r) => sum + r.freightUSD, 0);
  const totalCustoms = VIP1_PROCUREMENT_DATA.reduce((sum, r) => sum + r.customsUSD, 0);
  const deliveredCount = VIP1_PROCUREMENT_DATA.filter((r) => r.deliveryStatus === 'Delivered').length;
  const deliveryRate = (deliveredCount / VIP1_PROCUREMENT_DATA.length) * 100;
  const avgDeliveryDays =
    VIP1_PROCUREMENT_DATA.reduce((sum, r) => sum + r.deliveryDays, 0) / VIP1_PROCUREMENT_DATA.length;

  const handleExportProcurementExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Monthly Procurement Report
    const procurementRows: any[][] = [
      ['VIP Customer — International Procurement Report (18 Months)'],
      ['Customer Code: VIP-CORP-101 | Name: مجموعة التضامن للتجارة والاستيراد'],
      ['Evaluation Period: 18 Months (M01 to M18) | Currency: USD'],
      [''],
      [
        'Month',
        'PI Number',
        'PO Number',
        'LC Status',
        'BL Number',
        'Procurement Value USD',
        'Freight USD',
        'Customs USD',
        'Delivery Status',
        'Delivery Days',
        'Customer Invoice USD',
        'Customer Payments USD',
        'Closing Outstanding USD',
        'Evaluation',
      ],
    ];

    VIP1_PROCUREMENT_DATA.forEach((r) => {
      procurementRows.push([
        r.month,
        r.piNumber,
        r.poNumber,
        r.lcStatus,
        r.blNumber,
        r.procurementValueUSD,
        r.freightUSD,
        r.customsUSD,
        r.deliveryStatus,
        r.deliveryDays,
        r.customerInvoiceUSD,
        r.customerPaymentsUSD,
        r.closingOutstandingUSD,
        r.evaluation,
      ]);
    });

    // Summary row
    procurementRows.push([
      'TOTAL / SUMMARY',
      '',
      '',
      '',
      '',
      totalProcurement,
      totalFreight,
      totalCustoms,
      `${deliveryRate.toFixed(1)}% Delivered`,
      Number(avgDeliveryDays.toFixed(2)),
      totalProcurement,
      totalPayments,
      closingOutstanding,
      'EXCELLENT',
    ]);

    const ws1 = XLSX.utils.aoa_to_sheet(procurementRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Monthly Procurement Report');

    // Sheet 2: Document Tracking
    const docRows: any[][] = [
      ['Procurement Workflow & Document Tracking (8 Process Stages)'],
      ['Customer: VIP-CORP-101 | Trade Finance Compliance Matrix'],
      [''],
      ['Process stage', 'Required document / control', 'Output to record', 'Compliance Status / Notes'],
    ];

    DOCUMENT_TRACKING_STAGES.forEach((s) => {
      docRows.push([s.stageName, s.requiredDocument, s.outputRecord, s.notes]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(docRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Document Tracking');

    // Download Excel
    XLSX.writeFile(wb, 'VIP_Customer_International_Procurement_18M.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              VIP-CORP-101 (العميل الأول في كبار العملاء)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              دورة مشتريات واعتمادات دولية (18 شهراً)
            </span>
          </div>
          <h2 className="text-lg font-black text-white mt-1">
            مجموعة التضامن للتجارة والاستيراد — تقرير الاعتمادات والمشتريات الدولية
          </h2>
          <p className="text-xs text-slate-300">
            تتبع دورة الشراء والتمويل التجاري الكاملة من الفاتورة المبدئية (PI) إلى أوامر الشراء (PO)، والاعتمادات المستندية (LC)، وبوالص الشحن (B/L)، والتخليص الجمركي، والتسليم، والتسوية المالية التراكمية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToClients && (
            <button
              onClick={onBackToClients}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
            >
              العودة لكافة العملاء
            </button>
          )}

          <button
            onClick={handleExportProcurementExcel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير مصنف الإكسل (ورقتان: Report + Tracking)</span>
          </button>
        </div>
      </div>

      {/* 3. Final Evaluation Dashboard (KPI Cards as requested) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total Procurement */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-right space-y-1">
          <div className="text-[11px] text-slate-400">إجمالي قيمة المشتريات</div>
          <div className="text-xl font-mono font-black text-white">
            ${totalProcurement.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">18 أمر شراء دولي</div>
        </div>

        {/* Metric 2: Total Payments */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-right space-y-1">
          <div className="text-[11px] text-slate-400">إجمالي مدفوعات العميل</div>
          <div className="text-xl font-mono font-black text-emerald-400">
            ${totalPayments.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">نسبة تحصيل 99.67%</div>
        </div>

        {/* Metric 3: Closing Outstanding Balance */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-right space-y-1">
          <div className="text-[11px] text-slate-400">الرصيد المتبقي التراكمي</div>
          <div className="text-xl font-mono font-black text-amber-400">
            ${closingOutstanding.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">تسوية شهرية منضبطة</div>
        </div>

        {/* Metric 4: Total Freight */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-right space-y-1">
          <div className="text-[11px] text-slate-400">تكاليف الشحن الدولي</div>
          <div className="text-xl font-mono font-bold text-white">
            ${totalFreight.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">7.05% من قيمة المشتريات</div>
        </div>

        {/* Metric 5: Total Customs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-right space-y-1">
          <div className="text-[11px] text-slate-400">الرسوم الجمركية والضرائب</div>
          <div className="text-xl font-mono font-bold text-white">
            ${totalCustoms.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">4.69% من قيمة المشتريات</div>
        </div>

        {/* Metric 6: Delivery Rate & Time */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-right space-y-1">
          <div className="text-[11px] text-slate-400">معدل التسليم والمدة</div>
          <div className="text-xl font-mono font-black text-blue-400">
            {deliveryRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            متوسط {avgDeliveryDays.toFixed(1)} يوماً
          </div>
        </div>
      </div>

      {/* 2. Procurement Workflow & Document Tracking Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>سجل تتبع الوثائق والرقابة المصرفية لمراحل الشراء (Document Tracking Matrix)</span>
          </h3>
          <span className="text-[11px] text-emerald-400 font-mono font-bold bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            اكتمال الوثائق: 100% (8 مراحل معتمدة)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {DOCUMENT_TRACKING_STAGES.map((s) => (
            <div key={s.stageNumber} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-white">{s.stageName}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[11px] text-emerald-300 font-medium">{s.requiredDocument}</div>
              <div className="text-[10px] text-slate-400 font-mono">{s.outputRecord}</div>
              <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-900 font-medium">{s.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 1. Monthly Procurement Report Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              جدول دورة المشتريات الشهرية والاعتمادات والتسوية التراكمية (18 شهراً)
            </h3>
          </div>

          {/* Table Filters */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={filterDelivery}
              onChange={(e) => setFilterDelivery(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">كافة حالات التسليم</option>
              <option value="Delivered">مستلمة (Delivered)</option>
              <option value="In Transit">قيد النقل (In Transit)</option>
            </select>

            <select
              value={filterLC}
              onChange={(e) => setFilterLC(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">كافة حالات الاعتماد (LC)</option>
              <option value="Opened">مفتوح (Opened)</option>
              <option value="Settled">مسوى (Settled)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 font-semibold">
              <tr>
                <th className="py-2.5 px-3">الشهر</th>
                <th className="py-2.5 px-3">رقم الفاتورة (PI)</th>
                <th className="py-2.5 px-3">أمر الشراء (PO)</th>
                <th className="py-2.5 px-3 text-center">حالة الاعتماد (LC)</th>
                <th className="py-2.5 px-3">بوليصة الشحن (B/L)</th>
                <th className="py-2.5 px-3 text-left">قيمة الشراء ($)</th>
                <th className="py-2.5 px-3 text-left">الشحن ($)</th>
                <th className="py-2.5 px-3 text-left">الجمارك ($)</th>
                <th className="py-2.5 px-3 text-center">حالة التسليم</th>
                <th className="py-2.5 px-3 text-center">المدة (أيام)</th>
                <th className="py-2.5 px-3 text-left">المفوتر ($)</th>
                <th className="py-2.5 px-3 text-left">المحصل ($)</th>
                <th className="py-2.5 px-3 text-left">المتبقي التراكمي ($)</th>
                <th className="py-2.5 px-3 text-center">التقييم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
              {filteredData.map((r, i) => (
                <tr key={r.month} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-bold text-white">{r.month}</td>
                  <td className="py-2.5 px-3 text-slate-300">{r.piNumber}</td>
                  <td className="py-2.5 px-3 text-slate-300">{r.poNumber}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.lcStatus === 'Settled'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {r.lcStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{r.blNumber}</td>
                  <td className="py-2.5 px-3 text-left font-bold text-white">
                    ${r.procurementValueUSD.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-left text-slate-400">
                    ${r.freightUSD.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-left text-slate-400">
                    ${r.customsUSD.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.deliveryStatus === 'Delivered'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {r.deliveryStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-300">{r.deliveryDays}</td>
                  <td className="py-2.5 px-3 text-left text-slate-300">
                    ${r.customerInvoiceUSD.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-left font-bold text-emerald-400">
                    ${r.customerPaymentsUSD.toLocaleString()}
                  </td>
                  <td className={`py-2.5 px-3 text-left font-bold ${
                    r.closingOutstandingUSD > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    ${r.closingOutstandingUSD.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.evaluation === 'Excellent'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {r.evaluation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-mono font-bold text-xs">
              <tr>
                <td colSpan={5} className="py-3 px-3 text-white">
                  المجاميع الكلية المعتمدة (SUM formulas)
                </td>
                <td className="py-3 px-3 text-left text-emerald-400">
                  ${totalProcurement.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-left text-slate-300">
                  ${totalFreight.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-left text-slate-300">
                  ${totalCustoms.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-center text-blue-400">
                  {deliveryRate.toFixed(1)}%
                </td>
                <td className="py-3 px-3 text-center text-slate-300">
                  {avgDeliveryDays.toFixed(1)}d
                </td>
                <td className="py-3 px-3 text-left text-white">
                  ${totalProcurement.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-left text-emerald-400">
                  ${totalPayments.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-left text-amber-400">
                  ${closingOutstanding.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-center text-emerald-400">
                  EXCELLENT
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
