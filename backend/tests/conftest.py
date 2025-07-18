import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test configuration
@pytest.fixture(scope="session")
def test_database_url():
    """Get the test database URL"""
    return os.getenv("DATABASE_URL", "postgresql://postgres:7358@localhost:5432/mynotes_db")

@pytest.fixture(scope="session")
def test_engine(test_database_url):
    """Create a test database engine"""
    engine = create_engine(test_database_url)
    return engine

@pytest.fixture(scope="session")
def test_session_factory(test_engine):
    """Create a test session factory"""
    return sessionmaker(bind=test_engine)

# Pytest configuration
def pytest_configure(config):
    """Configure pytest"""
    # Set test markers
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "unit: marks tests as unit tests")
    
    # Set test timeout
    config.option.timeout = 30