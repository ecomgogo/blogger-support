# Multi-model AI routing

The platform offers 8 AI capabilities: grammar polish, tone/style rewrite, paragraph restructure/expansion, SEO keyword suggestions, SEO title/meta generation, full SEO optimization, translation, and image alt-text generation.

Instead of binding to a single LLM provider, we route each capability to the model best suited for it. The routing table is server-side in tRPC procedures, abstracted behind a `AIService` interface so adding a new model or swapping a provider requires no frontend changes.

**Initial routing**:
- **Claude (Anthropic)**: Grammar polish, tone/style rewrite, paragraph restructure — long-form text tasks where instruction-following precision matters.
- **GPT-4o (OpenAI)**: SEO keyword suggestions, SEO title/meta generation, full SEO optimization, translation — structured-output tasks where JSON mode and multilinguality are strong.
- **Claude or GPT-4o with vision**: Image alt-text generation — whichever has better cost/latency at launch.

**Why multi-model over single-provider**: No single model is best at everything. Routing lets us optimize per-capability quality and cost. The abstraction layer insulates the codebase from provider API changes and makes future model additions (Gemini, local models) a one-file change.
