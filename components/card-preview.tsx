type CardPreviewProps = {
  label: string;
  suit: string;
  revealed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  selectedBy?: string | null;
};

export function CardPreview({
  label,
  suit,
  revealed = false,
  disabled = false,
  onClick,
  selectedBy = null,
}: CardPreviewProps) {
  const isRedSuit = suit === "♦" || suit === "♥";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative flex aspect-[5/7] w-20 items-center justify-center overflow-hidden rounded-2xl border transition-transform duration-200",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        revealed
          ? "border-amber-200/60 bg-stone-50 text-stone-900 shadow-glow"
          : "border-[#f4e7cf]/40 bg-[#a81f34] text-[#f7f1e1] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-1",
      ].join(" ")}
    >
      {revealed ? (
        <div className="text-center">
          <div className="text-2xl font-bold">{label}</div>
          <div className={["text-xl", isRedSuit ? "text-rose-600" : "text-stone-900"].join(" ")}>
            {suit}
          </div>
          {selectedBy ? (
            <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-stone-500">
              {selectedBy}
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <img
            src="/assets/card-back.svg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0,rgba(255,255,255,0)_56%)]" />
        </>
      )}
    </button>
  );
}
