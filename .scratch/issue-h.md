## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Add three AI capabilities that build on the AIService foundation: tone/style rewrite, paragraph restructure/expansion, and SEO keyword/meta generation.

- **Tone rewrite**: user selects text, picks a tone (formal, casual, professional, humorous). AI rewrites in that voice. Same accept/reject diff flow as polish.
- **Paragraph restructure**: user selects a paragraph, chooses "Expand" or "Condense". AI adjusts length while preserving key points. Diff view with accept/reject.
- **SEO keywords**: user clicks "Suggest Keywords" → AI analyzes the full article content → returns a list of target keywords with search volume estimates (if available) and relevance scores. Displayed as a card panel, not inline.
- **SEO title & meta**: user clicks "Generate SEO Metadata" → AI generates an SEO-optimized title and meta description. User can edit before saving. Stored locally in the mirror (as seo_title, seo_description columns).

## Acceptance criteria

- [ ] Tone selector dropdown appears when selecting text for rewrite. Four tone options available.
- [ ] Tone rewrite produces text in the requested tone; diff view shows changes.
- [ ] Expand mode adds meaningful content to the paragraph without fluff.
- [ ] Condense mode shortens the paragraph while keeping the core message.
- [ ] Keyword suggestions include 5-10 keywords with relevance scores.
- [ ] Generated SEO title is under 60 characters; meta description under 160 characters.
- [ ] SEO title/meta are editable before saving.
- [ ] All four capabilities deduct credits correctly (different costs: rewrite=1, seo=2).
- [ ] Each capability triggers Processing → Review state transition.

## Blocked by

- [#8](https://github.com/ecomgogo/blogger-support/issues/8) — AI Foundation + Polish
