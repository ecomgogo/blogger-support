# Team collaboration within a tenant

A Tenant can have multiple Members, each with a role that gates what they can do. This is scoped within the tenant — members do not cross tenant boundaries.

**Roles**:
- **Author**: Create and edit articles, request AI processing.
- **Editor**: All Author permissions, plus approve/reject AI-processed articles and publish to Blogger.
- **Reviewer**: Read-only access to articles, can leave comments (future).

**Why roles, not flat access**: Even in a content team, not everyone publishes. An Author drafts; an Editor approves and publishes. Separating these prevents accidental publishes and creates an approval gate that aligns with the Article lifecycle's Review state.

**Data model**: A `Member` record links a Supabase user to a Tenant with a role enum. All Article mutations check the caller's membership and role before proceeding.
