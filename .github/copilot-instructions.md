# 🥛 Milk Distribution System — Copilot Context

## 📌 Project Overview
This is a full-stack Milk Distribution Management System built for real-world usage in a small milk collection and distribution business.

The system is designed to:
- Track milk supplied by suppliers
- Track milk sold to customers
- Calculate payments based on fat and quantity
- Maintain customer balances
- Generate fortnight reports
- Work in offline mode with sync capability

---

## 🧱 Tech Stack

### Backend
- FastAPI
- SQLAlchemy ORM
- SQLite (can be upgraded to PostgreSQL)

### Frontend
- Vanilla JavaScript (ES Modules)
- HTML + CSS
- IndexedDB (offline storage)
- PWA (Service Worker + Manifest)

---

## 🧩 Architecture

Frontend → FastAPI APIs → Service Layer → Database

We follow a **layered architecture**:

- Routers → Handle HTTP requests
- Services → Business logic
- Models → Database schema
- Dependencies → DB session management

---

## 📂 Important Backend Structure

app/
- models/
  - supplier.py
  - customer.py
  - transaction.py
  - payment.py

- routers/
  - supplier.py
  - customer.py
  - transaction.py
  - payment.py
  - report.py

- services/
  - calculation.py
  - transaction_service.py
  - report_service.py

- config.py
- database.py
- dependencies.py
- main.py

---

## 📊 Core Business Logic

### 💰 Calculation Formula
amount = litres * (fat * rate) / 10

Default rate:
82 per litre at fat = 10

---

## 🔁 Transactions

Single table handles both:
- suppliers
- customers

Using:
- person_id
- person_type ("supplier" or "customer")

---

## 💳 Customer Balance Logic

- When customer buys milk → balance increases
- When payment is made → balance decreases

---

## 📡 Offline Support

- Uses IndexedDB to store transactions locally
- Sync runs periodically when internet is available
- Data is pushed to backend and removed locally after sync

---

## 📱 PWA Support

- Installable on mobile
- Service worker caches static files
- Works offline (UI + local storage)

---

## ⚠️ Important Constraints

- No inline JS handlers (no onclick, oninput)
- Use addEventListener (module-based JS)
- All business logic must be inside services (not routers)
- Avoid duplicating logic in frontend and backend

---

## 🎯 Coding Guidelines for Copilot

When generating code:

1. Follow existing architecture strictly
2. Keep routers thin (no business logic)
3. Put calculations inside services
4. Use async/await for frontend API calls
5. Always validate inputs
6. Do not introduce new frameworks
7. Keep UI mobile-friendly
8. Prefer simple, readable code over complex code

---

## 🧠 Features Already Implemented

- Milk entry (supplier)
- Amount calculation
- Supplier validation
- Daily entry view
- Fortnight report
- IndexedDB offline storage
- Background sync
- PWA install support

---

## 🚀 Upcoming Features

- Add Supplier UI
- Add Customer UI
- Rate configuration UI
- Edit/Delete entries
- Payment tracking UI improvements
- CSV/PDF export
- Authentication (future)

---

## ❌ What to Avoid

- Do NOT use React, Angular, or heavy frameworks
- Do NOT break existing API structure
- Do NOT duplicate DB queries in multiple places
- Do NOT mix business logic into routers

---

## 💡 Goal

The goal is to build a **production-ready system** that:
- Solves a real business problem
- Works offline
- Is simple enough for non-technical users
- Is strong enough to showcase in interviews

---

## 🧑‍💻 Developer Intent

This project is being built to:
- Improve backend + frontend skills
- Learn system design through real-world problems
- Build a strong portfolio project for job interviews

---

## 📌 When answering questions

Copilot should:
- Prefer modifying existing code instead of rewriting
- Keep changes minimal and consistent
- Explain reasoning briefly when needed
- Follow current naming conventions

---