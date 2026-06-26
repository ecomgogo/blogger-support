## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Let users connect their Blogger account to the platform. After signing in, the user grants Blogger API access via Google OAuth (additional scope), and the platform stores the refresh token. The user then selects which of their Blogger blogs to manage.

- Add Blogger OAuth scope to the Google consent screen flow (prompt after initial login, or as part of onboarding).
- Store Google access token + refresh token in the Tenant record (encrypted).
- Build a token refresh utility that automatically refreshes the access token when expired, using the stored refresh token.
- After successful Blogger connection, call Blogger API to list the user's blogs.
- Display the blog list (name, URL, post count) in an onboarding selection UI.
- User selects one blog to connect — creates a Blog record linked to the Tenant.
- Create a "Blogs" sidebar section on the dashboard showing connected blogs.

## Acceptance criteria

- [ ] After Google sign-in, user is prompted to grant Blogger API access.
- [ ] Granting access stores an encrypted refresh token in the Tenant record.
- [ ] Token refresh works: an expired access token is transparently refreshed on next API call.
- [ ] User sees a list of their Blogger blogs and can select one to connect.
- [ ] Connected blog appears in the dashboard sidebar with name and URL.
- [ ] Blogger API calls are authenticated with the user's access token.

## Blocked by

- [#2](https://github.com/ecomgogo/blogger-support/issues/2) — Foundation
- [#3](https://github.com/ecomgogo/blogger-support/issues/3) — Google OAuth + Tenant
