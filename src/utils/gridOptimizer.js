/**
 * Calcula la clase de ancho/span para que las tarjetas de cualquier categoría
 * se repartan el espacio equitativamente en la última fila sin dejar huecos ni espacios vacíos,
 * tanto en Vista Normal (3 columnas), Cuadrícula (4 columnas) y Compacta (2 columnas).
 */
export function getDishGridClass(index, total, viewMode) {
  if (viewMode === 'compact') {
    if (total === 1) return 'col-compact-single';
    // Si es impar (ej: 3, 5, 7...), las últimas 3 tarjetas ocupan 33.3% cada una (en la misma fila)
    if (total % 2 !== 0 && index >= total - 3) {
      return 'col-span-third';
    }
    return 'col-span-half';
  }

  if (viewMode === 'grid4') {
    if (total === 1) return 'col-grid4-single';
    const remainder = total % 4;
    if (remainder === 1) {
      // Sobra 1 (ej: 5, 9, 13...): las últimas 5 se dividen en fila de 3 (33.3%) y fila de 2 (50%)
      if (index >= total - 2) {
        return 'col-grid4-half';
      }
      if (index >= total - 5) {
        return 'col-grid4-third';
      }
    } else if (remainder === 2) {
      // Sobran 2 (ej: 2, 6, 10, 14...): las últimas 2 se dividen 50/50
      if (index >= total - 2) {
        return 'col-grid4-half';
      }
    } else if (remainder === 3) {
      // Sobran 3 (ej: 3, 7, 11, 15...): las últimas 3 se dividen 33.3% cada una
      if (index >= total - 3) {
        return 'col-grid4-third';
      }
    }
    return 'col-grid4-quarter';
  }

  // Vista Normal (3 Columnas base en escritorio):
  if (total === 1) return 'col-grid-single';
  const rem3 = total % 3;
  if (rem3 === 1) {
    // Sobra 1 (ej: 4, 7, 10, 13, 16, 19, 22...): las últimas 4 tarjetas se reparten en 2 filas de 2 (50% cada una)
    if (index >= total - 4) {
      return 'col-grid-half';
    }
  } else if (rem3 === 2) {
    // Sobran 2 (ej: 2, 5, 8, 11, 14, 17, 20...): las últimas 2 tarjetas se dividen 50/50
    if (index >= total - 2) {
      return 'col-grid-half';
    }
  }
  return 'col-grid-third';
}
