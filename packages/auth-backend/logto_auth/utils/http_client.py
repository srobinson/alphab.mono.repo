from typing import Optional, Union

import httpx
from httpx import URL


async def create_http_client(
    timeout: float = 10.0,
    max_keepalive_connections: int = 5,
    max_connections: int = 10,
    base_url: Optional[Union[URL, str]] = None,
) -> httpx.AsyncClient:
    """
    Create an HTTP client with connection pooling.

    Args:
        timeout (float): Request timeout in seconds.
        max_keepalive_connections (int): Maximum number of keepalive connections.
        max_connections (int): Maximum number of connections.
        base_url (Optional[Union[URL, str]]): Base URL for all requests.

    Returns:
        httpx.AsyncClient: An async HTTP client with the specified configuration.
    """
    client_args = {
        "timeout": timeout,
        "limits": httpx.Limits(
            max_keepalive_connections=max_keepalive_connections,
            max_connections=max_connections,
        ),
    }

    # Only add base_url if it's not None
    if base_url is not None:
        client_args["base_url"] = base_url

    return httpx.AsyncClient(**client_args)


class HttpClientManager:
    """
    Manager for HTTP client lifecycle.

    This class helps manage the lifecycle of an HTTP client to ensure proper
    resource cleanup.
    """

    def __init__(self):
        self.client = None

    async def get_client(
        self,
        timeout: float = 10.0,
        max_keepalive_connections: int = 5,
        max_connections: int = 10,
        base_url: Optional[Union[URL, str]] = None,
    ) -> httpx.AsyncClient:
        """
        Get or create an HTTP client.

        Args:
            timeout (float): Request timeout in seconds.
            max_keepalive_connections (int): Maximum number of keepalive connections.
            max_connections (int): Maximum number of connections.
            base_url (Optional[Union[URL, str]]): Base URL for all requests.

        Returns:
            httpx.AsyncClient: An async HTTP client.
        """
        if self.client is None:
            self.client = await create_http_client(
                timeout=timeout,
                max_keepalive_connections=max_keepalive_connections,
                max_connections=max_connections,
                base_url=base_url,
            )
        return self.client

    async def close(self):
        """Close the HTTP client and release resources."""
        if self.client is not None:
            await self.client.aclose()
            self.client = None
