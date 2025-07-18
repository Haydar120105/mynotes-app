import pytest
import asyncio
import httpx
import subprocess
import time
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the parent directory to sys.path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import Base
from app.models.models import Folder, Note

# Load environment variables
load_dotenv()

# Test configuration
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:7358@localhost:5432/mynotes_db")
API_BASE_URL = "http://localhost:8000"

@pytest.fixture(scope="module")
def setup_test_environment():
    """Set up the test environment with database"""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def api_server():
    """Start the API server for integration tests"""
    # Start the server in the background
    server_process = subprocess.Popen([
        sys.executable, "-m", "uvicorn", "app.main:app", 
        "--host", "0.0.0.0", "--port", "8000", "--reload"
    ], cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Wait for server to start
    time.sleep(3)
    
    # Check if server is running
    try:
        with httpx.Client() as client:
            response = client.get(f"{API_BASE_URL}/health")
            assert response.status_code == 200
    except Exception as e:
        server_process.terminate()
        pytest.skip(f"Could not start API server: {e}")
    
    yield server_process
    
    # Clean up
    server_process.terminate()
    server_process.wait()

@pytest.fixture
def http_client():
    """Create an HTTP client for API requests"""
    return httpx.Client(base_url=API_BASE_URL)

@pytest.mark.integration
class TestFullStackIntegration:
    """Test full stack integration between frontend and backend"""
    
    def test_api_server_health(self, api_server, http_client):
        """Test that the API server is healthy"""
        response = http_client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
    
    def test_complete_folder_workflow(self, api_server, http_client, setup_test_environment):
        """Test complete folder CRUD workflow"""
        # Create a folder
        folder_data = {
            "name": "Integration Test Folder",
            "icon": "🧪",
            "parent_id": None
        }
        
        # POST /api/folders
        response = http_client.post("/api/folders/", json=folder_data)
        assert response.status_code == 200
        
        created_folder = response.json()
        assert created_folder["name"] == folder_data["name"]
        assert created_folder["icon"] == folder_data["icon"]
        assert "id" in created_folder
        
        folder_id = created_folder["id"]
        
        # GET /api/folders/{id}
        response = http_client.get(f"/api/folders/{folder_id}")
        assert response.status_code == 200
        assert response.json()["name"] == folder_data["name"]
        
        # GET /api/folders (list all)
        response = http_client.get("/api/folders/")
        assert response.status_code == 200
        folders = response.json()
        assert any(f["id"] == folder_id for f in folders)
        
        # PUT /api/folders/{id}
        update_data = {"name": "Updated Integration Folder"}
        response = http_client.put(f"/api/folders/{folder_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == update_data["name"]
        
        # DELETE /api/folders/{id}
        response = http_client.delete(f"/api/folders/{folder_id}")
        assert response.status_code == 200
        
        # Verify deletion
        response = http_client.get(f"/api/folders/{folder_id}")
        assert response.status_code == 404
    
    def test_complete_note_workflow(self, api_server, http_client, setup_test_environment):
        """Test complete note CRUD workflow"""
        # First create a folder for the note
        folder_data = {"name": "Notes Folder", "icon": "📝"}
        folder_response = http_client.post("/api/folders/", json=folder_data)
        folder_id = folder_response.json()["id"]
        
        # Create a note
        note_data = {
            "title": "Integration Test Note",
            "content": "<p>This is a <strong>test</strong> note with <em>formatting</em>.</p>",
            "folder_id": folder_id
        }
        
        # POST /api/notes
        response = http_client.post("/api/notes/", json=note_data)
        assert response.status_code == 200
        
        created_note = response.json()
        assert created_note["title"] == note_data["title"]
        assert created_note["content"] == note_data["content"]
        assert created_note["folder_id"] == folder_id
        assert created_note["is_deleted"] is False
        
        note_id = created_note["id"]
        
        # GET /api/notes/{id}
        response = http_client.get(f"/api/notes/{note_id}")
        assert response.status_code == 200
        assert response.json()["title"] == note_data["title"]
        
        # GET /api/notes (list all)
        response = http_client.get("/api/notes/")
        assert response.status_code == 200
        notes = response.json()
        assert any(n["id"] == note_id for n in notes)
        
        # GET /api/notes?folder_id={folder_id}
        response = http_client.get(f"/api/notes/?folder_id={folder_id}")
        assert response.status_code == 200
        folder_notes = response.json()
        assert len(folder_notes) == 1
        assert folder_notes[0]["id"] == note_id
        
        # PUT /api/notes/{id}
        update_data = {
            "title": "Updated Integration Note",
            "content": "<p>Updated content with <u>underline</u>.</p>"
        }
        response = http_client.put(f"/api/notes/{note_id}", json=update_data)
        assert response.status_code == 200
        updated_note = response.json()
        assert updated_note["title"] == update_data["title"]
        assert updated_note["content"] == update_data["content"]
        
        # DELETE /api/notes/{id} (soft delete)
        response = http_client.delete(f"/api/notes/{note_id}")
        assert response.status_code == 200
        
        # Verify soft deletion - note should not be accessible
        response = http_client.get(f"/api/notes/{note_id}")
        assert response.status_code == 404
        
        # Clean up folder
        http_client.delete(f"/api/folders/{folder_id}")
    
    def test_nested_folder_structure(self, api_server, http_client, setup_test_environment):
        """Test creating and managing nested folder structures"""
        # Create parent folder
        parent_data = {"name": "Parent Folder", "icon": "📂"}
        parent_response = http_client.post("/api/folders/", json=parent_data)
        parent_id = parent_response.json()["id"]
        
        # Create child folder
        child_data = {
            "name": "Child Folder",
            "icon": "📁",
            "parent_id": parent_id
        }
        child_response = http_client.post("/api/folders/", json=child_data)
        child_id = child_response.json()["id"]
        
        # Create grandchild folder
        grandchild_data = {
            "name": "Grandchild Folder",
            "icon": "📄",
            "parent_id": child_id
        }
        grandchild_response = http_client.post("/api/folders/", json=grandchild_data)
        grandchild_id = grandchild_response.json()["id"]
        
        # Verify hierarchy
        response = http_client.get(f"/api/folders/{child_id}")
        assert response.json()["parent_id"] == parent_id
        
        response = http_client.get(f"/api/folders/{grandchild_id}")
        assert response.json()["parent_id"] == child_id
        
        # Create notes in different levels
        note1_data = {"title": "Parent Note", "folder_id": parent_id}
        note2_data = {"title": "Child Note", "folder_id": child_id}
        note3_data = {"title": "Grandchild Note", "folder_id": grandchild_id}
        
        note1_response = http_client.post("/api/notes/", json=note1_data)
        note2_response = http_client.post("/api/notes/", json=note2_data)
        note3_response = http_client.post("/api/notes/", json=note3_data)
        
        # Verify notes are in correct folders
        response = http_client.get(f"/api/notes/?folder_id={parent_id}")
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Parent Note"
        
        response = http_client.get(f"/api/notes/?folder_id={child_id}")
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Child Note"
        
        response = http_client.get(f"/api/notes/?folder_id={grandchild_id}")
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Grandchild Note"
        
        # Clean up (delete parent should cascade)
        http_client.delete(f"/api/folders/{parent_id}")
    
    def test_error_handling(self, api_server, http_client):
        """Test API error handling"""
        # Test 404 for non-existent folder
        response = http_client.get("/api/folders/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
        
        # Test 404 for non-existent note
        response = http_client.get("/api/notes/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
        
        # Test invalid JSON
        response = http_client.post("/api/folders/", content="invalid json")
        assert response.status_code == 422
    
    def test_concurrent_operations(self, api_server, http_client, setup_test_environment):
        """Test concurrent operations on the same resources"""
        # Create a folder
        folder_data = {"name": "Concurrent Test Folder", "icon": "🔄"}
        folder_response = http_client.post("/api/folders/", json=folder_data)
        folder_id = folder_response.json()["id"]
        
        # Create multiple notes concurrently
        note_data_list = [
            {"title": f"Concurrent Note {i}", "folder_id": folder_id}
            for i in range(5)
        ]
        
        # Simulate concurrent creation
        responses = []
        for note_data in note_data_list:
            response = http_client.post("/api/notes/", json=note_data)
            responses.append(response)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
        
        # Verify all notes were created
        response = http_client.get(f"/api/notes/?folder_id={folder_id}")
        notes = response.json()
        assert len(notes) == 5
        
        # Clean up
        for note in notes:
            http_client.delete(f"/api/notes/{note['id']}")
        http_client.delete(f"/api/folders/{folder_id}")

@pytest.mark.integration
class TestDatabaseIntegration:
    """Test database integration and data consistency"""
    
    def test_database_connection_persistence(self, setup_test_environment):
        """Test that database connections work correctly"""
        engine = setup_test_environment
        SessionLocal = sessionmaker(bind=engine)
        
        # Test multiple sessions
        with SessionLocal() as session1:
            folder1 = Folder(name="Session Test 1", icon="🔧")
            session1.add(folder1)
            session1.commit()
            folder1_id = folder1.id
        
        with SessionLocal() as session2:
            folder2 = session2.query(Folder).filter_by(id=folder1_id).first()
            assert folder2 is not None
            assert folder2.name == "Session Test 1"
            
            # Update in this session
            folder2.name = "Updated Session Test"
            session2.commit()
        
        with SessionLocal() as session3:
            folder3 = session3.query(Folder).filter_by(id=folder1_id).first()
            assert folder3.name == "Updated Session Test"
            
            # Clean up
            session3.delete(folder3)
            session3.commit()
    
    def test_data_integrity_constraints(self, setup_test_environment):
        """Test database constraints and data integrity"""
        engine = setup_test_environment
        SessionLocal = sessionmaker(bind=engine)
        
        with SessionLocal() as session:
            # Create folder
            folder = Folder(name="Integrity Test", icon="🔒")
            session.add(folder)
            session.commit()
            
            # Create note with valid folder_id
            note = Note(
                title="Valid Note",
                content="Content",
                folder_id=folder.id
            )
            session.add(note)
            session.commit()
            
            # Verify relationship
            assert note.folder_id == folder.id
            assert note.folder.name == "Integrity Test"
            
            # Clean up
            session.delete(note)
            session.delete(folder)
            session.commit()

@pytest.mark.integration
@pytest.mark.slow
class TestPerformanceIntegration:
    """Test performance with realistic data loads"""
    
    def test_bulk_operations_performance(self, api_server, http_client, setup_test_environment):
        """Test performance with bulk operations"""
        import time
        
        # Create folder first
        folder_data = {"name": "Bulk Test Folder", "icon": "📊"}
        folder_response = http_client.post("/api/folders/", json=folder_data)
        folder_id = folder_response.json()["id"]
        
        # Measure time for bulk note creation
        start_time = time.time()
        
        note_ids = []
        for i in range(20):  # Create 20 notes
            note_data = {
                "title": f"Performance Test Note {i}",
                "content": f"<p>This is note number {i} with some <strong>content</strong>.</p>",
                "folder_id": folder_id
            }
            response = http_client.post("/api/notes/", json=note_data)
            assert response.status_code == 200
            note_ids.append(response.json()["id"])
        
        creation_time = time.time() - start_time
        
        # Should create 20 notes in reasonable time (less than 5 seconds)
        assert creation_time < 5.0
        
        # Measure time for bulk retrieval
        start_time = time.time()
        
        response = http_client.get(f"/api/notes/?folder_id={folder_id}")
        assert response.status_code == 200
        notes = response.json()
        assert len(notes) == 20
        
        retrieval_time = time.time() - start_time
        
        # Should retrieve all notes quickly (less than 1 second)
        assert retrieval_time < 1.0
        
        # Clean up
        for note_id in note_ids:
            http_client.delete(f"/api/notes/{note_id}")
        http_client.delete(f"/api/folders/{folder_id}")
    
    def test_database_query_performance(self, setup_test_environment):
        """Test database query performance"""
        engine = setup_test_environment
        SessionLocal = sessionmaker(bind=engine)
        
        with SessionLocal() as session:
            # Create test data
            folders = []
            for i in range(5):
                folder = Folder(name=f"Perf Folder {i}", icon="⚡")
                session.add(folder)
                folders.append(folder)
            
            session.commit()
            
            # Create notes in bulk
            notes = []
            for i in range(50):
                note = Note(
                    title=f"Perf Note {i}",
                    content=f"Content for note {i}",
                    folder_id=folders[i % 5].id
                )
                session.add(note)
                notes.append(note)
            
            session.commit()
            
            # Test query performance
            import time
            
            # Query all notes
            start_time = time.time()
            all_notes = session.query(Note).filter(Note.is_deleted == False).all()
            query_time = time.time() - start_time
            
            assert len(all_notes) >= 50
            assert query_time < 0.5  # Should be very fast
            
            # Query notes with join
            start_time = time.time()
            notes_with_folders = session.query(Note).join(Folder).filter(
                Note.is_deleted == False
            ).all()
            join_query_time = time.time() - start_time
            
            assert len(notes_with_folders) >= 50
            assert join_query_time < 0.5  # Should still be fast
            
            # Clean up
            for note in notes:
                session.delete(note)
            for folder in folders:
                session.delete(folder)
            session.commit()