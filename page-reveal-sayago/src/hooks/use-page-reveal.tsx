import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { CustomEase } from "gsap/CustomEase"
import { SplitText } from "gsap/SplitText"
import { type RefObject } from "react"

gsap.registerPlugin(useGSAP, SplitText, CustomEase)

CustomEase.create("hop", "0.9, 0, 0.1, 1")
CustomEase.create("glide", "0.8, 0, 0.2, 1")

// ============================================================
// TIMING CONFIG — tweak these to adjust the animation rhythm
// ============================================================

// --- Overlay ---
const OVERLAY_DELAY = 1
const OVERLAY_PART_DURATION = 0.3
const OVERLAY_EASE = "hop"
const SQUARE_OFFSET = "<0.3"

// --- Corners (initial fly-out) ---
const CORNERS_FLY_DURATION = 0.3
const CORNERS_FLY_EASE = "hop"

// --- Frames ---
const FRAMES_DURATION = 0.3
const FRAMES_EASE = "hop"

// --- Images (visual) ---
const INTRO_IMG_SCALE = 0.2
const INTRO_IMG_GAP = 40
const INTRO_IMG_BORDER_RADIUS = "2.5rem"
const INTRO_IMG_OFFSCREEN_MULTIPLIER = 1.3

// --- Images (slide to center) ---
const IMG_CENTER_OFFSET = ">0.1"
const IMG_CENTER_DURATION = 1.5
const IMG_CENTER_STAGGER = 0.025
const IMG_CENTER_EASE = "glide"

// --- Images (spread & hero expand) ---
const IMG_SPREAD_DURATION = 1.5
const IMG_SPREAD_EASE = "glide"
const HERO_EXPAND_DURATION = 1.5
const HERO_EXPAND_EASE = "glide"

// --- Text reveal ---
const NAV_TEXT_OFFSET = "<1"
const NAV_TEXT_DURATION = 1
const NAV_TEXT_STAGGER = 0.1
const NAV_TEXT_EASE = "power3.out"

const HEADER_TEXT_OFFSET = "<"
const HEADER_TEXT_DURATION = 1
const HEADER_TEXT_STAGGER = 0.1
const HEADER_TEXT_EASE = "power3.out"

const SOCIAL_TEXT_OFFSET = "<0.25"
const SOCIAL_TEXT_DURATION = 1
const SOCIAL_TEXT_STAGGER = 0.1
const SOCIAL_TEXT_EASE = "power3.out"

// --- Corner snap ---
const CORNER_SIZE = 60
const CORNER_GAP_MOBILE = 15
const CORNER_GAP_DESKTOP = 30
const MOBILE_BREAKPOINT = 640

// --- Text line initial offset ---
const LINE_INITIAL_Y = "125%"
// ============================================================

