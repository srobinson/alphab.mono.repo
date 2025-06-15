"""
Alphab Logging - A reusable logging package with structured logging capabilities.

This package provides a comprehensive logging solution with:
- Structured logging using structlog
- Multiple output formats (JSON, console, file)
- Rich console output with colors
- Easy configuration and setup
- Integration-ready for FastAPI, Django, and other frameworks
"""

from .config import LogConfig, LoggingConfig
from .formatters import ConsoleFormatter, JSONFormatter, StructuredFormatter
from .handlers import ConsoleHandler, FileHandler, JSONHandler, RichHandler
from .logger import (
    AlphabLogger,
    LogFormat,
    LogLevel,
    configure_logging,
    get_logger,
    setup_development_logging,
    setup_production_logging,
)
from .logging_config import create_logger, setup_logging

__version__ = "0.1.0"
__author__ = "Alphab <info@alphab.dev>"

# Main exports for easy importing
__all__ = [
    # Core logger
    "AlphabLogger",
    "get_logger",
    "create_logger",
    "setup_logging",
    "configure_logging",
    "setup_development_logging",
    "setup_production_logging",
    # Enums
    "LogLevel",
    "LogFormat",
    # Handlers
    "ConsoleHandler",
    "FileHandler",
    "JSONHandler",
    "RichHandler",
    # Formatters
    "JSONFormatter",
    "ConsoleFormatter",
    "StructuredFormatter",
    # Configuration
    "LogConfig",
    "LoggingConfig",
]
