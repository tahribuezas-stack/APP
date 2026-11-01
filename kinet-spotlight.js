/**
 * KINET OS - Global Spotlight Cursor Effect (Bulletproof Direct Background)
 */
(function () {
  'use strict';

  if (document.getElementById('kinet-spotlight-global')) return;

  const style = document.createElement('style');
  style.id = 'kinet-spotlight-global';
  style.innerHTML = `
    .glass-card, [class*="card"], .rounded-2xl, .rounded-xl {
      position: relative !important;
      isolation: isolate;
      /* Aplica el gradiente de luz directamente como la capa superior del fondo */
      background-image: radial-gradient(
        400px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
        var(--spotlight-color, rgba(0, 255, 102, 0.4)),
        transparent 70%
      ) !important;
    }
  `;
  document.head.appendChild(style);

  document.addEventListener('mousemove', (e) => {
    const elements = document.querySelectorAll('.glass-card, [class*="card'], .rounded-2xl, .rounded-xl');
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Actualiza las coordenadas del cursor dentro de la tarjeta
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);

      // Detección automática del color según el contexto
      if (!el.dataset.spotlightConfigured) {
        let color = 'rgba(0, 255, 102, 0.4)'; // Verde Neón (Atletas)
        const htmlContent = el.outerHTML;

        if (htmlContent.includes('amber') || htmlContent.includes('staff') || htmlContent.includes('Coach')) {
          color = 'rgba(245, 158, 11, 0.4)'; // Ámbar (Staff)
        } else if (htmlContent.includes('blue') || htmlContent.includes('scout') || htmlContent.includes('Club')) {
          color = 'rgba(59, 130, 246, 0.4)'; // Azul (Scouts)
        }

        el.style.setProperty('--spotlight-color', color);
        el.dataset.spotlightConfigured = 'true';
      }
    });
  }, { passive: true });

  console.log('KINET OS: Direct Background Spotlight Loaded ⚡');
})();
