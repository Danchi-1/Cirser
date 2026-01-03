from pydantic import BaseModel, Field
from typing import List, Optional

# --- Rule Schemas ---
class RuleSource(BaseModel):
    title: str
    author: Optional[str] = None
    section: Optional[str] = None
    page: Optional[str] = None

class RuleBase(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    domain: str
    formal_definition: str
    applicability_conditions: List[str]
    governing_equations: List[str]
    constraints: List[str]
    source: RuleSource
    embedding_text: Optional[str] = None 

    class Config:
        from_attributes = True

class Rule(RuleBase):
    pass

class RuleSearchResult(BaseModel):
    rule: Rule
    similarity_score: float
