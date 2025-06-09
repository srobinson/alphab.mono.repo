import pytest
from app.core.auth import get_jwks, get_user_info


@pytest.mark.asyncio
async def test_auth_functions_exist():
    """Simple test to verify that the auth functions exist and are callable."""
    assert callable(get_jwks)
    assert callable(get_user_info)


if __name__ == "__main__":
    pytest.main(["-xvs", __file__])
