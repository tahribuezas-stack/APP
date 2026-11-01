/**
 * KINET OS - Universal Full-Screen Spotlight
 */
(function () {
  'use strict';

  if (document.getElementById('kinet-global-spotlight')) return;

  const spotlight = document.createElement('div');
  spotlight.id = 'kinet-global-spotlight';
  
  // Detección automática del color corporativo según la página o rol actual
  let spotlightColor = 'rgba(0, 255, 102, 0.15)'; // Verde Neón por defecto (Atleta / Fase 1)
  const context = (window.location.href + document.title).toLowerCase();

  if (context.includes('staff') || context.includes('coach')) {
    spotlightColor = 'rgba(245, 158, 11, 0.15)'; // Ámbar Técnico (Staff)[cite: 3]
  } else if (context.includes('scout') || context.includes('club')) {
    spotlightColor = 'rgba(59, 130, 246, 0.15)'; // Azul Corporativo (Scout)
  }

  // Capa fija que cubre toda la ventana por encima de cualquier contenedor
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

  // Seguir las coordenadas exactas del cursor por toda la pantalla
  window.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    spotlight.style.background = `radial-gradient(450px circle at ${x}px ${y}px, ${spotlightColor}, transparent 75%)`;
  }, { passive: true });

  console.log('KINET OS: Universal Screen Spotlight Loaded ⚡');
})();
