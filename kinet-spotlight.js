/**
 * KINET OS - Global Spotlight Cursor Effect Module
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

    .glass-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
        var(--spotlight-color, rgba(0, 255, 102, 0.45)),
        transparent 70%
      );
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
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

      if (!card.dataset.spotlightMapped) {
        let color = 'rgba(0, 255, 102, 0.45)';
        const content = card.outerHTML + card.className;

        if (content.includes('amber') || card.closest('[id*="staff"], [id*="coach"]')) {
          color = 'rgba(245, 158, 11, 0.45)';
        } else if (content.includes('blue') || card.closest('[id*="scout"]')) {
          color = 'rgba(59, 130, 246, 0.45)';
        }

        card.style.setProperty('--spotlight-color', color);
        card.dataset.spotlightMapped = 'true';
      }
    });
  }, { passive: true });

  console.log('KINET OS: Spotlight Loaded Successfully');
})();
