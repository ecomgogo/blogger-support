## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Implement Google OAuth sign-up and login using Supabase Auth, and create a Tenant record on first sign-in. This is the authentication foundation — every other feature depends on knowing who the user is and which tenant they belong to.

- Configure Supabase Auth with Google OAuth provider.
- Create login page with "Sign in with Google" button (shadcn/ui).
- On first sign-in: create a Tenant record linked to the Supabase user ID.
- On subsequent sign-ins: look up the existing Tenant.
- Set up tRPC context middleware to extract tenant_id from the session and inject it into all procedures.
- Create a protected dashboard page (empty for now) that requires authentication.
- Redirect unauthenticated users to the login page.

## Acceptance criteria

- [ ] User clicks "Sign in with Google", completes Google OAuth flow, and lands on the dashboard.
- [ ] First-time sign-in creates a Tenant row in PostgreSQL with the correct Supabase user ID.
- [ ] Returning user sign-in does not create a duplicate Tenant.
- [ ] tRPC context contains the correct tenant_id for the authenticated user.
- [ ] Unauthenticated requests to protected routes redirect to login.
- [ ] Logout clears the session and redirects to login.

## Blocked by

- [#2](https://github.com/ecomgogo/blogger-support/issues/2) — Foundation
