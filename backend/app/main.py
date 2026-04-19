from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Import models (VERY IMPORTANT for table creation)
from app.models import supplier, customer, payment, transaction, rate, dairy

# Import routers
from app.routers import supplier as supplier_router
from app.routers import customer as customer_router
from app.routers import payment as payment_router
from app.routers import transaction as transaction_router
from app.routers import report as report_router
from app.routers import rate as rate_router
from app.routers import dairy as dairy_router

from app.config import settings


# Create tables
Base.metadata.create_all(bind=engine)

# Initialize default rates if they don't exist
from sqlalchemy.orm import sessionmaker
from app.services.rate_service import create_rate

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Initialize default rates
try:
    create_rate("cow", "supplier", 62.0, db)
    create_rate("buffalo", "supplier", 60.0, db)
    create_rate("cow", "customer", 62.0, db)
    create_rate("buffalo", "customer", 60.0, db)
except:
    pass
finally:
    db.close()

# Create app
app = FastAPI(title=settings.PROJECT_NAME)


# ---------- CORS ----------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[origin.strip() for origin in settings.FRONTEND_ORIGINS.split(",")],
#     allow_credentials=settings.FRONTEND_ORIGINS != "*",
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # temporary fix
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://milk-distribution-system.pages.dev/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- ROUTERS ----------
app.include_router(supplier_router.router)
app.include_router(customer_router.router)
app.include_router(payment_router.router)
app.include_router(transaction_router.router)
app.include_router(report_router.router)
app.include_router(rate_router.router)
app.include_router(dairy_router.router)


# ---------- HEALTH CHECK ----------
@app.get("/")
def root():
    return {"message": "Milk Distribution API running"}
