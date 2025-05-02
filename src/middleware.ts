import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if needed - important! Do this before checking user.
  await supabase.auth.getSession();

  const { data: { user } } = await supabase.auth.getUser();

  // Define public paths that don't require authentication
  const publicPaths = ['/login']; // Add any other public paths like /signup, /forgot-password

  const requestedPath = request.nextUrl.pathname;

  // Allow access to public paths regardless of auth status
  if (publicPaths.includes(requestedPath)) {
     // If logged-in user tries to access login, redirect them away
     if (user && requestedPath === '/login') {
         return NextResponse.redirect(new URL('/all-applications', request.url));
     }
    return response; // Allow access to public paths
  }

  // If the path is NOT public, check for user authentication
  if (!user) {
    // User is not logged in and trying to access a protected route, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', requestedPath); // Optional: Add redirect param
    return NextResponse.redirect(loginUrl);
  }

  // --- Role-based access control for /admin routes ---
  // This check should happen AFTER confirming the user is logged in
  if (requestedPath.startsWith('/admin')) {
      // Fetch user's role from your profile table
      // IMPORTANT: Ensure 'get_user_role' exists and works correctly server-side.
      // This assumes your profile setup associates auth.uid() with a role.
      const { data: profile, error: profileError } = await supabase
          .from('profile')
          .select('role')
          .eq('id', user.id)
          .single();

      if (profileError || !profile || profile.role !== 'admin') {
          // Redirect non-admins trying to access /admin routes
          // You could redirect to a specific 'access-denied' page or just the default page
          console.warn(`User ${user.email} attempted to access admin route ${requestedPath} without admin role.`);
          return NextResponse.redirect(new URL('/all-applications', request.url)); // Redirect to default page
      }
      // User is admin and accessing an admin route, allow access
  }

  // User is logged in and accessing a non-public, non-admin route (or is an admin accessing admin route), allow access
  return response;
}

// Define paths middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes - if you have any)
     * - auth/ (e.g., Supabase auth callback routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)',
  ],
}; 