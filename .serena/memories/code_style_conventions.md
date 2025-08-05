# Code Style and Conventions

## TypeScript Standards
- Strict TypeScript configuration
- Database types generated from Supabase
- Strong typing throughout the application

## Code Organization
- App Router structure with co-located components in `_components` folders
- Shared components in `src/components/`
- Database queries organized in `src/lib/supabase/queries/`
- Utilities in `src/lib/utils/` and `src/utils/`

## File Naming Conventions
- kebab-case for files and directories
- Component files use PascalCase for React components
- API routes follow REST conventions

## Component Structure
- Functional components with TypeScript
- React Hook Form for form handling
- TanStack React Query for server state
- Material-UI components with consistent theming

## Database Access Patterns
- All queries use typed Supabase client
- RLS policies enforce access control
- Custom database functions for complex logic
- Real-time subscriptions when needed

## Security Practices
- Middleware enforces authentication
- Role-based access control
- No hardcoded secrets in code
- Proper error handling with ErrorContext