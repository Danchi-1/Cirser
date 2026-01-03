from pydantic import BaseModel
from typing import Dict, Any

class SimulationParams(BaseModel):
    params: Dict[str, float]

class SimulationState(BaseModel):
    nodes: list = []
    branches: list = []
    params: Dict[str, float] = {}
