from sqlalchemy import Column, Integer, Float, String, UniqueConstraint
from datetime import datetime
from app.database import Base


class MilkRate(Base):
    __tablename__ = "milk_rates"

    id = Column(Integer, primary_key=True, index=True)
    milk_type = Column(String, nullable=False)  # "cow" or "buffalo"
    person_type = Column(String, nullable=False)  # "supplier" or "customer"
    rate = Column(Float, nullable=False)

    __table_args__ = (
        # Ensure unique combination of milk_type + person_type
        UniqueConstraint('milk_type', 'person_type', name='uix_milk_person'),
    )

    def __repr__(self):
        return f"<MilkRate milk_type={self.milk_type} person_type={self.person_type} rate={self.rate}>"
