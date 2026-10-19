"""
PCIS Deterministic Banking Intelligence Engine (Python Reference Implementation)
Contains pure mathematical routines with zero external dependencies (standard library only).
"""

import math
from typing import List, Optional, Tuple, Dict, Any

def calculate_percentile_rank(values: List[float], target: float) -> Optional[float]:
    """
    Deterministic percentile rank:
    percentile_rank(x) = 100 * (rank_mid(x) - 1) / (n - 1)
    where rank_mid is average rank in case of ties (1-based ascending).
    If n < 2, returns None.
    If all values are identical, returns 50.0.
    """
    valid = [v for v in values if v is not None and not math.isnan(v)]
    n = len(valid)
    if n < 2:
        return None
    
    if min(valid) == max(valid):
        return 50.0
    
    sorted_vals = sorted(valid)
    indices = [i + 1 for i, v in enumerate(sorted_vals) if abs(v - target) < 1e-9]
    
    if indices:
        rank_mid = sum(indices) / len(indices)
    else:
        count_lesser = sum(1 for v in sorted_vals if v < target)
        rank_mid = count_lesser + 0.5
        
    p_rank = 100.0 * (rank_mid - 1.0) / (n - 1.0)
    return round(max(0.0, min(100.0, p_rank)), 2)

def calculate_log_percentile_rank(values: List[float], target: float) -> Optional[float]:
    """
    Applies log1p(x) after verifying x >= 0, then calculates percentile rank.
    """
    non_negative = [v for v in values if v is not None and v >= 0]
    if target < 0 or len(non_negative) < 2:
        return None
    log_vals = [math.log1p(v) for v in non_negative]
    log_target = math.log1p(target)
    return calculate_percentile_rank(log_vals, log_target)

def calculate_growth_rate(current_val: Optional[float], prev_val: Optional[float]) -> Tuple[Optional[float], str]:
    """
    Growth Rate = (current - prev) / prev
    Handles zero denominator strictly without throwing zero-division errors.
    """
    if prev_val is None or current_val is None:
        return (None, "UNCOMPUTABLE")
    
    if prev_val == 0:
        if current_val > 0:
            return (None, "NEW_ACTIVITY")
        elif current_val == 0:
            return (0.0, "VALID")
        else:
            return (None, "UNCOMPUTABLE")
            
    if prev_val > 0 and current_val == 0:
        return (-1.0, "CEASED_ACTIVITY")
        
    if prev_val < 0:
        return (None, "UNCOMPUTABLE")
        
    rate = (current_val - prev_val) / prev_val
    return (round(rate, 4), "VALID")

def calculate_balance_volatility(balances: List[float]) -> Optional[float]:
    """
    Balance Volatility (Coefficient of Variation) = StdDev / Mean
    Requires at least 3 points and positive mean.
    """
    valid = [b for b in balances if b is not None and b >= 0]
    n = len(valid)
    if n < 3:
        return None
    mean = sum(valid) / n
    if mean <= 0:
        return None
    variance = sum((b - mean) ** 2 for b in valid) / (n - 1)
    std_dev = math.sqrt(variance)
    return round(std_dev / mean, 4)

def calculate_net_contribution(
    revenue: Optional[float],
    service_costs: Optional[float],
    allocated_overhead: Optional[float]
) -> Optional[float]:
    """
    Net Contribution = Revenue - Service Costs - Overhead
    Does NOT mix deposit totals or transaction turnover as revenue!
    """
    if revenue is None or service_costs is None or allocated_overhead is None:
        return None
    return round(revenue - service_costs - allocated_overhead, 2)

def calculate_strategic_score(
    dim_a: Optional[float],
    dim_g: Optional[float],
    dim_r: Optional[float],
    dim_e: Optional[float],
    w_a: float = 0.35,
    w_g: float = 0.25,
    w_r: float = 0.20,
    w_e: float = 0.20,
) -> Optional[float]:
    """
    Strategic Score = 0.35*A + 0.25*G + 0.20*R + 0.20*E
    Rule: NEVER calculate complete score if any dimension is missing!
    Never substitute missing dimension with 0!
    """
    if None in (dim_a, dim_g, dim_r, dim_e):
        return None
    score = w_a * dim_a + w_g * dim_g + w_r * dim_r + w_e * dim_e
    return round(score, 2)

def calculate_action_priority(
    strategic_rel: float,
    need_fit: float,
    urgency: float,
    efficiency: float,
    has_urgent_complaint: bool = False,
    w_strat: float = 0.35,
    w_need: float = 0.30,
    w_urg: float = 0.20,
    w_eff: float = 0.15,
) -> Tuple[float, bool]:
    """
    Action Priority = 0.35*Strategic + 0.30*Need + 0.20*Urgency + 0.15*Efficiency
    If has_urgent_complaint is True, urgency overrides to priority 99.5!
    """
    if has_urgent_complaint:
        return (99.5, True)
    score = w_strat * strategic_rel + w_need * need_fit + w_urg * urgency + w_eff * efficiency
    return (round(score, 2), False)

def calculate_campaign_roi(
    incremental_benefit: Optional[float],
    cost: Optional[float]
) -> Optional[float]:
    """
    ROI = (Benefit - Cost) / Cost
    """
    if cost is None or cost <= 0 or incremental_benefit is None:
        return None
    roi = (incremental_benefit - cost) / cost
    return round(roi * 100.0, 2)
