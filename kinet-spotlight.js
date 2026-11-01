/**
 * KINET OS - Global Spotlight Cursor Effect (Bulletproof Pseudo-element)
 */
(function () {
  'use strict';

  if (document.getElementById('kinet-spotlight-global')) return;

  const style = document.createElement('style');
  style.id = 'kinet-spotlight-global';
  style.innerHTML = `
    .glass-card, [class*="card"], .rounded-2xl, .rounded-xl {
      position: relative !important;
      overflow: hidden !important;
      isolation: isolate;
    }

    /* Capa de luz mediante pseudo-elemento optimizada para fondos oscuros */
    .glass-card::after, [class*="card"]::after, .rounded-2xl::after, .rounded-xl::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        circle 200px at var(--mouse-x, -500px) var(--mouse-y, -500px),
        var(--spotlight-color, rgba(0, 255, 102, 0.3)),
        transparent 80%
      );
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
      pointer-events: none;
      z-index: 1;
    }

    .glass-card:hover::after, [class*="card"]:hover::after, .rounded-2xl:hover::after, .rounded-xl:hover::after {
      opacity: 1;
    }

    /* Asegurar que el contenido interno permanezca siempre por encima del brillo */
    .glass-card > *, [class*="card"] > *, .rounded-2xl > *, .rounded-xl > * {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);

  document.addEventListener('mousemove', (e) => {
    const elements = document.querySelectorAll('.glass-card, [class*="card'], .rounded-2xl, .rounded-xl');
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);

      // Detección automática del color corporativo según la sección o página
      if (!el.dataset.spotlightConfigured) {
        let color = 'rgba(0, 255, 102, 0.3)'; // Verde Neón (Atletas)
        const context = (window.location.href + document.title + document.body.className + el.outerHTML).toLowerCase();

        if (context.includes('staff') || context.includes('coach') || context.includes('amber')) {
          color = 'rgba(245, 158, 11, 0.3)'; // Ámbar (Staff)
        } else if (context.includes('scout') || context.includes('club') || context.includes('blue')) {
          color = 'rgba(59, 130, 246, 0.3)'; // Azul (Scouts)
        }

        el.style.setProperty('--spotlight-color', color);
        el.dataset.spotlightConfigured = 'true';
      }
    });
  }, { passive: true });

  console.log('KINET OS: Bulletproof Spotlight Loaded ⚡');
})();
