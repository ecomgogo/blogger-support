# Vercel + Supabase for hosting and data

The Next.js application is deployed on Vercel. PostgreSQL, authentication, and Row-Level Security are provided by Supabase.

**Why Vercel**: Native Next.js support (edge functions, ISR, image optimization), zero-config deploys from git, and generous free tier. The platform is designed for Next.js — there is no dockerfile, no reverse-proxy config, no server maintenance.

**Why Supabase**: Managed PostgreSQL with built-in Google OAuth provider, Row-Level Security, and a free tier that covers early-stage SaaS. The Supabase JS client works server-side in Next.js API routes and client-side for real-time features if needed later. Keeping auth and data in the same service reduces the number of integrations to maintain.

**Considered alternative**: Self-hosting on a VPS via Docker Compose. Rejected for MVP because the operational overhead (database backups, uptime monitoring, TLS certs) does not differentiate the product.
