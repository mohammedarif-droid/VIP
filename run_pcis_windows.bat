@echo off
chcp 65001 > nul
title منصة ذكاء وتقييم كبار العملاء المصرفيين - CAC Bank PCIS
color 0A

echo ===============================================================================
echo     منصة ذكاء وتقييم كبار العملاء المصرفيين (PCIS Platform v1.0)
echo     بنك التسليف التعاوني والزراعي - إدارة خدمة كبار العملاء (شركات وأفراد)
echo ===============================================================================
echo.

echo [1/3] التحقق من بيئة التشغيل المحلية...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [تنبيه] بايثون غير مثبت في مسار النظام PATH. جاري المحاولة باستخدام Node.js...
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [خطأ] يرجى تثبيت Python أو Node.js لتشغيل المنصة محلياً.
        pause
        exit /b 1
    )
    echo [2/3] تشغيل واجهة الويب المصرفية عبر Node.js...
    npm run dev
    goto end
)

echo [2/3] تشغيل اختبارات القبول الحتمية الإلزامية (Acceptance Tests)...
python -m unittest discover tests -v
if %errorlevel% neq 0 (
    echo [تنبيه] حدث خطأ في اختبارات التحقق.
    pause
)

echo.
echo [3/3] تشغيل خادم المنصة المحلي...
echo المنصة تعمل محلياً بنسبة 100%% دون أي اتصال خارجي.
echo يرجى فتح المتصفح على العنوان: http://localhost:3000
echo.

npm run dev

:end
pause
