import sys
import os

# Add backend to path
sys.path.append(os.path.abspath("backend"))

try:
    print("Attempting to import ReasoningEngine...")
    from app.services.reasoning.engine import engine
    print("SUCCESS: Engine imported.")
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
