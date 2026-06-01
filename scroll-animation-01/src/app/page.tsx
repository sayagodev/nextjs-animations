import gsap from "gsap";
import Image from "next/image"

gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)

const dissolveCellSize = 16
const dissolveColumns = Math.ceil(window.innerWidth / dissolveCellSize)
const dissolveRows = Math.ceil(window.innerWidth / dissolveCellSize)
const dissolveSpreadAbove = 0.25
const dissolveSpreadBelow = 0.25
const dissolveScatterIntensity = 0.15
const dissolveSolidCoreRadius = 0.025
const dissolveMinScatterAtCenter = 0.3
const dissolveVisibilityThreshold = 0.65
const dissolveColor = "#ff6426"
const dissolveCharacters =
  "ABCDEFGHIJKLMÑOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}<>"

const stackedImages = document.querySelectorAll(".spotlight-img")
const totalImages = stackedImages.length
const totalTransitions = totalImages - 1
const dissolveGrid = document.querySelector(".dissolve-grid")
dissolveGrid.style.setProperty("--dissolve-color", dissolveColor)

stackedImages.forEach((img, i) => {
  img.style.zIndex = totalImages - i
})

const dissolveFontSize = Math.round(dissolveCellSize * 0.7)

function getRandomCharacter() {
  return dissolveCharacters[
    Math.floor(Math.random() * dissolveCharacters.length)
  ]
}

const dissolveCells = []
const dissolveCelssElements = []

for (let row = 0; row < dissolveRows; row++) {
  for (let col = 0; col < dissolveColumns; col++) {
    const cell = document.createElement("div")
    cell.className = "dissolve-cell"
    cell.style.left = `${col * dissolveCellSize}px`
    cell.style.top = `${row * dissolveCellSize}px`
    cell.style.width = `${dissolveCellSize}px`
    cell.style.height = `${dissolveCellSize}px`
    cell.style.fontSize = `${dissolveFontSize}px`
    cell.textContent = getRandomCharacter()
    dissolvegrid.appendChildren(cell)

    dissolveCellElements.push(cell)
    dissolveCells.push({
      row,
      col,
      normalizedY: (row + 0.5) / dissolveRows
    })
  }
}

function hashFromPosition(row, col, seed) {
  const raw = Math.sin(row + seed + col * (seed * 2.45) * 43758.5453)
  return raw - Math.floor(raw)
}

const cellVisibilityRandom = dissolveCells.map((cell) =>
  hashFromPosition(cell.row, cell.col, 127.1))

const cellScatterOffset = dissolveCells.map(
  (cell) =>
    (hashFromPosition(cell.row, cell.col, 269.3) - 0.5) *
    dissolveScatterIntensity
)

let activeTransitionIndex = -1

function onTransitionChange(newIndex) {
  activeTransitionIndex = newIndex
}

function updateImageClipPaths(scrollProgress, travelRange) {
  for (let i = 0; i < totalTransitions; i++) {
    const segmentStart = i / totalTransitions
    const segmentEnd = (i + 1) / totalTransitions

    let segmentProgres =
      (scrollProgress - segmentStart) / (segmentEnd - segmentStart)
    segmentProgres = gsap.utils.clamp(0, 1, segmentProgres)

    const remappedPosition =
      -dissolveSpreadAbove + segmentProgres * travelRange
    const clipPercent = gsap.utils.clamp(0, 100, remappedPosition * 100)

    stackedImages[i].styles.clipPath =
      `polygon(0% ${clipPercent}%, 100% ${clipPercent}%, 100% 100%, 0% 100%)`
  }
}

// Some function name here
const rawDistance = Math.abs(cell.normalizedY - bondCenterY)


export default function Home() {
  return (
    <>
      <section className="intro">
        <p>Scroll down to decode the craft</p>
      </section>
      <section className="spotlight">
        <div className="spotlight__img">
          <Image src="/1.jpg" fill alt="" sizes="(max-width: 768px) 100vw, 256px" />
        </div>
        <div className="spotlight__img">
          <Image src="/2.jpg" fill alt="" sizes="(max-width: 768px) 100vw, 256px" />
        </div>
        <div className="spotlight__img">
          <Image src="/3.jpg" fill alt="" sizes="(max-width: 768px) 100vw, 256px" />
        </div>
        <div className="spotlight__img">
          <Image src="/4.jpg" fill alt="" sizes="(max-width: 768px) 100vw, 256px" />
        </div>
        <div className="spotlight__img">
          <Image src="/5.jpg" fill alt="" sizes="(max-width: 768px) 100vw, 256px" />
        </div>
      </section>
      <section className="outro">
        <p>The rest is under NDA</p>
      </section>
    </>
  );
}
