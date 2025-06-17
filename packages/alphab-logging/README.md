# Alphab Logging

A reusable Python logging package with structured logging, multiple handlers, and easy configuration.

## Features

- **Structured Logging**: Built on structlog for consistent, searchable logs
- **Multiple Formats**: JSON, console, and rich terminal output
- **Easy Configuration**: Simple setup for development and production
- **Rich Terminal Output**: Beautiful colored logs with Rich library
- **Type Safety**: Full type hints for better development experience
- **Flexible Handlers**: Console, file, and JSON output options

## Installation

```bash
# In your project
pip install alphab-logging

# For development
poetry install
```

## Quick Start

### Development Logging (Rich Console Output)

```python
from alphab_logging import setup_development_logging

logger = setup_development_logging()
logger.info("Hello, world!", user_id=123, action="login")
```

### Production Logging (JSON Output)

```python
from alphab_logging import setup_production_logging

logger = setup_production_logging(
    level="INFO",
    output_file="/var/log/myapp.log"
)
logger.error("Database connection failed", error_code=500, db_host="localhost")
```

### Custom Configuration

```python
from alphab_logging import configure_logging, LogLevel, LogFormat

logger = configure_logging(
    level=LogLevel.DEBUG,
    format_type=LogFormat.JSON,
    include_timestamps=True,
    include_caller_info=True,
    colorize=False
)

logger.warning("Custom configured logger", component="auth", request_id="abc123")
```

## Configuration Options

### Log Levels

- `DEBUG`
- `INFO`
- `WARNING`
- `ERROR`
- `CRITICAL`

### Output Formats

- `CONSOLE`: Simple console output with optional colors
- `RICH`: Beautiful terminal output with Rich library
- `JSON`: Structured JSON logs for production

### Example Outputs

**Rich Console (Development):**

```
2024-01-15 10:30:45 | INFO | User login successful user_id=123 session_id=abc456
```

**JSON (Production):**

```json
{
  "timestamp": "2024-01-15T10:30:45.123456",
  "level": "INFO",
  "logger": "alphab",
  "message": "User login successful",
  "user_id": 123,
  "session_id": "abc456",
  "module": "auth",
  "function": "login",
  "line": 42
}
```

## Advanced Usage

### Context Binding

```python
from alphab_logging import get_logger

logger = get_logger("myapp")

# Bind context for all subsequent log messages
request_logger = logger.bind(request_id="req123", user_id=456)
request_logger.info("Processing request")
request_logger.error("Request failed", error="timeout")
```

### Custom Configuration

```python
from alphab_logging import LogConfig, AlphabLogger
from pathlib import Path

config = LogConfig(
    name="myservice",
    level=LogLevel.INFO,
    format_type=LogFormat.JSON,
    output_file=Path("/var/log/myservice.log"),
    include_timestamps=True,
    include_caller_info=False,
    colorize=False
)

logger = AlphabLogger(config.name)
logger.configure(**config.__dict__)
```

## Integration Examples

### FastAPI Integration

```python
from fastapi import FastAPI
from alphab_logging import setup_production_logging

app = FastAPI()
logger = setup_production_logging()

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info("Request started",
                method=request.method,
                url=str(request.url))

    response = await call_next(request)

    logger.info("Request completed",
                status_code=response.status_code)
    return response
```

### Replace Existing Loggers

```python
# Replace console.log statements
from alphab_logging import get_logger

logger = get_logger()

# Instead of: console.error("Error:", error)
logger.error("Error occurred", error=str(error), traceback=traceback.format_exc())

# Instead of: console.log("User action", user_id)
logger.info("User action performed", user_id=user_id, action="click")
```

## Development

```bash
# Setup
poetry install

# Format code
poetry run black .

# Type checking
poetry run mypy alphab_logging

# Run tests
poetry run pytest

# Run tests with coverage
poetry run pytest --cov=alphab_logging --cov-report=html
```

## License

MIT License - see LICENSE file for details.
