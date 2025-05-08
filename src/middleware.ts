import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Create a matcher for public routes that don't require authentication
const publicRoutes = createRouteMatcher([
  '/',
  '/subscribe/:path*',
  '/api/open/:path*',
  '/api/webhooks/:path*'
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is in the public routes, allow access
  if (publicRoutes(req)) {
    return;
  }
  
  // Otherwise, protect the route - require authentication
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.[^?]*$).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 