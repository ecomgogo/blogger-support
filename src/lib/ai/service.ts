import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
});

const MODEL = "deepseek-chat";

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

async function callDeepSeek(prompt: string, content: string): Promise<string> {
  const response = await deepseek.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content },
    ],
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content ?? "";
}

export class AIService {
  async polish(content: string): Promise<string> {
    return callDeepSeek(POLISH_PROMPT, content);
  }

  async rewrite(content: string, tone: string): Promise<string> {
    return callDeepSeek(REWRITE_PROMPT(tone), content);
  }

  async expand(content: string): Promise<string> {
    return callDeepSeek(EXPAND_PROMPT, content);
  }

  async condense(content: string): Promise<string> {
    return callDeepSeek(CONDENSE_PROMPT, content);
  }

  async suggestKeywords(content: string): Promise<string> {
    return callDeepSeek(SUGGEST_KEYWORDS_PROMPT, content);
  }

  async generateSEO(content: string): Promise<string> {
    return callDeepSeek(GENERATE_SEO_PROMPT, content);
  }

  async fullSEO(content: string, keyword: string): Promise<string> {
    return callDeepSeek(FULL_SEO_PROMPT(keyword), content);
  }

  async translate(content: string, language: string): Promise<string> {
    return callDeepSeek(TRANSLATE_PROMPT(language), content);
  }

  async generateAltText(imageBase64: string): Promise<string> {
    try {
      const response = await deepseek.chat.completions.create({
        model: MODEL,
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
      return "Image";
    }
  }
}

export const aiService = new AIService();
