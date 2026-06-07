import { type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { useLenis } from "@/components/providers/lenis-provider";

gsap.registerPlugin(useGSAP);

const CELL_SIZE = 16;
const DISSOLVE_SPREAD_ABOVE = 0.25;
const DISSOLVE_SPREAD_BELOW = 0.25;
const DISSOLVE_SCATTER_INTENSITY = 0.15;
const DISSOLVE_SOLID_CORE_RADIUS = 0.025;
const DISSOLVE_MIN_SCATTER_AT_CENTER = 0.3;
const DISSOLVE_VISIBILITY_THRESHOLD = 0.65;
const DISSOLVE_COLOR = "#EE1C25";
const DISSOLVE_CHARACTERS =
  // "☭ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}<>";
  "☭!@#$%^&*()_+[]{}<>";

function hashFromPosition(row: number, col: number, seed: number): number {
  const raw = Math.sin(row + seed + col * (seed * 2.45) * 43758.5453);
  return raw - Math.floor(raw);
}

interface Cell {
  row: number;
  col: number;
  normalizedY: number;
}

export function useScrollAnimation(
  imagesRef: RefObject<HTMLDivElement | null>,
  dissolveGridRef: RefObject<HTMLDivElement | null>,
) {
  const lenis = useLenis();

  useGSAP(() => {
    if (!lenis) return;

    const imagesContainer = imagesRef.current;
    const dissolveContainer = dissolveGridRef.current;
    if (!imagesContainer || !dissolveContainer) return;

    gsap.registerPlugin(ScrollTrigger);

    const tickerCallback = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    const images = imagesContainer.querySelectorAll<HTMLDivElement>(".spotlight-img");
    const totalImages = images.length;
    const totalTransitions = totalImages - 1;

    if (totalImages < 2) {
      gsap.ticker.remove(tickerCallback);
      return;
    }

    images.forEach((img, i) => {
      img.style.zIndex = String(totalImages - i);
    });

    const columns = Math.ceil(window.innerWidth / CELL_SIZE);
    const rows = Math.ceil(window.innerHeight / CELL_SIZE);
    const fontSize = Math.round(CELL_SIZE * 0.7);

    const cells: Cell[] = [];
    const cellElements: HTMLDivElement[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const el = document.createElement("div");
        el.className = "dissolve-cell";
        el.style.left = `${col * CELL_SIZE}px`;
        el.style.top = `${row * CELL_SIZE}px`;
        el.style.width = `${CELL_SIZE}px`;
        el.style.height = `${CELL_SIZE}px`;
        el.style.fontSize = `${fontSize}px`;
        el.textContent =
          DISSOLVE_CHARACTERS[Math.floor(Math.random() * DISSOLVE_CHARACTERS.length)];
        dissolveContainer.appendChild(el);

        cellElements.push(el);
        cells.push({ row, col, normalizedY: (row + 0.5) / rows });
      }
    }

    dissolveContainer.style.setProperty("--dissolve-color", DISSOLVE_COLOR);

    const cellVisibilityRandom = cells.map(
      (c) => hashFromPosition(c.row, c.col, 127.1),
    );
    const cellScatterOffset = cells.map(
      (c) => (hashFromPosition(c.row, c.col, 269.3) - 0.5) * DISSOLVE_SCATTER_INTENSITY,
    );

    const totalTravelRange = 1 + DISSOLVE_SPREAD_ABOVE + DISSOLVE_SPREAD_BELOW;

    function updateImageClipPaths(scrollProgress: number) {
      for (let i = 0; i < totalTransitions; i++) {
        const segmentStart = i / totalTransitions;
        const segmentEnd = (i + 1) / totalTransitions;

        let segmentProgress =
          (scrollProgress - segmentStart) / (segmentEnd - segmentStart);
        segmentProgress = gsap.utils.clamp(0, 1, segmentProgress);

        const remappedPosition =
          -DISSOLVE_SPREAD_ABOVE + segmentProgress * totalTravelRange;
        const clipPercent = gsap.utils.clamp(0, 100, remappedPosition * 100);

        images[i].style.clipPath = `polygon(0% ${clipPercent}%, 100% ${clipPercent}%, 100% 100%, 0% 100%)`;
      }
    }

    function updateDissolveCells(scrollProgress: number) {
      const currentTransition = Math.min(
        Math.floor(scrollProgress * totalTransitions),
        totalTransitions - 1,
      );
      const segmentStart = currentTransition / totalTransitions;
      const segmentEnd = (currentTransition + 1) / totalTransitions;
      let segmentProgress =
        (scrollProgress - segmentStart) / (segmentEnd - segmentStart);
      segmentProgress = gsap.utils.clamp(0, 1, segmentProgress);

      const bondCenterY = -DISSOLVE_SPREAD_ABOVE + segmentProgress * totalTravelRange;

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const rawDistance = Math.abs(cell.normalizedY - bondCenterY);
        const scatterStrength = gsap.utils.clamp(
          DISSOLVE_MIN_SCATTER_AT_CENTER,
          1,
          rawDistance / DISSOLVE_SOLID_CORE_RADIUS,
        );

        const rawSigned = cell.normalizedY - bondCenterY;
        const scatteredDistance = rawSigned + cellScatterOffset[i] * scatterStrength;

        const normalizedDistance =
          scatteredDistance >= 0
            ? scatteredDistance / DISSOLVE_SPREAD_BELOW
            : Math.abs(scatteredDistance) / DISSOLVE_SPREAD_ABOVE;

        const rawNormalizedDistance = rawDistance / (rawSigned >= 0
          ? DISSOLVE_SPREAD_BELOW
          : DISSOLVE_SPREAD_ABOVE);

        if (normalizedDistance >= 1 || rawNormalizedDistance >= 1) {
          cellElements[i].style.visibility = "hidden";
          continue;
        }

        const density = (1 - normalizedDistance) * (1 - normalizedDistance);
        const isVisible =
          density > cellVisibilityRandom[i] * DISSOLVE_VISIBILITY_THRESHOLD;
        cellElements[i].style.visibility = isVisible ? "visible" : "hidden";
      }
    }

    function hideAllDissolveCells() {
      cellElements.forEach((el) => {
        el.style.visibility = "hidden";
      });
    }

    hideAllDissolveCells();

    ScrollTrigger.create({
      trigger: imagesContainer,
      start: "top top",
      end: `+=${totalTransitions * window.innerHeight}`,
      pin: true,
      pinSpacing: true,
      scrub: true,
      onUpdate: (self) => {
        updateImageClipPaths(self.progress);
        updateDissolveCells(self.progress);
      },
    });

    return () => {
      gsap.ticker.remove(tickerCallback);
      cellElements.forEach((el) => el.remove());
    };
  }, { dependencies: [lenis], revertOnUpdate: true });
}
