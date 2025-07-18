import pytest
import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the parent directory to sys.path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database.connection import get_db, Base
from app.models.models import Folder, Note

# Load environment variables
load_dotenv()

# Create test database engine
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:7358@localhost:5432/mynotes_db")
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override the get_db dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def client():
    """Create a test client."""
    return TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="module")
def setup_database():
    """Set up test database tables."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

class TestRootEndpoints:
    """Test basic API endpoints."""
    
    def test_root_endpoint(self, client):
        """Test the root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "MyNotes API is running"}
    
    def test_health_check(self, client):
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

class TestFolderEndpoints:
    """Test folder API endpoints."""
    
    def test_get_folders_empty(self, client, setup_database):
        """Test getting folders when database is empty."""
        response = client.get("/api/folders/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_folder(self, client, setup_database):
        """Test creating a folder."""
        folder_data = {
            "name": "Test Folder",
            "icon": "📁",
            "parent_id": None
        }
        response = client.post("/api/folders/", json=folder_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Test Folder"
        assert data["icon"] == "📁"
        assert data["parent_id"] is None
        assert "id" in data
        assert "created_at" in data
    
    def test_get_folders_with_data(self, client, setup_database):
        """Test getting folders when data exists."""
        # Create a folder first
        folder_data = {"name": "Parent Folder", "icon": "📂"}
        response = client.post("/api/folders/", json=folder_data)
        assert response.status_code == 200
        
        # Now get all folders
        response = client.get("/api/folders/")
        assert response.status_code == 200
        
        folders = response.json()
        assert len(folders) == 1
        assert folders[0]["name"] == "Parent Folder"
    
    def test_get_folder_by_id(self, client, setup_database):
        """Test getting a specific folder by ID."""
        # Create a folder first
        folder_data = {"name": "Specific Folder", "icon": "📋"}
        response = client.post("/api/folders/", json=folder_data)
        folder_id = response.json()["id"]
        
        # Get the folder by ID
        response = client.get(f"/api/folders/{folder_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Specific Folder"
        assert data["id"] == folder_id
    
    def test_get_nonexistent_folder(self, client, setup_database):
        """Test getting a folder that doesn't exist."""
        response = client.get("/api/folders/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_update_folder(self, client, setup_database):
        """Test updating a folder."""
        # Create a folder first
        folder_data = {"name": "Original Name", "icon": "📁"}
        response = client.post("/api/folders/", json=folder_data)
        folder_id = response.json()["id"]
        
        # Update the folder
        update_data = {"name": "Updated Name", "icon": "📝"}
        response = client.put(f"/api/folders/{folder_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["icon"] == "📝"
        assert data["id"] == folder_id
    
    def test_delete_folder(self, client, setup_database):
        """Test deleting a folder."""
        # Create a folder first
        folder_data = {"name": "To Delete", "icon": "🗑️"}
        response = client.post("/api/folders/", json=folder_data)
        folder_id = response.json()["id"]
        
        # Delete the folder
        response = client.delete(f"/api/folders/{folder_id}")
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify it's deleted
        response = client.get(f"/api/folders/{folder_id}")
        assert response.status_code == 404
    
    def test_create_subfolder(self, client, setup_database):
        """Test creating a subfolder."""
        # Create parent folder
        parent_data = {"name": "Parent", "icon": "📂"}
        response = client.post("/api/folders/", json=parent_data)
        parent_id = response.json()["id"]
        
        # Create subfolder
        subfolder_data = {
            "name": "Subfolder",
            "icon": "📁",
            "parent_id": parent_id
        }
        response = client.post("/api/folders/", json=subfolder_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Subfolder"
        assert data["parent_id"] == parent_id

class TestNoteEndpoints:
    """Test note API endpoints."""
    
    def test_get_notes_empty(self, client, setup_database):
        """Test getting notes when database is empty."""
        response = client.get("/api/notes/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_note(self, client, setup_database):
        """Test creating a note."""
        note_data = {
            "title": "Test Note",
            "content": "This is a test note",
            "folder_id": None
        }
        response = client.post("/api/notes/", json=note_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Test Note"
        assert data["content"] == "This is a test note"
        assert data["folder_id"] is None
        assert data["is_deleted"] is False
        assert "id" in data
        assert "created_at" in data
    
    def test_get_notes_with_data(self, client, setup_database):
        """Test getting notes when data exists."""
        # Create a note first
        note_data = {"title": "Sample Note", "content": "Sample content"}
        response = client.post("/api/notes/", json=note_data)
        assert response.status_code == 200
        
        # Now get all notes
        response = client.get("/api/notes/")
        assert response.status_code == 200
        
        notes = response.json()
        assert len(notes) == 1
        assert notes[0]["title"] == "Sample Note"
    
    def test_get_note_by_id(self, client, setup_database):
        """Test getting a specific note by ID."""
        # Create a note first
        note_data = {"title": "Specific Note", "content": "Specific content"}
        response = client.post("/api/notes/", json=note_data)
        note_id = response.json()["id"]
        
        # Get the note by ID
        response = client.get(f"/api/notes/{note_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Specific Note"
        assert data["id"] == note_id
    
    def test_update_note(self, client, setup_database):
        """Test updating a note."""
        # Create a note first
        note_data = {"title": "Original Title", "content": "Original content"}
        response = client.post("/api/notes/", json=note_data)
        note_id = response.json()["id"]
        
        # Update the note
        update_data = {"title": "Updated Title", "content": "Updated content"}
        response = client.put(f"/api/notes/{note_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["content"] == "Updated content"
        assert data["id"] == note_id
    
    def test_delete_note(self, client, setup_database):
        """Test soft deleting a note."""
        # Create a note first
        note_data = {"title": "To Delete", "content": "Delete me"}
        response = client.post("/api/notes/", json=note_data)
        note_id = response.json()["id"]
        
        # Delete the note
        response = client.delete(f"/api/notes/{note_id}")
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify it's soft deleted (should return 404 when trying to get)
        response = client.get(f"/api/notes/{note_id}")
        assert response.status_code == 404
    
    def test_create_note_with_folder(self, client, setup_database):
        """Test creating a note in a folder."""
        # Create a folder first
        folder_data = {"name": "Notes Folder", "icon": "📝"}
        response = client.post("/api/folders/", json=folder_data)
        folder_id = response.json()["id"]
        
        # Create note in folder
        note_data = {
            "title": "Folder Note",
            "content": "Note in folder",
            "folder_id": folder_id
        }
        response = client.post("/api/notes/", json=note_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["folder_id"] == folder_id
    
    def test_get_notes_by_folder(self, client, setup_database):
        """Test getting notes filtered by folder."""
        # Create folder and notes
        folder_data = {"name": "Filter Test", "icon": "🔍"}
        response = client.post("/api/folders/", json=folder_data)
        folder_id = response.json()["id"]
        
        # Create notes in folder
        note1_data = {"title": "Note 1", "folder_id": folder_id}
        note2_data = {"title": "Note 2", "folder_id": folder_id}
        note3_data = {"title": "Note 3", "folder_id": None}  # Not in folder
        
        client.post("/api/notes/", json=note1_data)
        client.post("/api/notes/", json=note2_data)
        client.post("/api/notes/", json=note3_data)
        
        # Get notes by folder
        response = client.get(f"/api/notes/?folder_id={folder_id}")
        assert response.status_code == 200
        
        notes = response.json()
        assert len(notes) == 2
        assert all(note["folder_id"] == folder_id for note in notes)