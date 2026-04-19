import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import Base, engine

# Import all models
from app.models import supplier, customer, payment, transaction, dairy

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database initialized successfully!")