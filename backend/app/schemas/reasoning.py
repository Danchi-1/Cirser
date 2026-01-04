from typing import List, Optional, Any
from pydantic import BaseModel, Field

# --- Phase 1: Engineering Context ---
class ApplicabilityCheck(BaseModel):
    conditions_required: List[str]
    conditions_met: bool
    justification: str

class EngineeringContext(BaseModel):
    parameter_definition: str = Field(..., description="Formal definition of the parameter being solved")
    physical_interpretation: str = Field(..., description="Physical meaning of the definition")
    candidate_rules: List[str] = Field(..., description="List of Rule IDs considered")
    selected_rule_id: str = Field(..., description="The ID of the rule chosen for this step")
    rule_rejection_reasoning: str = Field(..., description="Why other rules were rejected")
    applicability_check: ApplicabilityCheck

# --- Phase 2: Symbolic Formulation ---
class SymbolicPlan(BaseModel):
    equation: str = Field(..., description="Symbolic equation (valid Python syntax)")
    variables: str = Field(..., description="Comma-separated variable assignments or 'EVAL' string")

# --- Phase 4: Final Response ---
class ReasoningStep(BaseModel):
    step: int
    phase: str
    thought: str
    equation: Optional[str] = None
    result: Optional[str] = None

class ReasoningResponse(BaseModel):
    status: str
    plan: Optional[dict] = None # Legacy support or final plan
    reasoning_steps: List[ReasoningStep] = []
    candidates: List[dict] = []
    final_answer: Optional[str] = None
