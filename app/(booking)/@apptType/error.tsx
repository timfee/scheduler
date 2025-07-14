"use client";

import { useCallback } from "react";

export default function Error({ reset }: { reset: () => void }) {
  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div className="space-y-2">
      <p>Error loading appointment types.</p>
      <button onClick={handleRetry} className="text-sm underline">
        Try again
      </button>
    </div>
  );
}
