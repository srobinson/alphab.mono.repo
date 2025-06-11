"""
Simple, elegant HTTP client for Python with connection pooling and async support.

Provides a clean interface for making HTTP requests with proper resource management,
timeouts, and error handling.
"""

from typing import Any

import httpx
from httpx import URL


class HttpError(Exception):
    """HTTP request error with status code and response details."""

    def __init__(self, message: str, status_code: int = 0, response_data: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_data = response_data


class HttpClient:
    """
    Simple HTTP client with connection pooling and proper resource management.

    Features:
    - Connection pooling for better performance
    - Automatic timeout handling
    - Structured error handling
    - Context manager support for proper cleanup
    - JSON request/response handling
    """

    def __init__(
        self,
        base_url: URL | str | None = None,
        timeout: float = 10.0,
        max_keepalive_connections: int = 5,
        max_connections: int = 10,
        headers: dict[str, str] | None = None,
    ):
        """
        Initialize HTTP client.

        Args:
            base_url: Base URL for all requests
            timeout: Request timeout in seconds
            max_keepalive_connections: Maximum number of keepalive connections
            max_connections: Maximum number of connections
            headers: Default headers for all requests
        """
        client_args = {
            "timeout": timeout,
            "limits": httpx.Limits(
                max_keepalive_connections=max_keepalive_connections,
                max_connections=max_connections,
            ),
            "headers": headers or {},
        }

        if base_url is not None:
            client_args["base_url"] = base_url

        self._client = httpx.AsyncClient(**client_args)

    async def __aenter__(self):
        """Context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit with proper cleanup."""
        await self.close()

    async def close(self):
        """Close the HTTP client and release resources."""
        if self._client:
            await self._client.aclose()

    async def request(
        self,
        method: str,
        url: str,
        *,
        json: Any = None,
        data: Any = None,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        timeout: float | None = None,
        **kwargs,
    ) -> httpx.Response:
        """
        Make an HTTP request.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            url: Request URL (relative to base_url if set)
            json: JSON data to send
            data: Form data to send
            params: URL query parameters
            headers: Request headers
            timeout: Request timeout override
            **kwargs: Additional arguments passed to httpx

        Returns:
            httpx.Response: The HTTP response

        Raises:
            HttpError: For HTTP errors or request failures
        """
        try:
            response = await self._client.request(
                method=method,
                url=url,
                json=json,
                data=data,
                params=params,
                headers=headers,
                timeout=timeout,
                **kwargs,
            )
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError as e:
            error_data = None
            try:
                error_data = e.response.json()
            except Exception:
                pass

            raise HttpError(
                message=f"HTTP {e.response.status_code}: {e.response.reason_phrase}",
                status_code=e.response.status_code,
                response_data=error_data,
            ) from e
        except httpx.TimeoutException as e:
            raise HttpError("Request timeout", status_code=408) from e
        except httpx.RequestError as e:
            raise HttpError(f"Request failed: {str(e)}") from e

    # Convenience methods
    async def get(self, url: str, **kwargs) -> httpx.Response:
        """Make a GET request."""
        return await self.request("GET", url, **kwargs)

    async def post(self, url: str, **kwargs) -> httpx.Response:
        """Make a POST request."""
        return await self.request("POST", url, **kwargs)

    async def put(self, url: str, **kwargs) -> httpx.Response:
        """Make a PUT request."""
        return await self.request("PUT", url, **kwargs)

    async def delete(self, url: str, **kwargs) -> httpx.Response:
        """Make a DELETE request."""
        return await self.request("DELETE", url, **kwargs)

    async def patch(self, url: str, **kwargs) -> httpx.Response:
        """Make a PATCH request."""
        return await self.request("PATCH", url, **kwargs)

    # JSON convenience methods
    async def get_json(self, url: str, **kwargs) -> Any:
        """Make a GET request and return JSON response."""
        response = await self.get(url, **kwargs)
        return response.json()

    async def post_json(self, url: str, data: Any = None, **kwargs) -> Any:
        """Make a POST request with JSON data and return JSON response."""
        response = await self.post(url, json=data, **kwargs)
        return response.json()

    async def put_json(self, url: str, data: Any = None, **kwargs) -> Any:
        """Make a PUT request with JSON data and return JSON response."""
        response = await self.put(url, json=data, **kwargs)
        return response.json()


# Convenience function for creating a client
def create_client(
    base_url: URL | str | None = None,
    timeout: float = 10.0,
    max_keepalive_connections: int = 5,
    max_connections: int = 10,
    headers: dict[str, str] | None = None,
) -> HttpClient:
    """
    Create an HTTP client with the specified configuration.

    This is a convenience function for simple use cases where you don't need
    the full flexibility of the HttpClient constructor.

    Args:
        base_url: Base URL for all requests
        timeout: Request timeout in seconds
        max_keepalive_connections: Maximum number of keepalive connections
        max_connections: Maximum number of connections
        headers: Default headers for all requests

    Returns:
        HttpClient: A configured HTTP client
    """
    return HttpClient(
        base_url=base_url,
        timeout=timeout,
        max_keepalive_connections=max_keepalive_connections,
        max_connections=max_connections,
        headers=headers,
    )
