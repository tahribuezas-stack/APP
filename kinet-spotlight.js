/**
 * KINET OS - Card-Only Precision Spotlight & Favicon Module
 */
(function () {
  'use strict';

  // 1. Inyección segura del Favicon de KINET OS en la pestaña
  try {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300FF66"><text y="18" font-size="18" font-weight="bold" font-family="monospace">K</text></svg>';
    if (!document.querySelector("link[rel*='icon']")) {
      document.head.appendChild(link);
    }
  } catch (e) {
    console.warn('KINET OS: Favicon injection notice', e);
  }

  if (document.getElementById('kinet-card-spotlight-style')) return;

  // 2. Definir los estilos CSS exclusivos para .glass-card
  const style = document.createElement('style');
  style.id = 'kinet-card-spotlight-style';
  style.innerHTML = `
    .glass-card {
      position: relative !important;
      overflow: hidden !important;
      isolation: isolate;
    }

    .glass-card::after {
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

    .glass-card:hover::after {
      opacity: 1;
    }

    .glass-card > * {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);

  // 3. Detección de coordenadas y color adaptativo por rol/sección
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.glass-card');
    
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      if (!card.dataset.spotlightConfigured) {
        let color = 'rgba(0, 255, 102, 0.35)'; // Verde Neón (Atleta / Fase 1)
        const context = (window.location.href + document.title).toLowerCase();

        if (context.includes('staff') || context.includes('coach')) {
          color = 'rgba(245, 158, 11, 0.35)'; // Ámbar (Staff)
        } else if (context.includes('scout') || context.includes('club')) {
          color = 'rgba(59, 130, 246, 0.35)'; // Azul (Scouts)
        }

        card.style.setProperty('--spotlight-color', color);
        card.dataset.spotlightConfigured = 'true';
      }
    });
  }, { passive: true });

  console.log('KINET OS: Clean Card Spotlight Loaded ⚡');
})();
