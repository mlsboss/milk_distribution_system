from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.dependencies import get_db
from app.services.report_service import get_fortnight_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/fortnight")
def report(start: date, end: date, db: Session = Depends(get_db)):
    return get_fortnight_report(start, end, db)