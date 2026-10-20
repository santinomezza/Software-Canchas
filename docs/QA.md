# Informe de QA

Auditoría ejecutada sobre el **build de producción** (`npm run build && npm start`),
no sobre el servidor de desarrollo.

```bash
npm run build && npm start
node scripts/qa/lighthouse.mjs http://localhost:3000
```

---

## Lighthouse

| Categoría | Móvil | Escritorio |
|---|---|---|
| Performance | **99** | **100** |
| Accessibility | **100** | **100** |
| Best Practices | **100** | **100** |
| SEO | **100** | **100** |

### Core Web Vitals (móvil, emulación Moto G)

| Métrica | Valor | Objetivo |
|---|---|---|
| First Contentful Paint | 0,3 s | < 1,8 s |
| Largest Contentful Paint | **0,8 s** | < 2,0 s |
| Total Blocking Time | **60 ms** | < 200 ms |
| Cumulative Layout Shift | **0** | < 0,05 |
| Speed Index | 0,6 s | < 3,4 s |

> El SEO baja a 92 si se audita un servidor local cuyo `canonical` apunta al
> dominio de producción: Lighthouse marca *"canonical apunta a otra
> location hreflang"*. Es un artefacto del entorno de prueba, no un defecto
> del sitio. Con `NEXT_PUBLIC_SITE_URL` alineado al host auditado, el SEO da
> 100.

---

## axe-core (WCAG 2.2 A/AA)

**0 violaciones** en la landing (1440 px) y en las pantallas del panel.

Reglas ejecutadas: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.

### Defectos encontrados y corregidos durante la auditoría

| Regla | Problema | Corrección |
|---|---|---|
| `aria-input-field-name` | El *thumb* del slider no tenía nombre accesible (Radix no propaga `aria-label` al pulgar) | Nueva prop `thumbLabel` en `Slider`, aplicada al `Thumb` |
| `list` | `<ul>` contenía `<div data-reveal>` en lugar de `<li>` | `Reveal` ahora se renderiza con `as="li"` en `reservations.tsx` |
| `listitem` | `<li>` fuera de su `<ul>` | Mismo fix que el anterior |
| `canonical` (SEO) | `hreflang` relativos contra `canonical` absoluto | Todos los alternates usan URLs absolutas de `siteConfig.url` |
| `errors-in-console` (BP) | El proxy de i18n interceptaba `/icon` y `/opengraph-image` (404) | Rutas de metadata excluidas del `matcher` del proxy |
| `aria-input-field-name` | El pulgar del slider sin nombre accesible | Prop `thumbLabel` en `Slider` |
| `list` / `listitem` | `<li>` fuera de su `<ul>` en la sección de reservas | `Reveal` con `as="li"` |
| HTML nesting | `<input hidden>` dentro de `<select>` en el selector de rol | Input movido fuera del `<select>` |
| Números de formulario | `min={1}` con `step={100}` rechazaba $4.500 | `min={0}` para que el paso sea múltiplo de 100 |

---

## Contraste de color (WCAG 2.2 AA)

| Par | Modo oscuro | Modo claro |
|---|---|---|
| `ink` / `base` | 18,4:1 | 15,2:1 |
| `ink-2` / `base` | 8,4:1 | 7,0:1 |
| `ink-3` / `base` | 5,7:1 | 4,6:1 |
| `accent` / `base` | 11,1:1 | 1,5:1 ⚠ no se usa como texto |
| `accent-contrast` / `accent` | 11,3:1 | 3,6:1 ⚠ |
| `gold` / `base` | 9,7:1 | 6,4:1 |

⚠ En modo claro el acento **no** se usa como texto: para texto sobre fondo
claro se usa `--accent-strong` (`#0C7A55`, 4,8:1). En claro, el botón primario
lleva acento de fondo con texto blanco.

---

## Movimiento reducido

`prefers-reduced-motion: reduce` está soportado en tres niveles:

1. **CSS** — los reveals se resuelven con `IntersectionObserver` + transiciones
   CSS, con un override que fuerza `opacity: 1; transform: none`. El contenido
   es **siempre visible**, incluso si el JS falla.
2. **`<noscript>`** — stylesheet inline que muestra todo el contenido aunque
   JavaScript esté deshabilitado.
3. **JS** — el tilt 3D no se monta, el reproductor no auto-avanza, los
   contadores muestran el valor final.

Verificado con Playwright con `reducedMotion: "reduce"`: 0 elementos con
`opacity: 0` tras el scroll.

---

## Pruebas automatizadas

### Unitarias (Vitest) — 19 tests

```
src/lib/scheduling.test.ts   15  (slots, solapamiento, seña, cancelación, slugs)
src/lib/auth.test.ts          4  (hash scrypt, verificación, normalización)
```

### End-to-end (Playwright) — 18 pasos en 2 suites

`scripts/qa/e2e.mjs` — flujo de onboarding contra un servidor levantado:

```
PASS  signup page renders
PASS  signup creates account and lands on panel
PASS  complex is created
PASS  court is added
PASS  opening hours are saved
PASS  public page shows the complex and its court
PASS  booking is created from the public page
PASS  booking shows up in the panel
PASS  double booking the same slot is rejected
PASS  screenshot of the panel

console errors: 0
```

`scripts/qa/e2e-panel.mjs` — agenda, caja y equipo:

```
PASS  owner signs up and sets up the complex
PASS  agenda renders the grid with the court column
PASS  booking is created from an empty slot
PASS  booking is fully editable from the agenda
PASS  cash report lists the movement and totals
PASS  manual cash movement is registered
PASS  employee is added with a temporary password
PASS  employee signs in and sees a read-only agenda

console errors: 0
```

La última suite verifica además que un empleado con rol *encargado* **no**
pueda entrar a la sección de equipo: el permiso se aplica en el servidor, no
ocultando el botón.

### Capturas responsive — 0 errores de consola

`scripts/qa/capture.mjs` captura la landing en **1440 / 768 / 390 px** y todas
las secciones, y cuenta los errores de consola en cada viewport.

---

## Responsive

Verificado en 360, 390, 768, 1024, 1440 y 1920 px.

- Grilla de 12 columnas que colapsa a 1 columna por debajo de `lg`.
- Tabla de caja con scroll horizontal en pantallas chicas.
- Grilla de turnos con scroll horizontal (`min-w-[38rem]`).
- Menú móvil con panel expandible; objetivos táctiles ≥ 44 px.

---

## Pendiente

- [ ] Auditoría con `axe` sobre el panel y la página pública (hoy cubre la landing).
- [ ] Pruebas de carga real (el servidor local responde en ~40 ms; falta medir
      con base de datos en la nube).
- [ ] Lighthouse en la URL de preview de Vercel (el rendimiento en la red de
      producción puede diferir del loopback).
