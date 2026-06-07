"use client"

import { useRef } from "react"
import Image from "next/image"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

const images = ["/2.jpg", "/3.jpg", "/5.jpg"]

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)

  useScrollAnimation(containerRef)

  return (
    <>
      <div ref={containerRef}>
        <section className="hero">
          <div className="hero-bg">
            <Image src="/1.jpg" fill alt="" sizes="(max-width: 768px) 100vw, 256px" />
          </div>

          <div className="hero-content">
            <h1>A modern approach to luxury living and timeless spaces</h1>
          </div>

          <div className="hero-revealer"></div>

          <div className="hero-images">
            {images.map((src) => (
              <div key={src} className="hero-img">
                <Image src={src} fill alt="" sizes="(max-width: 768px) 100vw, 256px" />
              </div>
            ))}
          </div>

          <div className="hero-outro-content">
            <h1>
              ThroughFully crafted spaces designed to inspire modern living connections
            </h1>
          </div>
        </section>
        <section className="about">
          <div className="about-content">
            <h3>Designing digital experiences that feel effortless</h3>
            <p>
              Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
