from sqlalchemy import Column, Integer, Float, String, Date
from datetime import date
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    # 🔥 CORE IDENTIFIERS
    person_id = Column(Integer, nullable=False)
    person_type = Column(String, nullable=False)  # "supplier" or "customer"

    # 🔥 MILK DETAILS
    litres = Column(Float, nullable=False)
    fat = Column(Float, nullable=True)

    milk_type = Column(String, nullable=False)   # cow / buffalo
    shift = Column(String, nullable=False)       # AM / PM

    # 🔥 CALCULATION
    amount = Column(Float, nullable=False)
    rate = Column(Float, nullable=True)

    # 🔥 DATE
    date = Column(Date, default=date.today)

    def __repr__(self):
        return (
            f"<Transaction id={self.id} "
            f"type={self.person_type} person={self.person_id} "
            f"litres={self.litres} amount={self.amount}>"
        )