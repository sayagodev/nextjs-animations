# Análisis del Hook de Animación Scroll

## Visión General

Este proyecto implementa una animación **hero scroll-driven** usando tres librerías clave:

- **GSAP** — Motor de animaciones. Maneja timelines, interpolaciones (tweens) y el scroll trigger.
- **ScrollTrigger** — Plugin de GSAP que enlaza las animaciones con el scroll del usuario.
- **Lenis** — Smooth scroll moderno. Reemplaza el scroll nativo del navegador para dar control fino sobre el frame loop.

---

## Arquitectura del Flujo

### 1. `layout.tsx` — El punto de entrada

Todo el árbol de componentes se envuelve en `<LenisProvider>`:

```tsx
<LenisProvider>{children}</LenisProvider>
```

Esto hace que el hook `useLenis()` esté disponible en cualquier componente hijo.

---

### 2. `lenis-provider.tsx` — Proveedor de Lenis

**¿Qué hace?**

- Crea una única instancia de `Lenis` con opciones por defecto:
  - `autoRaf: true` — Lenis maneja su propio `requestAnimationFrame`
  - `duration: 1.2` — Duración del scroll suave
  - `easing` exponencial — Curva de aceleración natural (ease-out)
- Expone la instancia via React Context (`LenisContext`).
- En el cleanup del `useEffect`, destruye la instancia con `lenisInstance.destroy()`.

**¿Por qué Context?**

Porque `useScrollAnimation` necesita la misma instancia de Lenis que está manejando el scroll. Si hubiera dos instancias, los scroll triggers no sincronizarían.

---

### 3. `page.tsx` — El escenario

Renderiza:

```
<section class="hero">
  ├── .hero-bg         → Imagen de fondo (1.jpg), escala inicial 1.5
  ├── .hero-content    → Texto principal
  ├── .hero-revealer   → Overlay rojo que "revela" el contenido
  ├── .hero-images     → Wrapper que contiene:
  │   ├── .hero-img    → Imagen 2.jpg (clip-path reducido al centro)
  │   ├── .hero-img    → Imagen 3.jpg
  │   └── .hero-img    → Imagen 5.jpg
  └── .hero-outro-content → Texto de salida con fondo rojo
<section class="about">
  └── margin-top: 500svh → Crea 7 viewports de distancia de scroll
```

La clase `hero-outro-content` se usa como **origen** para clonar las mitades izquierda/derecha en el hook.

---

### 4. `use-scroll-animation.tsx` — El cerebro (análisis línea por línea)

```typescript
import gsap from "gsap";
import type { RefObject } from "react";
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useLenis } from "@/components/providers/lenis-provider";

gsap.registerPlugin(useGSAP)
```

- `useGSAP` es un hook de `@gsap/react` que reemplaza `useEffect` para animaciones GSAP. Maneja automáticamente el cleanup y el `revertOnUpdate`.
- `ScrollTrigger` se registra más tarde dentro del hook, no aquí.

---

#### 4.1 Integración Lenis + GSAP

```typescript
const tickerCallback = (time: number) => lenis.raf(time * 1000)
gsap.ticker.add(tickerCallback)
gsap.ticker.lagSmoothing(0)
```

- GSAP tiene su propio **ticker** (loop de frames). Lenis también tiene su propio `raf`.
- Para que Lenis controle el scroll **y** GSAP anime en sincronía, se conecta el ticker de GSAP al `raf` de Lenis.
- Cada frame, GSAP llama a `tickerCallback` con el tiempo en segundos → se multiplica por 1000 para convertirlo a milisegundos (lo que espera `lenis.raf`).
- `gsap.ticker.lagSmoothing(0)` desactiva la compensación de lag para evitar saltos en la animación cuando el usuario vuelve a la pestaña.

**Sin esto**: ScrollTrigger no sabría cuándo Lenis está haciendo scroll, y la animación no avanzaría suavemente.

---

#### 4.2 Clonación del Outro

```typescript
const heroOutroClone = heroOutroContent?.cloneNode(true) as Element
heroOutroContent?.classList.add("hero-outro-left")
heroOutroClone?.classList.add("hero-outro-right")
heroOutroContent?.parentNode?.appendChild(heroOutroClone)
```

- El texto de salida (`hero-outro-content`) se **clona** para crear dos mitades independientes.
- La original se convierte en `hero-outro-left`.
- El clon se agrega al mismo padre y se convierte en `hero-outro-right`.
- El efecto final es que el texto se parte en dos y cada mitad se desplaza en direcciones opuestas formando una "cortina".

---

