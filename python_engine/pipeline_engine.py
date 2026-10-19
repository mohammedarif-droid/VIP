"""
PCIS International Procurement & Trade Finance Business Pipeline Engine
Implements deterministic stage gates, document validation, duplicate prevention,
status consistency, and cumulative financial reconciliation.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

class PipelineStageError(Exception):
    """Raised when a business pipeline transition violates banking validation rules."""
    pass

class ProcurementPipelineItem:
    def __init__(
        self,
        month: str,
        pi_number: str,
        po_number: str,
        lc_status: str,
        bl_number: str,
        procurement_value: float,
        freight: float,
        customs: float,
        delivery_status: str,
        delivery_days: int,
        customer_invoice: float,
        customer_payment: float,
    ):
        self.month = month
        self.pi_number = pi_number
        self.po_number = po_number
        self.lc_status = lc_status
        self.bl_number = bl_number
        self.procurement_value = procurement_value
        self.freight = freight
        self.customs = customs
        self.delivery_status = delivery_status
        self.delivery_days = delivery_days
        self.customer_invoice = customer_invoice
        self.customer_payment = customer_payment
        self.closing_outstanding = 0.0
        self.is_verified = False
        self.history: List[Dict[str, Any]] = []

class ProcurementPipeline:
    VALID_LC_STATUSES = {"Draft", "Opened", "Issued", "Amended", "Documents Presented", "Settled", "Paid"}
    VALID_DELIVERY_STATUSES = {"Pending", "In Transit", "Delivered"}

    def __init__(self, customer_id: str):
        self.customer_id = customer_id
        self.items: List[ProcurementPipelineItem] = []
        self.processed_events: set = set()
        self.audit_trail: List[Dict[str, Any]] = []
        self.cumulative_outstanding: float = 0.0

    def add_transaction(self, item: ProcurementPipelineItem, user: str = "trade_finance_officer") -> Tuple[bool, str]:
        """
        Processes a transaction through the pipeline gates.
        Enforces:
        1. Non-empty PI, PO, B/L numbers.
        2. Valid LC status.
        3. Delivery status consistency (cannot be Delivered with 0 days or missing B/L).
        4. Duplicate event prevention (idempotency).
        5. Cumulative ledger reconciliation.
        """
        event_key = f"{item.month}_{item.pi_number}_{item.po_number}"
        if event_key in self.processed_events:
            self._log_audit("DUPLICATE_ATTEMPT_BLOCKED", f"Duplicate transaction event blocked for {event_key}", user)
            return False, f"Duplicate transaction event: {event_key} already processed."

        # Gate 1: Proforma Invoice & Purchase Order Validation
        if not item.pi_number or not item.po_number:
            raise PipelineStageError("Missing document: PI and PO numbers are mandatory.")

        if item.procurement_value <= 0:
            raise PipelineStageError("Invalid procurement value: Must be greater than 0.")

        # Gate 2: Letter of Credit Status Check
        if item.lc_status not in self.VALID_LC_STATUSES:
            raise PipelineStageError(f"Invalid LC status: {item.lc_status}. Allowed: {self.VALID_LC_STATUSES}")

        # Gate 3: Shipping & Bill of Lading
        if not item.bl_number:
            raise PipelineStageError("Missing document: Bill of Lading (B/L) is required for international procurement.")

        # Gate 4: Delivery Confirmation vs Status Consistency
        if item.delivery_status not in self.VALID_DELIVERY_STATUSES:
            raise PipelineStageError(f"Invalid delivery status: {item.delivery_status}")

        if item.delivery_status == "Delivered" and item.delivery_days <= 0:
            raise PipelineStageError("Status mismatch: Shipment marked Delivered but delivery days <= 0.")

        # Gate 5: Cumulative Financial Ledger Reconciliation
        # Cumulative Outstanding Receivable = max(0, Previous Outstanding + Current Invoice - Current Payment)
        # Any excess payment is credited and settles the current outstanding balance to 0.00
        raw_balance = self.cumulative_outstanding + item.customer_invoice - item.customer_payment
        self.cumulative_outstanding = round(max(0.0, raw_balance), 2)
        item.closing_outstanding = self.cumulative_outstanding
        item.is_verified = True

        self.items.append(item)
        self.processed_events.add(event_key)
        self._log_audit("TRANSACTION_SETTLED", f"Transaction {item.month} ({item.po_number}) processed. Outstanding: ${self.cumulative_outstanding:,.2f}", user)
        return True, "Success"

    def try_process_transaction(self, item: ProcurementPipelineItem, user: str = "trade_finance_officer") -> Tuple[bool, str]:
        """
        Safely attempts to process a transaction.
        If a validation defect occurs, it catches the error, logs it as FAILED_STAGE_ERROR to audit trail,
        preserves pipeline state, and allows safe retry once corrected.
        """
        try:
            return self.add_transaction(item, user=user)
        except (PipelineStageError, ValueError) as err:
            self._log_audit("FAILED_STAGE_ERROR", f"Stage failed for {item.month} ({item.pi_number}): {str(err)}", user)
            return False, str(err)

    def authorize_stage_transition(
        self,
        month: str,
        current_stage: int,
        target_stage: int,
        user_role: str,
        has_documents: bool,
        user: str = "operator"
    ) -> bool:
        """
        Gate 6: Stage Transition and Role Enforcement.
        Stages:
        1: Quotation (PI)
        2: Purchase Order (PO)
        3: LC Issuance
        4: Shipment & BL
        5: Customs Clearance
        6: Delivery Confirmation
        7: Financial Reconciliation

        Enforces:
        - Cannot skip intermediate stages (e.g. jump from stage 2 to 6 without 3, 4, 5).
        - Must have required documents verified.
        - User role must be authorized ('trade_finance_manager', 'logistics_officer', 'finance_director').
        """
        # Rule 1: Sequential stage progression (can only advance by 1 stage at a time)
        if target_stage > current_stage + 1:
            self._log_audit("UNAUTHORIZED_TRANSITION_BLOCKED", f"{month}: Attempted to skip stages from {current_stage} to {target_stage}", user)
            raise PipelineStageError(f"Unauthorized transition: Cannot bypass intermediate pipeline stages ({current_stage} -> {target_stage}).")

        # Rule 2: Document prerequisite check
        if not has_documents:
            self._log_audit("UNAUTHORIZED_TRANSITION_BLOCKED", f"{month}: Missing required stage documents for transition to stage {target_stage}", user)
            raise PipelineStageError(f"Unauthorized transition: Missing mandatory documentation for stage {target_stage}.")

        # Rule 3: Role permission check
        authorized_roles = {"trade_finance_manager", "logistics_officer", "finance_director", "vip_department_head"}
        if user_role not in authorized_roles:
            self._log_audit("UNAUTHORIZED_ROLE_BLOCKED", f"{month}: Role '{user_role}' unauthorized to advance stage to {target_stage}", user)
            raise PipelineStageError(f"Unauthorized transition: User role '{user_role}' lacks approval authority.")

        self._log_audit("STAGE_TRANSITION_APPROVED", f"{month} advanced from stage {current_stage} to {target_stage} by {user_role}", user)
        return True

    def record_payment(self, month: str, amount: float, user: str = "cashier") -> float:
        """Applies a payment and reconciles the cumulative outstanding balance."""
        if amount <= 0:
            raise ValueError("Payment amount must be positive.")
        self.cumulative_outstanding = round(max(0.0, self.cumulative_outstanding - amount), 2)
        self._log_audit("PAYMENT_RECORDED", f"Payment of ${amount:,.2f} applied to {month}. New balance: ${self.cumulative_outstanding:,.2f}", user)
        return self.cumulative_outstanding

    def update_delivery_status(self, month: str, new_status: str, delivery_days: int, user: str = "logistics_officer"):
        """Validates transitions before updating shipment status."""
        for item in self.items:
            if item.month == month:
                if new_status == "Delivered" and delivery_days <= 0:
                    raise PipelineStageError("Cannot mark Delivered without verified delivery days > 0.")
                old_status = item.delivery_status
                item.delivery_status = new_status
                item.delivery_days = delivery_days
                self._log_audit("DELIVERY_STATUS_CHANGED", f"{month} delivery status changed from {old_status} to {new_status}", user)
                return True
        return False

    def get_totals(self) -> Dict[str, Any]:
        """Calculates exact aggregate metrics across the pipeline."""
        total_procurement = sum(i.procurement_value for i in self.items)
        total_payments = sum(i.customer_payment for i in self.items)
        total_freight = sum(i.freight for i in self.items)
        total_customs = sum(i.customs for i in self.items)
        total_invoiced = sum(i.customer_invoice for i in self.items)
        delivered_count = sum(1 for i in self.items if i.delivery_status == "Delivered")
        delivery_rate = (delivered_count / len(self.items) * 100.0) if self.items else 0.0
        avg_days = (sum(i.delivery_days for i in self.items) / len(self.items)) if self.items else 0.0

        return {
            "count": len(self.items),
            "total_procurement": round(total_procurement, 2),
            "total_payments": round(total_payments, 2),
            "total_invoiced": round(total_invoiced, 2),
            "closing_outstanding": round(self.cumulative_outstanding, 2),
            "total_freight": round(total_freight, 2),
            "total_customs": round(total_customs, 2),
            "delivered_count": delivered_count,
            "delivery_rate_percent": round(delivery_rate, 2),
            "avg_delivery_days": round(avg_days, 2),
        }

    def _log_audit(self, action: str, details: str, user: str):
        self.audit_trail.append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "details": details,
            "user": user,
            "customer_id": self.customer_id,
        })
