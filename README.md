# Modern Dashboard Module

Full-stack dashboard with Order and Return modules, dark SaaS UI, external CSS, and admin management.

## Tech Stack

- Frontend: React + Vite + React Router + Axios
- Backend: Node.js + Express + MongoDB + JWT + express-validator

## Folder Structure

- `client`: React application
- `server`: Express API with MongoDB models/controllers/routes/middleware

## Setup

### 1) Backend

1. Copy `server/.env.example` to `server/.env`
2. Fill values:
   - `MONGO_URI`
   - `JWT_SECRET`
3. Run:
   - `cd server`
   - `npm install`
   - `npm run dev`

### 2) Frontend

1. Copy `client/.env.example` to `client/.env`
2. Run:
   - `cd client`
   - `npm install`
   - `npm run dev`

## Authentication

- Admin registration is disabled.
- Fixed admin is auto-created/updated on server start using:
  - `ADMIN_EMAIL` (default: `uttam306115@gmail.com`)
  - `ADMIN_PASSWORD` (default: `uttam@2004`)
  - `ADMIN_NAME` (default: `Uttam Admin`)
- Login from UI route `/admin/login` or API `POST /api/auth/login`

## API Endpoints

- Orders:
  - `POST /api/orders`
  - `GET /api/orders` (admin JWT)
  - `PATCH /api/orders/:id/status` (admin JWT)
- Returns:
  - `POST /api/returns`
  - `GET /api/returns` (admin JWT)
  - `PATCH /api/returns/:id/status` (admin JWT)
- Dashboard:
  - `GET /api/dashboard/summary` (admin JWT)

## Features Included

- Order form with dynamic "Other" product field
- Return form with dynamic "Other" reason field
- Full client and server validation
- Admin protected dashboard
- Status update workflows (orders + returns)
- Search, status filters, sorting, pagination tables
- Summary cards for total/pending/delivered/returns
- Responsive glassmorphism dark UI (external CSS only)
