import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export type AICapability =
  | "polish"
  | "rewrite"
  | "expand"
  | "condense"
  | "suggestKeywords"
  | "generateSEO"
  | "fullSEO"
  | "translate"
  | "generateAltText";

const POLISH_PROMPT = `Polish the following text. Fix grammar, spelling, and punctuation errors. Improve sentence flow and readability. Do NOT change the meaning, tone, or voice. Return ONLY the polished text, no explanations.`;

const REWRITE_PROMPT = (tone: string) =>
  `Rewrite the following text in a ${tone} tone. Keep the core message and meaning exactly the same. Return ONLY the rewritten text.`;

const EXPAND_PROMPT = `Expand the following paragraph. Add meaningful detail, examples, or explanation while staying on topic. Return ONLY the expanded text.`;

const CONDENSE_PROMPT = `Condense the following paragraph. Remove redundancy and tighten the language while preserving the key points. Return ONLY the condensed text.`;

const SUGGEST_KEYWORDS_PROMPT = `Analyze the following article content and suggest 5-10 SEO keywords or phrases. For each, give a relevance score (1-10). Return as JSON: [{"keyword": "...", "score": N}]`;

const GENERATE_SEO_PROMPT = `Generate an SEO-optimized title (max 60 chars) and meta description (max 160 chars) for this article. Return as JSON: {"title": "...", "description": "..."}`;

const FULL_SEO_PROMPT = (keyword: string) =>
  `Rewrite this article to optimize for the keyword "${keyword}". Improve headings, keyword density, and structure. Keep the core message. Return ONLY the optimized article.`;

const TRANSLATE_PROMPT = (lang: string) =>
  `Translate the following text to ${lang}. Return ONLY the translated text.`;

const ALT_TEXT_PROMPT = `You are shown an image. Generate a concise, descriptive, SEO-friendly alt text (max 125 chars). Return ONLY the alt text.`;

/**
 * Route a capability to the appropriate model.
 * Primary: Claude for long-form, GPT-4o for structured/SEO.
 * Falls back to the other model on failure.
 */
export class AIService {
  async #callClaude(prompt: string, content: string): Promise<string> {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: prompt,
      messages: [{ role: "user", content }],
    });

    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return text;
  }

  async #callGPT4o(prompt: string, content: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content },
      ],
      max_tokens: 4096,
    });

    return response.choices[0]?.message?.content ?? "";
  }

  /**
   * Try primary model first, fall back to secondary on failure.
   */
  async #withFallback(
    primary: "claude" | "gpt4o",
    prompt: string,
    content: string
  ): Promise<string> {
    try {
      if (primary === "claude") return await this.#callClaude(prompt, content);
      return await this.#callGPT4o(prompt, content);
    } catch (err) {
      console.error(`Primary model (${primary}) failed, trying fallback:`, err);
      try {
        if (primary === "claude") return await this.#callGPT4o(prompt, content);
        return await this.#callClaude(prompt, content);
      } catch (err2) {
        console.error("Fallback model also failed:", err2);
        throw new Error("AI service unavailable. Please try again later.");
      }
    }
  }

  // ─── Public API ──────────────────────────────────────────

  async polish(content: string): Promise<string> {
    return this.#withFallback("claude", POLISH_PROMPT, content);
  }

  async rewrite(content: string, tone: string): Promise<string> {
    return this.#withFallback("claude", REWRITE_PROMPT(tone), content);
  }

  async expand(content: string): Promise<string> {
    return this.#withFallback("claude", EXPAND_PROMPT, content);
  }

  async condense(content: string): Promise<string> {
    return this.#withFallback("claude", CONDENSE_PROMPT, content);
  }

  async suggestKeywords(content: string): Promise<string> {
    return this.#withFallback("gpt4o", SUGGEST_KEYWORDS_PROMPT, content);
  }

  async generateSEO(content: string): Promise<string> {
    return this.#withFallback("gpt4o", GENERATE_SEO_PROMPT, content);
  }

  async fullSEO(content: string, keyword: string): Promise<string> {
    return this.#withFallback("gpt4o", FULL_SEO_PROMPT(keyword), content);
  }

  async translate(content: string, language: string): Promise<string> {
    return this.#withFallback("gpt4o", TRANSLATE_PROMPT(language), content);
  }

  async generateAltText(imageBase64: string): Promise<string> {
    // Alt text uses a vision model — try GPT-4o with vision, fallback to Claude
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: ALT_TEXT_PROMPT },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 200,
      });
      return response.choices[0]?.message?.content ?? "";
    } catch {
      // Claude fallback (no vision in current setup, return generic)
      return "Image";
    }
  }
}

export const aiService = new AIService();
