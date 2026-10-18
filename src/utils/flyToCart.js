/**
 * Utilidad Fly to Cart (Vuelo parabólico al carrito)
 * Efecto micro-interactivo para dar retroalimentación visual al agregar un producto
 */
export function triggerFlyToCart(event) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let startX = window.innerWidth / 2;
  let startY = window.innerHeight / 2;

  if (event && event.currentTarget) {
    const rect = event.currentTarget.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  } else if (event && event.clientX) {
    startX = event.clientX;
    startY = event.clientY;
  }

  // Elemento de destino: botón flotante de escritorio, botón del header o icono del mobile nav
  const targetEl =
    document.querySelector('.desktop-floating-cart') ||
    document.querySelector('.header-desktop-cart-btn') ||
    document.querySelector('.mobile-cart-badge') ||
    document.querySelector('.mobile-nav-bar');

  if (!targetEl) return;

  const targetRect = targetEl.getBoundingClientRect();
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;

  const particle = document.createElement('div');
  particle.className = 'fly-to-cart-particle';
  particle.style.left = `${startX}px`;
  particle.style.top = `${startY}px`;
  particle.style.setProperty('--dx', `${targetX - startX}px`);
  particle.style.setProperty('--dy', `${targetY - startY}px`);

  document.body.appendChild(particle);

  // Animación suave de rebote en el destino
  setTimeout(() => {
    targetEl.classList.add('cart-target-bounce');
    setTimeout(() => targetEl.classList.remove('cart-target-bounce'), 320);
  }, 420);

  setTimeout(() => {
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
  }, 550);
}
