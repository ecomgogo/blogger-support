# Next.js full-stack with tRPC, Prisma, and shadcn/ui

The application is a single Next.js project containing both the React frontend and the API layer. tRPC provides end-to-end type safety between the client and server. Prisma is the ORM for PostgreSQL. shadcn/ui + Tailwind CSS provides the component library.

**Why Next.js over separate frontend/backend**: NextAuth.js / Supabase Auth helpers for Google OAuth, single deployment target (Vercel), and no CORS/API-contract overhead between frontend and backend teams (there is one team).

**Why tRPC over REST/GraphQL**: This is a content-editing SaaS with well-defined CRUD + AI-action operations. tRPC's end-to-end types eliminate an entire class of "frontend sent the wrong shape" bugs without requiring GraphQL's query-language complexity.

**Why Prisma**: First-class TypeScript support, migration tooling built in, and Supabase PostgreSQL compatibility. Drizzle was considered but Prisma's migration DX and ecosystem maturity won.

**Why shadcn/ui**: Component ownership (code lives in our repo, not node_modules), Tailwind-native, and the Radix UI primitives underneath handle accessibility. Easy to replace individual components later.
