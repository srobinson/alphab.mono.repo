# Alphab HTTP Client

Simple, elegant HTTP client for Python with connection pooling and async support.

## Features

- 🚀 **Async/await support** with proper resource management
- 🔄 **Connection pooling** for better performance
- ⏰ **Configurable timeouts** and limits
- 🎯 **Clean error handling** with structured exceptions
- 📦 **KISS principle** - simple and easy to use

## Installation

```bash
pip install alphab-http-client
```

## Usage

```python
from alphab_http_client import HttpClient, create_client

# Simple usage
async with create_client("https://api.example.com") as client:
    data = await client.get_json("/users")

# Full client
client = HttpClient(
    base_url="https://api.example.com",
    timeout=30.0,
    headers={"Authorization": "Bearer token"}
)

try:
    response = await client.get("/users")
    users = response.json()
finally:
    await client.close()
```

## License

MIT
