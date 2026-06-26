# Local mirror with last-write-wins sync to Blogger

Every article created in the editor is stored in our PostgreSQL database (the "mirror"). Blogger is treated as a publish target, not the primary data store. When the user publishes, the mirror is pushed to Blogger via the Blogger API. When viewing an existing article, the mirror is populated from Blogger on first access.

**Why mirror, not pass-through**: Blogger API has rate limits and no offline support. AI processing (8 capabilities, multi-model routing) reads the article body repeatedly — hitting Blogger for every AI call would be slow and rate-limited. The mirror lets us work locally and push only on publish.

**Conflict resolution**: Last-write-wins. If Blogger has a newer version than the mirror, the next sync from the editor overwrites it. Rationale: most tenants are solo bloggers or small teams; the complexity of a merge UI does not pay for itself in this domain. We can introduce soft-locking later if team-collaboration usage demands it.
