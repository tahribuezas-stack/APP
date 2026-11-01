/**
 * KINET OS - Global Cursor Spotlight Module (Full Page Follow)
 */
(function () {
  'use strict';

  if (document.getElementById('kinet-global-spotlight')) return;

  // Crear el elemento flotante que sigue el cursor por toda la pantalla
  const spotlight = document.createElement('div');
  spotlight.id = 'kinet-global-spotlight';
  
  // Detección automática del color corporativo según la página actual
  let spotlightColor = 'rgba(0, 255, 102, 0.18)'; // Verde Neón por defecto (Atleta / Index / Fase 1)
  const context = (window.location.href + document.title).toLowerCase();

  if (context.includes('staff') || context.includes('coach')) {
    spotlightColor = 'rgba(245, 158, 11, 0.18)'; // Ámbar Técnico (Staff)[cite: 3]
  } else if (context.includes('scout') || context.includes('club')) {
    spotlightColor = 'rgba(59, 130, 246, 0.18)'; // Azul Corporativo (Scout)[cite: 7]
  }

  // Estilos fijos para cubrir la pantalla sin bloquear clics (pointer-events: none)
  spotlight.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: screen;
  `;
  document.body.appendChild(spotlight);

  // Actualizar la posición del gradiente en tiempo real con las coordenadas del ratón
  window.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    spotlight.style.background = `radial-gradient(550px circle at ${x}px ${y}px, ${spotlightColor}, transparent 70%)`;
  }, { passive: true });

  console.log('KINET OS: Global Full-Page Spotlight Loaded ⚡');
})();
