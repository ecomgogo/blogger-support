## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Implement the full article lifecycle state machine. Articles transition through Draft → Processing → Review → Published → Archived, with all allowed transitions enforced.

- Implement state machine in the Article service layer with these transitions:
  - Draft → Processing (user triggers AI action)
  - Processing → Review (AI completes)
  - Review → Published (editor approves, publishes to Blogger)
  - Review → Draft (editor rejects, returns for revision)
  - Published → Archived (editor removes from Blogger but keeps locally)
  - Archived → Draft (restore for rework)
- Update article list to show status badges and filter by status.
- Add status transition buttons to the editor (context-sensitive: only show valid next states).
- Update the publish flow from Issue #6 to go through Review → Published transition.
- Archived articles: removed from Blogger via API, but mirror row kept with status Archived.

## Acceptance criteria

- [ ] Article status is displayed as a badge in the article list (color-coded per state).
- [ ] Only valid transitions are offered as buttons in the editor.
- [ ] Clicking "Submit for AI" moves Draft → Processing (even if AI isn't built yet — placeholder).
- [ ] Processing → Review transition works (AI completion trigger).
- [ ] Editor clicks "Approve & Publish" → article moves to Published and appears on Blogger.
- [ ] Editor clicks "Reject" → article returns to Draft.
- [ ] Editor clicks "Archive" on a Published article → removed from Blogger, status becomes Archived.
- [ ] User can restore an Archived article back to Draft.
- [ ] Invalid transitions are rejected at the API layer (e.g., cannot jump from Draft directly to Published).

## Blocked by

- [#6](https://github.com/ecomgogo/blogger-support/issues/6) — Publish to Blogger
