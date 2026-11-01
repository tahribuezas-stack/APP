/**
 * KINET OS - Pure CSS Variable Tracker
 */
document.addEventListener('mousemove', (e) => {
  const cards = document.querySelectorAll('.glass-card');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--y', `${e.clientY - rect.top}px`);
  });
}, { passive: true });
