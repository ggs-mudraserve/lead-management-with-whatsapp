# Project Overview

## Purpose
Lead and Bank Application Management System - A comprehensive CRM for managing leads, bank applications, and user workflows with role-based access control.

## Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI Framework**: Material-UI (MUI) v7 with Emotion styling
- **Backend**: Supabase (PostgreSQL database with RLS, auth, storage)
- **State Management**: TanStack React Query for server state, React Hook Form for forms
- **Deployment**: PM2 with ecosystem.config.js (production on port 3000)

## Key Features
- Role-based access control (admin role for /admin routes)
- Lead management with documents, notes, and missed opportunities
- Bank application workflow
- Daily task system
- Real-time updates
- Data privacy with mobile number masking
- User segments: PL, BL, PL_DIGITAL, BL_DIGITAL

## Architecture
- App Router structure with nested layouts
- Middleware-based authentication and authorization
- RLS policies for data security
- Database functions for complex business logic
- Real-time subscriptions available