export function UsePageReveal(containerRef: RefObject<HTMLDivElement | null>) {
  useGSAP(() => {
    const container = containerRef.current
    if (!container) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const isMobile = vw < MOBILE_BREAKPOINT
    const off = (isMobile ? CORNER_GAP_MOBILE : CORNER_GAP_DESKTOP) + CORNER_SIZE / 2

    gsap.set(".corner-top-r, .corner-top-l, .corner-bottom-l, .corner-bottom-r", {
      xPercent: -50,
      yPercent: -50,
    })

    // --- Image setup ---
    const introImages = container.querySelectorAll<HTMLElement>(".intro-img")
    const introImgRotations = [-15, 5, -7.5, 10, -2.5]
    const introImgScaleWidth = vw * INTRO_IMG_SCALE
    const introImgRowWidth = introImgScaleWidth * 5 + INTRO_IMG_GAP * 4
    const introImgCenteredX = (vw - introImgRowWidth) / 2
    const introImgOffScreenX = introImgCenteredX - vw * INTRO_IMG_OFFSCREEN_MULTIPLIER

    introImages.forEach((img, i) => {
      const centeredX =
        introImgCenteredX +
        i * (introImgScaleWidth + INTRO_IMG_GAP) +
        introImgScaleWidth / 2 -
        vw / 2
      const offScreenX =
        introImgOffScreenX +
        i * (introImgScaleWidth + INTRO_IMG_GAP) +
        introImgScaleWidth / 2 -
        vw / 2
      gsap.set(img, {
        scale: INTRO_IMG_SCALE,
        x: offScreenX,
        rotation: introImgRotations[i],
        borderRadius: INTRO_IMG_BORDER_RADIUS,
      })
      img.dataset.centeredX = String(centeredX)
    })

    // --- Text split ---
    SplitText.create("nav a, .hero-header h1, .hero-social p, .hero-social a", {
      type: "lines",
      linesClass: "line",
      mask: "lines",
    })

    gsap.set(".line", { y: LINE_INITIAL_Y })

    const tl = gsap.timeline({ delay: OVERLAY_DELAY })

    // --- Overlay ---
    tl.to(".colon", {
      opacity: 0,
      y: "70%",
      duration: OVERLAY_PART_DURATION,
      ease: OVERLAY_EASE
    })
    tl.to(".square", {
      opacity: 0,
      duration: 0,
    }, SQUARE_OFFSET)
    tl.to(".corner-top-r", {
      x: vw / 2 - off,
      y: -(vh / 2) + off,
      duration: CORNERS_FLY_DURATION,
      ease: CORNERS_FLY_EASE
    }, "<")
    tl.to(".corner-top-l", {
      x: -(vw / 2) + off,
      y: -(vh / 2) + off,
      duration: CORNERS_FLY_DURATION,
      ease: CORNERS_FLY_EASE
    }, "<")
    tl.to(".corner-bottom-l", {
      x: -(vw / 2) + off,
      y: vh / 2 - off,
      duration: CORNERS_FLY_DURATION,
      ease: CORNERS_FLY_EASE
    }, "<")
    tl.to(".corner-bottom-r", {
      x: vw / 2 - off,
      y: vh / 2 - off,
      duration: CORNERS_FLY_DURATION,
      ease: CORNERS_FLY_EASE
    }, "<")
    tl.to(".frame-top-r", {
      x: vw / 2,
      y: -(vh / 2),
      duration: FRAMES_DURATION,
      ease: FRAMES_EASE
    }, "<")
    tl.to(".frame-bottom-l", {
      x: -(vw / 2),
      y: vh / 2,
      duration: FRAMES_DURATION,
      ease: FRAMES_EASE
    }, "<")

    let resize: (() => void) | null = null

    // Snap corners to viewport edges after frames clear
    tl.call(() => {
      const snap = () => {
        const gap = window.innerWidth < MOBILE_BREAKPOINT ? CORNER_GAP_MOBILE : CORNER_GAP_DESKTOP
        const set = (sel: string, l: number, t: number) => {
          container.querySelectorAll<HTMLElement>(sel).forEach(el => {
            el.style.transform = "none"
            el.style.left = l + "px"
            el.style.top = t + "px"
          })
        }
        set(".corner-top-r", window.innerWidth - gap - CORNER_SIZE, gap)
        set(".corner-top-l", gap, gap)
        set(".corner-bottom-l", gap, window.innerHeight - gap - CORNER_SIZE)
        set(".corner-bottom-r", window.innerWidth - gap - CORNER_SIZE, window.innerHeight - gap - CORNER_SIZE)
      }
      snap()
      resize = snap
      window.addEventListener("resize", snap)
    })

    // --- Image slide to center ---
    tl.to(introImages, {
      x: (_, target) => parseFloat(target.dataset.centeredX!),
      duration: IMG_CENTER_DURATION,
      ease: IMG_CENTER_EASE,
      stagger: IMG_CENTER_STAGGER,
    }, IMG_CENTER_OFFSET)

    // --- Side images spread, hero expands ---
    tl.to(".intro-img:nth-child(1), .intro-img:nth-child(2)", {
      x: "-100vw",
      duration: IMG_SPREAD_DURATION,
      ease: IMG_SPREAD_EASE,
    })

    tl.to(".intro-img:nth-child(4), .intro-img:nth-child(5)", {
      x: "100vw",
      duration: IMG_SPREAD_DURATION,
      ease: IMG_SPREAD_EASE,
    }, "<")

    tl.to(".hero-img", {
      scale: 1,
      x: 0,
      rotation: 0,
      borderRadius: 0,
      duration: HERO_EXPAND_DURATION,
      ease: HERO_EXPAND_EASE,
    }, "<")

    // --- Text reveal ---
    tl.to("nav .line", {
      y: "0%",
      duration: NAV_TEXT_DURATION,
      stagger: NAV_TEXT_STAGGER,
      ease: NAV_TEXT_EASE,
    }, NAV_TEXT_OFFSET)

    tl.to(".hero-header .line", {
      y: "0%",
      duration: HEADER_TEXT_DURATION,
      stagger: HEADER_TEXT_STAGGER,
      ease: HEADER_TEXT_EASE,
    }, HEADER_TEXT_OFFSET)

    tl.to(".hero-social .line", {
      y: "0%",
      duration: SOCIAL_TEXT_DURATION,
      stagger: SOCIAL_TEXT_STAGGER,
      ease: SOCIAL_TEXT_EASE,
    }, SOCIAL_TEXT_OFFSET)

    return () => {
      if (resize) window.removeEventListener("resize", resize)
    }

  }, { scope: containerRef })
}
