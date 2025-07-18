#!/usr/bin/env python3
"""
Setup script for MyNotes database
"""
import subprocess
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, SQLAlchemyError
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

def create_database():
    """Create the database if it doesn't exist"""
    try:
        # Connect to PostgreSQL server (not to specific database)
        load_dotenv()
        db_password = os.getenv("DB_PASSWORD")
        conn = psycopg2.connect(
            host="localhost",
            user="postgres",
            password=os.getenv("DB_PASSWORD")
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'mynotes_db'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute("CREATE DATABASE mynotes_db")
            print("✅ Database 'mynotes_db' created successfully")
        else:
            print("✅ Database 'mynotes_db' already exists")
            
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"❌ Error creating database: {e}")
        print("Make sure PostgreSQL is running and the credentials are correct.")
        sys.exit(1)

def run_migrations():
    """Run Alembic migrations"""
    try:
        # Generate initial migration
        print("🔄 Generating initial migration...")
        result = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", "Initial migration"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print("⚠️  Migration generation failed or no changes detected")
            print(result.stdout)
            print(result.stderr)
        else:
            print("✅ Migration generated successfully")
        
        # Run migrations
        print("🔄 Running migrations...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Migrations completed successfully")
        else:
            print("❌ Migration failed:")
            print(result.stdout)
            print(result.stderr)
            sys.exit(1)
            
    except FileNotFoundError:
        print("❌ Alembic not found. Please install requirements first:")
        print("pip install -r requirements.txt")
        sys.exit(1)

def insert_sample_data():
    """Insert some sample data"""
    try:
        from app.database.connection import engine
        from app.models.models import Folder, Note
        from sqlalchemy.orm import sessionmaker

        
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        # Check if data already exists
        if db.query(Folder).count() > 0:
            print("✅ Sample data already exists")
            db.close()
            return
        
        # Create sample folders
        personal_folder = Folder(name="Persönlich", icon="👤", parent_id=None)
        work_folder = Folder(name="Arbeit", icon="💼", parent_id=None)
        projects_folder = Folder(name="Projekte", icon="🚀", parent_id=None)
        
        db.add_all([personal_folder, work_folder, projects_folder])
        db.commit()
        
        # Create subfolders
        diary_folder = Folder(name="Tagebuch", icon="📖", parent_id=personal_folder.id)
        ideas_folder = Folder(name="Ideen", icon="💡", parent_id=personal_folder.id)
        meetings_folder = Folder(name="Meetings", icon="🤝", parent_id=work_folder.id)
        
        db.add_all([diary_folder, ideas_folder, meetings_folder])
        db.commit()
        
        # Create a sample note
        sample_note = Note(
            title="Willkommen bei MyNotes!",
            content="<p>Das ist deine erste Notiz. Du kannst sie bearbeiten oder löschen.</p>",
            folder_id=personal_folder.id
        )
        
        db.add(sample_note)
        db.commit()
        db.close()
        
        print("✅ Sample data inserted successfully")
        
    except Exception as e:
        print(f"❌ Error inserting sample data: {e}")

def main():
    print("🚀 Setting up MyNotes database...")
    
    # Change to backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create database
    create_database()
    
    # Run migrations
    run_migrations()
    
    # Insert sample data
    insert_sample_data()
    
    print("\n🎉 Database setup completed successfully!")
    print("\nTo start the backend server, run:")
    print("  cd backend")
    print("  python run.py")

if __name__ == "__main__":
    main()