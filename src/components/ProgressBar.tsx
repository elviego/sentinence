interface Props {
  processed: number;
  total: number;
}

export default function ProgressBar({ processed, total }: Props) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="px-3 py-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Analysing sentences…</span>
        <span>
          {processed}/{total}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
