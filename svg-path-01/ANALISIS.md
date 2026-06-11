# Análisis: SVG Path Animation en Next.js

## ¿Qué hace este proyecto?

Galería de tarjetas con imágenes. Al hacer hover, dos trazos SVG se animan (se "dibujan" a sí mismos) alrededor de la imagen y el título se revela palabra por palabra. Al salir el mouse, todo se revierte.

---

## Arquitectura

```
src/
├── app/
│   ├── layout.tsx        // Layout root: font Google Sans + LenisProvider wrapper
│   ├── page.tsx          // Página principal: 6 tarjetas con SVGs anidados
│   └── globals.css       // Estilos: layout, cards, SVG strokes, responsive
├── components/
│   └── providers/
│       └── lenis-provider.tsx  // Contexto React que envuelve Lenis (smooth scroll)
└── hooks/
    └── use-svg-animation.tsx   // Hook central: toda la lógica GSAP
```

### Dependencias clave
- **Next.js 16** — App Router, React 19
- **GSAP 3.15** — Animaciones profesionales ( SplitText, timeline )
- **Lenis 1.3** — Smooth scroll con `requestAnimationFrame` integrado

---

## Flujo de ejecución

1. `layout.tsx` inyecta la fuente Google Sans vía CSS variable y envuelve todo en `<LenisProvider>`.
2. `page.tsx` renderiza 6 `.card-container`. Cada card tiene:
   - Una imagen con `<Image fill>`
   - Dos SVGs superpuestos (`svg-stroke-1` y `svg-stroke-2`) con paths complejos
   - Un título `<h3>`
3. `useSVGAnimation(containerRef)` orquesta todo:

   a. **Registro del ticker** — Conecta el `gsap.ticker` con `lenis.raf()` para que Lenis escuche las actualizaciones de GSAP.
   b. **SplitText** — Cada título se parte en palabras envueltas en `<span class="word">`. Se ocultan con `yPercent: 100`.
   c. **StrokeDasharray/Offset** — Cada path SVG mide su longitud total con `getTotalLength()` y se "esconde" (offset = length).
   d. **mouseenter** — Timeline paralelo: paths animan `strokeDashoffset → 0` y `stroke-width → 700`; palabras suben a `yPercent: 0` con stagger.
   e. **mouseleave** — Timeline inverso: paths vuelven a offset original y stroke-width a 200; palabras bajan con stagger desde el final.

---

## Conceptos clave transferibles a otros proyectos

### 1. **Sincronización GSAP ↔ Lenis**
```ts
const tickerCallback = (time: number) => lenis.raf(time * 1000)
gsap.ticker.add(tickerCallback)
gsap.ticker.lagSmoothing(0)
```
Esto evita que las animaciones GSAP y el smooth scroll compitan. Cualquier proyecto que use ambos se beneficia.

### 2. **SVG Stroke-Draw Animation**
```ts
const length = svgPath.getTotalLength()
svgPath.style.strokeDasharray = String(length)
svgPath.style.strokeDashoffset = String(length)
// luego animar strokeDashoffset → 0
```
Técnica universal para "dibujar" cualquier SVG path. Sin librerías extra. Sirve para: loaders, ilustraciones, diagramas, firmas, etc.

### 3. **SplitText con máscara de palabras**
```ts
SplitText.create(element, { type: "words", mask: "words" })
gsap.set(split.words, { yPercent: 100 })
```
Revelado de texto palabra por palabra sin ocupar espacio invisible. Patrón reutilizable en headers, hero sections, listas.

### 4. **Timelines con overlapped tweens**
```ts
tween.to(path, { ... }, 0)          // empieza en t=0
tween.to(words, { ... }, 0.35)      // empieza en t=0.35
```
Un solo timeline orquesta animaciones paralelas con offsets exactos. Evita callbacks anidados y mantiene todo sincronizado.

### 5. **Kill y reset en eventos rápidos**
```ts
if (tl) tl.kill()
```
En `mouseenter/mouseleave` se mata la timeline anterior antes de crear una nueva. Crítico para evitar acumulación de tweens cuando el usuario pasa rápido el mouse.

### 6. **Provider pattern para librerías de terceros**
```tsx
const LenisContext = createContext<Lenis | null>(null)
// LenisProvider crea la instancia, la guarda en state, la destruye en cleanup
// useLenis() da acceso desde cualquier hook
```
Aislar la inicialización/limpieza de librerías externas en un context+provider evita fugas de memoria y centraliza la configuración.

### 7. **CSS custom properties por card**
```css
:root {
  --card-1-stroke: #e67339;
  --card-2-stroke: #a66363;
}
#card-1 .svg-stroke-1 svg path { stroke: var(--card-1-stroke); }
```
Cada tarjeta comparte el mismo SVG pero con colores diferentes vía variables CSS. Patrón reusable: mismo markup, distinto tema.

### 8. **Clamp para tipografía responsive**
```css
font-size: clamp(2rem, 2.5vw, 3rem);
```
Sin media queries. Escala suavemente entre mínimo y máximo según viewport.

### 9. **Escalado de SVG superpuesto**
```css
.card-container .svg-stroke {
  transform: translate(-50%, -50%) scale(1.5);
}
```
El SVG es más grande que la card para que los trazos se salgan del borde. Técnica para efectos que desbordan el contenedor sin recortarse.

### 10. **useGSAP + revertOnUpdate**
```ts
useGSAP(() => { ... }, { dependencies: [lenis], revertOnUpdate: true })
```
El hook `useGSAP` de `@gsap/react` limpia y re-ejecuta la animación cuando `lenis` cambia. Evita memory leaks y mantiene el estado sincronizado con React.
