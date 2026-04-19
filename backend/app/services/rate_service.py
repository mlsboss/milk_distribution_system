from sqlalchemy.orm import Session
from app.models.rate import MilkRate


def get_rate_by_milk_and_person_type(milk_type: str, person_type: str, db: Session) -> MilkRate:
    """Get rate for a specific milk type and person type (supplier or customer)"""
    return db.query(MilkRate).filter(
        MilkRate.milk_type == milk_type,
        MilkRate.person_type == person_type
    ).first()


def get_rate_by_milk_type(milk_type: str, db: Session) -> MilkRate:
    """Get supplier rate for a specific milk type (for backward compatibility)"""
    return get_rate_by_milk_and_person_type(milk_type, "supplier", db)


def get_all_rates(db: Session):
    """Get all milk rates (both supplier and customer)"""
    return db.query(MilkRate).all()


def create_rate(milk_type: str, person_type: str, rate: float, db: Session) -> MilkRate:
    """Create a new milk rate for supplier or customer"""
    existing = get_rate_by_milk_and_person_type(milk_type, person_type, db)
    if existing:
        return existing
    
    milk_rate = MilkRate(milk_type=milk_type, person_type=person_type, rate=rate)
    db.add(milk_rate)
    db.commit()
    db.refresh(milk_rate)
    return milk_rate


def update_rate(milk_type: str, person_type: str, new_rate: float, db: Session) -> tuple:
    """Update milk rate for a specific person type and return (old_rate, new_rate)"""
    milk_rate = get_rate_by_milk_and_person_type(milk_type, person_type, db)
    
    if not milk_rate:
        raise ValueError(f"Rate for {milk_type} ({person_type}) not found")
    
    old_rate = milk_rate.rate
    milk_rate.rate = new_rate
    db.commit()
    
    return old_rate, new_rate
