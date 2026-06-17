import gsap from "gsap";
import { useGSAP } from "@gsap/react"
import { SplitText } from "gsap/SplitText";
import type { RefObject } from "react";
import { useLenis } from "@/components/providers/lenis-provider";

gsap.registerPlugin(useGSAP)

export function useSVGAnimation(containerRef: RefObject<HTMLDivElement | null>) {
  const lenis = useLenis()

  useGSAP(() => {
    if (!lenis) return

    const container = containerRef.current
    if (!container) return

    const tickerCallback = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    gsap.registerPlugin(SplitText)

    const cardContainers = container.querySelectorAll(".card-container");

    cardContainers.forEach((cardContainer) => {
      const cardPaths = cardContainer.querySelectorAll(".svg-stroke path");
      const cardTitle = cardContainer.querySelector(".card-title h3");

      const split = SplitText.create(cardTitle, {
        type: "words",
        mask: "words",
        wordsClass: "word",
      });

      gsap.set(split.words, { yPercent: 100 });

      cardPaths.forEach((path) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
      });

      let tl;

      cardContainer.addEventListener("mouseenter", () => {
        if (tl) tl.kill();
        tl = gsap.timeline();

        cardPaths.forEach((path) => {
          tl.to(
            path,
            {
              strokeDashoffset: 0,
              attr: { "stroke-width": 700 },
              duration: 1.5,
              ease: "power2.out",
            },
            0,
          );
        });

        tl.to(
          split.words,
          {
            yPercent: 0,
            duration: 0.75,
            ease: "power3.out",
            stagger: 0.075,
          },
          0.35,
        );
      });

      cardContainer.addEventListener("mouseleave", () => {
        if (tl) tl.kill();
        tl = gsap.timeline();

        cardPaths.forEach((path) => {
          const length = path.getTotalLength();
          tl.to(
            path,
            {
              strokeDashoffset: length,
              attr: { "stroke-width": 200 },
              duration: 1,
              ease: "power2.out",
            },
            0,
          );
        });

        tl.to(
          split.words,
          {
            yPercent: 100,
            duration: 0.5,
            ease: "power3.out",
            stagger: { each: 0.05, from: "end" },
          },
          0,
        );
      });
    });

    return () => {
      gsap.ticker.remove(tickerCallback)
    }

  }, { dependencies: [lenis], revertOnUpdate: true })
}
