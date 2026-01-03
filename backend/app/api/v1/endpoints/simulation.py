from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SimulationParams(BaseModel):
    # Dynamic dict for parameters for now
    params: dict[str, float]

@router.post("/update")
async def update_simulation(params: SimulationParams):
    """
    Called when user moves sliders.
    """
    # In a full impl, this would re-run the 'Solver' validated against the 'Active Rule'
    # For now, we echo back valid state.
    return {
        "status": "updated",
        "new_state": params.params
    }
