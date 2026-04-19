from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.dependencies import get_db
from app.models.dairy import Dairy
from app.schemas import DairyCreate, DairyResponse
from app.services.dairy_service import create_dairy_entry, get_dairy_entries, get_dairy_entry_by_date_shift

router = APIRouter(prefix="/dairy", tags=["Dairy"])


@router.post("/", response_model=DairyResponse)
def add_dairy_entry(data: DairyCreate, db: Session = Depends(get_db)):
    """Add a new dairy entry"""
    return create_dairy_entry(data, db)


@router.get("/", response_model=list[DairyResponse])
def get_dairy_entries_endpoint(db: Session = Depends(get_db)):
    """Get all dairy entries"""
    return get_dairy_entries(db)


@router.get("/{date}/{shift}", response_model=DairyResponse)
def get_dairy_entry(date: str, shift: str, db: Session = Depends(get_db)):
    """Get a specific dairy entry"""
    try:
        entry_date = datetime.fromisoformat(date).date()
    except ValueError:
        raise HTTPException(400, "Invalid date format")

    entry = get_dairy_entry_by_date_shift(entry_date, shift, db)
    if not entry:
        raise HTTPException(404, "Dairy entry not found")

    return entry