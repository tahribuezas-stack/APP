/**
 * KINET OS - Card-Only Precision Spotlight & Favicon Module
 */
(function () {
  'use strict';

  // 1. Inyectar favicon de KINET OS si no existe
  if (!document.querySelector("link[rel*='icon']")) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300FF66"><text y="18" font-size="18" font-weight="bold" font-family="monospace">K</text></svg>';
    document.head.appendChild(link);
  }

  if (document.getElementById('kinet-card-spotlight-style')) return;

  // 2. Definir los estilos CSS para que el haz de luz actúe solo dentro de las tarjetas
  const style = document.createElement('style');
  style.id = 'kinet-card-spotlight-style';
  style.innerHTML = `
    .glass-card, [class*="card"], .rounded-2xl, .rounded-xl {
      position: relative !important;
      overflow: hidden !important;
      isolation: isolate;
    }

    .glass-card::after, [class*="card"]::after, .rounded-2xl::after, .rounded-xl::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        circle 180px at var(--mouse-x, -500px) var(--mouse-y, -500px),
        var(--spotlight-color, rgba(0, 255, 102, 0.35)),
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

    .glass-card > *, [class*="card"] > *, .rounded-2xl > *, .rounded-xl > * {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);

  // 3. Detectar coordenadas del ratón relativas a cada tarjeta y asignar color según la sección
  document.addEventListener('mousemove', (e) => {
    const elements = document.querySelectorAll('.glass-card, [class*="card'], .rounded-2xl, .rounded-xl');
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);

      if (!el.dataset.spotlightConfigured) {
        let color = 'rgba(0, 255, 102, 0.35)'; // Verde Neón (Atletas / Fase 1)
        const context = (window.location.href + document.title).toLowerCase();

        if (context.includes('staff') || context.includes('coach')) {
          color = 'rgba(245, 158, 11, 0.35)'; // Ámbar (Staff)
        } else if (context.includes('scout') || context.includes('club')) {
          color = 'rgba(59, 130, 246, 0.35)'; // Azul (Scouts)
        }

        el.style.setProperty('--spotlight-color', color);
        el.dataset.spotlightConfigured = 'true';
      }
    });
  }, { passive: true });

  console.log('KINET OS: Card-Only Spotlight Loaded ⚡');
})();
