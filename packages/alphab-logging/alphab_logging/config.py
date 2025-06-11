"""
Configuration classes for the alphab logging package.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from .logger import LogFormat, LogLevel


@dataclass
class LogConfig:
    """Configuration for a single logger."""

    name: str = "alphab"
    level: LogLevel = LogLevel.INFO
    format_type: LogFormat = LogFormat.RICH
    output_file: Optional[Path] = None
    include_timestamps: bool = True
    include_caller_info: bool = False
    colorize: bool = True


@dataclass
class LoggingConfig:
    """Global logging configuration."""

    default_level: LogLevel = LogLevel.INFO
    default_format: LogFormat = LogFormat.CONSOLE
    log_directory: Optional[Path] = None
    max_file_size_mb: int = 100
    backup_count: int = 5
    enable_console_output: bool = True
    enable_file_output: bool = False
    custom_formatters: Optional[Dict[str, Any]] = None

    def __post_init__(self) -> None:
        if self.custom_formatters is None:
            self.custom_formatters = {}

        if self.log_directory:
            self.log_directory.mkdir(parents=True, exist_ok=True)
