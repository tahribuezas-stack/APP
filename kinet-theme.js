// kinet-theme.js - Sincronizador Global de Tema y Estética para KINET OS
(function() {
    const savedAccent = localStorage.getItem('kinet_accent_color');
    const savedBg = localStorage.getItem('kinet_bg_intensity');
    const savedSpotlight = localStorage.getItem('kinet_spotlight');

    if (savedAccent) {
        applyGlobalAccent(savedAccent);
    }

    if (savedBg) {
        applyGlobalBg(savedBg);
    }

    if (savedSpotlight === 'false') {
        document.documentElement.style.setProperty('--spotlight-opacity', '0');
    }
})();

function applyGlobalAccent(hexColor) {
    let r = 0, g = 255, b = 136;
    if (hexColor === '#3B82F6') { r = 59; g = 130; b = 246; }
    else if (hexColor === '#F59E0B') { r = 245; g = 158; b = 11; }
    else if (hexColor === '#EC4899') { r = 236; g = 72; b = 153; }
    else if (hexColor === '#00FF88') { r = 0; g = 255; b = 136; }

    const root = document.documentElement;
    root.style.setProperty('--role-color', hexColor);
    root.style.setProperty('--role-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--role-glow', `rgba(${r}, ${g}, ${b}, 0.38)`);
    root.style.setProperty('--role-gradient', `linear-gradient(135deg, ${hexColor} 0%, rgba(${r},${g},${b},0.75) 100%)`);
}

function applyGlobalBg(mode) {
    const root = document.documentElement;
    if (mode === 'deep') {
        root.style.setProperty('--bg-void', '#020305');
    } else if (mode === 'contrast') {
        root.style.setProperty('--bg-void', '#0B101D');
    } else {
        root.style.setProperty('--bg-void', '#06080E');
    }
}