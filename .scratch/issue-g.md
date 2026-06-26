## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Build the AI service abstraction layer, the credit system, and the first AI capability: grammar polish. This establishes the pattern that all subsequent AI capabilities follow.

- Create AIService interface with methods for each capability (polish, rewrite, restructure, suggestKeywords, generateSEO, fullSEO, translate, generateAltText).
- Implement model routing: Claude for long-form text tasks, GPT-4o for structured/SEO tasks.
- Create CreditService: deduct credits on AI call, track usage per tenant per month, enforce free tier limits.
- Build the "Polish" flow end-to-end:
  - User selects text in the editor (or entire article), clicks "Polish".
  - Article state moves to Processing.
  - tRPC procedure calls AIService.polish() with the article content.
  - AI response is returned; diff view shows original vs polished text with inline changes highlighted.
  - User accepts → content replaces original, credits deducted, status → Review.
  - User rejects → content unchanged, no credits deducted, status → Draft.
- Credit display in the UI header: "X credits remaining this month".
- Graceful degradation: if primary model fails, fall back to secondary model.

## Acceptance criteria

- [ ] AIService routes polish requests to Claude.
- [ ] User selects text, clicks "Polish", article moves to Processing.
- [ ] AI-polished text is shown in a diff view (original vs suggested).
- [ ] Accepting the polish updates the article content, deducts 1 credit, moves to Review.
- [ ] Rejecting the polish leaves the article unchanged, costs nothing, returns to Draft.
- [ ] Credit count in the header decrements after accepting.
- [ ] Free tier user with 0 credits sees an error message, not a failed API call.
- [ ] If the primary model returns an error, the secondary model is attempted before failing.

## Blocked by

- [#2](https://github.com/ecomgogo/blogger-support/issues/2) — Foundation (for DB schema and AIService interface)
- [#5](https://github.com/ecomgogo/blogger-support/issues/5) — Draft Editor (for the editor UI integration)

> The AIService abstraction layer and Credit system can be built independently of the editor — only the "Polish" UI integration needs the editor.
