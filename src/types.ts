export type SentenceCategory =
  | "Claim"
  | "Evidence"
  | "Counter-argument"
  | "Opinion"
  | "Other";

export const CATEGORY_COLORS: Record<SentenceCategory, string> = {
  Claim: "#3B82F6",
  Evidence: "#22C55E",
  "Counter-argument": "#F97316",
  Opinion: "#A855F7",
  Other: "#6B7280",
};

export const CATEGORY_BG: Record<SentenceCategory, string> = {
  Claim: "bg-blue-100 text-blue-800",
  Evidence: "bg-green-100 text-green-800",
  "Counter-argument": "bg-orange-100 text-orange-800",
  Opinion: "bg-purple-100 text-purple-800",
  Other: "bg-gray-100 text-gray-700",
};

export interface ClassifiedSentence {
  id: number;
  text: string;
  category: SentenceCategory;
  confidence: number;
}

export interface ArticleData {
  url: string;
  title: string;
  sentences: string[];
}

export interface CachedAnalysis {
  url: string;
  title: string;
  sentences: ClassifiedSentence[];
  analyzedAt: number;
}

export type ExtensionMessage =
  | { type: "ANALYZE_PAGE"; url: string; title: string; sentences: string[] }
  | {
      type: "CLASSIFICATIONS_READY";
      url: string;
      title: string;
      sentences: ClassifiedSentence[];
    }
  | { type: "ANALYSIS_PROGRESS"; processed: number; total: number }
  | { type: "ANALYSIS_ERROR"; error: string }
  | { type: "GET_CLASSIFICATIONS"; url: string }
  | { type: "TRIGGER_ANALYSIS" }
  | { type: "OPEN_SIDEPANEL" };
