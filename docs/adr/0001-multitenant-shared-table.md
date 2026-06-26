# SaaS multi-tenant with shared-table isolation

The platform serves multiple independent tenants (each linked to a Google account). We use shared PostgreSQL tables with a `tenant_id` column on every tenant-scoped row, plus Supabase Row-Level Security to enforce isolation at the database layer.

**Considered Options**:
- *Schema-per-tenant*: Strongest isolation but Prisma does not support dynamic schemas — would require connection-per-schema shenanigans.
- *Database-per-tenant*: Total isolation but connection-pool explosion and cross-tenant analytics become painful.

**Why shared-table**: Prisma supports it natively. Supabase RLS adds a second fence beyond application-level filtering. If a specific tenant later requires physical isolation, we can migrate them to their own database without redesigning the rest of the system.
