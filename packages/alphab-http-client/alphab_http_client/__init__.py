"""
Alphab HTTP Client - Simple, elegant HTTP client for Python.

A lightweight, async HTTP client with connection pooling, proper error handling,
and clean API design following KISS principles.
"""

from .client import HttpClient, HttpError, create_client

__version__ = "0.1.0"
__author__ = "Alphab <info@alphab.dev>"

# Main exports - keep it simple
__all__ = [
    "HttpClient",
    "HttpError",
    "create_client",
]
