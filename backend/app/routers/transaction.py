from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.transaction import Transaction
from app.schemas import TransactionCreate, TransactionResponse
from app.services.transaction_service import (
    create_transaction,
    update_transaction,
    delete_transaction
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/", response_model=TransactionResponse)
def create(data: TransactionCreate, db: Session = Depends(get_db)):
    """Create a new transaction"""
    if data.person_type not in ["supplier", "customer"]:
        raise HTTPException(400, "Invalid person type")

    if data.milk_type not in ["cow", "buffalo"]:
        raise HTTPException(400, "Invalid milk type")

    try:
        txn = create_transaction(data, db)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    return txn


@router.get("/", response_model=list[TransactionResponse])
def get_all(person_type: str = None, db: Session = Depends(get_db)):
    """Get all transactions, optionally filtered by person_type"""
    query = db.query(Transaction)
    if person_type:
        if person_type not in ["supplier", "customer"]:
            raise HTTPException(400, "Invalid person type")
        query = query.filter(Transaction.person_type == person_type)
    return query.all()


@router.put("/{txn_id}", response_model=TransactionResponse)
def update(txn_id: int, data: TransactionCreate, db: Session = Depends(get_db)):
    """Update a transaction"""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()

    if not txn:
        raise HTTPException(404, "Transaction not found")

    try:
        txn = update_transaction(txn, data, db)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    return txn


@router.delete("/{txn_id}")
def delete(txn_id: int, db: Session = Depends(get_db)):
    """Delete a transaction"""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()

    if not txn:
        raise HTTPException(404, "Not found")

    delete_transaction(txn, db)

    return {"message": "Deleted"}
