# PRD: Blogger Support — AI-Powered Blog Management SaaS

## Problem Statement

Google Blogger users manage their blogs through Blogger's native web interface, which offers a basic rich-text editor with no AI assistance. Writing high-quality, SEO-optimized articles requires switching between Blogger, external writing tools, SEO analyzers, and translation services. For users managing multiple blogs or working in teams, there is no unified dashboard — every blog is a separate browser tab. The publishing workflow is entirely manual: compose in the editor, manually check SEO, manually polish language, and hit publish. There is no draft-review-publish collaboration flow, no AI augmentation, and no content pipeline.

## Solution

Blogger Support is a SaaS web application that connects to users' Google Blogger accounts via OAuth and provides:

- A **Markdown editor** (Milkdown) for composing and editing articles, with live preview.
- **8 AI-powered capabilities**: grammar polish, tone/style rewrite, paragraph restructure/expansion, SEO keyword suggestions, SEO title/meta generation, full SEO optimization, translation, and image alt-text generation — routed across multiple LLM providers (Claude + GPT-4o) optimized per task.
- **Local mirror storage** in PostgreSQL so AI processing and editing happen without Blogger API rate limits. Articles sync to Blogger on publish via last-write-wins.
- **Multi-blog management**: one Google account can manage multiple Blogger blogs from a single dashboard.
- **Team collaboration**: tenants can invite members with Author, Editor, or Reviewer roles. Authors draft and request AI processing; Editors approve and publish.
- **Freemium pricing**: free tier with monthly credit limits; paid tiers unlock all 8 AI capabilities and higher usage quotas.
- **Enhanced labels**: article labels stored locally with optional SEO metadata (e.g. label-page meta descriptions), synced to Blogger's native label system.

## User Stories

### Authentication & Onboarding

1. As a new user, I want to sign up with my Google account, so that I don't need to create yet another password.
2. As a returning user, I want to log in with Google and land on my dashboard, so that I can continue where I left off.
3. As a new tenant, I want to grant Blogger API access during onboarding, so that the platform can read and write my blog posts.
4. As a tenant admin, I want to select which of my Blogger blogs to connect, so that I only expose relevant blogs to the platform.

### Blog Management

5. As a blogger, I want to see all my connected blogs in a sidebar, so that I can switch between them quickly.
6. As a blogger, I want to connect an additional Blogger blog to my account, so that I can manage multiple blogs from one dashboard.
7. As a blogger, I want to disconnect a blog, so that it no longer appears in my workspace.

### Article Writing & Editing

