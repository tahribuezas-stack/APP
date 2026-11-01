/**
 * KINET OS - Clean Global Spotlight & Favicon Module
 */
(function () {
  'use strict';

  // 1. Inyectar favicon de KINET OS si no existe
  if (!document.querySelector("link[rel*='icon']")) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300FF66"><text y="18" font-size="18" font-weight="bold" font-family="monospace">K</text></svg>';
    document.head.appendChild(link);
  }

  if (document.getElementById('kinet-global-spotlight')) return;

  // 2. Crear el spotlight global flotante (sin tocar la estructura ni los márgenes de tu CSS)
  const spotlight = document.createElement('div');
  spotlight.id = 'kinet-global-spotlight';
  
  // Detección automática del color corporativo según la página o rol actual
  let spotlightColor = 'rgba(0, 255, 102, 0.22)'; // Verde Neón (Atleta / Fase 1)
  const context = (window.location.href + document.title).toLowerCase();

  if (context.includes('staff') || context.includes('coach')) {
    spotlightColor = 'rgba(245, 158, 11, 0.22)'; // Ámbar Técnico (Staff)
  } else if (context.includes('scout') || context.includes('club')) {
    spotlightColor = 'rgba(59, 130, 246, 0.22)'; // Azul Corporativo (Scout)
  }

  spotlight.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 99999;
  `;
  document.body.appendChild(spotlight);

  // Seguir las coordenadas del cursor con un haz de luz preciso y elegante (220px)
  window.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    spotlight.style.background = `radial-gradient(220px circle at ${x}px ${y}px, ${spotlightColor}, transparent 80%)`;
  }, { passive: true });

  console.log('KINET OS: Clean Spotlight Loaded ⚡');
})();
