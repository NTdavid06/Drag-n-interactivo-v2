"use strict";
// Ported from flash
// credits https://www.deviantart.com/gifhaas/art/Dragon-8681899 dragon by GifHaas on DeviantArt

// Variables globales optimizadas
const screen = document.getElementById("screen");
const xmlns = "http://www.w3.org/2000/svg";
const xlinkns = "http://www.w3.org/1999/xlink";
const N = 40; // Número de segmentos del cuerpo
const elems = new Array(N);
const pointer = { x: 0, y: 0 };
let width, height, radm, frm, rad;
let isMobile = false;
let isDragging = false;

// Variables para la animación de fuego y audio
const FIRE_LENGTH = 150; // Longitud máxima del fuego
const FIRE_DURATION = 350; // Duración de la animación en ms
const FIRE_COOLDOWN = 1000; // 1 segundo de enfriamiento
let isFireAnimating = false;
let lastFireTime = 0; // Para el Cooldown

// Elemento de audio
const roarAudio = new Audio('roar.mp3'); 
// Puedes ajustar el volumen si es necesario: roarAudio.volume = 0.5;

// Cache para mejor rendimiento
let rafId = null;
const transformCache = new Array(N);

// Precalcular factores para cada segmento
const segmentFactors = new Array(N);
for (let i = 0; i < N; i++) {
    segmentFactors[i] = (100 - i) / 5;
}

// Detectar dispositivo móvil
const detectMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768 && window.innerHeight <= 1024);
};

// Inicialización del dragón
const initDragon = () => {
    if (rafId) {
        cancelAnimationFrame(rafId);
    }
    
    screen.innerHTML = '';
    
    for (let i = 0; i < N; i++) {
        elems[i] = { 
            use: null, 
            x: width / 2, 
            y: height / 2,
            lastTransform: ''
        };
        transformCache[i] = '';
    }
    
    pointer.x = width / 2;
    pointer.y = height / 2;
    
    radm = Math.min(width, height) * 0.35;
    frm = Math.random();
    rad = 0;
    
    const fragment = document.createDocumentFragment();
    
    for (let i = 1; i < N; i++) {
        const elem = document.createElementNS(xmlns, "use");
        let href;
        
        if (i === 1) href = "Cabeza";
        else if (i === 8 || i === 14) href = "Aletas";
        else href = "Espina";
        
        elem.setAttributeNS(xlinkns, "xlink:href", "#" + href);
        elems[i].use = elem;
        fragment.appendChild(elem);
    }
    
    screen.appendChild(fragment);
};

