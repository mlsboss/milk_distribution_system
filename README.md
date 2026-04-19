# Milk Distribution System

A small web app for managing daily milk collection and delivery records. I built it around the workflow of a local dairy: add suppliers and customers, record morning/evening milk entries, manage rates, track customer balances, record payments, and generate simple reports.

The app is intentionally lightweight. The frontend is plain HTML, CSS, and JavaScript. The backend is FastAPI with SQLAlchemy, and it can run locally with SQLite or in the cloud with Postgres.

## What It Does

- Supplier milk entry with litres, fat, milk type, shift, and calculated amount
- Customer milk entry using the configured customer milk rate
- AM/PM shift tracking
- Supplier and customer management
- Customer balance tracking
- Payment settlement
- Dairy sale entries
- Reports with AM, PM, and combined totals
- PWA support for installing from Android Chrome

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: FastAPI
- Database: SQLite locally, Postgres in production
- ORM: SQLAlchemy
- Mobile install: PWA
- Suggested deployment:
  - Frontend: Cloudflare Pages
  - Backend: Render Free Web Service
  - Database: Neon Free Postgres

## Project Structure

```text
frontend/
  index.html
  app.js
  styles.css
  config.js
  pwa/

backend/
  app/
    main.py
    models/
    routers/
    services/
  requirements.txt
  runtime.txt

render.yaml
```

## Local Setup

Start the backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Start the frontend from the project root:

```bash
cd frontend
python -m http.server 5500
```

Open:

```text
http://127.0.0.1:5500
```

## Cloud Setup

### 1. Create Neon Database

Create a free Neon project and copy the Postgres connection string.

Use it as the backend `DATABASE_URL`.

### 2. Deploy Backend On Render

This repo includes `render.yaml`, so Render can detect the backend settings.

Render settings:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Environment variables:

```text
DATABASE_URL=<your Neon Postgres URL>
FRONTEND_ORIGINS=<your Cloudflare Pages URL>
```

For early testing, `FRONTEND_ORIGINS=*` is okay. For a public project, set it to the exact Cloudflare Pages URL.

### 3. Deploy Frontend On Cloudflare Pages

Cloudflare Pages settings:

```text
Build command: node frontend/build-config.js
Build output directory: frontend
```

Environment variable:

```text
MILK_API_URL=https://your-render-backend.onrender.com
```

The build script writes `frontend/config.js`, so the deployed frontend knows where the API lives.

## Android Install

After deploying the frontend:

1. Open the Cloudflare Pages URL in Android Chrome.
2. Use the browser menu.
3. Tap **Install app** or **Add to Home screen**.

The app will open like a basic mobile application and will use the cloud backend/database.

## Notes

Render Free is good for a demo or small personal project, but it can sleep after inactivity. The first request after sleep can be slow.

Do not use a local SQLite file on Render for real records. Render's free filesystem is not persistent. This project is set up to use Neon Postgres in production.

## Status

The app is usable for core dairy entry workflows. I still want to improve the UI for small screens and add a cleaner login/user system before using it for anything sensitive.
