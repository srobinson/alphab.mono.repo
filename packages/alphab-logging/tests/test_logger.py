"""
Tests for the alphab_logging package.
"""


import pytest
from alphab_logging import (
    AlphabLogger,
    LogFormat,
    LogLevel,
    configure_logging,
    get_logger,
    setup_development_logging,
    setup_production_logging,
)


def test_get_logger():
    """Test basic logger creation."""
    logger = get_logger("test")
    assert isinstance(logger, AlphabLogger)
    assert logger.name == "test"


def test_logger_methods():
    """Test logger methods exist and can be called."""
    logger = get_logger("test")

    # These should not raise exceptions
    logger.debug("Debug message", extra_field="value")
    logger.info("Info message", user_id=123)
    logger.warning("Warning message")
    logger.error("Error message", error_code=500)
    logger.critical("Critical message")


def test_logger_binding():
    """Test logger context binding."""
    logger = get_logger("test")
    bound_logger = logger.bind(request_id="abc123", user_id=456)

    assert isinstance(bound_logger, AlphabLogger)
    # Should be able to log with bound context
    bound_logger.info("Test message with context")


def test_development_logging_setup():
    """Test development logging setup."""
    logger = setup_development_logging()
    assert isinstance(logger, AlphabLogger)

    # Should work with debug level
    logger.debug("Development debug message")


def test_production_logging_setup():
    """Test production logging setup."""
    logger = setup_production_logging()
    assert isinstance(logger, AlphabLogger)

    # Should work with info level
    logger.info("Production info message")


def test_custom_configuration():
    """Test custom logger configuration."""
    logger = configure_logging(
        level=LogLevel.WARNING,
        format_type=LogFormat.CONSOLE,
        include_timestamps=False,
        colorize=False,
    )

    assert isinstance(logger, AlphabLogger)
    logger.warning("Custom configured warning")


def test_log_levels():
    """Test log level enumeration."""
    assert LogLevel.DEBUG.value == "DEBUG"
    assert LogLevel.INFO.value == "INFO"
    assert LogLevel.WARNING.value == "WARNING"
    assert LogLevel.ERROR.value == "ERROR"
    assert LogLevel.CRITICAL.value == "CRITICAL"


def test_log_formats():
    """Test log format enumeration."""
    assert LogFormat.JSON.value == "json"
    assert LogFormat.CONSOLE.value == "console"
    assert LogFormat.RICH.value == "rich"


@pytest.mark.parametrize("level", [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING])
def test_different_log_levels(level):
    """Test logging with different levels."""
    logger = configure_logging(level=level)

    # Should not raise exceptions
    logger.debug("Debug")
    logger.info("Info")
    logger.warning("Warning")
    logger.error("Error")
    logger.critical("Critical")


@pytest.mark.parametrize("format_type", [LogFormat.JSON, LogFormat.CONSOLE, LogFormat.RICH])
def test_different_formats(format_type):
    """Test logging with different formats."""
    logger = configure_logging(format_type=format_type)

    # Should not raise exceptions
    logger.info("Test message", test_field="value")


def test_file_output_configuration(tmp_path):
    """Test file output configuration."""
    log_file = tmp_path / "test.log"

    logger = configure_logging(format_type=LogFormat.JSON, output_file=log_file)

    logger.info("Test file output", test=True)

    # File should be created
    assert log_file.exists()
