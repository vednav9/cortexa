"""
Entry point for Render deployment.
Reads PORT from environment variable (set by Render automatically).
"""
import os
import sys
from pathlib import Path

# Ensure this directory (ai/) is in sys.path so all packages resolve correctly
sys.path.insert(0, str(Path(__file__).parent))

import uvicorn

# Render sets the PORT environment variable automatically
port = int(os.environ.get("PORT", 8000))

print(f"Starting Cortexa AI server on port {port}...")

uvicorn.run(
    "api.main:app",
    host="0.0.0.0",
    port=port,
    timeout_keep_alive=300,
)