#### 4.3 Setup de Clip Paths Iniciales

```typescript
gsap.set(".hero-outro-left", {
  clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)"
})
gsap.set(".hero-outro-right", {
  clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)"
})
gsap.set(heroImagesWrapper, { scale: 1 })
```

- `gsap.set()` es un `to()` instantáneo (sin duración) para establecer valores iniciales.
- Las mitades izquierda/derecha se recortan para mostrar exactamente su mitad correspondiente.
- El wrapper de imágenes se fuerza a `scale: 1` por si acaso el CSS lo hubiera puesto en otro valor.

---

#### 4.4 ScrollTrigger — El Timeline Principal

```typescript
const heroScrollTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: heroSection,
    start: "top top",       // cuando el top del hero llega al top del viewport
    end: () => `+=${window.innerHeight * 7}`,  // 7 viewports de duración
    pin: true,               // fija el hero en su lugar mientras dure la animación
    pinSpacing: false,       // no agrega margen extra por el pin (el margin del .about ya lo hace)
    scrub: true,             // la animación sigue el scroll 1:1
    invalidateOnRefresh: true, // recalcula medidas si la ventana cambia de tamaño
  }
})
```

**¿Qué significa `end: "+=7vh"` en la práctica?**
- La animación no depende de un elemento de salida. Simplemente dura **7 veces la altura del viewport**.
- Como `.about` tiene `margin-top: 500svh` (~5 viewports), y 7 viewports es suficiente para cubrir toda la animación antes de llegar al about.

**`scrub: true`** — Conecta el progreso del timeline directamente con la posición del scroll. Sin scrub, la animación se reproduciría completa al entrar al trigger.

---

#### 4.5 Secuencia de Animación (Línea de Tiempo Visual)

```
Tiempo (segundos virtuales del timeline):

0.0 ───────────────────────────────────────────────────── 1.0

[0.0 - 0.5]   hero-bg: escala de 1.5 → 1
[0.0 - 0.2]   hero-revealer: slit vertical 49.5% → 50.5%
[0.2 - 0.5]   hero-revealer: slit se expande 0% → 100%
[0.4 - 0.64]  hero-img (cascade): clip-path centro → full + scale 0→1
[0.52 - 0.68] hero-outro-content: scale 0→1
[0.65 - 0.71] hero-bg, hero-content, hero-revealer, hero-images: fade out
[0.70]        hero-background-color: transparent
[0.70 - 1.0]  hero-outro-left: xPercent -150 (se va a la izquierda)
[0.70 - 1.0]  hero-outro-right: xPercent 50 (se va a la derecha)
```

**Detalle de cada paso:**

##### Paso 1 — Fondo se acerca (0.0 → 0.5)
```typescript
heroScrollTimeline.to(heroBackground, { scale: 1, duration: 0.5 }, 0)
```
- El fondo empieza en `scale: 1.5` (definido en CSS como `.hero-bg { transform: scale(1.5) }`).
- Animación: se reduce a `scale: 1` para que la imagen se vea completa.
- Posición `0` = comienza inmediatamente al iniciar el timeline.

##### Paso 2 — Revealer se abre en dos fases (0.0 → 0.5)
```typescript
// Fase 1: slit fino (0.0 → 0.2)
heroScrollTimeline.to(heroRevealer, {
  clipPath: "polygon(49.5% 0%, 50.5% 0%, 50.5% 100%, 49.5% 100%)",
  duration: 0.2,
}, 0)

// Fase 2: apertura total (0.2 → 0.5)
heroScrollTimeline.to(heroRevealer, {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  duration: 0.3,
}, 0.2)
```
- El `.hero-revealer` es un `div` rojo que cubre toda la pantalla.
- En CSS tiene `clip-path: polygon(49.5% 50%, 50.5% 50%, 50.5% 50%, 49.5% 50%)` — un punto invisible en el centro.
- **Fase 1**: el clip-path se convierte en una línea vertical delgada (1% de ancho, de arriba a abajo).
- **Fase 2**: esa línea se expande horizontalmente hasta cubrir toda la pantalla.

**Efecto visual**: una línea vertical aparece en el centro y se expande como una cortina revelando lo que está detrás (el contenido y las imágenes).

