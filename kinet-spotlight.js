/**
 * KINET OS - Global Spotlight Cursor Effect Module (Versión Robusta)
 */
(function () {
  'use strict';

  // Evitar duplicados si se carga dos veces
  if (document.getElementById('kinet-spotlight-global')) return;

  const style = document.createElement('style');
  style.id = 'kinet-spotlight-global';
  style.innerHTML = `
    .glass-card {
      position: relative !important;
      overflow: hidden !important;
      isolation: isolate;
    }

    /* Halo de luz con valores por defecto seguros para evitar fallos del navegador */
    .glass-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
        rgba(59, 130, 246, 0.25),
        transparent 60%
      );
      opacity: 0;
      transition: opacity 0.25s ease-in-out;
      pointer-events: none;
      z-index: 1;
    }

    .glass-card:hover::before {
      opacity: 1;
    }

    /* Asegurar que el contenido interno esté siempre por encima del brillo */
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

  console.log('KINET OS: Spotlight Global Module Loaded Successfully ⚡');
})();
