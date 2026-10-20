# Sistema de diseño

Fuente de verdad: `src/design-system/tokens.ts`.
Espejo en CSS: `src/app/globals.css` (variables + `@theme` de Tailwind v4).
Export para Figma: `src/design-system/tokens.json`.

---

## 1. Concepto

**"Club nocturno esmeralda"** — precisión deportiva + hospitalidad de lujo.

El acento verde esmeralda aparece **sólo** en acciones, estados activos y datos
vivos. Todo lo demás son superficies verde-negro en capas. Consecuencia: el
CTA es lo único que brilla, la jerarquía se lee de un vistazo y la página se
siente un club privado, no un SaaS genérico.

## 2. Color

### Modo oscuro (por defecto)

| Token | Valor | Uso |
|---|---|---|
| `--bg-base` | `#07110F` | Fondo de página |
| `--bg-surface-1` | `#0D1B18` | Tarjetas, paneles |
| `--bg-surface-2` | `#13261F` | Superficies anidadas |
| `--bg-surface-3` | `#1B3129` | Chips, inputs, hover |
| `--accent` | `#2EE59D` | CTA, estados de éxito, datos |
| `--accent-contrast` | `#04140E` | Texto sobre acento |
| `--gold` | `#D9B870` | Detalle premium (bordes, badges, iconos clave) |
| `--ink` / `--ink-2` / `--ink-3` | `#E9F0ED` / `#9FB3AC` / `#7C918A` | Texto |
| `--line` / `--line-strong` | rgba 10% / 18% | Bordes |

### Modo claro

| Token | Valor |
|---|---|
| `--bg-base` | `#F6F4EF` |
| `--bg-surface-1` / `--surface-2` | `#FFFFFF` |
| `--bg-surface-3` | `#EFEBE2` |
| `--accent` | `#12B981` |
| `--accent-strong` | `#0C7A55` — **sólo para texto** sobre fondo claro |
| `--gold` | `#8A6A24` |
| `--ink` / `--ink-2` / `--ink-3` | `#1A1F1D` / `#4A544F` / `#68766F` |

### Contraste (WCAG 2.2 AA)

| Par | Modo oscuro | Modo claro |
|---|---|---|
| `ink` sobre `base` | 18.4:1 | 15.2:1 |
| `ink-2` sobre `base` | 8.4:1 | 7.0:1 |
| `ink-3` sobre `base` | 5.7:1 | 4.6:1 |
| `accent` sobre `base` | 11.1:1 | 1.5:1 ⚠ |
| `accent-contrast` sobre `accent` | 11.3:1 | 3.6:1 ⚠ |

⚠ En modo claro el acento **no** se usa como texto: para texto sobre fondo
claro se usa `--accent-strong` (`#0C7A55`, 4.8:1). En claro, el botón primario
usa acento como fondo con texto blanco.

## 3. Tipografía

- **Display**: `Fraunces` (variable, eje `opsz`) — titulares, cifras, nombres.
  `font-variation-settings: "opsz" 120`, tracking `-0.03em` a `4xl`.
- **UI**: `Inter Tight` (variable) — cuerpo, labels, botones.
- Escala modular 1.25 con `clamp()`:
  `xs .75 → sm .875 → base 1 → lg 1.125–1.25 → xl 1.375–1.625 → 2xl 1.75–2.25
   → 3xl 2.125–3.125 → 4xl 2.75–4.5 → 5xl 3.25–6 rem`
- Interlineado: `1.02` en display grande, `1.5` en cuerpo, `1.65` en lead.
- Títulos ≤ 8 palabras. Párrafos ≤ 3 líneas.

## 4. Espaciado y layout

- Grilla de 12 columnas, container `80rem` (wide `90rem`), gutter `clamp(1.25rem, …, 2.5rem)`.
- Ritmo vertical de sección: `clamp(5rem, 3.6rem + 6.2vw, 10rem)` (80–160 px).
- Radios: `xs 6 · sm 10 · md 14 · lg 20 · xl 28 · 2xl 36 · pill 999`.
- Sombras multicapa (`--shadow-sm/md/lg/xl`).

## 5. Superficies

- `glass`: blur 24 px + saturación 160 % + borde de 10 % de opacidad.
- `glass-strong`: blur 30 px para overlays sobre contenido.
- `mesh`: degradado radial en tres capas con blur — se usa detrás del hero y del
  CTA final.
- `grain`: ruido SVG al 2,8 % con `mix-blend-mode: overlay` para unificar
  superficies y fotografía.

## 6. Iconografía

Set único **Lucide** v1, trazo `1.5`, tamaño 16/20/24. Las marcas de terceros
(Instagram, LinkedIn, YouTube, TikTok, Apple, Google Play) están dibujadas a
mano en `src/components/brand/social-icons.tsx` porque Lucide v1 retiró los
glifos de marca. En la UI **no hay emojis**.

## 7. Movimiento

- Easing estándar: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Entradas: fade + translate de 12–24 px, 450–600 ms, escalonadas 60–80 ms.
- `prefers-reduced-motion: reduce` desactiva **todo** el movimiento no esencial:
  los reveals se resuelven por CSS (ver más abajo) y el tilt 3D no se monta.
- Los reveals usan `IntersectionObserver` + CSS, no una librería: así el
  contenido **siempre** es visible con reduced-motion y también sin JavaScript
  (hay un `<noscript>` que lo fuerza).

## 8. Componentes

`src/components/ui/` — construidos sobre Radix, con `cn()` de `tailwind-merge`.

| Componente | Variantes |
|---|---|
| Button | `primary · secondary · glass · ghost · gold · outline` / `sm md lg icon icon-sm` / `loading` |
| Badge | `default · accent · gold · outline · solid` |
| Card | `interactive` (hover elevado) |
| Input | `invalid`, con `Label` y `FieldError` |
| Select | Radix, con `SelectItem` |
| Accordion / Tabs / Slider / Switch / Dialog | Radix + estilos del sistema |
| Toaster | Sonner, tema-aware |

## 9. Reglas de uso

1. El acento es para acciones y datos. Si algo es decorativo, va en `gold` o en
   `ink-3`.
2. Ningún texto usa `--accent` sobre fondo claro.
3. Todo elemento interactivo tiene foco visible (`:focus-visible` con outline
   de 2 px en acento y offset de 3 px).
4. Todo objetivo táctil mide ≥ 44 px.
5. Los formularios validan en cliente **y** en servidor con el mismo schema Zod.
6. Ningún asset de terceros: toda la ilustración es vector o markup propio.

## 10. Importar a Figma

`src/design-system/tokens.json` sigue la convención `<categoría>/<rol>/<variante>`
de Figma Variables. Para recrear las variables:

1. Crear una collection con los modos `Light` / `Dark`.
2. Importar el JSON como variables (los nombres ya coinciden con los tokens CSS).
3. Crear los estilos de texto a partir de la escala de la sección 3.
4. Los estilos de color se mapean 1:1 con los tokens de la sección 2.
