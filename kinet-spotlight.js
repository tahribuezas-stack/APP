/**
 * KINET OS - Global Spotlight & Dynamic Color Glow Module (v3)
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

    /* Halo de luz dinámico con el color correspondiente a cada sección */
    .glass-card::before {
      content: '';
      position: absolute;
      inset: -1px;
      background: radial-gradient(
        400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
        var(--spotlight-color, rgba(0, 255, 102, 0.4)),
        rgba(15, 18, 21, 0.05) 50%,
        transparent 80%
      );
      opacity: 0;
      transition: opacity 0.25s ease-in-out;
      pointer-events: none;
      z-index: 1;
      mix-blend-mode: screen;
    }

    .glass-card:hover::before {
      opacity: 1;
    }

    .glass-card > * {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);

  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Detección automática del color según el rol o la tarjeta
      if (!card.dataset.spotlightConfigured) {
        let color = 'rgba(0, 255, 102, 0.35)'; // Verde Neón por defecto (Atleta)
        const content = card.outerHTML + document.title;

        if (content.includes('amber') || content.includes('Staff') || content.includes('Coach')) {
          color = 'rgba(245, 158, 11, 0.35)'; // Ámbar Técnico (Staff)
        } else if (content.includes('blue') || content.includes('Scout') || content.includes('Club')) {
          color = 'rgba(59, 130, 246, 0.35)'; // Azul Corporativo (Scout)
        }

        card.style.setProperty('--spotlight-color', color);
        card.dataset.spotlightConfigured = 'true';
      }
    });
  }, { passive: true });

  console.log('KINET OS: Spotlight Dynamic Color Module v3 Loaded ⚡');
})();
```[cite: 13]

### Verificación del funcionamiento
1. Guarda el archivo `kinet-spotlight.js` actualizado[cite: 13].
2. Recarga tu navegador presionando `Ctrl + F5` para limpiar la caché.
3. Pasa el cursor por encima de las tarjetas en la pantalla de selección o en los pasos de calibración y comprueba que el halo de iluminación sigue al ratón mostrando exactamente el tono correspondiente a cada perfil (Verde, Ámbar o Azul).
