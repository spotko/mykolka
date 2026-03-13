type RoundNoticeProps = {
  actionLabel?: string;
  onAction?: (() => void) | null;
  loserName: string | null;
  message: string | null;
  title?: string;
  tone?: "round" | "game";
};

export function RoundNotice({
  actionLabel,
  loserName,
  message,
  onAction = null,
  title = "Підсумок раунду",
  tone = "round",
}: RoundNoticeProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={[
        "mb-5 rounded-2xl px-4 py-4 text-sm shadow-glow",
        tone === "game"
          ? "border border-rose-300/20 bg-rose-400/10 text-rose-50"
          : "border border-amber-300/25 bg-amber-300/12 text-amber-50",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div
            className={[
              "text-xs uppercase tracking-[0.25em]",
              tone === "game" ? "text-rose-100/75" : "text-amber-100/75",
            ].join(" ")}
          >
            {title}
          </div>
          <div className="mt-2 text-base font-semibold">
            {loserName ? `${loserName} програв в цьому колі.` : message}
          </div>
        </div>

        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/15"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
