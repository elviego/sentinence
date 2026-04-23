import type { ClassifiedSentence } from "../types";
import { CATEGORY_BG, CATEGORY_COLORS } from "../types";

interface Props {
  sentence: ClassifiedSentence;
  onClick: (sentence: ClassifiedSentence) => void;
}

export default function ArgumentNode({ sentence, onClick }: Props) {
  const badgeClass = CATEGORY_BG[sentence.category];
  const borderColor = CATEGORY_COLORS[sentence.category];

  return (
    <div
      className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 group transition-colors"
      style={{ borderLeftColor: borderColor, borderLeftWidth: 3 }}
      onClick={() => onClick(sentence)}
      title="Click to scroll to this sentence in the article"
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          {sentence.category}
        </span>
        <p className="text-sm text-gray-700 leading-snug line-clamp-3 group-hover:line-clamp-none">
          {sentence.text}
        </p>
      </div>
    </div>
  );
}
