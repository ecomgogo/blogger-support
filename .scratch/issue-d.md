## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Build the article editor — the core UI of the platform. Users can create new articles and edit existing ones using a Milkdown Markdown editor with live preview and auto-save. Articles start as Drafts.

- Install and configure Milkdown editor with common plugins (markdown shortcuts, live preview toggle).
- Create article list page: shows all articles for the selected blog with status badges (Draft/Processing/Review/Published/Archived).
- "New Article" button: creates a blank draft with a default title, opens editor.
- Editor page: Milkdown editor on the left, live preview on the right. Responsive layout.
- Auto-save: debounced save to PostgreSQL mirror on every change.
- Article CRUD: create, read, update title/content, delete draft articles.
- Label assignment: user can add/remove Blogger labels to an article (basic tag input).
- Image upload: user can paste or drag images into the editor; images are uploaded via Blogger API and the URL is inserted into the Markdown.
- All operations are scoped to the current tenant and blog.

## Acceptance criteria

- [ ] User sees a list of articles (empty state: "No articles yet — create your first one").
- [ ] Clicking "New Article" opens the editor with a blank draft. Title is editable.
- [ ] Typing in the editor auto-saves to PostgreSQL within 2 seconds of stopping.
- [ ] Closing and reopening a draft restores the saved content.
- [ ] Markdown preview shows rendered HTML in real time.
- [ ] User can add and remove labels via a tag input below the title.
- [ ] User can paste an image into the editor. Image is uploaded to Blogger and a Markdown image tag is inserted.
- [ ] Deleting a draft removes it from the list.
- [ ] Article list shows the correct status badge for each article.

## Blocked by

- [#3](https://github.com/ecomgogo/blogger-support/issues/3) — Google OAuth + Tenant
- [#4](https://github.com/ecomgogo/blogger-support/issues/4) — Blogger Connection
