import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, Union

from fastapi import Request

# Configure logger
logger = logging.getLogger("logto_auth")


class LoggingService:
    """
    Service for logging authentication events.

    This service provides methods for logging authentication-related events
    for audit and debugging purposes.
    """

    def __init__(self, log_level: int = logging.INFO):
        """
        Initialize the logging service.

        Args:
            log_level (int): The logging level to use.
        """
        # Configure logger if not already configured
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(log_level)

    async def log_auth_event(
        self,
        request: Request,
        event_type: str,
        user_id: Optional[str] = None,
        success: bool = True,
        details: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Log an authentication event.

        Args:
            request (Request): The request object.
            event_type (str): The type of event (e.g., "signin").
            user_id (Optional[str]): The user ID associated with the event.
            success (bool): Whether the event was successful.
            details (Optional[str]): Additional details about the event.
            extra (Optional[Dict[str, Any]]): Extra information to include in the log.
        """
        # Create the event data
        event: Dict[str, Union[str, bool, None, Dict[str, Any]]] = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("User-Agent"),
            "success": success,
            "details": details,
        }

        # Add extra information if provided
        if extra:
            for key, value in extra.items():
                event[key] = value

        # Log the event with the appropriate level
        log_message = f"AUTH EVENT: {json.dumps(event, default=str)}"
        if success:
            logger.info(log_message)
        else:
            logger.error(log_message)

    def log_error(self, error: Exception, context: Optional[Dict[str, Any]] = None) -> None:
        """
        Log an error.

        Args:
            error (Exception): The error to log.
            context (Optional[Dict[str, Any]]): Additional context information.
        """
        error_data: Dict[str, Union[str, Dict[str, Any]]] = {
            "timestamp": datetime.utcnow().isoformat(),
            "error_type": type(error).__name__,
            "error_message": str(error),
        }

        # Add context if provided
        if context:
            error_data["context"] = context

        logger.error(f"AUTH ERROR: {json.dumps(error_data, default=str)}")

    def log_debug(self, message: str, data: Optional[Dict[str, Any]] = None) -> None:
        """
        Log a debug message.

        Args:
            message (str): The debug message.
            data (Optional[Dict[str, Any]]): Additional data to include.
        """
        debug_data: Dict[str, Union[str, Dict[str, Any]]] = {
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
        }

        # Add data if provided
        if data:
            debug_data["data"] = data

        logger.debug(f"AUTH DEBUG: {json.dumps(debug_data, default=str)}")
