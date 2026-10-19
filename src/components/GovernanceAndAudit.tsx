import React, { useState } from 'react';
import {
  ShieldCheck,
  History,
  Download,
  Upload,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { MethodologyConfig, AuditLogEntry } from '../types/banking';
import { StorageManager } from '../engine/storageManager';

interface GovernanceAndAuditProps {
  methodology: MethodologyConfig;
  onUpdateMethodology: (newConfig: MethodologyConfig) => void;
  auditLogs: AuditLogEntry[];
  onResetBenchmark: () => void;
  onRestoreBackup: (jsonContent: string) => boolean;
}

export const GovernanceAndAudit: React.FC<GovernanceAndAuditProps> = ({
  methodology,
  onUpdateMethodology,
  auditLogs,
  onResetBenchmark,
  onRestoreBackup,
}) => {
  const [activeSection, setActiveSection] = useState<'weights' | 'audit' | 'backup' | 'formulas'>('weights');

  // Weights edit state
  const [weightA, setWeightA] = useState(methodology.weightA);
  const [weightG, setWeightG] = useState(methodology.weightG);
  const [weightR, setWeightR] = useState(methodology.weightR);
  const [weightE, setWeightE] = useState(methodology.weightE);
  const [versionNote, setVersionNote] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const totalWeights = Number((weightA + weightG + weightR + weightE).toFixed(2));
  const isWeightValid = Math.abs(totalWeights - 1.0) < 0.001;

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) return;

    const newVersion: MethodologyConfig = {
      ...methodology,
      versionId: `PCIS-METH-V${(parseFloat(methodology.versionId.split('V')[1] || '1.0') + 0.1).toFixed(1)}`,
      effectiveDate: new Date().toISOString().split('T')[0],
      weightA,
      weightG,
      weightR,
      weightE,
    };

    onUpdateMethodology(newVersion);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = StorageManager.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PCIS_Banking_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = onRestoreBackup(content);
        if (success) {
          alert('تمت استعادة قاعدة البيانات والنسخة الاحتياطية بنجاح.');
        } else {
          alert('فشل استعادة النسخة الاحتياطية. تأكد من سلامة ملف JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Principle Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            حوكمة المنهجية، إدارة الأوزان، وسجل التدقيق (Auditability & Methodology Governance)
          </h3>
          <p className="text-xs text-slate-300">
            تخضع جميع عمليات النظام للتوثيق الصارم في سجل التدقيق غير القابل للتلاعب. ولا يغير النظام الأوزان تلقائياً؛ بل يتطلب أي تعديل اعتماداً إدارياً صريحاً لضمان إمكانية إعادة إنتاج التقييمات القديمة بأثر رجعي.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSection('weights')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'weights' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>إصدارات المنهجية والأوزان</span>
        </button>

        <button
          onClick={() => setActiveSection('audit')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'audit' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل التدقيق (Audit Trail)</span>
        </button>

        <button
          onClick={() => setActiveSection('backup')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'backup' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>النسخ الاحتياطي والاستعادة</span>
        </button>

        <button
          onClick={() => setActiveSection('formulas')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'formulas' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>توثيق المعادلات والرياضيات</span>
        </button>
      </div>

      {/* Section 1: Methodology & Weights */}
      {activeSection === 'weights' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">إصدار المنهجية النشط: {methodology.versionId}</h3>
              <p className="text-xs text-slate-400">تاريخ السريان: {methodology.effectiveDate} • المعتمد: {methodology.approvedBy}</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              إصدار رسمي
            </span>
          </div>

          {saveSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم اعتماد إصدار المنهجية الجديد وتوثيقه في سجل التدقيق بنجاح.</span>
            </div>
          )}

          <form onSubmit={handleSaveWeights} className="space-y-4 text-xs">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>وزن البعد A (القيمة الاقتصادية الحالية):</span>
                  <span className="font-mono text-emerald-400">{(weightA * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.60"
                  step="0.05"
                  value={weightA}
                  onChange={(e) => setWeightA(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>وزن البعد G (فرصة النمو والتوسع):</span>
                  <span className="font-mono text-emerald-400">{(weightG * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.50"
                  step="0.05"
                  value={weightG}
                  onChange={(e) => setWeightG(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>وزن البعد R (استقرار العلاقة والأرصدة):</span>
                  <span className="font-mono text-emerald-400">{(weightR * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.40"
                  step="0.05"
                  value={weightR}
                  onChange={(e) => setWeightR(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>وزن البعد E (التفاعل واحتياجات الخدمة والشكاوى):</span>
                  <span className="font-mono text-emerald-400">{(weightE * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.40"
                  step="0.05"
                  value={weightE}
                  onChange={(e) => setWeightE(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Total Validation */}
            <div className={`p-3 rounded-xl border flex items-center justify-between font-mono font-bold ${
              isWeightValid
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
            }`}>
              <span>إجمالي مجموع الأوزان (يجب أن يساوي 100%):</span>
              <span className="text-sm">{(totalWeights * 100).toFixed(0)}%</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={!isWeightValid}
                className={`px-5 py-2 rounded-xl font-bold transition-all shadow ${
                  isWeightValid
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                اعتماد إصدار المنهجية وتحديث التقييمات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 2: Audit Trail Log */}
      {activeSection === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>سجل التدقيق والعمليات (Audit Trail - {auditLogs.length} عملية موثقة)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">سجل حتمي محكم</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">التاريخ والوقت</th>
                  <th className="py-2.5 px-4">المستخدم المخوّل</th>
                  <th className="py-2.5 px-3 text-center">نوع الإجراء</th>
                  <th className="py-2.5 px-4">تفاصيل العملية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 text-slate-400">
                      {new Date(log.timestamp).toLocaleString('ar-YE')}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans">{log.userEmail}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.actionType === 'METHODOLOGY_CHANGE'
                          ? 'bg-purple-500/20 text-purple-300'
                          : log.actionType === 'IMPORT'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : log.actionType === 'BACKUP_RESTORE'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-200">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Backup & Restore */}
      {activeSection === 'backup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">النسخ الاحتياطي واستعادة البيانات محلياً</h3>
            <p className="text-xs text-slate-400">
              تُحفظ جميع السجلات محلياً بصورة كاملة دون أي اعتماد على خدمات سحابية خارجية أو إرسال بيانات العملاء إلى أطراف ثالثة.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export Backup Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 w-12 h-12 mx-auto flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <div className="font-bold text-white text-xs">تصدير نسخة احتياطية كاملة (JSON)</div>
              <p className="text-[11px] text-slate-400">
                يشمل كافة العملاء، الأرصدة، الحركات، الأنشطة، الميزانيات، وسجل التدقيق.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow"
              >
                تنزيل ملف النسخة الاحتياطية
              </button>
            </div>

            {/* Restore Backup Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 w-12 h-12 mx-auto flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-bold text-white text-xs">استعادة نسخة احتياطية سابقة</div>
              <p className="text-[11px] text-slate-400">
                اختر ملف JSON محفوظ سابقاً لاسترجاع حالة المحفظة وسجلاتها.
              </p>
              <label className="w-full block py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow">
                <span>تحديد ملف النسخة لاستعادتها</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Benchmark */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-300">إعادة ضبط البيانات إلى البيئة المعيارية الاصطناعية:</div>
              <div className="text-[10px] text-slate-500">يعيد تعيين حالات الاختبار والعملاء الـ 12 المعتمدين للتدقيق.</div>
            </div>
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من رغبتك في إعادة الضبط إلى البيانات المعيارية؟')) {
                  onResetBenchmark();
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-700"
            >
              إعادة تعيين المعيارية
            </button>
          </div>
        </div>
      )}

      {/* Section 4: Mathematical Equations Reference */}
      {activeSection === 'formulas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5 text-xs text-slate-300">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>المرجع الرياضي للمعادلات المنفذة حتمياً في النظام</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              تنفيذاً للبند الثاني: جميع الحسابات حتمية وقابلة للتدقيق بدون تدخل من نماذج الذكاء الاصطناعي التوليدي.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400">1. معادلة الرتبة المئينية الحتمية (Percentile Rank):</div>
              <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-white">
                percentile_rank(x) = 100 * (rank_mid(x) - 1) / (n - 1)
              </div>
              <p className="text-[11px] text-slate-400">
                حيث rank_mid هو متوسط الرتب عند التعادل، و n عدد القيم الصالحة (n &gt;= 2). وإذا تساوت كافة القيم، تكون الدرجة 50.0.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400">2. معدل تذبذب الأرصدة (Balance Volatility):</div>
              <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-white">
                CV = Standard Deviation(Balances) / Mean(Balances)
              </div>
              <p className="text-[11px] text-slate-400">
                يُحسب فقط عندما يكون المتوسط موجباً وتتوفر 3 أشهر صالحة على الأقل. ارتفاعه يعد مؤشراً سلبياً للاستقرار.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400">3. الدرجة الاستراتيجية الكلية (Strategic Score):</div>
              <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-white">
                Score = 0.35*A + 0.25*G + 0.20*R + 0.20*E
              </div>
              <p className="text-[11px] text-slate-400">
                قاعدة منع الحساب: لا تُحسب الدرجة إذا كان أحد الأبعاد مفقوداً أو غير صالح، ولا يُعوّض البعد الناقص بصفر مطلقاً.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400">4. أولوية الإجراء (Action Priority):</div>
              <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-white">
                Priority = 0.35*Strat + 0.30*Need + 0.20*Urgency + 0.15*Efficiency
              </div>
              <p className="text-[11px] text-slate-400">
                مستقلة عن الدرجة الاستراتيجية. والشكاوى العاجلة تتجاوز الترتيب التسويقي وتمنح درجة 99.5 فوراً.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400">5. صافي المساهمة الاقتصادية (Net Contribution):</div>
              <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-white">
                Net = Attributed Revenue - Service Costs - Allocated Overhead
              </div>
              <p className="text-[11px] text-slate-400">
                فصل صارم بين الإيرادات الفعلية وبين حركة الأرصدة والتحويلات؛ فالودائع ليست إيرادات.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400">6. العائد على الاستثمار للمبادرات (Campaign ROI):</div>
              <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-white">
                ROI = (Incremental Net Benefit - Campaign Cost) / Campaign Cost
              </div>
              <p className="text-[11px] text-slate-400">
                لا يُحسب ROI إذا كانت التكلفة صفراً أو الإيراد غير موثق بإسناد واضح.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
