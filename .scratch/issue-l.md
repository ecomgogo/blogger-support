## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Allow tenants to manage multiple Blogger blogs from one dashboard. Users can connect additional blogs and switch between them.

- "Add Blog" button in the sidebar: triggers Blogger blog selection flow (reuses the blog list UI from Issue #4).
- Blog switcher: dropdown or list in the sidebar showing all connected blogs with the active one highlighted.
- All article operations (list, create, edit, publish) are scoped to the currently selected blog.
- Disconnect blog: admin can remove a blog connection. All articles for that blog are soft-deleted (archived locally, not deleted from Blogger).
- Blog-level settings: each blog has its own default language, default SEO settings.
- Article list and dashboard reflect the currently selected blog only.

## Acceptance criteria

- [ ] User with one connected blog sees "Add Blog" button in the sidebar.
- [ ] Clicking "Add Blog" shows the user's remaining unconnected Blogger blogs.
- [ ] Selecting a second blog connects it and switches the active view to that blog.
- [ ] Switching between blogs in the sidebar changes the article list to show only that blog's articles.
- [ ] Creating an article is scoped to the active blog.
- [ ] Disconnecting a blog archives its articles and removes the blog from the sidebar.
- [ ] Each blog can have independent settings (language, default SEO).

## Blocked by

- [#4](https://github.com/ecomgogo/blogger-support/issues/4) — Blogger Connection
