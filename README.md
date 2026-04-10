# 🏨 LuxStay — Hotel Management System

A full-stack Next.js hotel management app converted from Java/JavaFX. Modern dark luxury UI deployable on **Vercel**, **Render**, and **Railway**.

## ✨ Features
- 🔐 JWT Auth (Admin / Staff / Manager roles)
- 🏠 Room management — add, edit price, delete
- 📋 Bookings — new booking, checkout, invoice
- 👤 Guest history
- 🧹 Housekeeping — visual room grid with status tracking
- 📊 Reports — revenue charts, room-type breakdown

**Demo credentials:** `admin / hotel123` · `staff / staff123` · `manager / mgr123`

## 🚀 Local Setup

```bash
npm install
cp .env.example .env.local   # fill in MySQL credentials
npm run dev                   # → http://localhost:3000
```

Tables and seed data are auto-created on first run.

## ☁️ Deploy

### Vercel
```bash
npm i -g vercel && vercel
# Set DATABASE_URL and JWT_SECRET in Vercel dashboard
```

### Railway (includes MySQL)
```bash
npm i -g @railway/cli
railway login && railway init && railway up
# Add MySQL plugin in Railway dashboard → auto-injects DATABASE_URL
# Add: JWT_SECRET=... and NEXT_OUTPUT=standalone
```

### Render
- Connect GitHub repo → Web Service → Docker runtime
- Set env vars: `DATABASE_URL`, `JWT_SECRET`, `NEXT_OUTPUT=standalone`
- Use an external MySQL (PlanetScale / Aiven free tier)

## Required Env Vars

```env
DATABASE_URL=mysql://user:password@host:3306/hotel_db
JWT_SECRET=your-long-random-secret
NEXT_OUTPUT=standalone   # needed for Railway/Render Docker builds
```

## Project Structure

```
app/
  page.tsx              # Login
  dashboard/layout.tsx  # Sidebar + tab routing
  api/                  # auth, rooms, bookings, customers, housekeeping, dashboard, reports
components/             # DashboardPage, RoomsPage, BookingsPage, CustomersPage, HousekeepingPage, ReportsPage
lib/
  db.ts                 # MySQL auto-schema + seeding
  auth.ts               # JWT helpers
Dockerfile              # For Railway/Render
railway.toml
render.yaml
vercel.json
```

## Stack
Next.js 15 · MySQL 8 (mysql2) · JWT auth · Custom CSS luxury dark theme
