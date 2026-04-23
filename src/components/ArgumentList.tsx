import type { ClassifiedSentence, SentenceCategory } from "../types";
import ArgumentNode from "./ArgumentNode";

interface Props {
  sentences: ClassifiedSentence[];
  filter: SentenceCategory | "All";
  onSentenceClick: (sentence: ClassifiedSentence) => void;
}

export default function ArgumentList({
  sentences,
  filter,
  onSentenceClick,
}: Props) {
  const visible =
    filter === "All"
      ? sentences
      : sentences.filter((s) => s.category === filter);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
        <span className="text-2xl mb-2">🔍</span>
        No sentences in this category.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {visible.map((s) => (
        <ArgumentNode key={s.id} sentence={s} onClick={onSentenceClick} />
      ))}
    </div>
  );
}
