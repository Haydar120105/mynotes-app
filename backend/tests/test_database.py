import pytest
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the parent directory to sys.path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import Base, get_db
from app.models.models import Folder, Note

# Load environment variables
load_dotenv()

# Create test database engine
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:7358@localhost:5432/mynotes_db")
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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

class TestDatabaseConnection:
    """Test database connection and basic operations."""
    
    def test_database_connection(self):
        """Test that we can connect to the database."""
        connection = engine.connect()
        assert connection is not None
        connection.close()
    
    def test_get_db_function(self):
        """Test the get_db dependency function."""
        db_generator = get_db()
        db = next(db_generator)
        assert db is not None
        # Close the generator
        try:
            next(db_generator)
        except StopIteration:
            pass

class TestFolderModel:
    """Test the Folder model."""
    
    def test_create_folder(self, db_session, setup_database):
        """Test creating a folder."""
        folder = Folder(
            name="Test Folder",
            icon="📁",
            parent_id=None
        )
        db_session.add(folder)
        db_session.commit()
        
        assert folder.id is not None
        assert folder.name == "Test Folder"
        assert folder.icon == "📁"
        assert folder.parent_id is None
    
    def test_create_subfolder(self, db_session, setup_database):
        """Test creating a subfolder."""
        # Create parent folder
        parent_folder = Folder(name="Parent", icon="📂")
        db_session.add(parent_folder)
        db_session.commit()
        
        # Create subfolder
        subfolder = Folder(
            name="Subfolder",
            icon="📁",
            parent_id=parent_folder.id
        )
        db_session.add(subfolder)
        db_session.commit()
        
        assert subfolder.parent_id == parent_folder.id
        assert subfolder.parent.name == "Parent"
    
    def test_folder_relationship(self, db_session, setup_database):
        """Test folder parent-child relationship."""
        parent = Folder(name="Parent", icon="📂")
        db_session.add(parent)
        db_session.commit()
        
        child1 = Folder(name="Child1", icon="📁", parent_id=parent.id)
        child2 = Folder(name="Child2", icon="📁", parent_id=parent.id)
        db_session.add_all([child1, child2])
        db_session.commit()
        
        # Refresh to get relationships
        db_session.refresh(parent)
        assert len(parent.subfolders) == 2
        assert child1 in parent.subfolders
        assert child2 in parent.subfolders

class TestNoteModel:
    """Test the Note model."""
    
    def test_create_note(self, db_session, setup_database):
        """Test creating a note."""
        note = Note(
            title="Test Note",
            content="This is a test note",
            folder_id=None
        )
        db_session.add(note)
        db_session.commit()
        
        assert note.id is not None
        assert note.title == "Test Note"
        assert note.content == "This is a test note"
        assert note.is_deleted is False
    
    def test_note_with_folder(self, db_session, setup_database):
        """Test creating a note with a folder."""
        # Create folder
        folder = Folder(name="Test Folder", icon="📁")
        db_session.add(folder)
        db_session.commit()
        
        # Create note in folder
        note = Note(
            title="Folder Note",
            content="Note in folder",
            folder_id=folder.id
        )
        db_session.add(note)
        db_session.commit()
        
        assert note.folder_id == folder.id
        assert note.folder.name == "Test Folder"
    
    def test_soft_delete_note(self, db_session, setup_database):
        """Test soft deleting a note."""
        note = Note(title="Delete Me", content="Content")
        db_session.add(note)
        db_session.commit()
        
        # Soft delete
        note.is_deleted = True
        db_session.commit()
        
        assert note.is_deleted is True
    
    def test_note_defaults(self, db_session, setup_database):
        """Test note default values."""
        note = Note()
        db_session.add(note)
        db_session.commit()
        
        assert note.title == "Unbenannt"
        assert note.content == ""
        assert note.is_deleted is False
        assert note.created_at is not None
        assert note.updated_at is not None

class TestModelRelationships:
    """Test relationships between models."""
    
    def test_folder_notes_relationship(self, db_session, setup_database):
        """Test that folders can have multiple notes."""
        folder = Folder(name="Project", icon="📊")
        db_session.add(folder)
        db_session.commit()
        
        note1 = Note(title="Note 1", content="Content 1", folder_id=folder.id)
        note2 = Note(title="Note 2", content="Content 2", folder_id=folder.id)
        db_session.add_all([note1, note2])
        db_session.commit()
        
        # Refresh to get relationships
        db_session.refresh(folder)
        assert len(folder.notes) == 2
        assert note1 in folder.notes
        assert note2 in folder.notes
    
    def test_cascade_delete_simulation(self, db_session, setup_database):
        """Test what happens when we delete a folder with notes."""
        folder = Folder(name="To Delete", icon="🗑️")
        db_session.add(folder)
        db_session.commit()
        
        note = Note(title="Note in folder", folder_id=folder.id)
        db_session.add(note)
        db_session.commit()
        
        # In real application, we would handle this in the API
        # For now, just verify the relationship exists
        assert note.folder_id == folder.id
        assert note.folder.name == "To Delete"