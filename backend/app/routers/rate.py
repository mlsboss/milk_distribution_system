from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.schemas import RateResponse, RateUpdate
from app.services.rate_service import (
    get_all_rates,
    get_rate_by_milk_and_person_type,
    update_rate
)

router = APIRouter(prefix="/rates", tags=["Rates"])


@router.get("/", response_model=list[RateResponse])
def get_rates(db: Session = Depends(get_db)):
    """Get all milk rates (supplier and customer)"""
    return get_all_rates(db)


@router.get("/{milk_type}/{person_type}", response_model=RateResponse)
def get_rate(milk_type: str, person_type: str, db: Session = Depends(get_db)):
    """Get rate for specific milk type and person type"""
    rate = get_rate_by_milk_and_person_type(milk_type, person_type, db)
    if not rate:
        raise HTTPException(404, f"Rate for {milk_type} ({person_type}) not found")
    return rate


@router.put("/{milk_type}/{person_type}")
def update_milk_rate(milk_type: str, person_type: str, data: RateUpdate, db: Session = Depends(get_db)):
    """Update milk rate for specific person type and return old and new rate"""
    if person_type not in ["supplier", "customer"]:
        raise HTTPException(400, "person_type must be 'supplier' or 'customer'")
    
    try:
        old_rate, new_rate = update_rate(milk_type, person_type, data.rate, db)
        return {
            "message": "Rate updated",
            "milk_type": milk_type,
            "person_type": person_type,
            "old_rate": old_rate,
            "new_rate": new_rate
        }
    except ValueError as e:
        raise HTTPException(404, str(e))
