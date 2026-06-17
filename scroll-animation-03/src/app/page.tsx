"use client"

import { useRef } from "react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)

  useScrollAnimation(containerRef)

  return (
    <div ref={containerRef}>
      <section className="intro">
        <h1>Time loosens its grip and the stack begins to shift</h1>
      </section>

      <section className="gallery">
        <h1></h1>
      </section>

      <section className="outro">
        <h1>Eventually, the stack settles and the scroll continues</h1>
      </section>
    </div>
  );
}
