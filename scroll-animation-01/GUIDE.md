# GSAP + Lenis en Next.js — Guía y mejores prácticas

Basado en la [documentación oficial de GSAP para React](https://gsap.com/resources/React/).

---

## Índice

1. [Arquitectura del proyecto](#1-arquitectura-del-proyecto)
2. [Cómo funciona la animación](#2-cómo-funciona-la-animación)
3. [useGSAP — el hook oficial](#3-usegsap--el-hook-oficial)
4. [Patrón para portar HTML/CSS/JS a Next.js](#4-patrón-para-portar-htmlcssjs-a-nextjs)
5. [Mejores prácticas](#5-mejores-prácticas)
6. [Checklist para nueva funcionalidad](#6-checklist-para-nueva-funcionalidad)

---

## 1. Arquitectura del proyecto

```
src/
├── app/
│   ├── globals.css          ← Estilos globales + Lenis CSS
│   ├── layout.tsx           ← Layout raíz (Server Component)
│   │   └── <LenisProvider>  ← Envuelve toda la app
│   └── page.tsx             ← "use client" — solo orquestación
├── components/
│   ├── dissolve-grid.tsx    ← Componente contenedor (forwardRef)
│   └── providers/
│       └── lenis-provider.tsx ← Contexto + instancia de Lenis
└── hooks/
    └── use-scroll-animation.ts ← Toda la lógica GSAP + ScrollTrigger
```

### Responsabilidades de cada capa

| Capa | Rol | ¿Browser API? |
|---|---|---|
| `layout.tsx` | Server Component. Provee Lenis a toda la app | No |
| `page.tsx` | `"use client"`. Renderiza UI, conecta refs → hook | Mínimo |
| `useScrollAnimation` | Hook. Crea/maneja GSAP, ScrollTrigger, dissolve grid | Sí |
| `dissolve-grid.tsx` | Componente contenedor vía `forwardRef` | No |
| `lenis-provider.tsx` | Contexto. Crea/destruye instancia de Lenis | Sí |

---

## 2. Cómo funciona la animación

### 2.1 Stack de imágenes

5 imágenes apiladas con `position: absolute` dentro de `section.spotlight`.  
GSAP asigna `z-index` descendente: imagen 0 arriba (z:5), imagen 4 abajo (z:1).

### 2.2 ScrollTrigger

```
trigger:  section.spotlight
start:    "top top"
end:      "+=4 * window.innerHeight"  (4 transiciones × 1 viewport)
pin:      true
scrub:    true
```

Pinea el `section.spotlight` durante 4 viewports de scroll.  
`self.progress` va de 0 a 1 durante ese recorrido.

### 2.3 Clip paths por transición

Cada imagen tiene su propio segmento del progreso global:

```
Transición i: [i/4, (i+1)/4]
              ↓
segmentProgress = 0 → 1  (mapeo local)
              ↓
clipPercent   = 0 → 100  (imagen se oculta de arriba a abajo)
```

### 2.4 Dissolve grid

~14,400 celdas con caracteres aleatorios, creadas imperativamente en el hook (no en JSX — serían demasiados elementos).

En cada frame de scroll:

1. Se calcula qué transición está activa (`currentTransition`)
2. Se obtiene el `segmentProgress` local (0→1 dentro de esa transición)
3. `bondCenterY = -0.25 + segmentProgress × 1.5` — misma posición que el clip boundary
4. Cada celda calcula su distancia al `bondCenterY` aplicando scatter pseudo-aleatorio
5. Si `rawNormalizedDistance >= 1` (incluso sin scatter), la celda se oculta
6. Si no, se compara `density` contra un threshold aleatorio → visible/hidden

### 2.5 Integración Lenis + GSAP

```ts
const tickerCallback = (time: number) => lenis.raf(time * 1000);
gsap.ticker.add(tickerCallback);
gsap.ticker.lagSmoothing(0);
```

Lenis intercepta el scroll nativo y provee un timeline suave.  
GSAP sincroniza su ticker con Lenis para que `ScrollTrigger` lea la posición actualizada.

---

## 3. useGSAP — el hook oficial

GSAP provee el hook [`useGSAP()`](https://www.npmjs.com/package/@gsap/react) (`@gsap/react`) como reemplazo directo de `useEffect`/`useLayoutEffect`. Resuelve los principales friction points de React:

### 3.1 Instalación

```bash
pnpm add gsap @gsap/react
```

### 3.2 Uso básico

```tsx
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);  // ← obligatorio

function Component() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Todo GSAP animation, ScrollTrigger, etc. creado aquí
    // se revierte automáticamente al desmontar el componente
    gsap.to(".box", { x: 360 });
  }, { scope: container }); // ← scope: selector text scoped al contenedor

  return (
    <div ref={container}>
      <div className="box" />
    </div>
  );
}
```

### 3.3 Por qué useGSAP en vez de useEffect

| `useEffect` | `useGSAP` |
|---|---|
| No hace cleanup automático de animaciones | Usa `gsap.context()` internamente — todo se revierte al desmontar |
| Con React 18 Strict Mode los efectos se ejecutan 2 veces, causando animaciones duplicadas | Maneja Strict Mode correctamente |
| No tiene scoping de selectores | `scope: containerRef` scopes el selector text al contenedor |
| `useLayoutEffect` no es SSR-safe | Usa `useIsomorphicLayoutEffect` internamente |

### 3.4 Config object

```tsx
useGSAP(() => {
  gsap.to(".box", { x: endX });
}, {
  dependencies: [endX],       // como el array de useEffect
  scope: container,           // scope para selector text
  revertOnUpdate: true,       // revertir animaciones previas al re-ejecutar
});
```

| Propiedad | Descripción |
|---|---|
| `dependencies` | Array de dependencias (como `useEffect`). Default: `[]` |
| `scope` | React ref — scopes el selector text a los descendientes del contenedor |
| `revertOnUpdate` | Si `true`, al cambiar dependencias se revierte el context anterior antes de crear el nuevo |

### 3.5 contextSafe() — animaciones en event handlers

Las animaciones creadas **fuera** del callback de `useGSAP` (ej: en un click handler) NO se revierten automáticamente. Usa `contextSafe()` para envolverlas:

```tsx
function Component() {
  const container = useRef(null);

  const { contextSafe } = useGSAP({ scope: container });

  const onClick = contextSafe(() => {
    // Esta animación SÍ se revertirá al desmontar el componente
    gsap.to(".box", { rotation: 180 });
  });

  return (
    <div ref={container}>
      <button onClick={onClick} className="box">Click</button>
    </div>
  );
}
```

### 3.6 Scoped selectors

En lugar de crear un ref por cada elemento, define un **scope** y usa selector text:

```tsx
// ❌ Muchos refs
const box1 = useRef();
const box2 = useRef();
const box3 = useRef();
useGSAP(() => {
  gsap.from([box1, box2, box3], { opacity: 0, stagger: 0.1 });
});

// ✅ Scope + selectors
const container = useRef();
useGSAP(() => {
  gsap.from(".box", { opacity: 0, stagger: 0.1 });
}, { scope: container });
```

### 3.7 Cleanup automático

`useGSAP` revierte automáticamente: `gsap.to()`, `gsap.from()`, `ScrollTrigger.create()`, `Draggable.create()`, `SplitText`, etc.

Lo que NO revierte automáticamente (cleanup manual necesario):
- `gsap.ticker.add()` / `gsap.ticker.remove()`
- DOM elements creados con `document.createElement`
- `window.addEventListener` / `removeEventListener`
- `setTimeout` / `setInterval`
- `lenis.destroy()`

```ts
useGSAP(() => {
  gsap.ticker.add(callback);       // ← no se revierte solo
  ScrollTrigger.create({ ... });   // ← se revierte solo ✓

  return () => {
    gsap.ticker.remove(callback);   // cleanup manual
    cellElements.forEach(el => el.remove());
  };
}, { dependencies: [dep], revertOnUpdate: true });
```

---

## 4. Patrón para portar HTML/CSS/JS a Next.js

### Regla de oro

**El código JS de animación que use `document`, `window`, o APIs del DOM NO puede estar al nivel del módulo.** Debe estar dentro de `useGSAP()` o `useEffect` en un componente con `"use client"`.

### Paso a paso

#### Paso 1: Instalar dependencias

```bash
pnpm add gsap @gsap/react lenis
```

#### Paso 2: Identificar código problemático

```js
// ❌ ESTO ROMPE EN NEXT.JS (código a nivel del módulo)
const elements = document.querySelectorAll(".item");
elements.forEach(el => el.style.color = "red");
ScrollTrigger.create({ trigger: ".container", ... });
```

#### Paso 3: Crear un `"use client"` wrapper

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function AnimationWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // ✅ Toda la lógica aquí
    const items = ref.current?.querySelectorAll(".item");
    items?.forEach((item, i) => {
      gsap.to(item, { opacity: 0, scrollTrigger: { trigger: item, ... } });
    });
  }, { scope: ref });

  return <div ref={ref}>{children}</div>;
}
```

#### Paso 4: Extraer lógica compleja a un hook personalizado

```ts
// hooks/use-my-animation.ts
export function useMyAnimation(containerRef: RefObject<HTMLDivElement | null>) {
  useGSAP(() => {
    // ... toda la lógica GSAP
    return () => { /* cleanup manual */ };
  }, { dependencies: [dep], revertOnUpdate: true });
}
```

#### Paso 5: El page.tsx solo orquesta

```tsx
"use client";

export default function Page() {
  const ref = useRef(null);
  useMyAnimation(ref);

  return <div ref={ref}>...</div>;
}
```

### Mapa de conversión HTML/CSS/JS → Next.js

| Concepto JS vainilla | Equivalente Next.js |
|---|---|
| `document.querySelectorAll` | `ref.current.querySelectorAll` o scoped selectors en `useGSAP` |
| `document.createElement` | JSX o `useEffect`/`useGSAP` con `createElement` + `appendChild` |
| `element.style.prop = x` | CSS classes + `style` prop, o directo en `useGSAP` para rendimiento |
| `window.innerWidth/Height` | Acceder dentro de `useGSAP` (solo cliente) |
| `window.addEventListener` | Dentro de `useGSAP`, limpiar en return |
| `new Lenis({...})` | Dentro de Provider + `useEffect`, `destroy()` en cleanup |
| `ScrollTrigger.create(...)` | Dentro de `useGSAP` — se revierte automáticamente |
| `setInterval` / `requestAnimationFrame` | Dentro de `useGSAP`, limpiar en return |
| Variables globales | `useRef` o closure dentro de `useGSAP` |

---

## 5. Mejores prácticas

### 5.1 useGSAP

- **Siempre** llamar `gsap.registerPlugin(useGSAP)` al inicio (una vez basta)
- Usar `scope: containerRef` para scoped selectors — evita crear 100 refs
- Para animaciones en event handlers, envolver con `contextSafe()`
- Usar `revertOnUpdate: true` cuando haya dependencias que requieran re-sincronizar
- El cleanup manual solo es necesario para cosas NO-GSAP (ticker, DOM, event listeners)

### 5.2 ScrollTrigger

- Registrar con `gsap.registerPlugin(ScrollTrigger)` antes de usar
- Crear dentro de `useGSAP` — se limpia solo al desmontar
- Usar `gsap.utils.clamp()` para valores que no deben salirse de rango

### 5.3 Lenis

- Crear la instancia en un Provider (contexto) para compartirla en toda la app
- Usar `autoRaf: true` si no se integra con GSAP
- Si se integra con GSAP, considerar `autoRaf: false` y llamar `lenis.raf()` desde `gsap.ticker` para evitar rAF duplicados
- Obtener la instancia vía `useLenis()` y hacer null-check antes de usar

### 5.4 Refs

- `useRef<HTMLDivElement>(null)` — estables entre renders, no causan re-ejecución
- Para múltiples elementos: un solo ref contenedor + `querySelectorAll` dentro de `useGSAP`
- Útiles para almacenar timelines y evitar que se creen en cada render

### 5.5 Rendimiento

- No renderizar en JSX cientos de elementos animados — crearlos imperativamente en `useGSAP` si son muchos (como el dissolve grid con 14k+ celdas)
- Usar `will-change` en CSS para propiedades animadas (`clip-path`, `transform`, `opacity`)
- `pointer-events: none` en overlays que no necesitan interacción
- `scrub: true` + `gsap.ticker` sincronizado con Lenis = animación fluida sin jank

### 5.6 Errores comunes

| Error | Solución |
|---|---|
| Olvidar `"use client"` | Agregar al inicio del archivo que use browser APIs |
| Código GSAP a nivel del módulo | Mover a `useGSAP()` |
| No limpiar `gsap.ticker` | Guardar callback y hacer `remove()` en cleanup |
| No destruir Lenis | Llamar `lenis.destroy()` en cleanup del provider |
| No registrar plugins | `gsap.registerPlugin(ScrollTrigger)`, `gsap.registerPlugin(useGSAP)` |
| Animaciones duplicadas en Strict Mode | Usar `useGSAP` que maneja cleanup automático |

---

## 6. Checklist para nueva funcionalidad

Al agregar una nueva animación con GSAP + Lenis en Next.js:

- [ ] `@gsap/react` está instalado (`pnpm add @gsap/react`)
- [ ] El componente tiene `"use client"` (si usa hooks o browser APIs)
- [ ] `gsap.registerPlugin(useGSAP)` está llamado
- [ ] `gsap.registerPlugin(ScrollTrigger)` está llamado (si se usa)
- [ ] Toda la lógica GSAP está dentro de `useGSAP()`, no al nivel del módulo
- [ ] Animated elements are targeted via `scope: container` + selector text, o refs individuales
- [ ] Animaciones en event handlers están envueltas en `contextSafe()`
- [ ] Cleanup manual para: `gsap.ticker`, DOM elements, event listeners, `setTimeout`
- [ ] `lenis` se obtiene vía `useLenis()` con null-check
- [ ] Build y lint pasan (`pnpm build && pnpm lint`)
- [ ] Probar en navegador: scroll suave, sin flickers, sin errores en consola

---

## Referencias

- [GSAP + React (oficial)](https://gsap.com/resources/React/)
- [useGSAP hook (npm)](https://www.npmjs.com/package/@gsap/react)
- [Useful patterns](https://gsap.com/resources/react-basics)
- [Advanced techniques](https://gsap.com/resources/react-advanced)
- [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Lenis](https://github.com/darkroomengineering/lenis)
- [Next.js Client Components](https://nextjs.org/docs/app/api-reference/directives/use-client)
