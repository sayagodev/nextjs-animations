"use client";

import { forwardRef } from "react";

export const DissolveGrid = forwardRef<HTMLDivElement>((_props, ref) => {
  return <div ref={ref} className="dissolve-grid" />;
});

DissolveGrid.displayName = "DissolveGrid";
