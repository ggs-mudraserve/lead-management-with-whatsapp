# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Environment Setup
- Copy `.env.local.example` to `.env.local` and update with actual values
- Required environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture Overview

### Core Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI Framework**: Material-UI (MUI) v7 with Emotion styling
- **Backend**: Supabase (PostgreSQL database with RLS, auth, storage)
- **State Management**: TanStack React Query for server state, React Hook Form for forms
- **Deployment**: PM2 with ecosystem.config.js (production on port 3000)

### Application Structure
This is a lead and bank application management system with role-based access control:

- **Authentication**: Supabase Auth with middleware-based session management
- **Authorization**: Role-based access (`admin` role for /admin routes) with RLS policies
- **Data Privacy**: Mobile number masking after configurable days (default: 20)
- **User Segments**: PL, BL, PL_DIGITAL, BL_DIGITAL for different business lines

### Key Data Entities
- **Leads**: Primary entity with associated documents, notes, and missed opportunities
- **Bank Applications**: Created from leads, with separate workflow and notes
- **Users**: Profile system with roles, teams, and activity tracking
- **Documents**: File storage in Supabase buckets with access controls

### Database Architecture
- **Views**: `v_all_applications`, `v_disbursed_applications` for aggregated data
- **Functions**: Complex business logic like `get_all_filtered_applications`, `can_user_access_lead`
- **RLS Policies**: Comprehensive row-level security for all tables
- **Triggers**: Auto-assignment of leads to owners, status updates
- **Cron Jobs**: Daily cleanup of stale owner assignments

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable UI components and layout
- `src/lib/supabase/` - Database client, types, and query functions
- `src/context/` - React contexts for auth and error handling
- `schema.md` - Complete database schema documentation

### Data Access Patterns
- All database queries use typed Supabase client in `src/lib/supabase/queries/`
- RLS policies enforce access control server-side
- Custom database functions handle complex authorization logic
- Real-time subscriptions available via `src/lib/supabase/realtime.ts`

### Security Model
- Middleware enforces authentication and role-based routing
- Inactive users are automatically signed out
- Admin-only routes protected at middleware level
- Document access controlled via RLS and storage policies
- Session refresh handled automatically in middleware

## Configuration

### Data Privacy
- `NEXT_PUBLIC_MOBILE_MASKING_DAYS`: Days after which mobile numbers are masked for non-admin users

### Development Notes
- Uses strict TypeScript with database types generated from Supabase
- ESLint configured with Next.js core web vitals and TypeScript rules
- Sentry integration for error tracking
- Performance optimizations with debounced functions and query caching