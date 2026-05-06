# Cafe Management System

A full-stack cafe and restaurant management platform built with React, Vite, TypeScript, Express, Prisma, and PostgreSQL.

## Overview

This workspace contains a split frontend/backend application for managing cafe operations, including:

- Branch and user management
- Menu categories, items, and variants
- Order creation and tracking
- Inventory, supplier, and purchase batch management
- Daily usage recording
- Role-based dashboards and access control
- Reporting and analytics views

## Architecture

- `client/` — React + Vite frontend
- `server/` — Express backend with Prisma ORM and PostgreSQL
- `server/prisma/` — database schema, migrations, and seed data

## Features

- Role-based access for `super_admin`, `branch_admin`, `waiter`, `cashier`, `chef`, and `store_manager`
- Super admin branch, menu, inventory, supplier, and user management
- Order creation and order history for operational staff
- Inventory tracking, purchase approvals, and daily usage logging
- Reporting dashboard for branch and admin insights
- Authentication, password reset, and user profile management
- Cloudinary file uploads for media handling

## Getting Started

### Backend

1. Open a terminal in `server/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the required values. Typical keys include:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Run the backend:
   ```bash
   npx tsx src/index.ts
   ```

### Frontend

1. Open a terminal in `client/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the frontend development server:
   ```bash
   npm run dev
   ```

## Folder Structure

- `client/src/` — React pages, components, hooks, and API integration
- `server/src/` — Express routes, controllers, middleware, and validation
- `server/prisma/` — Prisma schema and migration history
- `server/lib/` — database client and Cloudinary helpers

## Development Notes

- The frontend expects the backend API to be available at `http://localhost:5000`
- The server currently loads `server/.env` for database and cloud configuration
- Prisma migrations are stored in `server/prisma/migrations`

## Recommended Workflow

- Start the backend first
- Start the frontend after backend is running
- Use the role-based dashboard routes to test different access levels
