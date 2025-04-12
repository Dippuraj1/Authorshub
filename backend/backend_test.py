import pytest
import aiohttp
import asyncio
import os
from datetime import datetime
import json

# Get the backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')

class TestBookFormatter:
    @pytest.fixture(autouse=True)
    async def setup(self):
        self.base_url = BACKEND_URL
        self.session = aiohttp.ClientSession()
        self.test_users = {
            'free': {
                'email': f'free_user_{datetime.now().strftime("%Y%m%d%H%M%S")}@test.com',
                'password': 'TestPass123!'
            },
            'creator': {
                'email': f'creator_user_{datetime.now().strftime("%Y%m%d%H%M%S")}@test.com',
                'password': 'TestPass123!'
            },
            'business': {
                'email': f'business_user_{datetime.now().strftime("%Y%m%d%H%M%S")}@test.com',
                'password': 'TestPass123!'
            }
        }
        self.tokens = {}
        yield
        await self.session.close()

    async def register_user(self, email, password):
        """Register a new user"""
        url = f"{self.base_url}/api/register"
        data = {"email": email, "password": password}
        async with self.session.post(url, json=data) as response:
            return response.status, await response.json()

    async def login_user(self, email, password):
        """Login and get token"""
        url = f"{self.base_url}/api/token"
        data = {"username": email, "password": password}
        async with self.session.post(url, data=data) as response:
            return response.status, await response.json()

    async def upgrade_subscription(self, token, tier):
        """Upgrade user subscription"""
        url = f"{self.base_url}/api/subscription/upgrade"
        headers = {"Authorization": f"Bearer {token}"}
        async with self.session.put(url, json={"tier": tier}, headers=headers) as response:
            return response.status, await response.json()

    async def get_genres(self, token):
        """Get available genres"""
        url = f"{self.base_url}/api/genres"
        headers = {"Authorization": f"Bearer {token}"}
        async with self.session.get(url, headers=headers) as response:
            return response.status, await response.json()

    async def get_usage(self, token):
        """Get current usage"""
        url = f"{self.base_url}/api/usage/current"
        headers = {"Authorization": f"Bearer {token}"}
        async with self.session.get(url, headers=headers) as response:
            return response.status, await response.json()

    @pytest.mark.asyncio
    async def test_registration_and_login(self):
        """Test user registration and login flow"""
        print("\nTesting registration and login...")
        
        for tier, user_data in self.test_users.items():
            # Test registration
            status, response = await self.register_user(user_data['email'], user_data['password'])
            assert status == 200, f"Registration failed for {tier} user"
            print(f"✓ Registration successful for {tier} user")

            # Test login
            status, response = await self.login_user(user_data['email'], user_data['password'])
            assert status == 200, f"Login failed for {tier} user"
            assert 'access_token' in response, "No access token in response"
            self.tokens[tier] = response['access_token']
            print(f"✓ Login successful for {tier} user")

    @pytest.mark.asyncio
    async def test_subscription_tiers(self):
        """Test subscription tier functionality"""
        print("\nTesting subscription tiers...")
        
        # First register and login all users
        await self.test_registration_and_login()

        # Upgrade creator and business users
        for tier in ['creator', 'business']:
            status, response = await self.upgrade_subscription(self.tokens[tier], tier)
            assert status == 200, f"Failed to upgrade to {tier} tier"
            print(f"✓ Successfully upgraded to {tier} tier")

        # Test genre access for each tier
        for tier, token in self.tokens.items():
            status, genres = await self.get_genres(token)
            assert status == 200, f"Failed to get genres for {tier} tier"
            
            allowed_genres = [g for g in genres if g['allowed']]
            expected_count = {
                'free': 3,  # non_fiction, poetry, romance
                'creator': 10,  # all genres
                'business': 10  # all genres
            }
            
            assert len(allowed_genres) == expected_count[tier], \
                f"Incorrect number of allowed genres for {tier} tier"
            print(f"✓ Correct genre access for {tier} tier")

    @pytest.mark.asyncio
    async def test_usage_limits(self):
        """Test usage limits for different tiers"""
        print("\nTesting usage limits...")
        
        # Ensure we have logged in users
        if not self.tokens:
            await self.test_registration_and_login()

        # Check initial usage for each tier
        for tier, token in self.tokens.items():
            status, usage = await self.get_usage(token)
            assert status == 200, f"Failed to get usage for {tier} tier"
            
            expected_limits = {
                'free': 2,
                'creator': 10,
                'business': 50
            }
            
            assert usage['limit'] == expected_limits[tier], \
                f"Incorrect usage limit for {tier} tier"
            assert usage['current_usage'] == 0, \
                f"Initial usage should be 0 for {tier} tier"
            print(f"✓ Correct usage limits for {tier} tier")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])