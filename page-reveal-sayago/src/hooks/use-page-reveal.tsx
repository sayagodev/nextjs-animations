import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { CustomEase } from "gsap/CustomEase"
import { type RefObject } from "react"

gsap.registerPlugin(useGSAP)

CustomEase.create("hop", "0.9, 0, 0.1, 1")
CustomEase.create("glide", "0.8, 0, 0.2, 1")

export function UsePageReveal(containerRef: RefObject<HTMLDivElement | null>) {
  useGSAP(() => {
    const container = containerRef.current
    if (!container) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const isMobile = vw < 640
    const off = (isMobile ? 15 : 30) + 30

    gsap.set(".corner-top-r, .corner-top-l, .corner-bottom-l, .corner-bottom-r", {
      xPercent: -50,
      yPercent: -50,
    })

    const tl = gsap.timeline({ delay: 1 })

    tl.to(".colon", {
      opacity: 0,
      y: "70%",
      duration: 0.3,
      ease: "hop"
    })
    tl.to(".square", {
      opacity: 0,
      duration: 0,
    }, "<0.3")
    tl.to(".corner-top-r", {
      x: vw / 2 - off,
      y: -(vh / 2) + off,
      duration: 0.3,
      ease: "hop"
    }, "<")
    tl.to(".corner-top-l", {
      x: -(vw / 2) + off,
      y: -(vh / 2) + off,
      duration: 0.3,
      ease: "hop"
    }, "<")
    tl.to(".corner-bottom-l", {
      x: -(vw / 2) + off,
      y: vh / 2 - off,
      duration: 0.3,
      ease: "hop"
    }, "<")
    tl.to(".corner-bottom-r", {
      x: vw / 2 - off,
      y: vh / 2 - off,
      duration: 0.3,
      ease: "hop"
    }, "<")
    tl.to(".frame-top-r", {
      x: vw / 2,
      y: -(vh / 2),
      duration: 0.3,
      ease: "hop"
    }, "<")
    tl.to(".frame-bottom-l", {
      x: -(vw / 2),
      y: vh / 2,
      duration: 0.3,
      ease: "hop"
    }, "<")

    let resize: (() => void) | null = null

    tl.eventCallback("onComplete", () => {
      const el = 60

      const snap = () => {
        const gap = window.innerWidth < 640 ? 15 : 30
        const set = (sel: string, l: number, t: number) => {
          container.querySelectorAll<HTMLElement>(sel).forEach(el => {
            el.style.transform = "none"
            el.style.left = l + "px"
            el.style.top = t + "px"
          })
        }
        set(".corner-top-r", window.innerWidth - gap - el, gap)
        set(".corner-top-l", gap, gap)
        set(".corner-bottom-l", gap, window.innerHeight - gap - el)
        set(".corner-bottom-r", window.innerWidth - gap - el, window.innerHeight - gap - el)
      }

      snap()
      resize = snap
      window.addEventListener("resize", snap)
    })

    return () => {
      if (resize) window.removeEventListener("resize", resize)
    }

  }, { scope: containerRef })
}
