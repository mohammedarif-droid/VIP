/**
 * Export and Reporting Engine for PCIS Platform
 * Exports audited Excel workbooks (.xlsx), PDF executive reports, and CSV templates.
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  Customer,
  DimensionScores,
  ActionPriorityScore,
  CustomerForecast,
  Campaign,
  AuditLogEntry,
  MethodologyConfig,
} from '../types/banking';

export interface ComprehensiveReportData {
  customers: Customer[];
  scoresMap: Record<string, DimensionScores>;
  prioritiesMap: Record<string, ActionPriorityScore>;
  forecastsMap: Record<string, CustomerForecast>;
  campaigns: Campaign[];
  auditLogs: AuditLogEntry[];
  methodology: MethodologyConfig;
}

export function exportComprehensiveExcel(data: ComprehensiveReportData, filename = 'تقرير_ذكاء_كبار_العملاء_PCIS.xlsx') {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const totalCustomers = data.customers.length;
  const strategicTier1 = data.customers.filter((c) => c.currentTier === 'strategic_tier1').length;
  const growthOpp = data.customers.filter((c) => c.currentTier === 'growth_opportunity').length;
  const relationshipReinforce = data.customers.filter((c) => c.currentTier === 'relationship_reinforce').length;
  const standardVip = data.customers.filter((c) => c.currentTier === 'standard_vip').length;
  const incomplete = data.customers.filter((c) => c.currentTier === 'incomplete_evaluation').length;

  const summaryRows = [
    ['منصة ذكاء وتقييم كبار العملاء المصرفيين (PCIS) - التقرير التنفيذي الشامل'],
    ['تاريخ الاستخراج:', new Date().toLocaleString('ar-YE')],
    ['إصدار المنهجية المعتمدة:', data.methodology.versionId],
    ['المعتمد بواسطة:', data.methodology.approvedBy],
    ['السرية:', 'سري للغاية - استخدام مصرفي داخلي فقط'],
    [''],
    ['المؤشر الإحصائي', 'القيمة'],
    ['إجمالي كبار العملاء بالمحفظة', totalCustomers],
    ['عملاء استراتيجيون (Tier 1 A+)', strategicTier1],
    ['فرص نمو واعدة (Tier 2 A)', growthOpp],
    ['تعزيز العلاقة (Tier 3 B)', relationshipReinforce],
    ['خدمة اعتيادية محسنة (Tier 4 C)', standardVip],
    ['تقييم غير مكتمل (نقص بيانات)', incomplete],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص_التنفيذي');

  // 2. Customer Evaluation Scores Sheet
  const evalRows = [
    [
      'رمز العميل',
      'اسم العميل أو المؤسسة',
      'النوع',
      'القطاع',
      'الفرع',
      'مدير العلاقة المسؤول',
      'البعد A (القيمة الاقتصادية)',
      'البعد G (فرصة النمو)',
      'البعد R (استقرار العلاقة)',
      'البعد E (احتياج الخدمة والشكاوى)',
      'الدرجة الاستراتيجية الكلية',
      'التصنيف الاستراتيجي',
      'حالة اكتمال البيانات',
      'ملاحظات الاحتساب',
    ],
  ];

  for (const c of data.customers) {
    const s = data.scoresMap[c.id];
    evalRows.push([
      c.sourceCode,
      c.name,
      c.type === 'corporate' ? 'شركات' : 'أفراد',
      c.sector,
      c.branch,
      c.assignedManager,
      s?.dimensionA !== null && s?.dimensionA !== undefined ? s.dimensionA.toString() : 'غير متاح',
      s?.dimensionG !== null && s?.dimensionG !== undefined ? s.dimensionG.toString() : 'غير متاح',
      s?.dimensionR !== null && s?.dimensionR !== undefined ? s.dimensionR.toString() : 'غير متاح',
      s?.dimensionE !== null && s?.dimensionE !== undefined ? s.dimensionE.toString() : 'غير متاح',
      s?.strategicScore !== null && s?.strategicScore !== undefined ? s.strategicScore.toString() : 'غير مكتمل',
      translateTier(c.currentTier),
      s?.isComplete ? 'مكتمل' : 'ناقص',
      s?.completenessNotes?.join(' | ') || '',
    ]);
  }
  const wsEval = XLSX.utils.aoa_to_sheet(evalRows);
  XLSX.utils.book_append_sheet(wb, wsEval, 'تقييم_كبار_العملاء');

  // 3. Priorities & Actions Sheet
  const priorityRows = [
    [
      'رمز العميل',
      'اسم العميل',
      'درجة أولوية الإجراء',
      'هل توجد شكوى عاجلة؟',
      'الإجراء الموصى به',
      'التكلفة التقديرية (USD)',
      'الأهمية الاستراتيجية',
      'ملاءمة الحاجة',
      'الاستعجال',
      'كفاءة الموارد',
    ],
  ];

  for (const c of data.customers) {
    const p = data.prioritiesMap[c.id];
    if (p) {
      priorityRows.push([
        c.sourceCode,
        c.name,
        p.compositeActionPriority.toString(),
        p.hasUrgentOverride ? 'نعم - تدخل فوري' : 'لا',
        p.recommendedActionLabel,
        p.estimatedActionCost.toString(),
        p.strategicRelevance.toString(),
        p.needFit.toString(),
        p.urgency.toString(),
        p.resourceEfficiency.toString(),
      ]);
    }
  }
  const wsPriority = XLSX.utils.aoa_to_sheet(priorityRows);
  XLSX.utils.book_append_sheet(wb, wsPriority, 'أولويات_الإجراءات');

  // 4. Forecasts Sheet
  const forecastRows = [
    [
      'رمز العميل',
      'اسم العميل',
      'النموذج الإحصائي',
      'نسبة الخطأ WAPE %',
      'مستوى الموثوقية',
      'توقع 3 أشهر (متوسط الرصيد)',
      'توقع 6 أشهر (متوسط الرصيد)',
      'توقع 12 شهراً (متوسط الرصيد)',
      'تنبيه الحوكمة',
    ],
  ];

  for (const c of data.customers) {
    const f = data.forecastsMap[c.id];
    if (f) {
      const m3Val = f.horizons.m3[f.horizons.m3.length - 1]?.forecastBalance ?? 'غير متاح';
      const m6Val = f.horizons.m6[f.horizons.m6.length - 1]?.forecastBalance ?? 'غير متاح';
      const m12Val = f.horizons.m12[f.horizons.m12.length - 1]?.forecastBalance ?? 'غير متاح';

      forecastRows.push([
        c.sourceCode,
        c.name,
        f.backtestMetrics.modelType === 'linear_trend'
          ? 'انحدار الاتجاه الخطي'
          : f.backtestMetrics.modelType === 'baseline_recent_mean'
          ? 'المتوسط المرجعي الحديث'
          : 'بيانات غير كافية',
        `${f.backtestMetrics.wape.toFixed(1)}%`,
        f.backtestMetrics.isReliable ? 'موثوق' : 'غير موثوق',
        typeof m3Val === 'number' ? m3Val.toLocaleString() : m3Val,
        typeof m6Val === 'number' ? m6Val.toLocaleString() : m6Val,
        typeof m12Val === 'number' ? m12Val.toLocaleString() : m12Val,
        f.disclaimer,
      ]);
    }
  }
  const wsForecast = XLSX.utils.aoa_to_sheet(forecastRows);
  XLSX.utils.book_append_sheet(wb, wsForecast, 'التوقعات_الإحصائية');

  // 5. Campaigns & Budget Sheet
  const campRows = [
    [
      'معرف الحملة',
      'عنوان المبادرة',
      'فئة الإجراء',
      'الميزانية المعتمدة (USD)',
      'التكلفة الفعلية (USD)',
      'الإيراد الإضافي الموثق (USD)',
      'حساب العائد ROI %',
      'موثوقية الإسناد',
      'الحالة',
    ],
  ];
  for (const camp of data.campaigns) {
    const roiVal =
      camp.actualCost > 0
        ? `${(((camp.incrementalRevenueDocumented - camp.actualCost) / camp.actualCost) * 100).toFixed(1)}%`
        : 'غير متاح';

    campRows.push([
      camp.id,
      camp.title,
      camp.category,
      camp.approvedBudget.toString(),
      camp.actualCost.toString(),
      camp.incrementalRevenueDocumented.toString(),
      roiVal,
      camp.attributionReliability,
      camp.status,
    ]);
  }
  const wsCamp = XLSX.utils.aoa_to_sheet(campRows);
  XLSX.utils.book_append_sheet(wb, wsCamp, 'الميزانيات_والعائد');

  // 6. Audit Trail Sheet
  const auditRows = [['معرف السجل', 'التاريخ والوقت', 'المستخدم', 'نوع الإجراء', 'الوصف']];
  for (const a of data.auditLogs) {
    auditRows.push([a.id, a.timestamp, a.userEmail, a.actionType, a.description]);
  }
  const wsAudit = XLSX.utils.aoa_to_sheet(auditRows);
  XLSX.utils.book_append_sheet(wb, wsAudit, 'سجل_التدقيق');

  // Download workbook
  XLSX.writeFile(wb, filename);
}

export function exportExecutivePDF(data: ComprehensiveReportData, filename = 'تقرير_كبار_العملاء_التنفيذي.pdf') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header Banner
  doc.setFillColor(15, 23, 42); // dark slate 900
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Private Client Intelligence & Strategic Prioritization (PCIS)', 14, 15);
  doc.setFontSize(11);
  doc.text('VIP Banking Management - Executive Portfolio Audit', 14, 23);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()} | Version: ${data.methodology.versionId}`, 14, 30);

  // Body Summary Stats
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text('Portfolio Key Metrics Overview', 14, 45);

  const total = data.customers.length;
  const strategic = data.customers.filter((c) => c.currentTier === 'strategic_tier1').length;
  const growth = data.customers.filter((c) => c.currentTier === 'growth_opportunity').length;
  const reinforce = data.customers.filter((c) => c.currentTier === 'relationship_reinforce').length;
  const incomplete = data.customers.filter((c) => c.currentTier === 'incomplete_evaluation').length;

  doc.setFontSize(9);
  doc.rect(14, 50, 42, 22);
  doc.text('Total VIP Clients', 17, 56);
  doc.setFontSize(14);
  doc.text(`${total}`, 17, 66);

  doc.setFontSize(9);
  doc.rect(60, 50, 42, 22);
  doc.text('Strategic (Tier 1)', 63, 56);
  doc.setFontSize(14);
  doc.text(`${strategic}`, 63, 66);

  doc.setFontSize(9);
  doc.rect(106, 50, 42, 22);
  doc.text('Growth Opportunity', 109, 56);
  doc.setFontSize(14);
  doc.text(`${growth}`, 109, 66);

  doc.setFontSize(9);
  doc.rect(152, 50, 44, 22);
  doc.text('Incomplete Data', 155, 56);
  doc.setFontSize(14);
  doc.text(`${incomplete}`, 155, 66);

  // Table of Top Clients
  doc.setFontSize(11);
  doc.text('Key VIP Accounts & Priority Ranking', 14, 84);

  let startY = 92;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY - 5, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Code', 16, startY);
  doc.text('Client Name / Entity', 45, startY);
  doc.text('Strategic Score', 115, startY);
  doc.text('Priority Score', 145, startY);
  doc.text('Urgent Status', 172, startY);

  startY += 7;
  const sampleList = data.customers.slice(0, 15);
  for (const c of sampleList) {
    const s = data.scoresMap[c.id];
    const p = data.prioritiesMap[c.id];

    doc.setTextColor(15, 23, 42);
    doc.text(c.sourceCode, 16, startY);
    // English transliteration or clean substring for safe rendering
    const cleanName = c.name.length > 35 ? c.name.substring(0, 35) + '...' : c.name;
    doc.text(cleanName, 45, startY);
    doc.text(s?.strategicScore !== null && s?.strategicScore !== undefined ? `${s.strategicScore}` : 'Incomplete', 115, startY);
    doc.text(p ? `${p.compositeActionPriority}` : '-', 145, startY);
    doc.text(p?.hasUrgentOverride ? 'URGENT' : 'Normal', 172, startY);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, startY + 2, 196, startY + 2);
    startY += 8;
  }

  // Footer Disclaimer
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'CONFIDENTIAL BANKING DOCUMENT - PCIS Deterministic Engine v1.0. All scores are computed deterministically.',
    14,
    285
  );

  doc.save(filename);
}

export function downloadSampleCSVTemplate(type: 'customers' | 'balances' | 'transactions') {
  let content = '';
  let filename = '';

  if (type === 'customers') {
    filename = 'PCIS_قالب_بيانات_العملاء_القياسي.csv';
    content =
      'sourceCode,name,type,sector,relationshipStartDate,assignedManager,branch,operationalStatus\n' +
      'VIP-CORP-301,مجموعة العالمية للتجارة الدولية,corporate,تجارة واستيراد,2018-05-10,سامي الخولاني,الفرع الرئيسي,active\n' +
      'VIP-IND-401,الشيخ سالم علي باصبرين,individual,ملاءة مالية عالية,2019-11-20,ريم الصبري,فرع المكلا,active\n';
  } else if (type === 'balances') {
    filename = 'PCIS_قالب_الأرصدة_الشهرية_القياسي.csv';
    content =
      'sourceCode,month,currency,averageBalance,closingBalance,termDeposits,newDepositsOrRenewals\n' +
      'VIP-CORP-301,2026-01,USD,2450000,2480000,1000000,0\n' +
      'VIP-CORP-301,2026-02,USD,2510000,2530000,1000000,0\n' +
      'VIP-IND-401,2026-01,USD,1200000,1210000,800000,0\n';
  } else {
    filename = 'PCIS_قالب_المعاملات_الشهرية_القياسي.csv';
    content =
      'sourceCode,month,currency,inboundLocalVolume,inboundLocalCount,outboundLocalVolume,outboundLocalCount,inboundIntlVolume,inboundIntlCount,outboundIntlVolume,outboundIntlCount,feeRevenue\n' +
      'VIP-CORP-301,2026-01,USD,650000,35,520000,42,1400000,8,1200000,12,4200\n' +
      'VIP-IND-401,2026-01,USD,85000,12,60000,15,250000,3,180000,4,1100\n';
  }

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function translateTier(tier: Customer['currentTier']): string {
  switch (tier) {
    case 'strategic_tier1':
      return 'استراتيجي (Tier 1 A+)';
    case 'growth_opportunity':
      return 'فرصة نمو (Tier 2 A)';
    case 'relationship_reinforce':
      return 'تعزيز العلاقة (Tier 3 B)';
    case 'standard_vip':
      return 'خدمة اعتيادية محسنة (Tier 4 C)';
    case 'incomplete_evaluation':
      return 'تقييم غير مكتمل';
    default:
      return tier;
  }
}
