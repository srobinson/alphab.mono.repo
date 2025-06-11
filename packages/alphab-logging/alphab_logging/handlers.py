"""
Custom logging handlers for the alphab logging package.
"""

import logging
import sys
from pathlib import Path
from typing import Optional


class ConsoleHandler(logging.StreamHandler):
    """Enhanced console handler with color support."""

    def __init__(self, colorize: bool = True):
        super().__init__()
        self.colorize = colorize


class FileHandler(logging.FileHandler):
    """Enhanced file handler with automatic directory creation."""

    def __init__(self, filename: Path, mode: str = "a", encoding: Optional[str] = None):
        # Ensure directory exists
        filename.parent.mkdir(parents=True, exist_ok=True)
        super().__init__(str(filename), mode, encoding)


class JSONHandler(logging.Handler):
    """Handler that outputs JSON formatted log records."""

    def __init__(self, stream=None):
        super().__init__()
        self.stream = stream or sys.stderr

    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            self.stream.write(msg + "\n")
            self.stream.flush()
        except Exception:
            self.handleError(record)


class RichHandler(logging.Handler):
    """Handler using Rich for beautiful console output."""

    def __init__(self, console=None, show_time: bool = True, show_path: bool = False):
        super().__init__()
        self.console = console
        self.show_time = show_time
        self.show_path = show_path

    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            if self.console:
                self.console.print(msg)
            else:
                print(msg)
        except Exception:
            self.handleError(record)
