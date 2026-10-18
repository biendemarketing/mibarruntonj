# REGLA ESTRICTA E INQUEBRANTABLE: CERO TRAZOS EN TODA LA INTERFAZ

## 1. Prohibición Absoluta de Bordes / Trazos
- **NUNCA** agregar `border`, `outline`, `border-top`, `border-bottom`, `border-left`, o `border-right` a ningún elemento visual de la interfaz.
- Esto incluye **explícitamente**:
  - Tarjetas de platos (`.product-card`, `.product-card-compact`)
  - Modales (`.modal-content`, `.product-detail-modal`)
  - Drawers y paneles laterales (`.mobile-drawer`, `.cart-drawer`, `.categories-sidebar-nav`)
  - Barras de navegación (`.header-search-box`, `.mobile-nav-bar`, `.desktop-categories-bar`)
  - Botones, popovers, chips, badges, inputs y footers
  - Ni en modo claro (Light Mode) **ni en modo oscuro (Dark Mode)**

## 2. Cómo Lograr Contraste y Separación sin Trazos
1. **Diferencias de Tonalidad de Fondo (`background-color`)**:
   - Usar variaciones sutiles de fondo (ejemplo: fondo de página oscuro + fondo de card ligeramente más claro o con mayor opacidad).
2. **Sombras Suaves y Definidas (`box-shadow`)**:
   - Usar `box-shadow` suave o difusa (con opacidad moderada) para elevar los elementos sobre el fondo.
3. **Efectos de Vidrio Esmerilado (`backdrop-filter`)**:
   - Usar `backdrop-filter: blur(...)` para separar capas flotantes.
4. **Espaciado y Márgenes (`padding` / `gap` / `margin`)**:
   - Usar espacio negativo para separar jerarquías.

## 3. Verificación Obligatoria
- Antes de completar cualquier cambio de CSS o interfaz, verificar que no se haya introducido ninguna propiedad `border: 1px ...` o similar.
- Si un elemento tiene un borde por defecto del navegador, anularlo con `border: none !important;`.
