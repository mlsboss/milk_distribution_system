from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    balance = Column(Float, default=0)

    def __repr__(self):
        return f"<Customer id={self.id} name={self.name} balance={self.balance}>"