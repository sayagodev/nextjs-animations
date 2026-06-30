"use client"

import { UsePageReveal } from "@/hooks/use-page-reveal";
import { useRef } from "react";
import Link from "next/link";
import Grainient from "@/components/effects/grainient";

const gradients = [
  { color1: "#BADFDB", color2: "#FFBDBD", color3: "#FCF9EA" },
  { color1: "#210F37", color2: "#4F1C51", color3: "#A55B4B" },
  { color1: "#FF97D0", color2: "#B331F1", color3: "#FBF5A7" },
  { color1: "#BADFDB", color2: "#FF97D0", color3: "#FCF9EA" },
  { color1: "#210F37", color2: "#4F1C51", color3: "#FF97D0" },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)

  UsePageReveal(containerRef)

  return (
    <div ref={containerRef}>
      <div className="preloader-overlay">
        <div className="semicolon">
          <div className="frame-top-r" />
          <div className="frame-bottom-l" />
          <div className="square" />
          <div className="corner-top-r" />
          <div className="corner-top-l" />
          <div className="corner-bottom-l" />
          <div className="corner-bottom-r" />
          <div className="colon">
          </div>
        </div>
      </div>

      <nav>
        <div className="nav-logo">
          <Link href="#">Foundry & Form<br /> Industrial Design Consultancy</Link>
        </div>
        <div className="nav-items">
          <Link href="#">Work</Link>
          <Link href="#">Catalogue</Link>
          <Link href="#">About</Link>
        </div>
      </nav>

      <section className="hero">
        {gradients.map((g, i) => (
          <div key={i} className={`intro-img ${i === 2 ? 'hero-img' : ''}`}>
            <Grainient color1={g.color1} color2={g.color2} color3={g.color3} />
          </div>
        ))}
        <div className="hero-content">
          <div className="hero-header">
            <h1>Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.</h1>
          </div>
          <div className="hero-social">
            <p>Say Hello</p>
            <Link href="#">info@foundryandform.com</Link>
            <Link href="#">View Enquirires</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
