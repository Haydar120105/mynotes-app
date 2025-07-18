from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FolderBase(BaseModel):
    name: str
    icon: str = "📁"
    parent_id: Optional[int] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None

class Folder(FolderBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    subfolders: List["Folder"] = []
    
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: str = "Unbenannt"
    content: str = ""
    folder_id: Optional[int] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[int] = None

class Note(NoteBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_deleted: bool = False
    
    class Config:
        from_attributes = True

# Update forward reference
Folder.model_rebuild()