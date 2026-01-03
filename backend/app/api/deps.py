# Temporary mock for initial build
from typing import Generator

def get_db() -> Generator:
    try:
        yield None
    finally:
        pass
