import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
@pytest.mark.parametrize('method,path', [
    ('GET', '/api/v1/trust/blocks'),
    ('POST', '/api/v1/trust/blocks/2'),
    ('DELETE', '/api/v1/trust/blocks/2'),
])
async def test_user_blocking_endpoints_are_unavailable(method, path):
    async with AsyncClient(transport=ASGITransport(app=app), base_url='https://test') as client:
        response = await client.request(method, path)
        assert response.status_code == 404, response.text
