# Blogger Support

A SaaS platform that lets users manage their Google Blogger blogs with AI-powered writing, SEO optimization, and automated publishing.

## Language

**Tenant**:
A registered SaaS account linked to a Google account via OAuth, representing one customer of the platform.
_Avoid_: Account, workspace, organization

**Blog**:
A Google Blogger blog connected to a Tenant. Blogger API allows a single Google account to own multiple blogs.
_Avoid_: Site, website, channel

**Member**:
A user who collaborates within a Tenant, with a role (Author, Editor, Reviewer) determining their permissions.
_Avoid_: User (ambiguous — use when referring to authenticated identity, not tenant membership), collaborator

**Article**:
A piece of content managed in the editor, with a lifecycle state. Stored locally as a mirror and synced to Blogger on publish.
_Avoid_: Post (Blogger API uses "post" — map to Article internally), page, entry

**Mirror**:
A local PostgreSQL copy of a Blogger article. The system reads from and writes to the mirror; Blogger is updated on publish.
_Avoid_: Cache, snapshot

**Sync**:
The push/pull operation between a local Mirror and its corresponding Blogger article. Conflicts resolve via last-write-wins.
_Avoid_: Import/export, upload/download

**Label**:
An article classification tag. Stored locally with optional SEO metadata (e.g. label-level meta description), then synced to Blogger's native label system.
_Avoid_: Tag, category, topic

**Credit**:
A unit of AI processing allowance. Free tier tenants get a monthly allocation; paid tiers get higher or unlimited credits.
_Avoid_: Token (ambiguous with LLM tokens), quota

## Article lifecycle

```
Draft → Processing → Review → Published → Archived
```

- **Draft**: Initial state, not yet submitted to AI.
- **Processing**: AI is actively polishing.
- **Review**: AI complete, awaiting user confirmation. User can edit further.
- **Published**: Synced to Blogger and live.
- **Archived**: Removed from Blogger but retained locally.
