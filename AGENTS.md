# Reglas del Proyecto Mi Barrunto

## REGLA ESTRICTA DE DISEÑO: CERO TRAZOS EN TODA LA INTERFAZ
- **PROHIBICIÓN TOTAL DE BORDES/TRAZOS**: Queda terminantemente prohibido utilizar bordes (`border`, `border-top`, `border-bottom`, `outline`) en tarjetas (`cards`), modales, drawers, barras de búsqueda, botones, sidebars, popovers o cualquier otro componente visual, tanto en modo claro como en modo oscuro.
- Toda separación visual y contraste debe lograrse **exclusivamente** mediante:
  1. Sombras volumétricas (`box-shadow`).
  2. Diferencias de tonalidad en fondos (`background-color`).
  3. Difuminado de vidrio (`backdrop-filter`).
  4. Espaciado y padding limpio.
- Todos los componentes deben tener `border: none !important;`.

## REGLA ESTRICTA: PROHIBICIÓN TOTAL DE EMOJIS — USAR SIEMPRE ICONOS VECTORIALES (SVG)
- **NUNCA** utilizar emojis en la interfaz ni en documentos impresos (como 🖨️, ⏰, 📞, 📍, 📘, 📸, 🎵, ☎️, 💬, 🌐, 💡, ★, etc.).
- Todo pictograma o símbolo debe implementarse obligatoriamente mediante **iconos vectoriales SVG profesionales** (Lucide icons o SVG inline limpios), garantizando elegancia, nitidez en imprenta (300+ DPI) y consistencia visual entre dispositivos.

