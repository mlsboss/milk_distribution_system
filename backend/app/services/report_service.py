from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.dairy import Dairy


def get_fortnight_report(start, end, db: Session):

    suppliers_raw = db.query(
        Supplier.id,
        Supplier.name,
        func.sum(Transaction.litres),
        func.sum(Transaction.amount)
    ).join(
        Transaction, Supplier.id == Transaction.person_id
    ).filter(
        Transaction.person_type == "supplier",
        Transaction.date >= start,
        Transaction.date <= end
    ).group_by(Supplier.id, Supplier.name).all()

    suppliers = [
        {
            "id": s[0],
            "name": s[1],
            "litres": s[2] or 0,
            "amount": s[3] or 0
        }
        for s in suppliers_raw
    ]

    supplier_breakdown_raw = db.query(
        Supplier.id,
        Supplier.name,
        Transaction.shift,
        func.sum(Transaction.litres),
        func.sum(Transaction.amount)
    ).join(
        Transaction, Supplier.id == Transaction.person_id
    ).filter(
        Transaction.person_type == "supplier",
        Transaction.date >= start,
        Transaction.date <= end
    ).group_by(Supplier.id, Supplier.name, Transaction.shift).all()

    supplier_breakdown = {}
    for s in supplier_breakdown_raw:
        supplier_id = s[0]
        if supplier_id not in supplier_breakdown:
            supplier_breakdown[supplier_id] = {
                "id": supplier_id,
                "name": s[1],
                "AM": {"litres": 0, "amount": 0},
                "PM": {"litres": 0, "amount": 0}
            }
        supplier_breakdown[supplier_id][s[2]] = {
            "litres": s[3] or 0,
            "amount": s[4] or 0
        }
    supplier_breakdown = list(supplier_breakdown.values())

    supplier_details_raw = db.query(
        Transaction.date,
        Transaction.shift,
        Transaction.litres,
        Transaction.fat,
        Transaction.amount,
        Supplier.id,
        Supplier.name
    ).join(
        Supplier, Supplier.id == Transaction.person_id
    ).filter(
        Transaction.person_type == "supplier",
        Transaction.date >= start,
        Transaction.date <= end
    ).order_by(Transaction.date.desc(), Transaction.shift).all()

    supplier_details = [
        {
            "date": row[0].isoformat(),
            "shift": row[1],
            "litres": row[2],
            "fat": row[3],
            "amount": row[4],
            "supplier_id": row[5],
            "name": row[6]
        }
        for row in supplier_details_raw
    ]

    customers_raw = db.query(
        Customer.id,
        Customer.name,
        func.sum(Transaction.litres),
        func.sum(Transaction.amount)
    ).join(
        Transaction, Customer.id == Transaction.person_id
    ).filter(
        Transaction.person_type == "customer",
        Transaction.date >= start,
        Transaction.date <= end
    ).group_by(Customer.id, Customer.name).all()

    customers = [
        {
            "id": c[0],
            "name": c[1],
            "litres": c[2] or 0,
            "amount": c[3] or 0
        }
        for c in customers_raw
    ]

    customer_breakdown_raw = db.query(
        Customer.id,
        Customer.name,
        Transaction.shift,
        func.sum(Transaction.litres),
        func.sum(Transaction.amount)
    ).join(
        Transaction, Customer.id == Transaction.person_id
    ).filter(
        Transaction.person_type == "customer",
        Transaction.date >= start,
        Transaction.date <= end
    ).group_by(Customer.id, Customer.name, Transaction.shift).all()

    customer_breakdown = {}
    for c in customer_breakdown_raw:
        customer_id = c[0]
        if customer_id not in customer_breakdown:
            customer_breakdown[customer_id] = {
                "id": customer_id,
                "name": c[1],
                "AM": {"litres": 0, "amount": 0},
                "PM": {"litres": 0, "amount": 0}
            }
        customer_breakdown[customer_id][c[2]] = {
            "litres": c[3] or 0,
            "amount": c[4] or 0
        }
    customer_breakdown = list(customer_breakdown.values())

    customer_details_raw = db.query(
        Transaction.date,
        Transaction.shift,
        Transaction.litres,
        Transaction.fat,
        Transaction.amount,
        Customer.id,
        Customer.name
    ).join(
        Customer, Customer.id == Transaction.person_id
    ).filter(
        Transaction.person_type == "customer",
        Transaction.date >= start,
        Transaction.date <= end
    ).order_by(Transaction.date.desc(), Transaction.shift).all()

    customer_details = [
        {
            "date": row[0].isoformat(),
            "shift": row[1],
            "litres": row[2],
            "fat": row[3],
            "amount": row[4],
            "customer_id": row[5],
            "name": row[6]
        }
        for row in customer_details_raw
    ]

    balances_raw = db.query(
        Customer.name,
        Customer.balance
    ).all()

    balances = [{"name": b[0], "balance": b[1] or 0} for b in balances_raw]

    dairy_entries = db.query(
        Dairy.date,
        Dairy.shift,
        Dairy.litres,
        Dairy.fat,
        Dairy.snf,
        Dairy.amount
    ).filter(
        Dairy.date >= start,
        Dairy.date <= end
    ).order_by(Dairy.date.desc(), Dairy.shift).all()

    dairy_by_date = {}
    for entry in dairy_entries:
        date_key = entry[0].isoformat()
        if date_key not in dairy_by_date:
            dairy_by_date[date_key] = {"AM": None, "PM": None}
        dairy_by_date[date_key][entry[1]] = {
            "litres": entry[2],
            "fat": entry[3],
            "snf": entry[4],
            "amount": entry[5]
        }

    return {
        "suppliers": suppliers,
        "supplier_breakdown": supplier_breakdown,
        "supplier_details": supplier_details,
        "customers": customers,
        "customer_breakdown": customer_breakdown,
        "customer_details": customer_details,
        "balances": balances,
        "dairy": dairy_by_date
    }