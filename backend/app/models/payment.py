from sqlalchemy import Column, Integer, Float, Date
from datetime import date
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, default=date.today)

    def __repr__(self):
        return f"<Payment customer_id={self.customer_id} amount={self.amount}>"