from sqlalchemy.orm import Session
from datetime import date
from app.models.dairy import Dairy


def create_dairy_entry(data, db: Session):
    """Create a new dairy entry"""

    dairy_entry = Dairy(
        date=date.fromisoformat(data.date),
        shift=data.shift,
        litres=data.litres,
        fat=data.fat,
        snf=data.snf,
        amount=data.amount
    )

    db.add(dairy_entry)
    db.commit()
    db.refresh(dairy_entry)

    return dairy_entry


def get_dairy_entries(db: Session):
    """Get all dairy entries ordered by date and shift"""
    return db.query(Dairy).order_by(Dairy.date.desc(), Dairy.shift).all()


def get_dairy_entry_by_date_shift(date_obj: date, shift: str, db: Session):
    """Get a specific dairy entry by date and shift"""
    return db.query(Dairy).filter(
        Dairy.date == date_obj,
        Dairy.shift == shift
    ).first()