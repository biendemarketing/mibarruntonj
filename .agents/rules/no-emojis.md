# REGLA ESTRICTA E INQUEBRANTABLE: PROHIBICIÓN TOTAL DE EMOJIS — SIEMPRE USAR ICONOS VECTORIALES (SVG)

## 1. Prohibición Absoluta de Emojis
- **NUNCA** utilizar emojis tipográficos de ningún tipo (por ejemplo: 🖨️, ⏰, 📞, 📍, 📘, 📸, 🎵, ☎️, 💬, 🌐, 💡, ★, ✨, etc.) en ningún componente visual, texto, botón, pie de página, portada, menú web ni menú imprimible.
- Los emojis renderizan de forma inconsistente entre sistemas operativos (Windows, macOS, iOS, Android), carecen de calidad tipográfica y lucen informales o poco profesionales.

## 2. Obligación de Usar Iconos Vectoriales (SVG)
- Toda necesidad gráfica de pictograma, símbolo o icono debe resolverse **exclusivamente con iconos vectoriales SVG limpios** (ejemplo: librería `lucide-react`, iconos SVG inline con `viewBox`, `stroke="currentColor"` o colores institucionales).
- Los iconos vectoriales deben tener:
  1. Dimensiones explícitas (`width`, `height`).
  2. Trazo y relleno profesional acorde a la paleta de colores del diseño.
  3. Escalabilidad perfecta tanto en pantallas Retina como en documentos de impresión a 300+ DPI.

## 3. Verificación
- Antes de entregar cualquier código HTML, JSX o CSS, revisar y asegurar que no exista ningún carácter emoji en el marcado o textos visibles.
