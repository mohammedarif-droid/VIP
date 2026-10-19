#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Private Client Intelligence & Strategic Prioritization Platform (PCIS)
Local CLI & Verification Script
"""

import os
import sys
import unittest

def run_tests():
    print("=" * 70)
    print("  تشغيل اختبارات القبول الحتمية الإلزامية (Section 20 Acceptance Tests)")
    print("=" * 70)
    loader = unittest.TestLoader()
    suite = loader.discover('tests')
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n[نجاح] اجتازت جميع الاختبارات الحتمية بنجاح 100%.")
    else:
        print("\n[تنبيه] هناك اختبارات لم تجتز التحقق.")

def print_banner():
    print("=" * 70)
    print("  منصة ذكاء وتقييم كبار العملاء المصرفيين (PCIS Platform v1.0)")
    print("  بنك التسليف التعاوني والزراعي - إدارة خدمة كبار العملاء")
    print("=" * 70)
    print("  الخيارات المتاحة:")
    print("  1. تشغيل اختبارات القبول الحتمية (Automated Acceptance Tests)")
    print("  2. تشغيل واجهة الويب المصرفية (Web Application on Port 3000)")
    print("  3. الخروج")
    print("=" * 70)

def main():
    print_banner()
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        run_tests()
        return

    choice = input("اختر رقم الإجراء [1-3]: ").strip()
    if choice == '1':
        run_tests()
    elif choice == '2':
        print("\nبدء تشغيل خادم المنصة المحلي عبر npm run dev...")
        os.system("npm run dev")
    else:
        print("إغلاق.")

if __name__ == '__main__':
    main()
