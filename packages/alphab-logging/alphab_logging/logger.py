"""
Core logger module with structured logging capabilities.
"""

import logging
import sys
from enum import Enum
from pathlib import Path
from typing import Any, Optional, Union

import structlog
from rich import pretty
from rich.console import Console
from rich.logging import RichHandler

pretty.install()


class LogLevel(Enum):
    """Log level enumeration."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogFormat(Enum):
    """Log format enumeration."""

    JSON = "json"
    CONSOLE = "console"
    RICH = "rich"


class AlphabLogger:
    """
    Main logger class with structured logging capabilities.

    This class provides a flexible, structured logging interface that can be
    configured for different environments (development, production, testing).
    """

    def __init__(self, name: str = "alphab"):
        self.name = name
        self._logger = structlog.get_logger(name)
        self._configured = False

    def configure(
        self,
        level: Union[LogLevel, str] = LogLevel.INFO,
        format_type: LogFormat = LogFormat.RICH,
        output_file: Optional[Path] = None,
        include_timestamps: bool = True,
        include_caller_info: bool = False,
        colorize: bool = True,
    ) -> None:
        """
        Configure the logger with specified settings.

        Args:
            level: Logging level
            format_type: Output format (JSON, CONSOLE, RICH)
            output_file: Optional file path for logging output
            include_timestamps: Whether to include timestamps
            include_caller_info: Whether to include caller information
            colorize: Whether to colorize console output
        """
        if isinstance(level, str):
            level = LogLevel(level.upper())

        # Configure structlog
        processors = []

        if include_timestamps:
            processors.append(structlog.processors.TimeStamper(fmt="ISO"))

        if include_caller_info:
            processors.append(
                structlog.processors.CallsiteParameterAdder(
                    parameters=[
                        structlog.processors.CallsiteParameter.FILENAME,
                        structlog.processors.CallsiteParameter.LINENO,
                        structlog.processors.CallsiteParameter.FUNC_NAME,
                    ]
                )
            )

        processors.extend(
            [
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
            ]
        )

        # Configure output format
        if format_type == LogFormat.JSON:
            processors.append(structlog.processors.JSONRenderer())
        elif format_type == LogFormat.RICH:
            processors.append(structlog.dev.ConsoleRenderer(colors=colorize))
        else:  # CONSOLE
            processors.append(structlog.dev.ConsoleRenderer(colors=colorize))

        # Configure handlers
        handlers = []

        if format_type == LogFormat.RICH:
            console = Console(stderr=True)
            handlers.append(
                RichHandler(
                    console=console,
                    markup=True,
                    rich_tracebacks=True,
                    show_path=include_caller_info,
                    show_time=include_timestamps,
                )
            )
        else:
            handlers.append(logging.StreamHandler(sys.stdout))

        if output_file:
            output_file.parent.mkdir(parents=True, exist_ok=True)
            handlers.append(logging.FileHandler(str(output_file)))

        # Configure stdlib logging
        log_format = (
            "%(message)s"
            if format_type == LogFormat.RICH
            else "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        logging.basicConfig(
            level=getattr(logging, level.value),
            handlers=handlers,
            format=log_format,
        )

        # Configure structlog
        structlog.configure(
            processors=processors,
            wrapper_class=structlog.stdlib.BoundLogger,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )

        self._configured = True

    def debug(self, message: str, **kwargs: Any) -> None:
        """Log a debug message."""
        self._logger.debug(message, **kwargs)

    def info(self, message: str, **kwargs: Any) -> None:
        """Log an info message."""
        self._logger.info(message, **kwargs)

    def warning(self, message: str, **kwargs: Any) -> None:
        """Log a warning message."""
        self._logger.warning(message, **kwargs)

    def error(self, message: str, **kwargs: Any) -> None:
        """Log an error message."""
        self._logger.error(message, **kwargs)

    def critical(self, message: str, **kwargs: Any) -> None:
        """Log a critical message."""
        self._logger.critical(message, **kwargs)

    def exception(self, message: str, **kwargs: Any) -> None:
        """Log an exception with traceback."""
        self._logger.exception(message, **kwargs)

    def bind(self, **kwargs: Any) -> "AlphabLogger":
        """Bind additional context to the logger."""
        bound_logger = AlphabLogger(self.name)
        bound_logger._logger = self._logger.bind(**kwargs)
        bound_logger._configured = self._configured
        return bound_logger


# Global logger instance
_global_logger: Optional[AlphabLogger] = None


def get_logger(name: str = "alphab") -> AlphabLogger:
    """
    Get a logger instance.

    Args:
        name: Logger name

    Returns:
        AlphabLogger instance
    """
    global _global_logger

    if _global_logger is None or _global_logger.name != name:
        _global_logger = AlphabLogger(name)

    return _global_logger


def configure_logging(
    level: Union[LogLevel, str] = LogLevel.INFO,
    format_type: LogFormat = LogFormat.CONSOLE,
    output_file: Optional[Union[str, Path]] = None,
    **kwargs: Any,
) -> AlphabLogger:
    """
    Configure global logging settings.

    Args:
        level: Logging level
        format_type: Output format
        output_file: Optional output file path
        **kwargs: Additional configuration options

    Returns:
        Configured logger instance
    """
    logger = get_logger()

    file_path: Optional[Path] = None
    if output_file:
        if isinstance(output_file, str):
            file_path = Path(output_file)
        else:
            file_path = output_file

    logger.configure(level=level, format_type=format_type, output_file=file_path, **kwargs)

    return logger


def setup_development_logging(
    level: LogLevel = LogLevel.DEBUG,
    include_caller_info: bool = True,
) -> AlphabLogger:
    """
    Setup logging for development environment.

    Args:
        level: Logging level (default: DEBUG)
        include_caller_info: Whether to include caller info

    Returns:
        Configured logger
    """
    return configure_logging(
        level=level,
        format_type=LogFormat.RICH,
        include_timestamps=True,
        include_caller_info=include_caller_info,
        colorize=True,
    )


def setup_production_logging(
    level: LogLevel = LogLevel.INFO,
    output_file: Optional[Union[str, Path]] = None,
) -> AlphabLogger:
    """
    Setup logging for production environment.

    Args:
        level: Logging level (default: INFO)
        output_file: Optional log file path

    Returns:
        Configured logger
    """
    return configure_logging(
        level=level,
        format_type=LogFormat.JSON,
        output_file=output_file,
        include_timestamps=True,
        include_caller_info=False,
        colorize=False,
    )
