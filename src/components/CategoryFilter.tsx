import type { SentenceCategory } from "../types";
import { CATEGORY_BG } from "../types";

const ALL_CATEGORIES: Array<SentenceCategory | "All"> = [
  "All",
  "Claim",
  "Evidence",
  "Counter-argument",
  "Opinion",
  "Other",
];

interface Props {
  active: SentenceCategory | "All";
  counts: Record<SentenceCategory | "All", number>;
  onChange: (cat: SentenceCategory | "All") => void;
}

export default function CategoryFilter({ active, counts, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-100">
      {ALL_CATEGORIES.map((cat) => {
        const isActive = active === cat;
        const baseStyle =
          cat === "All"
            ? isActive
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            : isActive
              ? CATEGORY_BG[cat as SentenceCategory].replace(
                  /text-\S+/,
                  "text-white"
                ) + " !bg-opacity-100"
              : CATEGORY_BG[cat as SentenceCategory] + " opacity-60 hover:opacity-100";

        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${baseStyle}`}
          >
            {cat}
            {counts[cat] !== undefined && (
              <span className="ml-1 opacity-75">({counts[cat]})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
