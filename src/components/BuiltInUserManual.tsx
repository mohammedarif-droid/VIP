import React from 'react';
import {
  BookOpen,
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Target,
  FileSpreadsheet,
  Terminal,
} from 'lucide-react';

export const BuiltInUserManual: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl text-right">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              دليل التشغيل وقاموس البيانات والمنهجية المصرفية المعتمدة
            </h2>
            <p className="text-xs text-slate-400">
              منصة ذكاء وتقييم كبار العملاء — Private Client Intelligence & Prioritization Platform (PCIS)
            </p>
          </div>
        </div>
      </div>

      {/* Chapter 1: Platform Purpose & Core Banking Philosophy */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3 text-xs leading-relaxed text-slate-300">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>الفصل الأول: فلسفة المنصة وأهداف إدارة كبار العملاء (VIP Banking)</span>
        </h3>
        <p>
          صُممت هذه المنصة لتزويد مدير خدمة كبار العملاء (شركات وأفراد) بأداة ذكاء مصرفي استراتيجية تدير محفظة تتراوح بين 100 إلى 500 عميل نخبة. تنقل المنصة الإدارة من أسلوب رد الفعل التقليدي إلى <strong>الإدارة الاستباقية للمحافظ والعلاقات</strong>، من خلال الإجابة على الأسئلة الجوهرية:
        </p>
        <ul className="list-disc list-inside space-y-1 mr-2 text-slate-300">
          <li>ما هي القيمة الاقتصادية الحقيقية لكل عميل بالمقارنة مع تكلفة خدمته؟</li>
          <li>هل توجد مؤشرات مبكرة على تراجع نشاط العميل أو سحب ودائعه لتفادي تسربه استباقياً؟</li>
          <li>ما هي المنتجات المؤهلة التي يحتاجها العميل ولم يتم تفعيلها بعد (فرص البيع المتقاطع Cross-Selling)؟</li>
          <li>من هم العملاء الذين يستحقون الزيارات الميدانية أو المواد الدعائية ضمن الميزانية المعتمدة؟</li>
          <li>ما هو الدليل المالي الموثق الذي يمكن تقديمه للإدارة العليا لإثبات عائد جهود الإدارة خلال فترة تجربة 12 شهراً؟</li>
        </ul>
      </div>

      {/* Chapter 2: Data Dictionary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4 text-xs text-slate-300">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>الفصل الثاني: قاموس البيانات المصرفية القياسية (Data Dictionary)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">1. سجلات العملاء (customers):</div>
            <p className="text-[11px] text-slate-400">
              تحتوي على المعرف الفريد الداخلي (id)، رمز العميل المصرفي المستعار (sourceCode) للحفاظ على السرية، نوع العميل (شركات أو أفراد)، والقطاع الاقتصادي، ومدير العلاقة المسؤول، وتاريخ بدء العلاقة.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">2. الأرصدة الشهرية (monthly_balances):</div>
            <p className="text-[11px] text-slate-400">
              متوسط الرصيد الشهري (الناتج عن متوسط النقاط أو الأيام)، رصيد نهاية الشهر، والودائع لأجل. يُفصل بين العملات (دولار، ريال يمني، ريال سعودي) ولا يتم دمجها إلا بسعر تحويل موثق.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">3. حركات العمليات (monthly_transactions):</div>
            <p className="text-[11px] text-slate-400">
              عدد وحجم الحركات المحلية والدولية الواردة والصادرة، مع رسوم العمليات. يُمنع جمع الحركات والتحويلات كإيراد للبنك؛ فالتحويلات تدفقات نقدية وليست عائداً مصرفياً.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">4. الربحية الاقتصادية (customer_economics):</div>
            <p className="text-[11px] text-slate-400">
              صافي المساهمة الاقتصادية = الإيراد المنسوب - تكلفة تقديم الخدمة - التكاليف العامة الموزعة. في حال عدم توفرها، يعتمد النظام مؤشر "قيمة النشاط البديل" ولا يسميها ربحية.
            </p>
          </div>
        </div>
      </div>

      {/* Chapter 3: Four-Dimension Framework */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3 text-xs leading-relaxed text-slate-300">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>الفصل الثالث: محرك التقييم رباعي الأبعاد (A, G, R, E Framework)</span>
        </h3>
        <p>
          تُحسب الدرجة الاستراتيجية الكلية (0 إلى 100) وفق تركيبة الأوزان التالية:
        </p>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-center text-sm font-bold text-emerald-400 my-2">
          Strategic Score = 0.35 * A + 0.25 * G + 0.20 * R + 0.20 * E
        </div>
        <div className="space-y-2 mt-3">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <strong>البعد A (القيمة الاقتصادية - 35%):</strong> يُقاس بصافي المساهمة أو مؤشر قيمة النشاط (متوسط الأرصدة والرسوم) بعد تحويلها لوغاريتمياً لحساب الرتبة المئينية بدقة.
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <strong>البعد G (فرص النمو - 25%):</strong> يُقاس باتجاه نمو الأرصدة، عدد المنتجات المؤهلة غير المستخدمة (مثل الاعتمادات، الرواتب، ونقاط البيع)، وتاريخ التجاوب مع المبادرات السابقة.
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <strong>البعد R (استقرار العلاقة - 20%):</strong> يُقاس بمعامل تذبذب الأرصدة (CV) وعمر العلاقة واستمرارية النشاط بدون انقطاع.
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <strong>البعد E (التفاعل والخدمة - 20%):</strong> يُقاس بانتظام الزيارات، التفاعل الدوري، مع إعطاء وزن خاص للشكاوى المفتوحة والالتزامات المعلقة.
          </div>
        </div>
      </div>

      {/* Chapter 4: 12-Month Pilot Program Proof */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3 text-xs leading-relaxed text-slate-300">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <span>الفصل الرابع: خطة إثبات التحسن والعائد خلال فترة تجربة 12 شهراً</span>
        </h3>
        <p>
          لإثبات نجاح المنصة للإدارة العليا للبنك، يُوصى باتباع الخطوات التالية:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 mr-2">
          <li>
            <strong>تثبيت خط الأساس (Baseline):</strong> في الشهر الأول، يتم تسجيل توزيع درجات الأبعاد الأربعة ومتوسط أرصدة كبار العملاء وإجمالي إيرادات الرسوم.
          </li>
          <li>
            <strong>تنفيذ الزيارات الموجهة بالأولويات:</strong> توجيه مدراء العلاقات بناءً على مصفوفة الأولويات (Action Priority) بدلاً من الزيارات العشوائية.
          </li>
          <li>
            <strong>حصر إيرادات البيع المتقاطع (Cross-Selling):</strong> تسجيل أي منتج جديد يفتحه العميل (اعتماد مستندي، خطابات ضمان، رواتب) وربطه بالمبادرة.
          </li>
          <li>
            <strong>حساب العائد التجاري الصافي (ROI):</strong> في نهاية كل ربع سنة، يتم استخراج تقرير ROI ومقارنة التكلفة بالإيراد المنسوب.
          </li>
          <li>
            <strong>قياس معدل الاحتفاظ (Retention Rate):</strong> إثبات استقرار أرصدة كبار العملاء المستهدفين بمبادرات الحماية وانعدام حالات التسرب التام.
          </li>
        </ol>
      </div>
    </div>
  );
};
