from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.models import Folder
from app.schemas.schemas import FolderCreate, FolderUpdate, Folder as FolderSchema

router = APIRouter(prefix="/folders", tags=["folders"])

@router.get("/", response_model=List[FolderSchema])
def get_folders(db: Session = Depends(get_db)):
    """Get all folders with their hierarchy"""
    folders = db.query(Folder).filter(Folder.parent_id.is_(None)).all()
    return folders

@router.get("/{folder_id}", response_model=FolderSchema)
def get_folder(folder_id: int, db: Session = Depends(get_db)):
    """Get a specific folder by ID"""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder

@router.post("/", response_model=FolderSchema)
def create_folder(folder: FolderCreate, db: Session = Depends(get_db)):
    """Create a new folder"""
    db_folder = Folder(**folder.model_dump())
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.put("/{folder_id}", response_model=FolderSchema)
def update_folder(folder_id: int, folder_update: FolderUpdate, db: Session = Depends(get_db)):
    """Update a folder"""
    db_folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    update_data = folder_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_folder, field, value)
    
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    """Delete a folder and all its subfolders"""
    db_folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Delete all subfolders recursively
    def delete_subfolders(folder):
        for subfolder in folder.subfolders:
            delete_subfolders(subfolder)
        db.delete(folder)
    
    delete_subfolders(db_folder)
    db.commit()
    return {"message": "Folder deleted successfully"}