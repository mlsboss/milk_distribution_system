import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import SessionLocal, engine
from app.models.rate import MilkRate

db = SessionLocal()

# Clear existing rates
db.query(MilkRate).delete()
db.commit()

# Initialize rates for both supplier and customer for cow and buffalo milk
rates_data = [
    {"milk_type": "cow", "person_type": "supplier", "rate": 62.0},
    {"milk_type": "cow", "person_type": "customer", "rate": 75.0},
    {"milk_type": "buffalo", "person_type": "supplier", "rate": 60.0},
    {"milk_type": "buffalo", "person_type": "customer", "rate": 70.0},
]

for rate_info in rates_data:
    rate = MilkRate(
        milk_type=rate_info["milk_type"],
        person_type=rate_info["person_type"],
        rate=rate_info["rate"]
    )
    db.add(rate)
    print(f"Added rate: {rate_info['milk_type']} ({rate_info['person_type']}) = ₹{rate_info['rate']}")

db.commit()
db.close()

print("\nRates initialized successfully!")
