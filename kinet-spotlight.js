/**
 * KINET OS - Global Spotlight Cursor Effect Module (Color Dinámico por Página)
 */
(function () {
  'use strict';

  // Evitar duplicados si se carga dos veces
  if (document.getElementById('kinet-spotlight-global')) return;

  // Detectar el color del spotlight según la página o el rol activo
  let spotlightColor = 'rgba(0, 255, 102, 0.25)'; // Por defecto Verde Neón (Atleta)
  
  const path = window.location.pathname;
  if (path.includes('staff') || path.includes('coach')) {
    spotlightColor = 'rgba(245, 158, 11, 0.25)'; // Ámbar para Staff
  } else if (path.includes('scout')) {
    spotlightColor = 'rgba(59, 130, 246, 0.25)'; // Azul para Scout
  }

  const style = document.createElement('style');
  style.id = 'kinet-spotlight-global';
  style.innerHTML = `
    .glass-card {
      position: relative !important;
      overflow: hidden !important;
      isolation: isolate;
    }

    /* Halo de luz interactivo con el color adaptado a la página */
    .glass-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        circle 220px at var(--mouse-x, -500px) var(--mouse-y, -500px),
        ${spotlightColor},
        transparent 80%
      );
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
      pointer-events: none;
      z-index: 1;
    }

    .glass-card:hover::after {
      opacity: 1;
    }

    /* Asegurar que el contenido interno esté siempre por encima del efecto */
    .glass-card > * {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);

  // Escuchar el movimiento del cursor en toda la ventana de forma optimizada
  window.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  }, { passive: true });

  console.log('KINET OS: Dynamic Spotlight Module Loaded Successfully ⚡');
})();
