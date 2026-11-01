/**
 * KINET OS - Global Spotlight Cursor Effect Module
 * Añade iluminación dinámica de cursor a todas las tarjetas de la aplicación sin alterar la lógica de negocio.
 */

(function () {
  'use strict';

  // 1. Inyectar los estilos CSS necesarios de forma automática
  const spotlightStyles = document.createElement('style');
  spotlightStyles.id = 'kinet-global-spotlight-styles';
  spotlightStyles.innerHTML = `
    /* Tarjetas con efecto Spotlight interactivo global */
    .glass-card {
      position: relative;
      background: rgba(19, 23, 29, 0.85);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
      overflow: hidden;
    }

    /* El foco de luz azul que sigue al cursor dentro de cada tarjeta */
    .glass-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(59, 130, 246, 0.18), transparent 40%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 1;
    }

    .glass-card:hover::before {
      opacity: 1;
    }

    /* Asegurar que el contenido interno esté siempre por encima del foco de luz */
    .glass-card > * {
      position: relative;
      z-index: 2;
    }

    .glass-card:hover {
      border-color: rgba(59, 130, 246, 0.4);
      box-shadow: 0 0 25px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }

    .glass-card.selected {
      border-color: #3B82F6 !important;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
      background: rgba(59, 130, 246, 0.04);
    }
  `;
  document.head.appendChild(spotlightStyles);

  // 2. Escáner de movimiento del cursor optimizado para todo el documento
  document.addEventListener('mousemove', (e) => {
    const cards = document.getElementsByClassName('glass-card');
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  }, { passive: true });

  console.log('KINET OS: Spotlight Global Module Loaded Successfully ⚡');
})();