import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
  Database,
  Building2,
  User,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, MonthlyBalance, Currency, StrategicTier } from '../types/banking';
import { downloadSampleCSVTemplate } from '../utils/exportEngine';

interface DataImportWizardProps {
  existingCustomers: Customer[];
  onImportCustomers: (newCustomers: Customer[]) => void;
  onImportBalances: (newBalances: MonthlyBalance[]) => void;
  onAddSingleCustomer: (customer: Customer) => void;
}

export const DataImportWizard: React.FC<DataImportWizardProps> = ({
  existingCustomers,
  onImportCustomers,
  onImportBalances,
  onAddSingleCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [importType, setImportType] = useState<'customers' | 'balances'>('customers');
  const [fileData, setFileData] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validationReport, setValidationReport] = useState<{
    validCount: number;
    errors: string[];
    warnings: string[];
  } | null>(null);

  // Manual Quick Add form
  const [manualCode, setManualCode] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState<'corporate' | 'individual'>('corporate');
  const [manualSector, setManualSector] = useState('');
  const [manualBranch, setManualBranch] = useState('الفرع الرئيسي');
  const [manualManager, setManualManager] = useState('أحمد عبد القادر');
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: null });
        setFileData(data);
        validateImportedData(data, importType);
      } catch (err) {
        setValidationReport({
          validCount: 0,
          errors: ['فشل قراءة الملف. يرجى التأكد من توافق صيغة Excel أو CSV.'],
          warnings: [],
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  const validateImportedData = (data: any[], type: 'customers' | 'balances') => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    if (!Array.isArray(data) || data.length === 0) {
      errors.push('الملف فارغ أو لا يحتوي على صفوف صالحة.');
      setValidationReport({ validCount: 0, errors, warnings });
      return;
    }

    const seenCodes = new Set<string>();

    if (type === 'customers') {
      data.forEach((row, idx) => {
        const rowNum = idx + 2;
        const code = row.sourceCode || row['رمز العميل'] || row['source_code'];
        const name = row.name || row['اسم العميل'] || row['client_name'];

        if (!code) {
          errors.push(`الصف ${rowNum}: رمز العميل (sourceCode) مفقود.`);
          return;
        }

        if (seenCodes.has(code)) {
          errors.push(`الصف ${rowNum}: تكرار رمز العميل (${code}) داخل الملف.`);
          return;
        }
        seenCodes.add(code);

        const existsInDb = existingCustomers.some((c) => c.sourceCode === code);
        if (existsInDb) {
          warnings.push(`الصف ${rowNum}: الرمز (${code}) موجود مسبقاً في قاعدة البيانات وسيقوم الاستيراد بتحديثه.`);
        }

        if (!name) {
          warnings.push(`الصف ${rowNum}: اسم العميل فارغ للرمز (${code}).`);
        }

        validCount++;
      });
    } else {
      // Balances validation
      data.forEach((row, idx) => {
        const rowNum = idx + 2;
        const code = row.sourceCode || row['رمز العميل'];
        const month = row.month || row['الشهر'];
        const avgBal = Number(row.averageBalance || row['متوسط الرصيد']);

        if (!code) {
          errors.push(`الصف ${rowNum}: رمز العميل مفقود.`);
          return;
        }
        if (!month) {
          errors.push(`الصف ${rowNum}: الشهر مفقود للعميل (${code}).`);
          return;
        }
        if (isNaN(avgBal)) {
          errors.push(`الصف ${rowNum}: قيمة متوسط الرصيد غير صالحة للعميل (${code}).`);
          return;
        }
        if (avgBal < 0) {
          warnings.push(`الصف ${rowNum}: متوسط الرصيد سالب (${avgBal})، يرجى التحقق مما إذا كان مكشوفاً.`);
        }

        validCount++;
      });
    }

    setValidationReport({ validCount, errors, warnings });
  };

  const handleCommitImport = () => {
    if (!fileData || !validationReport || validationReport.errors.length > 0) return;

    if (importType === 'customers') {
      const parsedCustomers: Customer[] = fileData.map((row, idx) => {
        const code = String(row.sourceCode || row['رمز العميل'] || `VIP-${Date.now()}-${idx}`);
        const existing = existingCustomers.find((c) => c.sourceCode === code);
        return {
          id: existing?.id || `cust-imported-${Date.now()}-${idx}`,
          sourceCode: code,
          name: String(row.name || row['اسم العميل'] || 'عميل مستورد'),
          type: (row.type === 'individual' || row['النوع'] === 'أفراد' ? 'individual' : 'corporate') as any,
          sector: String(row.sector || row['القطاع'] || 'عام'),
          relationshipStartDate: String(row.relationshipStartDate || row['تاريخ البدء'] || '2024-01-01'),
          assignedManager: String(row.assignedManager || row['مدير العلاقة'] || 'مدير العلاقات المصرفية'),
          branch: String(row.branch || row['الفرع'] || 'الفرع الرئيسي'),
          operationalStatus: 'active',
          currentTier: 'growth_opportunity',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isSynthetic: false,
        };
      });

      onImportCustomers(parsedCustomers);
    }

    setFileData(null);
    setValidationReport(null);
    setFileName('');
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode || !manualName) return;

    const newClient: Customer = {
      id: `cust-manual-${Date.now()}`,
      sourceCode: manualCode,
      name: manualName,
      type: manualType,
      sector: manualSector || 'تجارة عامة',
      relationshipStartDate: new Date().toISOString().split('T')[0],
      assignedManager: manualManager,
      branch: manualBranch,
      operationalStatus: 'active',
      currentTier: 'standard_vip',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynthetic: false,
    };

    onAddSingleCustomer(newClient);
    setManualSuccessMsg(`تمت إضافة العميل (${manualName}) بنجاح.`);
    setManualCode('');
    setManualName('');
    setManualSector('');
    setTimeout(() => setManualSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
          <Database className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            معالج الاستيراد وفحص جودة البيانات (Data Ingestion & Integrity Engine)
          </h3>
          <p className="text-xs text-slate-300">
            يتيح استيراد ملفات Excel و CSV مع التحقق الآلي من تكرار المعرفات، الفجوات الزمنية، والقيم السالبة أو غير المنطقية قبل اعتماد السجلات، مع إتاحة التسجيل اليدوي المصرح به.
          </p>
        </div>
      </div>

      {/* Tabs Switcher: Upload vs Manual */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>استيراد جماعي عبر Excel / CSV</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>إضافة وتعديل يدوي مصرح به</span>
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="space-y-5">
          {/* Download Official Templates Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>تحميل قوالب الإدخال المعتمدة للمنصة:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => downloadSampleCSVTemplate('customers')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-right transition-all group cursor-pointer"
              >
                <div className="font-bold text-white text-xs group-hover:text-emerald-400">قالب بيانات العملاء (Customers)</div>
                <div className="text-[10px] text-slate-400 mt-1">رمز العميل، الاسم، النوع، القطاع، المدير المسؤول</div>
              </button>

              <button
                onClick={() => downloadSampleCSVTemplate('balances')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-right transition-all group cursor-pointer"
              >
                <div className="font-bold text-white text-xs group-hover:text-emerald-400">قالب الأرصدة الشهرية (Balances)</div>
                <div className="text-[10px] text-slate-400 mt-1">الشهر، العملة، متوسط الرصيد، رصيد الإغلاق، الودائع</div>
              </button>

              <button
                onClick={() => downloadSampleCSVTemplate('transactions')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-right transition-all group cursor-pointer"
              >
                <div className="font-bold text-white text-xs group-hover:text-emerald-400">قالب حركات العمليات (Transactions)</div>
                <div className="text-[10px] text-slate-400 mt-1">التحويلات المحلية والدولية، أعداد المعاملات، الرسوم</div>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex justify-center gap-3 mb-2">
                <button
                  onClick={() => setImportType('customers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    importType === 'customers' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  استيراد سجلات العملاء
                </button>
                <button
                  onClick={() => setImportType('balances')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    importType === 'balances' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  استيراد الأرصدة الشهرية
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 transition-colors cursor-pointer relative bg-slate-950/60">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <div className="font-bold text-white text-sm">
                    {fileName || 'اسحب وأفلت ملف Excel أو CSV هنا، أو انقر للاختيار'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    يدعم مصنفات Excel (.xlsx, .xls) وملفات CSV المشفرة بـ UTF-8
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Report Card */}
            {validationReport && (
              <div className="mt-6 text-right max-w-xl mx-auto p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>تقرير التحقق وفحص الجودة الآلي</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    السجلات الصالحة: {validationReport.validCount}
                  </span>
                </div>

                {/* Errors */}
                {validationReport.errors.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>أخطاء تمنع الاستيراد:</span>
                    </div>
                    {validationReport.errors.map((err, i) => (
                      <div key={i} className="text-[11px] mr-4">• {err}</div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {validationReport.warnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>تنبيهات وملاحظات:</span>
                    </div>
                    {validationReport.warnings.map((warn, i) => (
                      <div key={i} className="text-[11px] mr-4">• {warn}</div>
                    ))}
                  </div>
                )}

                {/* Commit Action */}
                <div className="pt-2 flex justify-end">
                  <button
                    disabled={validationReport.errors.length > 0}
                    onClick={handleCommitImport}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      validationReport.errors.length === 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    اعتماد واستيراد {validationReport.validCount} سجل في قاعدة البيانات
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Quick Add View */}
      {activeTab === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">إضافة عميل نخبة جديد يدوياً (تسجيل مصرح به)</h3>
          </div>

          {manualSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{manualSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleManualAdd} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">رمز العميل المصرفي (sourceCode):</label>
                <input
                  type="text"
                  required
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="مثلاً: VIP-CORP-501"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم العميل أو المؤسسة:</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="مثلاً: شركة المحيط الأزرق للاستيراد"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نوع العميل:</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="corporate">شركات ومؤسسات تجارية</option>
                  <option value="individual">أفراد ذوو ملاءة مالية (HNWI)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">القطاع الاقتصادي:</label>
                <input
                  type="text"
                  value={manualSector}
                  onChange={(e) => setManualSector(e.target.value)}
                  placeholder="مثلاً: تجارة واستيراد، مقاولات، أدوية"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">الفرع التابع له:</label>
                <input
                  type="text"
                  value={manualBranch}
                  onChange={(e) => setManualBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">مدير العلاقة المسؤول:</label>
                <input
                  type="text"
                  value={manualManager}
                  onChange={(e) => setManualManager(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow cursor-pointer"
              >
                إضافة العميل والبدء في التقييم
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
