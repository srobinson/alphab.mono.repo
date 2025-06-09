import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.core.auth import (
    AuthenticationError,
    CustomOAuth2PasswordBearer,
    RateLimiter,
    TokenData,
    TokenVerificationError,
    create_access_token,
    get_current_user,
    get_jwks,
    get_user_info,
    has_role,
    log_auth_event,
)
from app.core.config import settings
from fastapi import HTTPException, Request, status
from jose import jwt


# Test RateLimiter
def test_rate_limiter():
    # Create a rate limiter with a limit of 2 requests per minute
    limiter = RateLimiter(requests_per_minute=2)

    # First request should not be rate limited
    assert limiter.is_rate_limited("127.0.0.1") == False

    # Second request should not be rate limited
    assert limiter.is_rate_limited("127.0.0.1") == False

    # Third request should be rate limited
    assert limiter.is_rate_limited("127.0.0.1") == True

    # Different IP should not be rate limited
    assert limiter.is_rate_limited("192.168.1.1") == False


# Test CustomOAuth2PasswordBearer
@pytest.mark.asyncio
async def test_custom_oauth2_password_bearer():
    # Create an instance of CustomOAuth2PasswordBearer
    oauth2_scheme = CustomOAuth2PasswordBearer(tokenUrl="auth/token")

    # Create a mock request with OPTIONS method
    mock_request = MagicMock()
    mock_request.method = "OPTIONS"

    # Call the instance with the mock request
    result = await oauth2_scheme(mock_request)

    # The result should be None for OPTIONS requests
    assert result is None

    # Create a mock request with GET method but no Authorization header
    mock_request = MagicMock()
    mock_request.method = "GET"
    mock_request.headers = {}

    # Call the instance with the mock request and expect an exception
    with pytest.raises(HTTPException):
        await oauth2_scheme(mock_request)

    # Create a mock request with GET method and Authorization header but wrong scheme
    mock_request = MagicMock()
    mock_request.method = "GET"
    mock_request.headers = {"Authorization": "Basic dXNlcjpwYXNzd29yZA=="}

    # Call the instance with the mock request and expect an exception
    with pytest.raises(HTTPException):
        await oauth2_scheme(mock_request)

    # Create a mock request with GET method and Authorization header with Bearer scheme
    mock_request = MagicMock()
    mock_request.method = "GET"
    mock_request.headers = {"Authorization": "Bearer token123"}

    # Call the instance with the mock request
    result = await oauth2_scheme(mock_request)

    # The result should be the token
    assert result == "token123"


# Test JWKS caching
@pytest.mark.asyncio
async def test_jwks_caching():
    # Create a mock response with the expected data
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "keys": [
            {
                "kid": "test-kid",
                "kty": "RSA",
                "use": "sig",
                "n": "test-n",
                "e": "test-e",
            }
        ]
    }

    # Patch the http_client.get method to return our mock response
    with patch("app.core.auth.http_client.get", AsyncMock(return_value=mock_response)):
        # Call the function for the first time
        result1 = await get_jwks()

        # Call the function again
        result2 = await get_jwks()

        # Both results should be the same object (cached)
        assert result1 is result2


# Test get_user_info_from_logto
@pytest.mark.asyncio
async def test_get_user_info_from_logto_with_token():
    # Create a token
    token = "test-token"

    # Create mock user info
    mock_user_info = {
        "sub": "test-sub-from-userinfo",
        "name": "Test User From UserInfo",
        "email": "test-userinfo@example.com",
    }

    # Create a mock response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "User info response"
    mock_response.json = MagicMock(return_value=mock_user_info)

    # Create a mock for the async context manager
    async def mock_get(*args, **kwargs):
        return mock_response

    # Patch the http_client.get method
    with patch("app.core.auth.http_client.get", mock_get):
        # Call the function
        result = await get_user_info(token)

        # Check the result
        assert result is not None
        assert result["sub"] == "test-sub-from-userinfo"
        assert result["name"] == "Test User From UserInfo"
        assert result["email"] == "test-userinfo@example.com"


# Test get_user_info_from_logto
@pytest.mark.asyncio
async def test_get_user_info_from_logto():
    # Create user info data
    user_info_data = {
        "sub": "test-sub",
        "name": "Test User",
        "email": "test@example.com",
    }

    # Create a mock response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "User info response"

    # Create a mock for json() that returns a dictionary directly, not a coroutine
    mock_json = MagicMock(return_value=user_info_data)
    mock_response.json = mock_json

    # Create a mock for the async context manager
    async def mock_get(*args, **kwargs):
        return mock_response

    # Patch the http_client.get method
    with patch("app.core.auth.http_client.get", mock_get):
        # Call the function
        result = await get_user_info("test-token")

        # Check the result
        assert result is not None
        assert result["sub"] == "test-sub"
        assert result["name"] == "Test User"
        assert result["email"] == "test@example.com"


# Test get_current_user
@pytest.mark.asyncio
async def test_get_current_user():
    # Mock the get_user_info_from_logto function to return a known payload
    mock_payload = {
        "sub": "test-sub",
        "name": "Test User",
        "email": "test@example.com",
        "roles": ["admin", "user"],
        "exp": (datetime.utcnow() + timedelta(hours=1)).timestamp(),
    }

    with patch("app.core.auth.get_user_info_from_logto", AsyncMock(return_value=mock_payload)):
        # Call the function
        result = await get_current_user("test-token")

        # Check the result
        assert result is not None
        assert result.sub == "test-sub"
        assert "admin" in result.roles
        assert "user" in result.roles
        assert result.exp is not None


# Test has_role
@pytest.mark.asyncio
async def test_has_role():
    # Create a token data with admin role
    token_data = TokenData(sub="test-sub", roles=["admin", "user"])

    # Create a role checker for admin role
    role_checker = has_role(["admin"])

    # Call the role checker with the token data
    result = await role_checker(token_data)

    # The result should be the token data
    assert result is token_data

    # Create a role checker for editor role
    role_checker = has_role(["editor"])

    # Call the role checker with the token data and expect an exception
    with pytest.raises(AuthenticationError):
        await role_checker(token_data)

    # Create a role checker with no required roles
    role_checker = has_role([])

    # Call the role checker with the token data
    result = await role_checker(token_data)

    # The result should be the token data
    assert result is token_data


# Test create_access_token
@pytest.mark.asyncio
async def test_create_access_token():
    # Create a data dict
    data = {"sub": "test-sub", "name": "Test User"}

    # Call the function with no expires_delta
    token = await create_access_token(data)

    # Decode the token
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )

    # Check the payload
    assert payload["sub"] == "test-sub"
    assert payload["name"] == "Test User"
    assert "exp" in payload

    # Call the function with expires_delta
    token = await create_access_token(data, expires_delta=timedelta(minutes=30))

    # Decode the token
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )

    # Check the payload
    assert payload["sub"] == "test-sub"
    assert payload["name"] == "Test User"
    assert "exp" in payload


# Test log_auth_event
@pytest.mark.asyncio
async def test_log_auth_event():
    # Create a mock request
    mock_request = MagicMock()
    mock_request.client.host = "127.0.0.1"
    mock_request.headers = {"User-Agent": "Test User Agent"}

    # Call the function
    await log_auth_event(
        request=mock_request,
        event_type="login",
        user_id="test-user",
        success=True,
        details="Test login",
    )

    # No assertion needed as the function just prints the event


if __name__ == "__main__":
    pytest.main(["-xvs", __file__])
