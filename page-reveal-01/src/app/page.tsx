"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePageReveal } from "@/hooks/use-page-reveal"

const images = ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg"]

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)

  usePageReveal(containerRef)

  return (
    <div ref={containerRef}>
      <div className="preloader-overlay">
        <div className="preloader" />
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
        {images.map((src, i) => (
          <div key={src} className={`intro-img ${i === 2 ? 'hero-img' : ''}`}>
            <Image src={src} fill alt="" sizes="(max-width: 768px) 100vw, 256px" />
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
  )
}
