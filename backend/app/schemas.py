from pydantic import BaseModel
from typing import Optional
from datetime import date as DateType


# ===== SUPPLIER SCHEMAS =====
class SupplierCreate(BaseModel):
    id: int
    name: str


class SupplierUpdate(BaseModel):
    name: str


class SupplierResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ===== CUSTOMER SCHEMAS =====
class CustomerCreate(BaseModel):
    id: int
    name: str


class CustomerUpdate(BaseModel):
    name: str


class CustomerResponse(BaseModel):
    id: int
    name: str
    balance: float = 0

    class Config:
        from_attributes = True


# ===== PAYMENT SCHEMAS =====
class PaymentCreate(BaseModel):
    customer_id: int
    amount: float


# ===== TRANSACTION SCHEMAS =====
class TransactionCreate(BaseModel):
    person_id: int
    person_type: str  # "supplier" or "customer"
    litres: float
    fat: float
    milk_type: str  # "cow" or "buffalo"
    shift: str  # "AM" or "PM"
    date: Optional[str] = None
    amount: Optional[float] = None


class TransactionResponse(BaseModel):
    id: int
    person_id: int
    person_type: str
    litres: float
    fat: float
    milk_type: str
    shift: str
    amount: float
    rate: Optional[float] = None
    date: DateType

    class Config:
        from_attributes = True


# ===== RATE SCHEMAS =====
class RateCreate(BaseModel):
    milk_type: str  # "cow" or "buffalo"
    rate: float


class RateUpdate(BaseModel):
    rate: float


class RateResponse(BaseModel):
    id: int
    milk_type: str
    person_type: str
    rate: float

    class Config:
        from_attributes = True


# ===== DAIRY SCHEMAS =====
class DairyCreate(BaseModel):
    date: str  # ISO date string
    shift: str  # "AM" or "PM"
    litres: float
    fat: float
    snf: float
    amount: float


class DairyResponse(BaseModel):
    date: DateType
    shift: str
    litres: float
    fat: float
    snf: float
    amount: float

    class Config:
        from_attributes = True
