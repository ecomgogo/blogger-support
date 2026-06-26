## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Connect the local article mirror to Google Blogger. When a user publishes an article, push it to Blogger. Allow pulling existing Blogger articles into the editor. Handle sync conflicts with last-write-wins.

- Implement BloggerService adapter: push article to Blogger API (create or update post), pull article from Blogger API.
- Mirror table: store article_id, blogger_post_id, title, content, labels, status, timestamps.
- Publish action: user clicks "Publish" on a draft → article is pushed to Blogger → Blogger post ID is stored in the mirror → article status becomes Published.
- Pull action: on the article list, "Import from Blogger" button → lists unmirrored Blogger posts → user selects one → creates a mirror with status Published.
- Conflict detection: before pushing, compare mirror.updated_at with Blogger post.updated. If Blogger is newer, warn the user before overwriting.
- Label sync: labels assigned in the editor are applied to the Blogger post on publish.
- All Blogger API calls go through the token refresh utility from Issue #4.

## Acceptance criteria

- [ ] User publishes a draft article; it appears on their live Blogger blog with the correct title, content, and labels.
- [ ] Re-publishing an already-published article updates the live Blogger post.
- [ ] User imports an existing Blogger article; it appears in the article list and can be opened in the editor.
- [ ] If the Blogger version is newer than the mirror, user sees a warning before overwriting.
- [ ] Blogger API rate limits (100 req/100s per user) are not exceeded during a normal editing session.

## Blocked by

- [#4](https://github.com/ecomgogo/blogger-support/issues/4) — Blogger Connection
- [#5](https://github.com/ecomgogo/blogger-support/issues/5) — Draft Editor