8. As an author, I want to create a new article in a Markdown editor with live preview, so that I can write and see the formatted result simultaneously.
9. As an author, I want the editor to auto-save my draft, so that I never lose my work.
10. As an author, I want to see a list of my existing articles with their status (draft/review/published), so that I know what needs my attention.
11. As an author, I want to open an existing article for editing, so that I can update published posts or continue working on drafts.
12. As an author, I want to assign labels to my article, so that my blog stays organized.
13. As an author, I want to upload images via the editor (writing into Blogger's image hosting), so that my articles have visuals.

### AI Capabilities

14. As an author, I want to click "Polish" to have AI correct grammar and improve fluency, so that my writing is cleaner.
15. As an author, I want to select a tone (formal/casual/professional/humorous) before AI rewrites a passage, so that the output matches my voice.
16. As an author, I want to select a paragraph and ask AI to expand or condense it, so that I can adjust article depth without manually rewriting.
17. As an author, I want AI to suggest target keywords for my article based on its content, so that I can improve my SEO strategy.
18. As an author, I want AI to generate an SEO-optimized title and meta description, so that my article ranks better in search results.
19. As an author, I want to trigger a full-SEO optimization pass that rewrites content for a target keyword, so that I can compete for specific search terms.
20. As an author, I want to translate my article into another language and save it as a separate article, so that I can reach a multilingual audience.
21. As an author, I want AI to scan images in my article and generate descriptive alt text, so that my images contribute to SEO.
22. As an author, I want to see a diff between my original text and the AI-processed version, so that I can accept or reject changes.
23. As an author, I want to see my remaining AI credits, so that I know when I'll hit my limit.

### Article Lifecycle & Publishing

24. As an author, I want to submit my draft for AI processing with one click, so that the article enters the Processing state automatically.
25. As an author, I want the article to enter "Review" state after AI completes, so that I can inspect the result before publishing.
26. As an editor, I want to approve and publish an article to Blogger with one click, so that the content goes live immediately.
27. As an editor, I want to reject an AI-processed article and send it back to draft, so that the author can revise it.
28. As an editor, I want to archive a published article (removing it from Blogger but keeping it locally), so that my blog stays current without losing content.

### Team Collaboration

29. As a tenant admin, I want to invite a team member by email, so that they can join my workspace.
30. As a tenant admin, I want to assign a role (Author/Editor/Reviewer) when inviting, so that permissions are correct from day one.
31. As a tenant admin, I want to change a member's role or remove them, so that access stays up to date.
32. As an author, I want to see which articles are assigned to me, so that I know what to work on.
33. As an editor, I want to see all articles in "Review" state across the team, so that I can prioritize my approvals.

### Billing & Plans

34. As a free-tier user, I want to see how many AI credits I have remaining this month, so that I can plan my usage.
35. As a free-tier user approaching the limit, I want to see an upgrade prompt, so that I can move to a paid plan.
36. As a paid user, I want unlimited access to all AI capabilities, so that I'm not constrained in my workflow.
37. As a tenant admin, I want to manage my subscription (upgrade/downgrade/cancel), so that I control my costs.

### Synchronization

38. As an author, I want my published articles to sync one-way to Blogger (local → Blogger), so that changes I make in the editor appear on my blog.
39. As an author, I want to pull an existing Blogger article into the editor, so that I can improve posts created outside this platform.
40. As an author, I want to be warned if the Blogger version is newer than my editor version before I overwrite it, so that I don't accidentally clobber changes made elsewhere.

## Implementation Decisions

### Architecture

- **Monorepo Next.js application**: Single project containing frontend (React + shadcn/ui + Tailwind CSS) and backend (tRPC API routes). No separate frontend/backend deployables.
- **tRPC for API communication**: End-to-end TypeScript types from database (Prisma) through to the client. Each domain area gets its own tRPC router.
- **Prisma ORM with PostgreSQL**: Schema-first, migration-managed. All tenant-scoped tables carry a `tenant_id` foreign key.

### Multi-tenancy

- **Shared table with tenant_id column**: Every tenant-scoped row includes `tenant_id`. Middleware on tRPC context injects the current tenant ID from the authenticated session.
- **Supabase Row-Level Security**: PostgreSQL RLS policies enforce tenant isolation at the database layer as a second safety net.
- **One tenant = one Google OAuth account**: Each registered SaaS account links to exactly one Google account (which may own multiple Blogger blogs).

### Blogger Integration

- **Backend OAuth with refresh token**: Google OAuth token (including refresh token) is stored in PostgreSQL. Server-side API calls use the current valid access token, refreshing automatically when expired. This enables "auto-publish" background tasks without the user being online.
- **Local mirror architecture**: When a user opens an article, the system fetches it from Blogger and stores a mirror row locally. All editing and AI processing operate on the mirror. On publish, the mirror is pushed back to Blogger via the API.
- **Last-write-wins sync**: If the Blogger version is newer than the mirror, the next editor save overwrites it. The system warns before overwriting but does not enforce merge resolution.
- **Blogger image hosting**: Images uploaded in the editor are posted to Blogger's image hosting via the Blogger API, so the platform incurs no image storage cost.

### AI Integration

- **Multi-model routing**: An `AIService` abstraction routes each of the 8 capabilities to the optimal model. Initial routing: Claude for long-form text tasks (polish, rewrite, restructure); GPT-4o for structured/SEO tasks (keywords, meta, translation); vision-capable model for alt-text.
- **Credit system**: Each AI call consumes credits from the tenant's monthly allowance. The credit cost varies by capability (translation is more expensive than polish). Free tier gets a fixed monthly allocation.

### Team Collaboration

- **Roles**: Author (create/edit/AI), Editor (Author + approve/publish), Reviewer (read-only, comment-ready for future).
- **Member invitation**: Tenant admin invites by email. Invitee must have a Google account and sign in. Membership is tenant-scoped.

### Article State Machine

```
Draft ──→ Processing ──→ Review ──→ Published ──→ Archived
  ↑                         │                         │
  └─────────────────────────┘                         │
  (reject back to draft)                              │
                                                      │
  ┌───────────────────────────────────────────────────┘
  │ (unpublish → archived)
```

Allowed transitions:
- Draft → Processing: User clicks "AI Polish" or any AI action
- Processing → Review: AI completes all requested actions
- Review → Published: Editor approves and publishes to Blogger
- Review → Draft: Editor rejects, returns for revision
- Published → Archived: Editor removes from Blogger
- Archived → Draft: User restores for rework

## Testing Decisions

### What makes a good test

- Test external behavior through tRPC procedure calls, not React component internals or database queries directly.
- Mock the AI service and Blogger API adapter at the boundary; use a real PostgreSQL (Supabase local) for database-dependent tests.
- Every test that touches tenant-scoped data must assert that cross-tenant access is denied.

### Test seam: tRPC Router layer

The primary test surface is the tRPC procedure. A test:
1. Creates an authenticated context with a known tenant ID and user role.
2. Calls the procedure with test input.
3. Asserts the response and any database side effects.

This one seam covers authentication → authorization → business logic → persistence for every operation.

### Test seam: AI Service

Mock the `AIService` interface to return fixed AI responses. Tests assert:
- The correct model is selected for each capability.
- The prompt sent to the model includes the necessary context (article content, target language, etc.).
- Credit deduction happens on successful AI calls.
- Graceful degradation when a provider returns an error (fallback to secondary model).

### Test seam: Blogger API Adapter

Mock the `BloggerService` interface. Tests assert:
- Sync push writes the correct article body, title, and labels.
- Sync pull populates the mirror correctly.
- Last-write-wins detection triggers a warning when Blogger timestamp > mirror timestamp.
- Token refresh is attempted on 401 responses.

### Database tests

Use a real PostgreSQL instance (Supabase local or test project). Tests assert:
- RLS policies reject queries without the correct tenant_id.
- Cascading deletes (e.g., removing a blog cleans up its articles).
- Unique constraints on (tenant_id, slug) and similar compound keys.

## Out of Scope

- **CRM / lead capture**: Forms embedded in Blogger articles, lead collection, and customer relationship management. Deferred until the core blog management system is stable.
- **Content calendar / scheduling**: Planning articles on a calendar view and scheduling future publishes. The first version publishes immediately.
- **Batch import/export**: Bulk importing articles from other platforms or exporting to static files.
- **Custom domains / themes**: Blogger theme editing or custom domain configuration. The platform manages content only.
- **Analytics dashboard**: Page views, traffic sources, or reader engagement metrics. Blogger's own analytics remain the source of truth.
- **Comments management**: Reading, moderating, or replying to Blogger comments.
- **Email notifications**: Notifying members of review assignments, publish events, or credit exhaustion.
- **Mobile native app**: The application is a responsive web app only.

## Further Notes

- The Blogger API v3 is the sole integration surface with Google Blogger. It supports CRUD for posts, pages, comments, and media uploads. Posts map to our Article concept; pages are out of scope for MVP.
- Google OAuth scopes required: `https://www.googleapis.com/auth/blogger` for reading/writing posts, and `https://www.googleapis.com/auth/userinfo.email` for identity.
- Blogger API quotas: 100 requests per 100 seconds per user. The mirror architecture is designed to stay well within this limit by minimizing API calls.
- Milkdown editor supports collaborative editing extensions (Yjs), which could enable real-time collaboration in a future iteration.
- The ADR set (docs/adr/0001–0006) contains the rationale for all architectural decisions referenced in this PRD.