// FUNCIÓN: ALIENTO DE FUEGO con Cooldown y Audio
const fireBreath = () => {
    const now = performance.now();

    // 2. Control de Cooldown
    if (isFireAnimating || (now - lastFireTime < FIRE_COOLDOWN)) return; 
    
    isFireAnimating = true;
    lastFireTime = now;

    // 1. Reproducir Rugido
    roarAudio.currentTime = 0; // Reinicia el sonido si se está reproduciendo
    roarAudio.play().catch(e => console.log("Error al reproducir audio:", e));
    
    // Lógica visual del fuego (sin cambios mayores)
    const head = elems[1];
    if (!head || !head.use) {
        isFireAnimating = false;
        return;
    }

    const ep = elems[0];
    const dx_head = head.x - ep.x;
    const dy_head = head.y - ep.y;
    const a_head = Math.atan2(dy_head, dx_head);
    const angleDeg = a_head * (180 / Math.PI);
    
    const fireX = (ep.x + head.x) * 0.5;
    const fireY = (ep.y + head.y) * 0.5;
    
    const fireElem = document.createElementNS(xmlns, "use");
    fireElem.setAttributeNS(xlinkns, "xlink:href", "#Fuego");
    fireElem.setAttributeNS(null, "class", "fire-effect");
    
    const tx = fireX + Math.cos(a_head) * 10; 
    const ty = fireY + Math.sin(a_head) * 10;
    
    const initialScale = isMobile ? 0.3 : 0.4;
    fireElem.setAttributeNS(null, "transform", `translate(${tx},${ty}) rotate(${angleDeg}) scale(${initialScale})`);
    fireElem.style.opacity = '1';
    fireElem.style.transition = `all ${FIRE_DURATION}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;

    screen.appendChild(fireElem);

    void fireElem.offsetWidth;

    const finalScale = isMobile ? 1.5 : 2.5;
    fireElem.setAttributeNS(null, "transform", 
        `translate(${tx + Math.cos(a_head) * FIRE_LENGTH}, 
                    ${ty + Math.sin(a_head) * FIRE_LENGTH}) 
         rotate(${angleDeg}) 
         scale(${finalScale})`);
    fireElem.style.opacity = '0';

    setTimeout(() => {
        if (fireElem.parentNode) {
            fireElem.parentNode.removeChild(fireElem);
        }
        isFireAnimating = false;
    }, FIRE_DURATION + 50);
};

// MANEJADORES DE EVENTOS (sin cambios funcionales aquí)
const initTouchEvents = () => {
    const container = document.querySelector('.container-full');
    
    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        pointer.x = touch.clientX;
        pointer.y = touch.clientY;
        rad = Math.max(0, rad - 10);
        
        fireBreath();
        
        e.preventDefault();
    }, { passive: false });
    
    container.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        pointer.x = touch.clientX;
        pointer.y = touch.clientY;
        rad = Math.max(0, rad - 10);
        e.preventDefault();
    }, { passive: false });
    
    container.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    container.addEventListener('touchcancel', () => {
        isDragging = false;
    });
};

const initMouseEvents = () => {
    const container = document.querySelector('.container-full');
    
    container.addEventListener('mousemove', (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        rad = Math.max(0, rad - 10);
    }, { passive: true });
    
    container.addEventListener('mousedown', () => {
        isDragging = true;
        
        fireBreath();
    });
    
    container.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    container.addEventListener('mouseleave', () => {
        isDragging = false;
    });
    
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
};

// Redimensionamiento
let resizeTimeout;
const RESIZE_DELAY = 250;

const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        width = window.innerWidth;
        height = window.innerHeight;
        radm = Math.min(width, height) * 0.35;
        initDragon();
        runOptimized();
    }, RESIZE_DELAY);
};

// LOOP DE ANIMACIÓN
const runOptimized = () => {
    rafId = requestAnimationFrame(runOptimized);
    
    const e0 = elems[0];
    const time = performance.now() * 0.001;
    
    const ax = Math.cos(time * 1.6) * rad * width / height * 0.75;
    const ay = Math.sin(time * 1.4) * rad * height / width * 0.75;
    
    const smoothFactor = isDragging ? 0.2 : 0.1;
    e0.x += (ax + pointer.x - e0.x) * smoothFactor;
    e0.y += (ay + pointer.y - e0.y) * smoothFactor;
    
    let e, ep, a, dx, dy, s, transformStr;
    
    for (let i = 1; i < N; i++) {
        e = elems[i];
        ep = elems[i - 1];
        
        dx = e.x - ep.x;
        dy = e.y - ep.y;
        a = Math.atan2(dy, dx);
        
        const factor = segmentFactors[i];
        const dragFactor = isDragging ? 0.3 : 0.25;
        
        e.x += (ep.x - e.x + Math.cos(a) * factor) * dragFactor;
        e.y += (ep.y - e.y + Math.sin(a) * factor) * dragFactor;
        
        const baseScale = isMobile ? 85 : 95;
        const scaleReduction = 2.4;
        
        s = (baseScale - i * scaleReduction) / 55;
        
        if (i === 1) {
            s *= isMobile ? 1.05 : 1.1;
        }
        
        if (i === 8 || i === 14) {
            s *= 1.2;
        }
        
        transformStr = `translate(${(ep.x + e.x) * 0.5},${(ep.y + e.y) * 0.5}) rotate(${a * (180 / Math.PI)}) scale(${s})`;
        
        if (transformCache[i] !== transformStr) {
            e.use.setAttributeNS(null, "transform", transformStr);
            transformCache[i] = transformStr;
        }
    }
    
    if (rad < radm) rad += (radm - rad) * 0.05;
    
    frm += 0.0025;
    
    if (rad > radm * 0.6 && !isDragging) {
        const centerX = width / 2;
        const centerY = height / 2;
        pointer.x += (centerX - pointer.x) * 0.025;
        pointer.y += (centerY - pointer.y) * 0.025;
    }
    
    if (isMobile && isDragging) {
        if (pointer.x < -50) pointer.x = -50;
        if (pointer.x > width + 50) pointer.x = width + 50;
        if (pointer.y < -50) pointer.y = -50;
        if (pointer.y > height + 50) pointer.y = height + 50;
    }
};

// INICIALIZACIÓN COMPLETA
const init = () => {
    isMobile = detectMobile();
    
    width = window.innerWidth;
    height = window.innerHeight;
    
    if (isMobile) {
        initTouchEvents();
    } else {
        initMouseEvents();
    }
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });
    
    initDragon();
    
    runOptimized();
    
    setTimeout(() => {
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            instructions.style.opacity = '0';
            setTimeout(() => {
                instructions.style.display = 'none';
            }, 500);
        }
    }, 8000);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        width = window.innerWidth;
        height = window.innerHeight;
        radm = Math.min(width, height) * 0.35;
        initDragon();
    }, 100);
});
