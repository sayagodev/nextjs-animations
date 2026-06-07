"use client";

import { useRef } from "react";
import Image from "next/image";

import { DissolveGrid } from "@/components/dissolve-grid";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const images = ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg"];

export default function Home() {
  const imagesRef = useRef<HTMLDivElement>(null);
  const dissolveGridRef = useRef<HTMLDivElement>(null);

  useScrollAnimation(imagesRef, dissolveGridRef);

  return (
    <>
      <section className="intro">
        <p>Scroll down to decode the craft</p>
      </section>
      <section className="spotlight" ref={imagesRef}>
        {images.map((src) => (
          <div key={src} className="spotlight-img">
            <Image
              src={src}
              fill
              alt=""
              sizes="(max-width: 768px) 100vw, 256px"
            />
          </div>
        ))}
        <DissolveGrid ref={dissolveGridRef} />
      </section>
      <section className="outro">
        <p>The rest is under NDA</p>
      </section>
    </>
  );
}
