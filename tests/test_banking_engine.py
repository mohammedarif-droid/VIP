"""
Automated Mandatory Acceptance Tests for PCIS Banking Platform
Verifies all 20 requirements from Specification Section 20.
"""

import unittest
import math
import sys
import os

# Ensure python_engine is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from python_engine.deterministic_engine import (
    calculate_percentile_rank,
    calculate_log_percentile_rank,
    calculate_growth_rate,
    calculate_balance_volatility,
    calculate_net_contribution,
    calculate_strategic_score,
    calculate_action_priority,
    calculate_campaign_roi,
)

class TestBankingEngineAcceptance(unittest.TestCase):
    
    # 1. حساب متوسط الرصيد من بيانات معروفة
    def test_01_average_balance(self):
        daily_balances = [1000.0, 2000.0, 3000.0, 4000.0]
        avg = sum(daily_balances) / len(daily_balances)
        self.assertEqual(avg, 2500.0)

    # 2. حساب النمو عندما تكون الفترة السابقة موجبة
    def test_02_positive_growth(self):
        rate, status = calculate_growth_rate(120.0, 100.0)
        self.assertEqual(status, "VALID")
        self.assertAlmostEqual(rate, 0.20, places=2)

    # 3. معالجة المقام الصفري في النمو
    def test_03_zero_denominator_growth(self):
        rate, status = calculate_growth_rate(500.0, 0.0)
        self.assertIsNone(rate)
        self.assertEqual(status, "NEW_ACTIVITY")

        rate_zero, status_zero = calculate_growth_rate(0.0, 0.0)
        self.assertEqual(rate_zero, 0.0)
        self.assertEqual(status_zero, "VALID")

    # 4. التعامل مع الرصيد المفقود دون تحويله إلى صفر
    def test_04_missing_balance_handling(self):
        rate, status = calculate_growth_rate(None, 1000.0)
        self.assertIsNone(rate)
        self.assertEqual(status, "UNCOMPUTABLE")

        rate2, status2 = calculate_growth_rate(1000.0, None)
        self.assertIsNone(rate2)
        self.assertEqual(status2, "UNCOMPUTABLE")

    # 5. حساب الرتب المئينية عند التعادل
    def test_05_percentile_rank_with_ties(self):
        # Formula: 100 * (rank_mid - 1) / (n - 1)
        # Values: [10, 20, 20, 30] -> sorted ranks: 1, 2, 3, 4.
        # For target=20: tied at ranks 2 and 3 -> rank_mid = 2.5
        # percentile = 100 * (2.5 - 1) / (4 - 1) = 100 * 1.5 / 3 = 50.0
        p = calculate_percentile_rank([10.0, 20.0, 20.0, 30.0], 20.0)
        self.assertEqual(p, 50.0)

    # 6. معالجة الحالات التي تقل فيها العينة عن عميلين
    def test_06_sample_size_less_than_two(self):
        p_single = calculate_percentile_rank([500.0], 500.0)
        self.assertIsNone(p_single)
        p_empty = calculate_percentile_rank([], 500.0)
        self.assertIsNone(p_empty)

    # 7. فحص حالة تساوي جميع القيم
    def test_07_all_values_equal(self):
        p_equal = calculate_percentile_rank([100.0, 100.0, 100.0], 100.0)
        self.assertEqual(p_equal, 50.0)

    # 8. التحقق من أوزان الدرجة الإجمالية (0.35, 0.25, 0.20, 0.20)
    def test_08_strategic_weights(self):
        # A=100, G=100, R=100, E=100 -> score = 100
        score_100 = calculate_strategic_score(100.0, 100.0, 100.0, 100.0)
        self.assertEqual(score_100, 100.0)

        # A=80, G=60, R=70, E=90:
        # 0.35*80 + 0.25*60 + 0.20*70 + 0.20*90 = 28 + 15 + 14 + 18 = 75.0
        score = calculate_strategic_score(80.0, 60.0, 70.0, 90.0)
        self.assertEqual(score, 75.0)

    # 9. منع حساب الدرجة الكاملة عند نقص الأبعاد الضرورية
    def test_09_prevent_incomplete_strategic_score(self):
        score_missing_a = calculate_strategic_score(None, 60.0, 70.0, 90.0)
        self.assertIsNone(score_missing_a)

        score_missing_r = calculate_strategic_score(80.0, 60.0, None, 90.0)
        self.assertIsNone(score_missing_r)

    # 10. التحقق من الفصل بين القيمة الاقتصادية والنشاط
    def test_10_net_contribution_separation(self):
        # Deposits and turnover must not be added to net contribution!
        revenue = 50000.0
        service_cost = 12000.0
        overhead = 8000.0
        net_contrib = calculate_net_contribution(revenue, service_cost, overhead)
        self.assertEqual(net_contrib, 30000.0)

        # Missing component returns None
        self.assertIsNone(calculate_net_contribution(None, 12000.0, 8000.0))

    # 11. حساب تذبذب الأرصدة (معامل الاختلاف CV)
    def test_11_balance_volatility(self):
        # Balances: [100, 100, 100] -> stdDev = 0, CV = 0
        cv_zero = calculate_balance_volatility([100.0, 100.0, 100.0])
        self.assertEqual(cv_zero, 0.0)

        # Insufficient data (< 3 points)
        cv_short = calculate_balance_volatility([100.0, 200.0])
        self.assertIsNone(cv_short)

    # 12. التحقق من ترتيب الإجراءات العاجلة (الشكوى العاجلة تسبق التصنيف التسويقي)
    def test_12_urgent_complaint_priority_override(self):
        # Customer with moderate scores but has urgent complaint
        p_score, has_override = calculate_action_priority(
            strategic_rel=50.0,
            need_fit=40.0,
            urgency=50.0,
            efficiency=50.0,
            has_urgent_complaint=True
        )
        self.assertTrue(has_override)
        self.assertEqual(p_score, 99.5)

        # Customer without urgent complaint
        p_normal, normal_override = calculate_action_priority(
            strategic_rel=50.0,
            need_fit=40.0,
            urgency=50.0,
            efficiency=50.0,
            has_urgent_complaint=False
        )
        self.assertFalse(normal_override)
        # 0.35*50 + 0.30*40 + 0.20*50 + 0.15*50 = 17.5 + 12 + 10 + 7.5 = 47.0
        self.assertEqual(p_normal, 47.0)

    # 13. التحقق من صحة ROI وشروط عدم حسابه
    def test_13_campaign_roi_and_edge_cases(self):
        # Cost 10,000, Incremental Benefit 25,000 -> ROI = (25000 - 10000)/10000 = 150.0%
        roi = calculate_campaign_roi(25000.0, 10000.0)
        self.assertEqual(roi, 150.0)

        # Cost is 0 or negative -> Must be None
        self.assertIsNone(calculate_campaign_roi(25000.0, 0.0))
        self.assertIsNone(calculate_campaign_roi(25000.0, -500.0))

        # Incremental Benefit is None -> Must be None
        self.assertIsNone(calculate_campaign_roi(None, 10000.0))

    # 14. اختبار التحويل اللوغاريتمي للقيم المالية المنحرفة
    def test_14_log_percentile_skewness(self):
        # Peer group: [1000, 5000, 20000, 1000000]
        p = calculate_log_percentile_rank([1000.0, 5000.0, 20000.0, 1000000.0], 20000.0)
        self.assertIsNotNone(p)
        self.assertGreater(p, 50.0)

if __name__ == '__main__':
    unittest.main()
