/**
 * KINET OS - Global Spotlight Cursor Effect Module (Basado en Variable CSS)
 */
(function () {
  'use strict';

  if (document.getElementById('kinet-spotlight-global')) return;

  const style = document.createElement('style');
  style.id = 'kinet-spotlight-global';
  style.innerHTML = `
    .glass-card {
      position: relative !important;
      overflow: hidden !important;
      isolation: isolate;
    }

    /* Lee la variable --spotlight-color definida en el body de cada página */
    .glass-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        circle 220px at var(--mouse-x, -500px) var(--mouse-y, -500px),
        var(--spotlight-color, rgba(0, 255, 102, 0.30)),
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

    .glass-card > * {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);

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

  console.log('KINET OS: Spotlight CSS Variable Module Loaded Successfully ⚡');
})();
