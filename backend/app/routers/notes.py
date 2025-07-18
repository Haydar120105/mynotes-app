from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.models import Note
from app.schemas.schemas import NoteCreate, NoteUpdate, Note as NoteSchema

router = APIRouter(prefix="/notes", tags=["notes"])

@router.get("/", response_model=List[NoteSchema])
def get_notes(folder_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all notes, optionally filtered by folder"""
    query = db.query(Note).filter(Note.is_deleted == False)
    if folder_id is not None:
        query = query.filter(Note.folder_id == folder_id)
    return query.all()

@router.get("/{note_id}", response_model=NoteSchema)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """Get a specific note by ID"""
    note = db.query(Note).filter(Note.id == note_id, Note.is_deleted == False).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.post("/", response_model=NoteSchema)
def create_note(note: NoteCreate, db: Session = Depends(get_db)):
    """Create a new note"""
    db_note = Note(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.put("/{note_id}", response_model=NoteSchema)
def update_note(note_id: int, note_update: NoteUpdate, db: Session = Depends(get_db)):
    """Update a note"""
    db_note = db.query(Note).filter(Note.id == note_id, Note.is_deleted == False).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_note, field, value)
    
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Soft delete a note"""
    db_note = db.query(Note).filter(Note.id == note_id, Note.is_deleted == False).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db_note.is_deleted = True
    db.commit()
    return {"message": "Note deleted successfully"}

@router.post("/sync", response_model=List[NoteSchema])
def sync_notes(notes: List[NoteCreate], db: Session = Depends(get_db)):
    """Sync multiple notes (for offline sync)"""
    synced_notes = []
    
    for note_data in notes:
        # Check if note already exists (by title and folder for simplicity)
        existing_note = db.query(Note).filter(
            Note.title == note_data.title,
            Note.folder_id == note_data.folder_id,
            Note.is_deleted == False
        ).first()
        
        if existing_note:
            # Update existing note
            for field, value in note_data.model_dump().items():
                setattr(existing_note, field, value)
            db.commit()
            db.refresh(existing_note)
            synced_notes.append(existing_note)
        else:
            # Create new note
            db_note = Note(**note_data.model_dump())
            db.add(db_note)
            db.commit()
            db.refresh(db_note)
            synced_notes.append(db_note)
    
    return synced_notes