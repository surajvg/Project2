import os
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, create_base

# --- CONFIGURATION ---
# Set your manual path here. e.g., "D:/ProjectFiles/PDFs"
MANUAL_BASE_PATH = "C:/ServerData/StepFolders" 

Base = create_base()

class StepDocument(Base):
    __tablename__ = "step_documents"
    id = Column(Integer, primary_key=True, index=True)
    step_name = Column(String, index=True)
    filename = Column(String)
    file_path = Column(String)

router = APIRouter()

def sync_folder_to_db(step_name: str, db: Session):
    """
    Watches the folder and updates the DB so the 
    frontend always sees what is actually on the disk.
    """
    folder_path = os.path.join(MANUAL_BASE_PATH, step_name)
    
    if not os.path.exists(folder_path):
        return []

    # Get all PDFs currently in the physical folder
    disk_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
    
    # Simple Sync: Clear old records for this step and re-insert 
    # (Or you can do a more complex diff if the folder is massive)
    db.query(StepDocument).filter(StepDocument.step_name == step_name).delete()
    
    for file in disk_files:
        new_rec = StepDocument(
            step_name=step_name,
            filename=file,
            file_path=os.path.join(folder_path, file)
        )
        db.add(new_rec)
    
    db.commit()

@router.get("/api/list-pdfs")
def list_pdfs(step_name: str, db: Session = Depends(get_db)):
    # First, sync the DB with the actual folder content
    sync_folder_to_db(step_name, db)
    
    # Then return the updated list
    docs = db.query(StepDocument).filter(StepDocument.step_name == step_name).all()
    return [{"id": d.id, "filename": d.filename} for d in docs]

@router.get("/api/view-pdf/{file_id}")
def view_pdf(file_id: int, db: Session = Depends(get_db)):
    doc = db.query(StepDocument).filter(StepDocument.id == file_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File no longer exists")

    return FileResponse(doc.file_path, media_type="application/pdf")
