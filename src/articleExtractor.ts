import { Readability } from "@mozilla/readability";

export interface ExtractedArticle {
  title: string;
  sentences: string[];
}

export function extractArticle(doc: Document): ExtractedArticle | null {
  const clone = doc.cloneNode(true) as Document;
  const reader = new Readability(clone);
  const article = reader.parse();
  if (!article) return null;

  const sentences = splitSentences(article.textContent ?? "");
  return { title: article.title || document.title, sentences };
}

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end-of-string
  const raw = text.split(/(?<=[.!?])\s+(?=[A-Z"'"(])/);
  return raw
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 25 && s.length <= 800);
}
