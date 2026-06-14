"use client"

import { UsePageReveal } from "@/hooks/use-page-reveal";
import { useRef } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)

  UsePageReveal(containerRef)

  return (
    <div ref={containerRef}>
      <div className="preloader-overlay">
        <div className="semicolon">
          <div className="square" />
          <div className="corner-top-r" />
          <div className="corner-top-l" />
          <div className="corner-bottom-l" />
          <div className="corner-bottom-r" />
          <div className="colon">
          </div>
        </div>
      </div>
    </div>
  );
}
