"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type CardCalloutProps = {
  message: string | null;
};

export function CardCallout({ message }: CardCalloutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !message) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center px-4 pb-24 sm:items-center sm:pb-0">
      <div className="rounded-full border border-amber-300/25 bg-[rgba(29,18,7,0.74)] px-5 py-2.5 text-center text-sm text-amber-50 shadow-glow backdrop-blur animate-[callout-in_220ms_ease-out]">
        {message}
      </div>
    </div>,
    document.body,
  );
}
