"""
Logging configuration utilities.

Simple, elegant logging setup that just works.
"""

import os
from pathlib import Path

from .logger import (
    AlphabLogger,
    LogFormat,
    LogLevel,
    configure_logging,
    get_logger,
    setup_development_logging,
    setup_production_logging,
)


def setup_logging(
    name: str = "app", level: LogLevel = LogLevel.INFO, log_file: Path | None = None
) -> AlphabLogger:
    """
    Simple logging setup - just works.

    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARN, ERROR)
        log_file: Optional log file path

    Returns:
        Configured logger instance
    """
    environment = os.getenv("ENVIRONMENT", "development").lower()
    log_format = os.getenv("LOG_FORMAT", "console").lower()

    if environment == "production":
        # Production: JSON logs
        file_path = log_file or Path("./logs/app.log")
        setup_production_logging(level=level, output_file=file_path)
    else:
        # Development: Choose format
        if log_format == "rich":
            setup_development_logging(level=level, include_caller_info=False)
        else:
            # Clean console (default - works great with turbo dev)
            configure_logging(
                level=level,
                format_type=LogFormat.CONSOLE,
                include_timestamps=True,
                include_caller_info=False,
                colorize=True,
            )

    return get_logger(name)


def create_logger(
    name: str, level: LogLevel | None = None, log_file: Path | None = None
) -> AlphabLogger:
    """
    Create a simple logger.

    Args:
        name: Logger name
        level: Optional log level override
        log_file: Optional log file override

    Returns:
        Logger instance
    """
    if level is not None or log_file is not None:
        # Custom setup
        return setup_logging(name=name, level=level or LogLevel.INFO, log_file=log_file)
    else:
        # Use existing configuration
        return get_logger(name)
