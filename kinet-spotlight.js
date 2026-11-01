/**
 * KINET OS - Precision Spotlight Cursor Effect (Optimized Size & Color)
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
      /* Gradiente reducido a 180px para un aro de luz más preciso y elegante */
      background-image: radial-gradient(
        180px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
        var(--spotlight-color, rgba(0, 255, 102, 0.35)),
        transparent 80%
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
      
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);

      // Detección inteligente basada en la URL actual, la página o el contenido de la tarjeta
      if (!el.dataset.spotlightConfigured) {
        let color = 'rgba(0, 255, 102, 0.4)'; // Verde Neón por defecto (Atletas)
        
        const pageContext = (window.location.href + document.title + document.body.className + el.outerHTML).toLowerCase();

        if (pageContext.includes('staff') || pageContext.includes('coach') || pageContext.includes('amber')) {
          color = 'rgba(245, 158, 11, 0.4)'; // Ámbar Técnico (Staff)
        } else if (pageContext.includes('scout') || pageContext.includes('club') || pageContext.includes('blue')) {
          color = 'rgba(59, 130, 246, 0.4)'; // Azul Corporativo (Scouts)
        }

        el.style.setProperty('--spotlight-color', color);
        el.dataset.spotlightConfigured = 'true';
      }
    });
  }, { passive: true });

  console.log('KINET OS: Precision Spotlight Loaded ⚡');
})();
