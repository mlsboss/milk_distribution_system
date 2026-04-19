from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.dependencies import get_db
from app.models.payment import Payment
from app.models.customer import Customer
from app.schemas import PaymentCreate

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/")
def make_payment(data: PaymentCreate, db: Session = Depends(get_db)):

    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()

    if not customer:
        raise HTTPException(404, "Customer not found")

    if data.amount <= 0:
        raise HTTPException(400, "Invalid amount")

    payment = Payment(
        customer_id=data.customer_id,
        amount=data.amount,
        date=date.today()
    )

    db.add(payment)

    # 🔥 update balance
    customer.balance -= data.amount

    db.commit()

    return {"message": "Payment recorded"}