##### Paso 3 — Imágenes cascada (0.4 → ~0.64)
```typescript
const cascadeStart = 0.4
const cascadeStagger = 0.04
const cascadeDuration = 0.16

heroImages.forEach((heroImage, index) => {
  heroScrollTimeline.to(
    heroImage,
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      scale: 1,
      duration: cascadeDuration,
    },
    cascadeStart + index * cascadeStagger
  )
})
```
- Cada `.hero-img` empieza con `clip-path: polygon(50% 50%, ...)` — invisible (colapsado al centro).
- También tiene `scale: 0` en CSS (`.hero-img { transform: translate(-50%, -50%) scale(0) }`).
- La animación expande el clip-path al rectángulo completo **y** escala a 1 simultáneamente.
- `forEach` + `index * cascadeStagger` crea el **efecto cascada**: cada imagen aparece 0.04s después de la anterior.
- 3 imágenes × 0.04s = 0.08s de diferencia total entre la primera y la última.

##### Paso 4 — Outro aparece (0.52)
```typescript
heroScrollTimeline.to(".hero-outro-content", {
  scale: 1,
  duration: cascadeDuration,
}, cascadeStart + heroImages.length * cascadeStagger + cascadeStagger * 0.5)
```
- Justo después de que la última imagen termine de aparecer, el texto de salida escala de 0 → 1.
- El timing: `0.4 + 3*0.04 + 0.5*0.04 = 0.4 + 0.12 + 0.02 = 0.54` (aproximadamente).

##### Paso 5 — Fade out de elementos anteriores (0.65)
```typescript
heroScrollTimeline.to(
  [heroBackground, heroContent, heroRevealer, heroImagesWrapper],
  { autoAlpha: 0, duration: 0.06 },
  0.65,
)
```
- `autoAlpha: 0` es una propiedad conveniente de GSAP que establece `opacity: 0` y `visibility: hidden` al mismo tiempo.
- Desaparecen el fondo, el texto original, el revealer y el wrapper de imágenes para dejar solo el outro visible.

##### Paso 6 — Color de fondo transparente (0.7)
```typescript
heroScrollTimeline.set(heroSection, { backgroundColor: "transparent" }, 0.7)
```
- La sección `.hero` tenía el fondo rojo (por el `.hero-outro-content`).
- Se vuelve transparente para que el `.about` (que viene detrás con `z-index: 1`) sea visible.

##### Paso 7 — Efecto cortina de salida (0.7 → 1.0)
```typescript
heroScrollTimeline.to(".hero-outro-left", { xPercent: -150, duration: 0.3 }, 0.7)
heroScrollTimeline.to(".hero-outro-right", { xPercent: 50, duration: 0.3 }, 0.7)
```
- La mitad izquierda del texto se mueve `-150%` hacia la izquierda.
- La mitad derecha se mueve `50%` hacia la derecha.
- `xPercent` es relativo al **ancho del propio elemento**, no del padre. Como cada mitad tiene ~50% del ancho total:
  - Izquierda: `-150%` = 1.5 veces su ancho hacia la izquierda (sale de pantalla).
  - Derecha: `50%` = 0.5 veces su ancho hacia la derecha (también sale de pantalla).

**Resultado**: el texto de salida se parte en dos y se abre como una cortina, revelando la sección `.about` que estaba detrás.

---

#### 4.6 Cleanup

```typescript
return () => {
  gsap.ticker.remove(tickerCallback)
}
```

- Cuando el componente se desmonta o las dependencias cambian, se remueve el callback del ticker de GSAP.
- Esto evita fugas de memoria y que Lenis siga recibiendo frames después de que el hook ya no es necesario.
- `revertOnUpdate: true` en `useGSAP` hace que cualquier tween/timeline activo se revierta automáticamente.

---

## Resumen Visual del Efecto Completo

```
Scroll hacia abajo (7 viewports):

1. Hero se pincha en pantalla (no se mueve)
2. Fondo se acerca (zoom out)
3. Línea roja aparece en el centro y se expande → "cortina que se abre"
4. 3 imágenes aparecen en cascada, una tras otra
5. Texto de salida aparece
6. Todo lo anterior se desvanece
7. El texto de salida se parte en dos mitades que se separan
8. La sección "about" queda visible debajo
```

## Relación con el CSS

| Elemento | CSS | Propósito |
|---|---|---|
| `.hero` | `position: relative; z-index: 2` | Capa sobre `.about` (z-index: 1) |
| `.hero-bg` | `scale(1.5)` | Empieza zoomed in, anima a scale(1) |
| `.hero-revealer` | `clip-path: polygon(49.5% 50%, ...)` | Invisible al inicio |
| `.hero-img` | `clip-path: polygon(50% 50%, ...)` | Invisible al inicio |
| `.hero-outro-content` | `scale(0)` | Invisible, anima a scale(1) |
| `.about` | `margin-top: 500svh` | Espacio extra para que el hero pin funcione |
