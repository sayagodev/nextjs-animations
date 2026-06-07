# Patrones GSAP + Next.js

Basado en los problemas encontrados en `page-reveal-01` y la guía de `scroll-animation-01`.

---

## 1. El error más común: el hook no está conectado

```tsx
// ❌ page.tsx es Server Component — la animación NUNCA corre
// (no tiene "use client", no llama al hook)

// ✅ page.tsx debe ser cliente y llamar al hook
"use client"
import { useRef } from "react"
import { useMiAnimacion } from "@/hooks/use-mi-animacion"

export default function Page() {
  const ref = useRef<HTMLDivElement>(null)
  useMiAnimacion(ref)

  return <div ref={ref}>{/* ... */}</div>
}
```

**Regla:** Si usas `document`, `window`, `gsap`, `useRef`, o cualquier API del navegador, el componente necesita `"use client"`.

---

## 2. useGSAP reemplaza a useEffect

```tsx
// ❌ DOMContentLoaded + useEffect
useEffect(() => {
  document.addEventListener("DOMContentLoaded", () => {
    gsap.to(".box", { x: 100 })
  })
}, [])

// ✅ useGSAP con scope
import { useGSAP } from "@gsap/react"
gsap.registerPlugin(useGSAP)

useGSAP(() => {
  gsap.to(".box", { x: 100 })
}, { scope: containerRef })
```

| `useEffect` | `useGSAP` |
|---|---|
| No hace cleanup automático | Revierte animaciones al desmontar |
| React Strict Mode duplica animaciones | Maneja Strict Mode correctamente |
| Selectores globales (`document.querySelector`) | `scope:` limita selectores al contenedor |
| No es SSR-safe | Usa `useIsomorphicLayoutEffect` internamente |

---

## 3. Scoped selectors vs querySelectorAll

```tsx
// ❌ document.querySelectorAll — alcance global, no aislado
const boxes = document.querySelectorAll(".box")

// ✅ Scoped selectors — solo busca dentro del contenedor
useGSAP(() => {
  gsap.to(".box", { opacity: 1, stagger: 0.1 })
}, { scope: containerRef })

// ✅ O con ref + querySelectorAll (cuando necesitas iterar)
const container = containerRef.current
const boxes = container.querySelectorAll(".box")
```

úsalo cuando:
- Necesitas iterar sobre los elementos (forEach, map)
- Necesitas asignar a `dataset`
- Usas SplitText (no soporta scoping automático)

---

## 4. SplitText en Next.js

```tsx
// ✅ SplitText dentro de useGSAP, con querySelectorAll
useGSAP(() => {
  const container = containerRef.current
  if (!container) return

  SplitText.create("nav a, .hero-header h1", {
    type: "lines",
    linesClass: "line",
  })

  gsap.set(".line", { y: "125%" })
  // ...
}, { scope: containerRef })
```

SplitText modifica el DOM (envuelve texto en divs). Hazlo **antes** de las animaciones, en el mismo `useGSAP`.

---

## 5. Timeline: etiquetas y position parameter

```tsx
const tl = gsap.timeline({ delay: 1 })

tl.to(".a", { x: 100 })                    // posición 0
tl.to(".b", { x: 200 })                    // después de .a
tl.to(".c", { x: 300 }, "<0.5")            // 0.5s después de .b
tl.to(".d", { x: 400 }, "mi-etiqueta")     // marca una posición
tl.to(".e", { x: 500 }, "mi-etiqueta")     // mismo tiempo que .d
tl.to(".f", { x: 600 }, "<")               // mismo tiempo que .e
```

| Parámetro | Significado |
|---|---|
| `"<"` | Mismo tiempo que la animación anterior |
| `">"` | Al final de la animación anterior |
| `"<0.5"` | 0.5s después del inicio de la anterior |
| `">0.5"` | 0.5s después del final de la anterior |
| `"label"` | Posición de la etiqueta |
| `"label+=0.5"` | 0.5s después de la etiqueta |

---

## 6. Cleanup manual obligatorio

useGSAP revierte automáticamente: `gsap.to()`, `ScrollTrigger.create()`, `SplitText`.

**NO revierte automáticamente (cleanup manual):**

```tsx
useGSAP(() => {
  gsap.ticker.add(callback)

  const el = document.createElement("div")
  container.appendChild(el)

  window.addEventListener("resize", onResize)

  return () => {
    gsap.ticker.remove(callback)
    el.remove()
    window.removeEventListener("resize", onResize)
  }
}, { scope: containerRef })
```

---

## 7. Errores comunes detectados en este proyecto

| Error | Solución |
|---|---|
| `"use client"` faltante en page.tsx | Agregar al inicio del archivo |
| Hook definido pero nunca llamado | Llamarlo en el componente |
| `DOMContentLoaded` dentro de useGSAP | Eliminarlo — useGSAP ya corre en el momento correcto |
| Selector vacío `""` en tl.to() | Usar el selector correcto (`"nav .line"`) |
| Sintaxis con comas (`tl.to(...), tl.to(...)`) | Usar statements separados (`tl.to(...); tl.to(...)`) |
| Código GSAP a nivel del módulo | Mover dentro de `useGSAP()` |
| No registrar plugins | `gsap.registerPlugin(useGSAP, SplitText, CustomEase)` |

---

## 8. Checklist para nueva animación

- [ ] `"use client"` en el componente
- [ ] `gsap.registerPlugin(useGSAP)` llamado
- [ ] Toda la lógica GSAP dentro de `useGSAP()`
- [ ] `scope: containerRef` para selectores aislados
- [ ] Cleanup manual para ticker, event listeners, DOM elements
- [ ] Build y lint pasan (`pnpm build && pnpm lint`)
- [ ] Probar en navegador: sin errores en consola
