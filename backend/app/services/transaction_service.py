from sqlalchemy.orm import Session
from datetime import date
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.services.calculation import calculate_amount
from app.services.rate_service import get_rate_by_milk_and_person_type


def calculate_transaction_amount(data, rate: float) -> float:
    if data.person_type == "customer":
        return data.litres * rate

    return calculate_amount(data.litres, data.fat, rate)


def create_transaction(data, db: Session):
    """Create a new transaction with dynamic rate based on milk type and person type"""
    transaction_date = date.fromisoformat(data.date) if data.date else date.today()

    if data.person_type == "supplier":
        exists = db.query(Supplier).filter(Supplier.id == data.person_id).first()
        if not exists:
            raise ValueError("Supplier ID not found. Add the supplier first.")
    elif data.person_type == "customer":
        exists = db.query(Customer).filter(Customer.id == data.person_id).first()
        if not exists:
            raise ValueError("Customer ID not found. Add the customer first.")
    
    # Check if transaction already exists for this person, milk_type, date, shift
    existing = db.query(Transaction).filter(
        Transaction.person_id == data.person_id,
        Transaction.person_type == data.person_type,
        Transaction.milk_type == data.milk_type,
        Transaction.date == transaction_date,
        Transaction.shift == data.shift
    ).first()
    
    if existing:
        raise ValueError(f"Transaction already exists for {data.person_type} {data.person_id} on {data.date} {data.shift} with {data.milk_type} milk")
    
    # Get rate for the milk type and person type
    rate_obj = get_rate_by_milk_and_person_type(data.milk_type, data.person_type, db)
    rate = rate_obj.rate if rate_obj else 82.0  # Default fallback
    
    amount = calculate_transaction_amount(data, rate)

    txn = Transaction(
        person_id=data.person_id,
        person_type=data.person_type,
        litres=data.litres,
        fat=data.fat,
        milk_type=data.milk_type,
        shift=data.shift,
        amount=amount,
        rate=rate,
        date=transaction_date
    )

    db.add(txn)

    # Update customer balance when transaction is for a customer
    if data.person_type == "customer":
        cust = db.query(Customer).filter(Customer.id == data.person_id).first()
        if cust:
            cust.balance += amount

    db.commit()

    return txn


def update_transaction(txn, data, db: Session):
    """Update a transaction with dynamic rate and balance adjustments"""

    # Get rate for the milk type and person type
    rate_obj = get_rate_by_milk_and_person_type(data.milk_type, data.person_type, db)
    rate = rate_obj.rate if rate_obj else txn.rate or 82.0

    if data.person_type == "supplier":
        exists = db.query(Supplier).filter(Supplier.id == data.person_id).first()
        if not exists:
            raise ValueError("Supplier ID not found. Add the supplier first.")
    elif data.person_type == "customer":
        exists = db.query(Customer).filter(Customer.id == data.person_id).first()
        if not exists:
            raise ValueError("Customer ID not found. Add the customer first.")

    new_amount = calculate_transaction_amount(data, rate)

    # Reverse old balance impact
    if txn.person_type == "customer":
        old_cust = db.query(Customer).filter(Customer.id == txn.person_id).first()
        if old_cust:
            old_cust.balance -= txn.amount  # Reverse the old transaction

    # Update transaction
    txn.person_id = data.person_id
    txn.person_type = data.person_type
    txn.litres = data.litres
    txn.fat = data.fat
    txn.milk_type = data.milk_type
    txn.shift = data.shift
    txn.amount = new_amount
    txn.rate = rate

    # Apply new balance impact
    if data.person_type == "customer":
        new_cust = db.query(Customer).filter(Customer.id == data.person_id).first()
        if new_cust:
            new_cust.balance += new_amount

    db.commit()

    return txn


def delete_transaction(txn, db: Session):
    """Delete a transaction and reverse balance impact"""

    # Reverse balance impact before deleting
    if txn.person_type == "customer":
        cust = db.query(Customer).filter(Customer.id == txn.person_id).first()
        if cust:
            cust.balance -= txn.amount  # Reverse the transaction amount

    db.delete(txn)
    db.commit()
