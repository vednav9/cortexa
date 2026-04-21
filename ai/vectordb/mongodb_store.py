"""
Compatibility wrapper for MongoDB vector store imports.

The codebase currently uses vectordb.json_store as the active implementation,
which already writes chunks and embeddings to MongoDB dual collections:
- documentchunks
- embeddingstores

This module keeps legacy imports (`vectordb.mongodb_store`) working.
"""

from vectordb.json_store import JSONStore, get_json_store


def get_mongodb_store() -> JSONStore:
    """Return the active MongoDB-backed vector store instance."""
    return get_json_store()
