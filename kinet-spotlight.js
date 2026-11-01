/**
 * KINET OS - Precision Spotlight, Centering Fix & Favicon Injector
 */
(function () {
  'use strict';

  // 1. Inyectar automáticamente el Favicon / Logo de KINET OS en la pestaña
  if (!document.querySelector("link[rel*='icon']")) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300FF66"><text y="18" font-size="18" font-weight="bold" font-family="monospace">K</text></svg>';
    document.head.appendChild(link);
  }

  // 2. Corregir alineación para centrar la interfaz en la pantalla
  if (!document.getElementById('kinet-layout-fix')) {
    const layoutStyle = document.createElement('style');
    layoutStyle.id = 'kinet-layout-fix';
    layoutStyle.innerHTML = `
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100vh;
        background-color: #080A0C !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }
      /* Centrar contenedor principal si venía flotando en una esquina */
      body > div:first-of-type, main {
        margin: auto;
      }
    `;
    document.head.appendChild(layoutStyle);
  }

  if (document.getElementById('kinet-global-spotlight')) return;

  // 3. Crear el spotlight global con un haz de luz más pequeño y preciso
  const spotlight = document.createElement('div');
  spotlight.id = 'kinet-global-spotlight';
  
  // Detección automática del color corporativo según la página actual
  let spotlightColor = 'rgba(0, 255, 102, 0.25)'; // Verde Neón (Atleta / Fase 1)
  const context = (window.location.href + document.title).toLowerCase();

  if (context.includes('staff') || context.includes('coach')) {
    spotlightColor = 'rgba(245, 158, 11, 0.25)'; // Ámbar Técnico (Staff)
  } else if (context.includes('scout') || context.includes('club')) {
    spotlightColor = 'rgba(59, 130, 246, 0.25)'; // Azul Corporativo (Scout)
  }

  spotlight.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 99999;
  `;
  document.body.appendChild(spotlight);

  // Seguir las coordenadas del cursor con un radio reducido (220px)
  window.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    spotlight.style.background = `radial-gradient(220px circle at ${x}px ${y}px, ${spotlightColor}, transparent 80%)`;
  }, { passive: true });

  console.log('KINET OS: Optimized Spotlight & Layout Loaded ⚡');
})();
