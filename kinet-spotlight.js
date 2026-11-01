/**
 * KINET OS - Spotlight Cursor Effect (Fixed Syntax & Universal Target)
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
      /* Sintaxis CSS corregida: circle 180px */
      background-image: radial-gradient(
        circle 180px at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
        var(--spotlight-color, rgba(0, 255, 102, 0.45)),
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

      // Detección automática del color según la sección o página actual
      if (!el.dataset.spotlightConfigured) {
        let color = 'rgba(0, 255, 102, 0.45)'; // Verde Neón (Atletas)
        
        const context = (window.location.href + document.title + document.body.className + el.outerHTML).toLowerCase();

        if (context.includes('staff') || context.includes('coach') || context.includes('amber')) {
          color = 'rgba(245, 158, 11, 0.45)'; // Ámbar (Staff)
        } else if (context.includes('scout') || context.includes('club') || context.includes('blue')) {
          color = 'rgba(59, 130, 246, 0.45)'; // Azul (Scouts)
        }

        el.style.setProperty('--spotlight-color', color);
        el.dataset.spotlightConfigured = 'true';
      }
    });
  }, { passive: true });

  console.log('KINET OS: Spotlight Fixed & Loaded ⚡');
})();
