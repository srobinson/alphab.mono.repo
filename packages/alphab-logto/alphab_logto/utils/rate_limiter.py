import time
from collections import defaultdict
from typing import Dict, List, Optional


class RateLimiter:
    """
    Simple in-memory rate limiter.

    This class provides a basic rate limiting functionality to prevent
    abuse of API endpoints.
    """

    def __init__(self, requests_per_minute: int = 60):
        """
        Initialize the rate limiter.

        Args:
            requests_per_minute (int): Maximum number of requests allowed per minute.
        """
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, identifier: str) -> bool:
        """
        Check if the identifier is rate limited.

        Args:
            identifier (str): The identifier to check (usually an IP address).

        Returns:
            bool: True if the identifier is rate limited, False otherwise.
        """
        now = time.time()
        minute_ago = now - 60

        # Remove requests older than 1 minute
        self.requests[identifier] = [t for t in self.requests[identifier] if t > minute_ago]

        # Check if the number of requests in the last minute exceeds the limit
        if len(self.requests[identifier]) >= self.requests_per_minute:
            return True

        # Add the current request
        self.requests[identifier].append(now)
        return False

    def get_remaining_requests(self, identifier: str) -> int:
        """
        Get the number of remaining requests for the identifier.

        Args:
            identifier (str): The identifier to check (usually an IP address).

        Returns:
            int: The number of remaining requests.
        """
        now = time.time()
        minute_ago = now - 60

        # Remove requests older than 1 minute
        self.requests[identifier] = [t for t in self.requests[identifier] if t > minute_ago]

        # Calculate remaining requests
        return max(0, self.requests_per_minute - len(self.requests[identifier]))

    def reset(self, identifier: Optional[str] = None):
        """
        Reset the rate limiter for a specific identifier or all identifiers.

        Args:
            identifier (Optional[str]): The identifier to reset. If None, reset all.
        """
        if identifier is None:
            self.requests.clear()
        else:
            self.requests[identifier] = []
