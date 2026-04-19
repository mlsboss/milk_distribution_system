from sqlalchemy import Column, Float, String, Date, PrimaryKeyConstraint
from datetime import date
from app.database import Base


class Dairy(Base):
    __tablename__ = "dairy"

    date = Column(Date, nullable=False)
    shift = Column(String, nullable=False)  # "AM" or "PM"

    litres = Column(Float, nullable=False)
    fat = Column(Float, nullable=False)
    snf = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('date', 'shift'),
    )

    def __repr__(self):
        return f"<Dairy date={self.date} shift={self.shift} litres={self.litres} amount={self.amount}>"