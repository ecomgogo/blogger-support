## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Add the three most complex AI capabilities: full SEO optimization pass, article translation, and image alt-text generation.

- **Full SEO optimization**: user enters a target keyword → AI rewrites the entire article to optimize for that keyword (adjusts headings, keyword density, structure) while maintaining readability. Heavy credit cost.
- **Translation**: user selects target language → AI translates the full article → result is saved as a NEW article (separate mirror row, linked to the source article). The new article starts in Review state. User can publish it independently to Blogger as a separate post.
- **Image alt-text**: user clicks "Generate Alt Text" → AI scans all images in the article → generates descriptive, SEO-friendly alt text for each image → inline replacement in the Markdown. Uses a vision-capable model (GPT-4o or Claude with vision).

## Acceptance criteria

- [ ] Full SEO pass: user enters keyword, AI rewrites article. Diff view shows before/after. Accepting deducts 5 credits.
- [ ] SEO pass preserves the article's core message while optimizing for the target keyword.
- [ ] Translation: user selects language from a dropdown (top 20 languages). AI returns translated article.
- [ ] Translated article is saved as a separate article with "(French)" or equivalent suffix in the title.
- [ ] Translated article can be published independently to Blogger.
- [ ] Alt-text generation: AI scans all images, generates alt text, user sees a list of changes to approve individually or accept all.
- [ ] Translation costs 3 credits per article.
- [ ] Alt-text generation costs 1 credit per article.

## Blocked by

- [#8](https://github.com/ecomgogo/blogger-support/issues/8) — AI Foundation + Polish
- [#9](https://github.com/ecomgogo/blogger-support/issues/9) — AI Rewrite + SEO Basics (for the SEO infrastructure)
