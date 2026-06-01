'use client'

import gsap from "gsap"
import { TransitionRouter } from "next-transition-router"
import { useEffect, useRef } from "react"

const ROWS = 4
const COLS = 16

export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const transitionGridRef = useRef<HTMLDivElement | null>(null)
  const blocksRef = useRef<HTMLDivElement[]>([])

  const createTransitionGrid = () => {
    if (!transitionGridRef.current) return
    const container = transitionGridRef.current
    container.innerHTML = ""
    blocksRef.current = []

    const blockWidth = window.innerWidth / COLS
    const blockHeight = window.innerHeight / ROWS

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const block = document.createElement("div")
        block.className = "transition-block"
        block.style.cssText = `
        width: ${blockWidth + 1}px;
        height: ${blockHeight + 1}px;
        left: ${col * blockWidth}px;
        top: ${row * blockHeight}px;
        transform-origin: ${row % 2 === 0 ? "left" : "right"} center;
        `;
        container.appendChild(block)
        blocksRef.current.push(block)
      }
    }

    gsap.set(blocksRef.current, { scaleX: 0 })
  }

  useEffect(() => {
    createTransitionGrid()
    window.addEventListener("resize", createTransitionGrid)
    return () => window.removeEventListener("resize", createTransitionGrid)
  }, [])

  const getRowBlocks = (row: number) =>
    blocksRef.current.slice(row * COLS, row * COLS + COLS)

  const animateIn = (onComplete: gsap.Callback | undefined) => {
    const tl = gsap.timeline({ onComplete });

    [0, 1, 2, 3].forEach((row: number) => {
      const bloks = getRowBlocks(row)
      tl.to(
        bloks,
        {
          scaleX: 1,
          duration: 0.6,
          ease: "power3.inOut",
          stagger: {
            each: 0.025,
            from: row % 2 === 0 ? "start" : "end",
          },
        },
        "<",
      )
    })

    return tl
  }

  const animateOut = (onComplete: gsap.Callback | undefined) => {
    const tl = gsap.timeline({ onComplete });

    [0, 1, 2, 3].forEach((row: number) => {
      const bloks = getRowBlocks(row)
      tl.to(
        bloks,
        {
          scaleX: 0,
          duration: 0.6,
          ease: "power3.inOut",
          stagger: {
            each: 0.025,
            from: row % 2 === 0 ? "start" : "end",
          },
        },
        "<",
      )
    })

    return tl
  }

  return (
    <TransitionRouter
      auto
      leave={(next) => {
        const tl = animateIn(next)
        return () => tl.kill()
      }}
      enter={(next) => {
        const tl = animateOut(next)
        return () => tl.kill()
      }}
    >
      <div ref={transitionGridRef} className="transition-grid" />
      {children}
    </TransitionRouter>
  )
}


