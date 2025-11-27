import sys
import os
sys.path.append(os.getcwd())

try:
    from app.core import security
    from app.api import deps
    from app.schemas import token, user
    from app.api.v1.endpoints import auth
    from app.api.v1.api import api_router
    print("Imports successful")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
