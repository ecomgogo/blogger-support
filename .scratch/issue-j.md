## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Enable team collaboration within a tenant. Tenant admins can invite members, assign roles, and manage access. All article operations enforce role-based permissions.

- Add Member table schema and Prisma migration.
- Build invitation flow: admin enters email → creates an invitation record → invitee receives link → on sign-in with matching email, they join the tenant.
- Roles: Author (create/edit/AI), Editor (Author + approve/publish), Reviewer (read-only).
- Permission middleware: tRPC procedures check the caller's role before allowing mutations.
- Admin page: list members, change roles, remove members.
- Article assignment: articles have an optional assignee (member). Author sees "My Articles" filter.
- Editor review queue: a view showing all articles in Review state across the team.

## Acceptance criteria

- [ ] Admin invites a member by email. Invitation link is valid.
- [ ] Invitee signs in with Google (matching email) and automatically joins the tenant with the assigned role.
- [ ] Author can create and edit articles but cannot publish (publish button hidden/disabled).
- [ ] Editor can publish and reject articles in Review.
- [ ] Reviewer sees read-only editor; cannot modify content.
- [ ] Admin can change a member's role from the admin page.
- [ ] Admin can remove a member; removed member can no longer access the tenant.
- [ ] Editor sees a "Review Queue" showing all articles in Review state.
- [ ] Author can filter the article list to "My Articles".

## Blocked by

- [#7](https://github.com/ecomgogo/blogger-support/issues/7) — Article State Machine (for Review state and publish/reject transitions)
