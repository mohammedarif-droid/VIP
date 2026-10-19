"""
PCIS VIP Pipeline Testing & Defect-Hunting Acceptance Test Suite
Verifies all 10 pipeline test cases specified in the VIP system approval plan:
1. Normal pipeline
2. Missing document
3. Duplicate event
4. Failed stage (safe retry)
5. Status mismatch
6. Data consistency
7. Financial reconciliation
8. Pipeline recovery
9. Unauthorized transition
10. Audit trail
Plus defect guards: Negative amounts and Invalid LC status.
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from python_engine.pipeline_engine import ProcurementPipeline, ProcurementPipelineItem, PipelineStageError

# Official 18-month benchmark dataset for VIP Customer 1
SAMPLE_18M_DATA = [
    ("M01", "PI-2601", "PO-2601", "Opened", "BL-2601", 25000, 1800, 1200, "Delivered", 28, 25000, 25000),
    ("M02", "PI-2602", "PO-2602", "Opened", "BL-2602", 32000, 2200, 1500, "Delivered", 32, 32000, 30000),
    ("M03", "PI-2603", "PO-2603", "Settled", "BL-2603", 28000, 2000, 1300, "Delivered", 25, 28000, 30000),
    ("M04", "PI-2604", "PO-2604", "Opened", "BL-2604", 40000, 2800, 1800, "In Transit", 38, 40000, 35000),
    ("M05", "PI-2605", "PO-2605", "Settled", "BL-2605", 36000, 2500, 1600, "Delivered", 29, 36000, 40000),
    ("M06", "PI-2606", "PO-2606", "Opened", "BL-2606", 45000, 3000, 2000, "Delivered", 34, 45000, 42000),
    ("M07", "PI-2607", "PO-2607", "Settled", "BL-2607", 38000, 2600, 1700, "Delivered", 27, 38000, 42000),
    ("M08", "PI-2608", "PO-2608", "Opened", "BL-2608", 52000, 3500, 2300, "In Transit", 41, 52000, 48000),
    ("M09", "PI-2609", "PO-2609", "Settled", "BL-2609", 47000, 3200, 2100, "Delivered", 30, 47000, 51000),
    ("M10", "PI-2610", "PO-2610", "Opened", "BL-2610", 55000, 3700, 2400, "Delivered", 33, 55000, 52000),
    ("M11", "PI-2611", "PO-2611", "Settled", "BL-2611", 49000, 3300, 2200, "Delivered", 26, 49000, 55000),
    ("M12", "PI-2612", "PO-2612", "Opened", "BL-2612", 62000, 4200, 2800, "Delivered", 36, 62000, 58000),
    ("M13", "PI-2613", "PO-2613", "Settled", "BL-2613", 58000, 3900, 2500, "Delivered", 29, 58000, 62000),
    ("M14", "PI-2614", "PO-2614", "Opened", "BL-2614", 65000, 4400, 2900, "In Transit", 43, 65000, 60000),
    ("M15", "PI-2615", "PO-2615", "Settled", "BL-2615", 60000, 4100, 2700, "Delivered", 31, 60000, 65000),
    ("M16", "PI-2616", "PO-2616", "Opened", "BL-2616", 72000, 4900, 3200, "Delivered", 35, 72000, 68000),
    ("M17", "PI-2617", "PO-2617", "Settled", "BL-2617", 68000, 4600, 3000, "Delivered", 28, 68000, 72000),
    ("M18", "PI-2618", "PO-2618", "Opened", "BL-2618", 78000, 5300, 3500, "Delivered", 37, 78000, 75000),
]

class TestPipelineAndDefects(unittest.TestCase):

    def setUp(self):
        self.pipeline = ProcurementPipeline(customer_id="VIP-CORP-101")

    # 1. Normal Pipeline: 18 Months End-to-End Execution
    def test_01_normal_pipeline_18_months_reconciliation(self):
        """Verifies transaction moves through every stage and matches exact financial ledger."""
        for row in SAMPLE_18M_DATA:
            item = ProcurementPipelineItem(*row)
            success, msg = self.pipeline.add_transaction(item)
            self.assertTrue(success, f"Failed at {row[0]}: {msg}")

        totals = self.pipeline.get_totals()
        self.assertEqual(totals["count"], 18)
        self.assertEqual(totals["total_procurement"], 910000.00, "Total procurement value must equal $910,000")
        self.assertEqual(totals["total_payments"], 910000.00, "Total customer payments must equal $910,000")
        self.assertEqual(totals["closing_outstanding"], 3000.00, "Closing outstanding must equal $3,000")
        self.assertEqual(totals["total_freight"], 62000.00, "Total freight must equal $62,000")
        self.assertEqual(totals["total_customs"], 40700.00, "Total customs must equal $40,700")
        self.assertEqual(totals["delivered_count"], 15, "15 shipments delivered")
        self.assertAlmostEqual(totals["delivery_rate_percent"], 83.33, places=2)
        self.assertAlmostEqual(totals["avg_delivery_days"], 32.33, places=2)

    # 2. Defect Test: Missing Document (PI/PO or B/L)
    def test_02_missing_document_gate(self):
        """Pipeline must reject progression if mandatory documents (PI, PO, B/L) are missing."""
        # Missing PI
        item_no_pi = ProcurementPipelineItem("M19", "", "PO-999", "Opened", "BL-999", 10000, 500, 300, "In Transit", 30, 10000, 10000)
        with self.assertRaises(PipelineStageError) as ctx:
            self.pipeline.add_transaction(item_no_pi)
        self.assertIn("Missing document", str(ctx.exception))

        # Missing Bill of Lading
        item_no_bl = ProcurementPipelineItem("M19", "PI-999", "PO-999", "Opened", "", 10000, 500, 300, "In Transit", 30, 10000, 10000)
        with self.assertRaises(PipelineStageError) as ctx:
            self.pipeline.add_transaction(item_no_bl)
        self.assertIn("Bill of Lading", str(ctx.exception))

    # 3. Defect Test: Duplicate Event Prevention
    def test_03_duplicate_event_prevention(self):
        """Reprocessing an event must not duplicate payments or alter the cumulative ledger."""
        item = ProcurementPipelineItem(*SAMPLE_18M_DATA[0])
        success1, _ = self.pipeline.add_transaction(item)
        self.assertTrue(success1)
        initial_balance = self.pipeline.cumulative_outstanding

        # Attempt to reprocess duplicate M01
        success2, msg = self.pipeline.add_transaction(item)
        self.assertFalse(success2)
        self.assertIn("Duplicate", msg)
        self.assertEqual(self.pipeline.cumulative_outstanding, initial_balance, "Ledger balance must remain intact on duplicate attempt")
        self.assertEqual(len(self.pipeline.items), 1, "Duplicate item must not be appended")

    # 4. Defect Test: Failed Stage Logging and Safe Retry
    def test_04_failed_stage_logged_and_safely_retried(self):
        """Error is logged in audit trail and the transaction can be safely retried once corrected."""
        # Step A: Defective transaction (missing PO)
        defective_item = ProcurementPipelineItem(
            "M19", "PI-2619", "", "Opened", "BL-2619", 20000, 1000, 500, "In Transit", 30, 20000, 20000
        )
        success, error_msg = self.pipeline.try_process_transaction(defective_item, user="clerk_ali")
        self.assertFalse(success)
        self.assertIn("Missing document", error_msg)

        # Confirm failure was captured in audit trail
        failed_logs = [log for log in self.pipeline.audit_trail if log["action"] == "FAILED_STAGE_ERROR"]
        self.assertEqual(len(failed_logs), 1)
        self.assertIn("clerk_ali", failed_logs[0]["user"])
        self.assertEqual(len(self.pipeline.items), 0, "Failed transaction must not enter pipeline")

        # Step B: Safe Retry with corrected PO
        corrected_item = ProcurementPipelineItem(
            "M19", "PI-2619", "PO-2619", "Opened", "BL-2619", 20000, 1000, 500, "In Transit", 30, 20000, 20000
        )
        retry_success, retry_msg = self.pipeline.try_process_transaction(corrected_item, user="clerk_ali")
        self.assertTrue(retry_success)
        self.assertEqual(retry_msg, "Success")
        self.assertEqual(len(self.pipeline.items), 1, "Corrected transaction successfully recorded on retry")

    # 5. Defect Test: Status Mismatch (Cannot be Delivered without valid days)
    def test_05_status_mismatch_prevention(self):
        """Shipment cannot be marked Delivered with delivery days <= 0."""
        item_invalid = ProcurementPipelineItem(
            "M19", "PI-2619", "PO-2619", "Opened", "BL-2619", 20000, 1000, 500, "Delivered", 0, 20000, 20000
        )
        with self.assertRaises(PipelineStageError) as ctx:
            self.pipeline.add_transaction(item_invalid)
        self.assertIn("Status mismatch", str(ctx.exception))

    # 6. Data Consistency across Pipeline Stages
    def test_06_data_consistency_across_stages(self):
        """Ensures that PI, PO, LC, B/L, Customs, and Invoices remain correctly linked."""
        for row in SAMPLE_18M_DATA[:5]:
            self.pipeline.add_transaction(ProcurementPipelineItem(*row))

        item_m04 = self.pipeline.items[3]
        self.assertEqual(item_m04.month, "M04")
        self.assertEqual(item_m04.pi_number, "PI-2604")
        self.assertEqual(item_m04.po_number, "PO-2604")
        self.assertEqual(item_m04.bl_number, "BL-2604")
        self.assertEqual(item_m04.delivery_status, "In Transit")
        self.assertEqual(item_m04.closing_outstanding, 5000.0)

    # 7. Financial Reconciliation: Cumulative Outstanding Formula Verification
    def test_07_cumulative_outstanding_ledger_steps(self):
        """Tests that cumulative balance matches the 18-month ledger at each step."""
        for row in SAMPLE_18M_DATA:
            self.pipeline.add_transaction(ProcurementPipelineItem(*row))

        # Check key interim reconciliations:
        self.assertEqual(self.pipeline.items[0].closing_outstanding, 0.0)    # M01: 25k - 25k = 0
        self.assertEqual(self.pipeline.items[1].closing_outstanding, 2000.0) # M02: 0 + 32k - 30k = 2000
        self.assertEqual(self.pipeline.items[2].closing_outstanding, 0.0)    # M03: 2000 + 28k - 30k = 0
        self.assertEqual(self.pipeline.items[3].closing_outstanding, 5000.0) # M04: 0 + 40k - 35k = 5000
        self.assertEqual(self.pipeline.items[4].closing_outstanding, 1000.0) # M05: 5000 + 36k - 40k = 1000
        self.assertEqual(self.pipeline.items[5].closing_outstanding, 4000.0) # M06: 1000 + 45k - 42k = 4000
        self.assertEqual(self.pipeline.items[6].closing_outstanding, 0.0)    # M07: 4000 + 38k - 42k = 0
        self.assertEqual(self.pipeline.items[7].closing_outstanding, 4000.0) # M08: 0 + 52k - 48k = 4000
        self.assertEqual(self.pipeline.items[8].closing_outstanding, 0.0)    # M09: 4000 + 47k - 51k = 0
        self.assertEqual(self.pipeline.items[9].closing_outstanding, 3000.0) # M10: 0 + 55k - 52k = 3000
        self.assertEqual(self.pipeline.items[10].closing_outstanding, 0.0)   # M11: Settled with excess payment = 0
        self.assertEqual(self.pipeline.items[11].closing_outstanding, 4000.0)# M12: 0 + 62k - 58k = 4000
        self.assertEqual(self.pipeline.items[17].closing_outstanding, 3000.0)# Final M18: $3,000

    # 8. Pipeline Interruption and Recovery
    def test_08_pipeline_interruption_and_recovery(self):
        """Interrupted processing resumes without losing or duplicating transactions."""
        # Process first 9 months
        for row in SAMPLE_18M_DATA[:9]:
            self.pipeline.add_transaction(ProcurementPipelineItem(*row))
        mid_outstanding = self.pipeline.cumulative_outstanding
        self.assertEqual(mid_outstanding, 0.0)

        # Simulate interruption & resume from M10 to M18
        for row in SAMPLE_18M_DATA[9:]:
            self.pipeline.add_transaction(ProcurementPipelineItem(*row))

        totals = self.pipeline.get_totals()
        self.assertEqual(totals["closing_outstanding"], 3000.0)
        self.assertEqual(totals["total_procurement"], 910000.0)
        self.assertEqual(totals["count"], 18)

    # 9. Defect Test: Unauthorized Transition Prevention
    def test_09_unauthorized_stage_transition_blocked(self):
        """Users cannot bypass restricted stages, skip stages, or proceed without required documents."""
        # Attempt to skip from stage 1 (Quotation) directly to stage 5 (Customs)
        with self.assertRaises(PipelineStageError) as ctx:
            self.pipeline.authorize_stage_transition(
                month="M01",
                current_stage=1,
                target_stage=5,
                user_role="trade_finance_manager",
                has_documents=True
            )
        self.assertIn("Cannot bypass intermediate pipeline stages", str(ctx.exception))

        # Attempt transition without required documentation
        with self.assertRaises(PipelineStageError) as ctx2:
            self.pipeline.authorize_stage_transition(
                month="M01",
                current_stage=1,
                target_stage=2,
                user_role="trade_finance_manager",
                has_documents=False
            )
        self.assertIn("Missing mandatory documentation", str(ctx2.exception))

        # Attempt transition by unauthorized user role (e.g. guest or general_clerk)
        with self.assertRaises(PipelineStageError) as ctx3:
            self.pipeline.authorize_stage_transition(
                month="M01",
                current_stage=1,
                target_stage=2,
                user_role="general_guest",
                has_documents=True
            )
        self.assertIn("lacks approval authority", str(ctx3.exception))

        # Valid transition succeeds
        valid_res = self.pipeline.authorize_stage_transition(
            month="M01",
            current_stage=1,
            target_stage=2,
            user_role="trade_finance_manager",
            has_documents=True,
            user="manager_ahmed"
        )
        self.assertTrue(valid_res)

    # 10. Audit Trail Verification
    def test_10_audit_trail_logging(self):
        """Each status change records the relevant user, time, and action."""
        item = ProcurementPipelineItem(*SAMPLE_18M_DATA[0])
        self.pipeline.add_transaction(item, user="officer_ahmed")

        self.assertGreater(len(self.pipeline.audit_trail), 0)
        log = self.pipeline.audit_trail[0]
        self.assertEqual(log["user"], "officer_ahmed")
        self.assertEqual(log["action"], "TRANSACTION_SETTLED")
        self.assertIn("2026", log["timestamp"])

    # 11. Defect Test: Negative Amount and Corrupted Payment Prevention
    def test_11_negative_amount_defect_prevention(self):
        """Negative procurement values or payments must be rejected."""
        item_neg = ProcurementPipelineItem(
            "M19", "PI-2619", "PO-2619", "Opened", "BL-2619", -5000, 500, 300, "In Transit", 30, -5000, 0
        )
        with self.assertRaises(PipelineStageError):
            self.pipeline.add_transaction(item_neg)

        # Test negative payment rejection
        with self.assertRaises(ValueError):
            self.pipeline.record_payment("M01", -1000)

    # 12. Defect Test: Unauthorized / Invalid LC Status Prevention
    def test_12_invalid_lc_status_defect_prevention(self):
        """Pipeline must reject non-banking LC statuses."""
        item_bad_lc = ProcurementPipelineItem(
            "M19", "PI-2619", "PO-2619", "ArbitraryStatus", "BL-2619", 20000, 1000, 500, "In Transit", 30, 20000, 20000
        )
        with self.assertRaises(PipelineStageError) as ctx:
            self.pipeline.add_transaction(item_bad_lc)
        self.assertIn("Invalid LC status", str(ctx.exception))

if __name__ == '__main__':
    unittest.main()
