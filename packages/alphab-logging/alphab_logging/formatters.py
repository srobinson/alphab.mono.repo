"""
Custom logging formatters for the alphab logging package.
"""

import json
import logging


class JSONFormatter(logging.Formatter):
    """Formatter that outputs structured JSON logs."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in [
                "name",
                "msg",
                "args",
                "levelname",
                "levelno",
                "pathname",
                "filename",
                "module",
                "lineno",
                "funcName",
                "created",
                "msecs",
                "relativeCreated",
                "thread",
                "threadName",
                "processName",
                "process",
                "getMessage",
                "exc_info",
                "exc_text",
                "stack_info",
            ]:
                log_data[key] = value

        return json.dumps(log_data, default=str)


class ConsoleFormatter(logging.Formatter):
    """Enhanced console formatter with colors."""

    # Color codes
    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def __init__(self, colorize: bool = True, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.colorize = colorize

    def format(self, record: logging.LogRecord) -> str:
        if self.colorize and record.levelname in self.COLORS:
            # Add color to level name
            original_levelname = record.levelname
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{self.RESET}"

            formatted = super().format(record)

            # Restore original level name
            record.levelname = original_levelname
            return formatted
        else:
            return super().format(record)


class StructuredFormatter(logging.Formatter):
    """Formatter for structured logging with key-value pairs."""

    def format(self, record: logging.LogRecord) -> str:
        # Base format
        formatted = super().format(record)

        # Add structured data
        extras = []
        for key, value in record.__dict__.items():
            if key not in [
                "name",
                "msg",
                "args",
                "levelname",
                "levelno",
                "pathname",
                "filename",
                "module",
                "lineno",
                "funcName",
                "created",
                "msecs",
                "relativeCreated",
                "thread",
                "threadName",
                "processName",
                "process",
                "getMessage",
                "exc_info",
                "exc_text",
                "stack_info",
            ]:
                extras.append(f"{key}={value}")

        if extras:
            formatted += f" | {' '.join(extras)}"

        return formatted
