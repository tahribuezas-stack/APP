/**
 * KINET OS - Global Spotlight Cursor Effect (Universal Auto-Target)
 */
(function () {
  'use strict';

  if (document.getElementById('kinet-spotlight-global')) return;

  const style = document.createElement('style');
  style.id = 'kinet-spotlight-global';
  style.innerHTML = `
    /* Aplica a cualquier tarjeta o contenedor interactivo */
    .glass-card, [class*="card"], .rounded-2xl, .rounded-xl {
      position: relative !important;
      overflow: hidden !important;
      isolation: isolate;
    }

    .glass-card::before, [class*="card"]::before, .rounded-2xl::before, .rounded-xl::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
        var(--spotlight-color, rgba(0, 255, 102, 0.4)),
        transparent 70%
      );
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
      pointer-events: none;
      z-index: 1;
    }

    .glass-card:hover::before, [class*="card"]:hover::before, .rounded-2xl:hover::before, .rounded-xl:hover::before {
      opacity: 1;
    }

    .glass-card > *, [class*="card"] > *, .rounded-2xl > *, .rounded-xl > * {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);

  document.addEventListener('mousemove', (e) => {
    // Selecciona tarjetas por clase genérica de Tailwind o clases personalizadas
    const elements = document.querySelectorAll('.glass-card, [class*="card"], .rounded-2xl, .rounded-xl');
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);

      if (!el.dataset.spotlightConfigured) {
        let color = 'rgba(0, 255, 102, 0.4)'; // Verde por defecto

        const htmlContent = el.outerHTML;
        if (htmlContent.includes('amber') || htmlContent.includes('staff') || htmlContent.includes('Coach')) {
          color = 'rgba(245, 158, 11, 0.4)'; // Ámbar
        } else if (htmlContent.includes('blue') || htmlContent.includes('scout') || htmlContent.includes('Club')) {
          color = 'rgba(59, 130, 246, 0.4)'; // Azul
        }

        el.style.setProperty('--spotlight-color', color);
        el.dataset.spotlightConfigured = 'true';
      }
    });
  }, { passive: true });

  console.log('KINET OS: Universal Spotlight Loaded ⚡');
})();
