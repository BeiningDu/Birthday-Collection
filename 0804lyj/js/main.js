// ==========================================
// 1. 调试与环境配置
// ==========================================
const debugConsole = document.getElementById('debug-console');
function log(msg) {
    if (debugConsole) {
        const time = new Date().toLocaleTimeString();
        debugConsole.innerHTML += `[${time}] ${msg}<br>`;
    }
    console.log(msg);
}

const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (window.location.protocol === 'file:') {
    const warning = document.getElementById('protocol-warning');
    if (warning) warning.style.display = 'block';
}

// ==========================================
// 2. 全局变量与配置
// ==========================================
let activeFireworks = [];
let isFireworkCooldown = false;
let isBigHeartCooldown = false;
let isHeartRaining = false;
let sharedCircleTexture = null;
let gestureCounters = { victory: 0, heart: 0, one: 0, bigHeart: 0, thumbUp: 0, four: 0, middle: 0 };
let isThumbUpCooldown = false;
let isCloverCooldown = false;
let isExplosionCooldown = false;

const gunSound = new Audio('./src/gun.mp3'); 
let isGunCooldown = false;

const CAKE_THEME = { bottom: "#FF69B4", top: "#FFB6C1", cream: "#FFFFFF" };
const VISUAL_CONFIG = { particleCount: IS_MOBILE ? 4000 : 6000, color: 0xff69b4, blowThreshold: 25, blowMaxDuration: 100 };
const STATE = { INTRO: -1, IDLE: 0, COUNTDOWN: 1, CAKE: 2, BLOWING: 3, CELEBRATION: 4 };

let currentState = STATE.INTRO;
let interactionMode = 0; 

let particlesData = [];
let scene, camera, renderer, particleSystem;
let time = 0;
let shapeCache = {}; 
let blowProgress = 0;
let isSpacePressed = false; 
let isTouching = false; 

let rotationVelocity = 0;
let isDragging = false;
let previousMouseX = 0;
let lastHandX = 0;
let autoRotateSpeed = 0.005;

let autoEntryTimer = null;
let autoEntrySeconds = 10;

let audioContext, analyser;
const bgm = document.getElementById('bgm');

const ui = {
    startOverlay: document.getElementById('start-overlay'),
    uiLayer: document.getElementById('ui-layer'),
    statusText: document.getElementById('status-text'),
    statusDot: document.getElementById('status-dot'),
    mainText: document.getElementById('instruction-text'),
    subText: document.getElementById('sub-instruction'),
    handIcon: document.getElementById('hand-icon'),
    blowMeter: document.getElementById('blow-meter-container'),
    blowBar: document.getElementById('blow-meter-bar'),
    blowHint: document.getElementById('blow-hint'),
    surpriseLayer: document.getElementById('surprise-layer'),
    revealBtn: document.getElementById('reveal-btn'),
    floatingGiftBtn: document.getElementById('floating-gift-btn'),
    cardContainer: document.getElementById('flip-card-container'), 
    nextBtn: document.getElementById('next-surprise-btn'),
    closeBtn: document.getElementById('close-card-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    settingsToggle: document.getElementById('settings-toggle'),
    topBanner: document.getElementById('top-banner'),
    startBtn: document.getElementById('start-btn'),
    loadingText: document.getElementById('loading-text'),
    camStatusDot: document.getElementById('cam-status-dot'),
    camStatusText: document.getElementById('cam-status-text'),
    page1: document.getElementById('card-page-1'),
    page2: document.getElementById('card-page-2'),
    toPage2Btn: document.getElementById('to-page-2-btn'),
    textContainer1: document.getElementById('typewriter-text-1'),
    textContainer2: document.getElementById('typewriter-text-2'),
    autoCountdownText: document.getElementById('auto-countdown-text')
};

// ==========================================
// 3. Three.js 核心逻辑
// ==========================================
initThree();

function initThree() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    preloadShapes();
    createParticles();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const onStart = (x) => {
        if(interactionMode === 1) {
            isDragging = true;
            previousMouseX = x;
            rotationVelocity = 0; 
        }
    };
    const onMove = (x) => {
        if(isDragging && interactionMode === 1) {
            const delta = x - previousMouseX;
            const sensitivity = IS_MOBILE ? 0.015 : 0.008; 
            rotationVelocity = delta * sensitivity;
            particleSystem.rotation.y += rotationVelocity;
            previousMouseX = x;
        }
    };
    const onEnd = () => { isDragging = false; };

    container.addEventListener('mousedown', (e) => onStart(e.clientX));
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', onEnd);

    container.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), {passive: false});
    window.addEventListener('touchmove', (e) => {
        if(isDragging) e.preventDefault(); 
        onMove(e.touches[0].clientX);
    }, {passive: false});
    window.addEventListener('touchend', onEnd);
    
    render();
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(VISUAL_CONFIG.particleCount * 3);
    const colors = new Float32Array(VISUAL_CONFIG.particleCount * 3);
    const sizes = new Float32Array(VISUAL_CONFIG.particleCount);
    particlesData = [];
    const c = new THREE.Color(VISUAL_CONFIG.color);

    for (let i = 0; i < VISUAL_CONFIG.particleCount; i++) {
        const x = (Math.random() - 0.5) * 300;
        const y = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 200;
        positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        sizes[i] = Math.random() * 2;
        particlesData.push({
            current: new THREE.Vector3(x, y, z),
            target: new THREE.Vector3(x, y, z),
            baseTarget: new THREE.Vector3(x, y, z),
            velocity: new THREE.Vector3(0, 0, 0),
            type: 'bg', layer: null, targetColor: c.clone(),
            noiseOffset: Math.random() * 100,
            angle: Math.random() * Math.PI * 2, 
            radius: 20 + Math.random() * 40,
            orbitSpeed: (Math.random() - 0.5) * 0.02
        });
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const material = new THREE.PointsMaterial({ size: 1.2, vertexColors: true, map: getCircleTexture(), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

function getCircleTexture() {
    if (!sharedCircleTexture) {
        const c = document.createElement('canvas'); c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
        sharedCircleTexture = new THREE.CanvasTexture(c);
    }
    return sharedCircleTexture;
}

function getShapePoints(type, text) {
    const points = [];
    if (type === 'text') {
        const c = document.createElement('canvas'); c.width = 300; c.height = 300;
        const ctx = c.getContext('2d');
        let fontSize = 110;
        if (text.length === 2) fontSize = 85;
        else if (text.length === 3) fontSize = 65;
        else if (text.length >= 4) fontSize = 48;
        
        ctx.font = `bold ${fontSize}px "Noto Serif SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, 150, 150); // 居中 150
        
        const data = ctx.getImageData(0, 0, 300, 300).data;
        const step = 2;
        for (let y = 0; y < 300; y += step) {
            for (let x = 0; x < 300; x += step) {
                if (data[(y * 300 + x) * 4 + 3] > 128) {
                    points.push({ 
                        vec: new THREE.Vector3((x - 150) / 3.5, -(y - 150) / 3.5, 0).multiplyScalar(1.8), 
                        type: 'text', 
                        color: new THREE.Color(0xffffff) 
                    });
                }
            }
        }
    } else if (type === 'cake') {
        const layers = [{y: -16, r: 18, h: 10, type: 'bottom'}, {y: -6,  r: 13, h: 8,  type: 'top'}];
        layers.forEach(l => {
            for(let i=0; i<(IS_MOBILE?800:1500); i++) {
                const theta = Math.random() * Math.PI * 2;
                const r = l.r * (0.95 + Math.random()*0.05); 
                const h = Math.random() * l.h;
                points.push({ vec: new THREE.Vector3(r*Math.cos(theta), l.y+h, r*Math.sin(theta)), type: 'cake', layer: l.type });
            }
            for(let i=0; i<500; i++) {
                const theta = Math.random() * Math.PI * 2;
                const r = Math.random() * l.r;
                points.push({ vec: new THREE.Vector3(r*Math.cos(theta), l.y+l.h, r*Math.sin(theta)), type: 'cake', layer: 'cream' });
            }
            for(let i=0; i<100; i++) {
                const theta = Math.random() * Math.PI * 2;
                const r = l.r + 0.2;
                const h = Math.random() * l.h;
                const sprinkleColor = new THREE.Color().setHSL(Math.random(), 1, 0.6);
                points.push({
                    vec: new THREE.Vector3(r*Math.cos(theta), l.y+h, r*Math.sin(theta)),
                    type: 'cake', color: sprinkleColor
                });
            }
        });
        const candleY = layers[1].y + layers[1].h;
        for(let i=0; i<300; i++) {
            const h = Math.random() * 12;
            const r = Math.random() * 0.8;
            const theta = Math.random() * Math.PI * 2;
            let col = (Math.sin(h*1.5 + theta)>0) ? new THREE.Color(0xFF0000) : new THREE.Color(0xFFFFFF);
            points.push({ vec: new THREE.Vector3(r*Math.cos(theta), candleY+h, r*Math.sin(theta)), type: 'candle', color: col });
        }
        const flameY = candleY + 12;
        for(let i=0; i<400; i++) {
            const u = Math.random();
            const h = u * 7;
            const r = (1-u) * 2.0 * Math.random();
            const theta = Math.random() * Math.PI * 2;
            let col = new THREE.Color(0xFFA500);
            if(u<0.2) col.setHex(0x0000FF); else if(u>0.7) col.setHex(0xFF4500);
            points.push({ vec: new THREE.Vector3(r*Math.cos(theta), flameY+h, r*Math.sin(theta)), type: 'flame', color: col });
        }
    }
    return points;
}

function preloadShapes() {
    setTimeout(() => {
        shapeCache['3'] = getShapePoints('text', '3');
        shapeCache['2'] = getShapePoints('text', '2');
        shapeCache['1'] = getShapePoints('text', '1');
        shapeCache['cake'] = getShapePoints('cake');
        shapeCache['name'] = getShapePoints('text', '梁益嘉');
        shapeCache['sheng'] = getShapePoints('text', '生');
        shapeCache['ri'] = getShapePoints('text', '日');
        shapeCache['kuai'] = getShapePoints('text', '快');
        shapeCache['le'] = getShapePoints('text', '乐');
        shapeCache['happy_birthday'] = getShapePoints('text', '生日快乐！');
        ui.loadingText.style.display = 'none';
    }, 100);
}

function transitionTo(key) {
    const targets = shapeCache[key] || [];
    particlesData.forEach((p, i) => {
        if (i < targets.length) {
            p.baseTarget.copy(targets[i].vec);
            p.target.copy(targets[i].vec);
            p.type = targets[i].type;
            p.layer = targets[i].layer;
            if(targets[i].color) {
                p.targetColor = targets[i].color.clone();
            } else {
                p.targetColor = new THREE.Color(0xffffff); 
            }
            const force = 3;
            p.current.add(new THREE.Vector3((Math.random()-0.5)*force, (Math.random()-0.5)*force, (Math.random()-0.5)*force));
        } else {
            const angle = Math.random() * Math.PI * 2;
            const r = 40 + Math.random() * 40;
            p.baseTarget.set(r*Math.cos(angle), (Math.random()-0.5)*60, r*Math.sin(angle));
            p.target.copy(p.baseTarget);
            p.type = 'bg';
            p.layer = null;
            p.targetColor = new THREE.Color(0x222222);
        }
    });
}

function updateParticles() {
    const positions = particleSystem.geometry.attributes.position.array;
    const colors = particleSystem.geometry.attributes.color.array;
    const sizes = particleSystem.geometry.attributes.size.array;
    time += 0.02;
    const blowInfluence = blowProgress / 100;

    for (let i = 0; i < VISUAL_CONFIG.particleCount; i++) {
        const p = particlesData[i];
        let target = p.target.clone();

        if (p.type === 'cake') {
            if (p.layer === 'bottom') p.targetColor.set(CAKE_THEME.bottom);
            else if (p.layer === 'top') p.targetColor.set(CAKE_THEME.top);
            else if (p.layer === 'cream') p.targetColor.set(CAKE_THEME.cream);
        }

        if (currentState === STATE.INTRO) {
            const angle = p.angle + time * 0.05;
            const r = p.radius + Math.sin(time * 0.5 + i * 0.01) * 10;
            target.x = Math.cos(angle) * r * 3;
            target.z = Math.sin(angle) * r * 3;
            target.y = p.baseTarget.y + Math.sin(time * 0.5 + target.x * 0.05) * 20; 
            const hue = 0.8 + (Math.sin(time * 0.1 + target.x * 0.01) * 0.1); 
            p.targetColor.setHSL(hue, 0.7, 0.6);
        }
        else if (currentState === STATE.CELEBRATION && p.type === 'bg') {
            const angle = p.angle + time * 0.1 + p.orbitSpeed;
            const r = p.radius + Math.sin(time + i) * 5;
            target.x = Math.cos(angle) * r;
            target.z = Math.sin(angle) * r;
            target.y = p.baseTarget.y + Math.sin(time + p.noiseOffset) * 2;
            const hue = 0.9 + (Math.sin(time + i * 0.01) * 0.05); 
            p.targetColor.setHSL(hue, 0.8, 0.6);
        } 
        else if (currentState === STATE.IDLE) {
            const angle = p.angle + time * 0.1;
            const r = p.radius + Math.sin(time + i * 0.01)*2;
            target.x = Math.cos(angle) * r;
            target.z = Math.sin(angle) * r;
            target.y = p.baseTarget.y + Math.sin(time + target.x * 0.05) * 5; 
            p.targetColor.set(0x443344); 
        }

        if (p.type === 'flame') {
            const noise = Math.sin(time * 6 + p.noiseOffset) * 0.6;
            target.x += noise;
            if (blowInfluence > 0.1 || currentState === STATE.CELEBRATION) {
                let lift = blowInfluence * 25;
                if(currentState === STATE.CELEBRATION) lift = 60;
                target.y += lift;
                target.x += (Math.random()-0.5) * lift * 0.8;
                p.targetColor.lerp(new THREE.Color(0xdddddd), 0.1); 
            }
        }

        p.current.lerp(target, 0.08);

        positions[i*3] = p.current.x;
        positions[i*3+1] = p.current.y;
        positions[i*3+2] = p.current.z;
        
        colors[i*3] += (p.targetColor.r - colors[i*3]) * 0.1;
        colors[i*3+1] += (p.targetColor.g - colors[i*3+1]) * 0.1;
        colors[i*3+2] += (p.targetColor.b - colors[i*3+2]) * 0.1;

        if (p.type === 'flame' && (blowInfluence > 0.1 || currentState === STATE.CELEBRATION)) {
            sizes[i] = Math.max(0, 1.5 * (1 - blowInfluence)); 
            if(currentState === STATE.CELEBRATION) sizes[i] *= 0.9;
        } else {
            sizes[i] = 1.2 + Math.sin(time + i) * 0.3;
        }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;
    particleSystem.geometry.attributes.size.needsUpdate = true;
    
    if (interactionMode === 1) {
        if (!isDragging) {
            rotationVelocity *= 0.96; 
            particleSystem.rotation.y += rotationVelocity + autoRotateSpeed;
        }
    } else if (currentState !== STATE.IDLE && currentState !== STATE.INTRO) {
        particleSystem.rotation.y = Math.sin(time * 0.15) * 0.15;
    } else {
        particleSystem.rotation.y = 0;
    }
}

// ==========================================
// 4. 业务流程控制
// ==========================================
let transitionLock = false;

function startSequence() {
    if (currentState !== STATE.IDLE || transitionLock) return;
                
    if (autoEntryTimer) {
        clearInterval(autoEntryTimer);
        autoEntryTimer = null;
    }
    ui.autoCountdownText.classList.add('hidden');

    log('检测到手势，开始倒计时序列');
    transitionLock = true;
    currentState = STATE.COUNTDOWN;
    ui.statusText.innerText = "GESTURE DETECTED";
    ui.statusText.className = "text-xs md:text-sm text-green-400 font-bold tracking-wider";
    ui.statusDot.className = "inline-block w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_#0f0]";
    ui.handIcon.style.display = 'none';
    ui.mainText.innerText = "";
    ui.subText.innerText = "";

    transitionTo('3');
    setTimeout(() => transitionTo('2'), 1200);
    setTimeout(() => transitionTo('1'), 2400);
    setTimeout(() => transitionTo('name'), 3800);
    setTimeout(() => transitionTo('sheng'), 5800);
    setTimeout(() => transitionTo('ri'), 6800);
    setTimeout(() => transitionTo('kuai'), 7800);
    setTimeout(() => transitionTo('le'), 8800);
    setTimeout(() => transitionTo('happy_birthday'), 9800);
    setTimeout(() => { showCake(); }, 11800);
}

function showCake() {
    log('展示蛋糕，开启吹气检测');
    currentState = STATE.BLOWING;
    transitionTo('cake');
    ui.settingsPanel.style.display = 'flex';
    ui.mainText.innerText = "";
    ui.subText.innerText = "";
    ui.topBanner.classList.remove('hidden'); 
    ui.statusText.innerText = "MIC LISTENING...";
    ui.blowMeter.style.opacity = '1';
    ui.blowHint.style.opacity = '1';
}

function successCelebration() {
    log('许愿成功！播放庆祝动画');
    currentState = STATE.CELEBRATION;
    ui.statusText.innerText = "WISH GRANTED";
    ui.blowMeter.style.opacity = '0';
    ui.blowHint.style.opacity = '0';
    ui.settingsPanel.style.display = 'none';

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
    })();
    
    document.body.classList.add('shake-screen');
    setTimeout(() => document.body.classList.remove('shake-screen'), 500);

    particlesData.forEach(p => {
        if (p.type === 'cake' || p.type === 'candle' || p.type === 'ring') {
            p.target.y += Math.sin(p.current.x * 0.5) * 0.5; 
        } else if (p.type !== 'flame') {
            p.type = 'bg'; 
        }
    });

    setTimeout(() => {
        ui.surpriseLayer.classList.remove('hidden');
        ui.surpriseLayer.classList.add('active');
        ui.revealBtn.classList.remove('hidden');
    }, 1500);
}

// 颜色选择器监听
document.getElementById('picker-bottom').addEventListener('input', (e) => CAKE_THEME.bottom = e.target.value);
document.getElementById('picker-top').addEventListener('input', (e) => CAKE_THEME.top = e.target.value);
document.getElementById('picker-cream').addEventListener('input', (e) => CAKE_THEME.cream = e.target.value);

ui.settingsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const display = ui.settingsPanel.style.display;
    ui.settingsPanel.style.display = (display === 'none' || display === '') ? 'flex' : 'none';
});

// 打字机与卡片控制
const wishes_part1 = [
    "生日快乐！🎉",
    "",
    "祝你在新的一岁里：",
    "生活顺心，学业顺利！",
    "保持热爱，奔赴山海！",
    "不负韶华，心想事成！",
    "每天都有好心情，快乐常伴！✨",
    "",
    "           —— Happy Birthday! "
];

const wishes_part2 = [
    "原作者: mnbvcxzz1375", "",
    "改编: Beining Du", "",
    "配乐: (我也不知道是什么配乐)", "",
    "特别鸣谢: Sam", "", "",
    "感谢观看！希望喜欢",
];

function typeWriter(textArray, containerId, speed = 50) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    let lineIndex = 0; let charIndex = 0;

    function type() {
        if (lineIndex < textArray.length) {
            const currentLine = textArray[lineIndex];
            if (charIndex < currentLine.length) {
                container.innerHTML += currentLine.charAt(charIndex);
                charIndex++;
                setTimeout(type, speed);
            } else {
                container.innerHTML += "<br>";
                lineIndex++; charIndex = 0;
                setTimeout(type, 300);
            }
            container.scrollTop = container.scrollHeight;
        }
    }
    type();
}

ui.revealBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ui.revealBtn.classList.add('hidden');
    ui.cardContainer.classList.remove('hidden');
});

ui.nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ui.cardContainer.classList.add('flipped');
    ui.page1.classList.remove('hidden');
    ui.page2.classList.add('hidden');
    setTimeout(() => typeWriter(wishes_part1, 'typewriter-text-1'), 400);
});

ui.toPage2Btn.addEventListener('click', (e) => {
    e.stopPropagation();
    ui.page1.classList.add('hidden');
    ui.page2.classList.remove('hidden');
    setTimeout(() => typeWriter(wishes_part2, 'typewriter-text-2', 30), 100);
});

ui.floatingGiftBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ui.floatingGiftBtn.classList.add('hidden'); 
    ui.surpriseLayer.classList.remove('hidden'); 
    ui.surpriseLayer.classList.add('active');
    interactionMode = 0;
    ui.cardContainer.classList.remove('hidden');
    ui.cardContainer.classList.remove('flipped');
    ui.page1.classList.remove('hidden');
    ui.page2.classList.add('hidden');
});

ui.closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ui.mainText.innerText = ""; 
    ui.surpriseLayer.classList.remove('active');
    ui.surpriseLayer.classList.add('hidden');    
    ui.floatingGiftBtn.classList.remove('hidden');
    
    interactionMode = 1; 
    transitionTo('cake'); 
    ui.statusText.innerText = "INTERACTIVE MODE";
    if (ui.textContainer1) ui.textContainer1.innerHTML = "";
    if (ui.textContainer2) ui.textContainer2.innerHTML = "";
    ui.topBanner.classList.remove('hidden');
});

function startAutoEntryCountdown() {
    autoEntrySeconds = 15;
    ui.autoCountdownText.classList.remove('hidden');
    ui.autoCountdownText.innerText = `若未检测到手势，${autoEntrySeconds}秒后自动开始...`;
    
    if (autoEntryTimer) clearInterval(autoEntryTimer);

    autoEntryTimer = setInterval(() => {
        autoEntrySeconds--;
        if (autoEntrySeconds > 0) {
            ui.autoCountdownText.innerText = `若未检测到手势，${autoEntrySeconds}秒后自动开始...`;
        } else {
            clearInterval(autoEntryTimer);
            autoEntryTimer = null;
            ui.autoCountdownText.classList.add('hidden');
            if (currentState === STATE.IDLE) {
                log('自动倒数结束，触发开始序列');
                startSequence();
            }
        }
    }, 1000);
}

ui.startBtn.addEventListener('click', async function() {
    log('点击了进入按钮...');
    const btn = this;
    
    btn.innerHTML = '<span class="animate-pulse">Loading...</span>';
    btn.disabled = true;
    ui.loadingText.style.display = 'block';
    
    try {
        fadeAudioIn();
        await initAudio();
        log('音频初始化成功');
    } catch(e) {
        log('音频初始化警告: ' + e);
        ui.statusText.innerText = "AUDIO/MIC LIMITED";
    }

    try {
        log('尝试启动摄像头...');
        await initCamera();
        log('摄像头启动成功');
    } catch (e) {
        log('摄像头/MediaPipe 失败: ' + e);
        ui.statusText.innerText = "CAMERA FAILED - USE SPACEBAR";
    }
    
    log('进入主界面...');
    currentState = STATE.IDLE;
    ui.startOverlay.classList.add('hidden');
    ui.uiLayer.style.display = 'flex';

    startAutoEntryCountdown();
});

async function initAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        checkAudio();
    } catch (e) {
        log('麦克风权限被拒绝');
        ui.statusText.innerText = "MIC DENIED - USE TOUCH/SPACE";
        throw e;
    }
}

document.addEventListener('touchstart', (e) => {
    if(currentState === STATE.BLOWING && !e.target.closest('button') && !e.target.closest('input')) {
        isTouching = true;
    }
}, {passive: false});

document.addEventListener('touchend', () => isTouching = false);
document.addEventListener('touchcancel', () => isTouching = false);
document.addEventListener('keydown', (e) => { if(e.code === 'Space') isSpacePressed = true; });
document.addEventListener('keyup', (e) => { if(e.code === 'Space') isSpacePressed = false; });

function checkAudio() {
    requestAnimationFrame(checkAudio);
    if (currentState !== STATE.BLOWING) return;
    let volume = 0;
    if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let sum = 0; for(let i=0; i<data.length; i++) sum += data[i];
        volume = sum / data.length;
    }
    if (volume > VISUAL_CONFIG.blowThreshold || isSpacePressed || isTouching) {
        blowProgress += 0.8; 
    } else {
        blowProgress -= 0.3; 
    }
    blowProgress = Math.max(0, Math.min(100, blowProgress));
    ui.blowBar.style.width = blowProgress + '%';
    if (blowProgress >= 100) successCelebration();
}

function fadeAudioIn() {
    const playPromise = bgm.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => log('背景音乐开始播放')).catch(_ => log('等待用户交互播放音乐'));
    }
    
    bgm.volume = 0;
    let vol = 0;
    const fade = setInterval(() => {
        vol += 0.05;
        if(vol >= 0.5) { vol = 0.5; clearInterval(fade); }
        bgm.volume = vol;
    }, 200);
}

document.getElementById('music-btn').addEventListener('click', () => {
    if (bgm.paused) bgm.play(); else bgm.pause();
});

function isVictoryGesture(landmarks) {
    const indexStraight = landmarks[8].y < landmarks[6].y;
    const middleStraight = landmarks[12].y < landmarks[10].y;
    const ringBent = landmarks[16].y > landmarks[14].y;
    const pinkyBent = landmarks[20].y > landmarks[18].y;
    return indexStraight && middleStraight && ringBent && pinkyBent;
}

function isHeartGesture(landmarks) {
    const dx = landmarks[4].x - landmarks[8].x;
    const dy = landmarks[4].y - landmarks[8].y;
    const distance48 = Math.sqrt(dx * dx + dy * dy);
    const isPinching = distance48 < 0.10;
    const middleBent = landmarks[12].y > landmarks[10].y;
    const ringBent   = landmarks[16].y > landmarks[14].y;
    const pinkyBent  = landmarks[20].y > landmarks[18].y;

    return isPinching && middleBent && ringBent && pinkyBent;
}

function isOneGesture(landmarks) {
    const indexStraight = landmarks[8].y < landmarks[6].y;
    const middleBent    = landmarks[12].y > landmarks[10].y;
    const ringBent      = landmarks[16].y > landmarks[14].y;
    const pinkyBent     = landmarks[20].y > landmarks[18].y;
    const indexHigherThanMiddle = landmarks[8].y < (landmarks[12].y - 0.04);
    const dx = landmarks[4].x - landmarks[9].x;
    const dy = landmarks[4].y - landmarks[9].y;
    const thumbDistance = Math.sqrt(dx * dx + dy * dy);
    const thumbFolded = thumbDistance < 0.20;

    return indexStraight && middleBent && ringBent && pinkyBent && indexHigherThanMiddle && thumbFolded;
}

function isBigHeartGesture(landmarks) {
    const dx = landmarks[4].x - landmarks[8].x;
    const dy = landmarks[4].y - landmarks[8].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const isArc = distance > 0.12 && distance < 0.28;
    const indexCurved = landmarks[8].y > landmarks[7].y;
    return isArc && indexCurved;
}

function triggerHeartRain() {
    if (isHeartRaining) return;
    isHeartRaining = true;
    try {
        const heartPath = confetti.shapeFromPath({
            path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
        });
        confetti({
            particleCount: 20,
            spread: 80,
            origin: { y: 0.4 },
            shapes: [heartPath],
            colors: ['#ff4d4d', '#ff69b4', '#ff1493'],
            scalar: 3,
            ticks: 120
        });
    } catch (e) {
        console.error("Confetti 异常:", e);
    }
    setTimeout(() => { isHeartRaining = false; }, 1500);
}

function triggerBigHeart() {
    if (isBigHeartCooldown) return;
    isBigHeartCooldown = true;

    let container = document.getElementById('big-heart-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'big-heart-container';
        container.innerHTML = '<div>❤️</div>';
        document.body.appendChild(container);
    }

    container.style.display = 'block';
    const heartEl = container.firstElementChild;
    heartEl.className = '';
    void heartEl.offsetWidth; 
    heartEl.className = 'animate-big-heart';

    setTimeout(() => {
        container.style.display = 'none';
        isBigHeartCooldown = false;
    }, 1300);
}

function triggerFirework() {
    if (isFireworkCooldown || !scene || activeFireworks.length >= 3) return;
    isFireworkCooldown = true;

    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    const origin = new THREE.Vector3((Math.random() - 0.5) * 20, 5 + Math.random() * 10, (Math.random() - 0.5) * 10);
    const colorPalette = [0xff1493, 0x00ffff, 0xffd700, 0xff4500, 0xff69b4, 0x7b68ee];
    const baseColor = new THREE.Color(colorPalette[Math.floor(Math.random() * colorPalette.length)]);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = origin.x;
        positions[i * 3 + 1] = origin.y;
        positions[i * 3 + 2] = origin.z;

        colors[i * 3] = baseColor.r;
        colors[i * 3 + 1] = baseColor.g;
        colors[i * 3 + 2] = baseColor.b;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 0.35 + Math.random() * 0.45; // 减缓初速度

        velocities.push(new THREE.Vector3(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
        ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 2.2,
        vertexColors: true,
        map: getCircleTexture(),
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const fireworkSystem = new THREE.Points(geometry, material);
    scene.add(fireworkSystem);

    activeFireworks.push({
        system: fireworkSystem,
        velocities: velocities,
        life: 1.0
    });

    setTimeout(() => { isFireworkCooldown = false; }, 1200);
}

function updateFireworks() {
    for (let f = activeFireworks.length - 1; f >= 0; f--) {
        const fw = activeFireworks[f];
        fw.life -= 0.008; // 较慢的淡出衰减，烟花绽放更久

        if (fw.life <= 0) {
            scene.remove(fw.system);
            fw.system.geometry.dispose();
            fw.system.material.dispose();
            activeFireworks.splice(f, 1);
            continue;
        }

        const positions = fw.system.geometry.attributes.position.array;
        fw.system.material.opacity = fw.life;

        for (let i = 0; i < fw.velocities.length; i++) {
            positions[i * 3] += fw.velocities[i].x;
            positions[i * 3 + 1] += fw.velocities[i].y;
            positions[i * 3 + 2] += fw.velocities[i].z;

            fw.velocities[i].y -= 0.005; // 较轻的重力
            fw.velocities[i].multiplyScalar(0.985); // 渐进阻力
        }

        fw.system.geometry.attributes.position.needsUpdate = true;
    }
}

function isThumbUpGesture(landmarks) {
    const thumbUp = landmarks[4].y < landmarks[2].y && landmarks[3].y < landmarks[2].y;
    const indexBent = landmarks[8].y > landmarks[6].y;
    const middleBent = landmarks[12].y > landmarks[10].y;
    const ringBent = landmarks[16].y > landmarks[14].y;
    const pinkyBent = landmarks[20].y > landmarks[18].y;

    return thumbUp && indexBent && middleBent && ringBent && pinkyBent;
}

function isFourGesture(landmarks) {
    const indexStraight  = landmarks[8].y  < landmarks[6].y;
    const middleStraight = landmarks[12].y < landmarks[10].y;
    const ringStraight   = landmarks[16].y < landmarks[14].y;
    const pinkyStraight  = landmarks[20].y < landmarks[18].y;
    const dx = landmarks[4].x - landmarks[9].x;
    const dy = landmarks[4].y - landmarks[9].y;
    const thumbTucked = Math.sqrt(dx * dx + dy * dy) < 0.20;
    return indexStraight && middleStraight && ringStraight && pinkyStraight && thumbTucked;
}

function isMiddleFingerGesture(landmarks) {
    const middleStraight = landmarks[12].y < landmarks[10].y;
    const indexBent = landmarks[8].y > landmarks[6].y;
    const ringBent = landmarks[16].y > landmarks[14].y;
    const pinkyBent = landmarks[20].y > landmarks[18].y;
    const middleHigherThanIndex = landmarks[12].y < (landmarks[8].y - 0.04);

    return middleStraight && indexBent && ringBent && pinkyBent && middleHigherThanIndex;
}

function triggerThumbUp() {
    if (isThumbUpCooldown) return;
    isThumbUpCooldown = true;

    try {
        const thumbShape = confetti.shapeFromText({ text: '👍', scalar: 2 });
        confetti({
            particleCount: 18,
            spread: 90,
            origin: { y: 0.4 },
            shapes: [thumbShape],
            scalar: 4.5,
            ticks: 120
        });
    } catch (e) {
        console.error("ThumbUp Confetti 异常:", e);
    }

    setTimeout(() => { isThumbUpCooldown = false; }, 3200);
}

function triggerClover(landmark) {
    try {
        let container = document.getElementById('clover-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'clover-container';
            container.innerHTML = '<div class="clover-content">🍀<div class="clover-text">幸运值 +1 ✨</div></div>';
            document.body.appendChild(container);
        }

        if (landmark) {
            const x = (1 - landmark.x) * window.innerWidth;
            const y = landmark.y * window.innerHeight;
            container.style.left = `${x}px`;
            container.style.top = `${y}px`;
        } else {
            container.style.left = '50%'; container.style.top = '50%';
        }

        container.style.display = 'block';
        const el = container.firstElementChild;
        if (el) {
            el.className = ''; void el.offsetWidth;
            el.className = 'clover-content animate-clover';
        }
    } catch (e) {
        console.error("Clover 异常:", e);
    }

    setTimeout(() => {
        const container = document.getElementById('clover-container');
        if (container) container.style.display = 'none';
    }, 2400);
}

function triggerExplosion(landmark) {
    try {
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.classList.add('shake-screen');
            setTimeout(() => canvasContainer.classList.remove('shake-screen'), 500);
        }
        let container = document.getElementById('explosion-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'explosion-container';
            container.innerHTML = '<div class="explosion-content">MIND YOUR LANGUAGE!<div class="explosion-text"></div></div>';
            document.body.appendChild(container);
        }

        if (landmark) {
            const x = (1 - landmark.x) * window.innerWidth;
            const y = landmark.y * window.innerHeight;
            container.style.left = `${x}px`;
            container.style.top = `${y}px`;
        } else {
            container.style.left = '50%'; container.style.top = '50%';
        }

        container.style.display = 'block';
        const el = container.firstElementChild;
        if (el) {
            el.className = ''; void el.offsetWidth;
            el.className = 'explosion-content animate-explode';
        }
        triggerFirework();
    } catch (e) {
        console.error("Explosion 异常:", e);
    }

    setTimeout(() => {
        const container = document.getElementById('explosion-container');
        if (container) container.style.display = 'none';
    }, 3200);
}

function isGunGesture(landmarks) {
    const indexStraight = landmarks[8].y < landmarks[6].y && landmarks[6].y < landmarks[5].y;
    const middleBent = landmarks[12].y > landmarks[10].y;
    const ringBent   = landmarks[16].y > landmarks[14].y;
    const pinkyBent  = landmarks[20].y > landmarks[18].y;
    const vIndex = { x: landmarks[8].x - landmarks[5].x, y: landmarks[8].y - landmarks[5].y };
    const vThumb = { x: landmarks[4].x - landmarks[2].x, y: landmarks[4].y - landmarks[2].y };

    const dot = vIndex.x * vThumb.x + vIndex.y * vThumb.y;
    const lenIndex = Math.sqrt(vIndex.x * vIndex.x + vIndex.y * vIndex.y);
    const lenThumb = Math.sqrt(vThumb.x * vThumb.x + vThumb.y * vThumb.y);

    if (lenIndex === 0 || lenThumb === 0) return false;

    const cosAngle = Math.max(-1, Math.min(1, dot / (lenIndex * lenThumb)));
    const angleDeg = Math.acos(cosAngle) * (180 / Math.PI);
    const dx48 = landmarks[4].x - landmarks[8].x;
    const dy48 = landmarks[4].y - landmarks[8].y;
    const dist48 = Math.sqrt(dx48 * dx48 + dy48 * dy48);

    return indexStraight && middleBent && ringBent && pinkyBent && (angleDeg >= 65) && (dist48 > 0.20);
}

function triggerGunshot(indexTipLandmark) {
    if (isGunCooldown) return;
    isGunCooldown = true;

    try {
        gunSound.currentTime = 0;
        gunSound.play().catch(e => console.log('音频播放被阻止:', e));

        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.classList.add('shake-screen');
            setTimeout(() => canvasContainer.classList.remove('shake-screen'), 250);
        }

        const hole = document.createElement('div');
        hole.className = 'bullet-hole';
        if (indexTipLandmark) {
            const x = (1 - indexTipLandmark.x) * window.innerWidth;
            const y = indexTipLandmark.y * window.innerHeight;
            hole.style.left = `${x}px`;
            hole.style.top = `${y}px`;
        } else {
            hole.style.left = '50%';
            hole.style.top = '50%';
        }
        document.body.appendChild(hole);
        setTimeout(() => hole.remove(), 1300);
    } catch (e) {
        console.error("Gunshot 异常:", e);
    }

    setTimeout(() => { isGunCooldown = false; }, 800);
}

let rawGestureCounter = 0;
let currentRawGesture = 'none';
let currentStableGesture = 'none';
let gestureHasFired = false; 

function detectRawGesture(landmarks) {
    if (isVictoryGesture(landmarks)) return 'victory';
    if (isGunGesture(landmarks)) return 'gun';
    if (isMiddleFingerGesture(landmarks)) return 'middle';
    if (isThumbUpGesture(landmarks)) return 'thumbUp';
    if (isFourGesture(landmarks)) return 'four';
    if (isOneGesture(landmarks)) return 'one';
    if (isBigHeartGesture(landmarks)) return 'bigHeart';
    if (isHeartGesture(landmarks)) return 'heart';
    return 'none';
}

function updateCameraStatusUI(gesture) {
    const dot = ui.camStatusDot;
    const text = ui.camStatusText;
    if (!dot || !text) return;

    switch (gesture) {
        case 'victory':
            dot.className = "w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]";
            text.innerText = "VICTORY ✌️"; text.className = "text-[8px] text-green-400 font-mono font-bold";
            break;
        case 'gun':
            dot.className = "w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]";
            text.innerText = "GUN 🔫"; text.className = "text-[8px] text-orange-400 font-mono font-bold";
            break;
        case 'middle':
            dot.className = "w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444]";
            text.innerText = "MIDDLEFINGER 🖕"; text.className = "text-[8px] text-red-400 font-mono font-bold";
            break;
        case 'thumbUp':
            dot.className = "w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]";
            text.innerText = "LIKE 👍"; text.className = "text-[8px] text-blue-300 font-mono font-bold";
            break;
        case 'four':
            dot.className = "w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]";
            text.innerText = "LUCKY 🍀"; text.className = "text-[8px] text-emerald-300 font-mono font-bold";
            break;
        case 'one':
            dot.className = "w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]";
            text.innerText = "FIREWORK ☝️"; text.className = "text-[8px] text-amber-300 font-mono font-bold";
            break;
        case 'bigHeart':
            dot.className = "w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]";
            text.innerText = "BIG HEART 🫶"; text.className = "text-[8px] text-rose-300 font-mono font-bold";
            break;
        case 'heart':
            dot.className = "w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_#f472b6]";
            text.innerText = "HEART ❤️"; text.className = "text-[8px] text-pink-300 font-mono font-bold";
            break;
        default:
            dot.className = "w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]";
            text.innerText = "DETECTED"; text.className = "text-[8px] text-yellow-300 font-mono";
            break;
    }
}

async function initCamera() {
    const video = document.getElementsByClassName('input_video')[0];
    
    if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
        throw new Error("MediaPipe 库未加载");
    }

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({ 
        maxNumHands: 1, 
        modelComplexity: 0, 
        minDetectionConfidence: 0.5, 
        minTrackingConfidence: 0.5 
    });
    
    hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const firstHand = results.multiHandLandmarks[0];
            const detected = detectRawGesture(firstHand);

            if (detected === currentRawGesture) {
                rawGestureCounter++;
            } else {
                currentRawGesture = detected;
                rawGestureCounter = 1;
            }

            const STABLE_THRESHOLD = 10;

            if (rawGestureCounter >= STABLE_THRESHOLD && currentStableGesture !== currentRawGesture) {
                currentStableGesture = currentRawGesture;
                gestureHasFired = false;
                updateCameraStatusUI(currentStableGesture);
            }

            if (currentStableGesture !== 'none' && !gestureHasFired) {
                switch (currentStableGesture) {
                    case 'victory':
                        if (currentState === STATE.IDLE) { startSequence(); gestureHasFired = true; }
                        break;
                    case 'gun':
                        triggerGunshot(firstHand[8]);
                        gestureHasFired = true;
                        break;
                    case 'middle':
                        triggerExplosion(firstHand[12]);
                        gestureHasFired = true;
                        break;
                    case 'thumbUp':
                        triggerThumbUp(); gestureHasFired = true;
                        break;
                    case 'four':
                        triggerClover(firstHand[12]);
                        gestureHasFired = true;
                        break;
                    case 'one':
                        triggerFirework(); gestureHasFired = true;
                        break;
                    case 'bigHeart':
                        triggerBigHeart(); gestureHasFired = true;
                        break;
                    case 'heart':
                        triggerHeartRain(); gestureHasFired = true;
                        break;
                }
            }

            if (interactionMode === 1) {
                const currentHandX = firstHand[9].x; 
                const delta = currentHandX - lastHandX;
                if (Math.abs(delta) > 0.002) {
                    rotationVelocity += delta * -0.4; 
                }
                lastHandX = currentHandX;
            }
        } else {
            currentRawGesture = 'none';
            rawGestureCounter = 0;
            if (currentStableGesture !== 'none') {
                currentStableGesture = 'none';
                gestureHasFired = false;
                ui.camStatusDot.className = "w-1.5 h-1.5 rounded-full bg-red-500";
                ui.camStatusText.innerText = "NO HAND";
                ui.camStatusText.className = "text-[8px] text-red-400 font-mono";
            }
        }

        const ctx = document.getElementById('output_canvas').getContext('2d');
        ctx.clearRect(0, 0, 160, 120);
        if(results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const l of results.multiHandLandmarks) {
                drawConnectors(ctx, l, HAND_CONNECTIONS, {color: '#ff69b4', lineWidth: 2});
            }
        }
    });

    const camera = new Camera(video, { 
        onFrame: async () => { await hands.send({image: video}); }, 
        width: 320, 
        height: 240 
    });
    
    return camera.start();
}

function render() {
    requestAnimationFrame(render);
    updateParticles();
    updateFireworks();
    renderer.render(scene, camera);
}

let currentPhotoIndex = 0;
const photos = document.querySelectorAll('.photo-slide');
const dots = document.querySelectorAll('#photo-dots .dot');
const captions = ["Moments 📸", "Memories ✨", "Birthday 🎉"];
const captionEl = document.getElementById('photo-caption');
let autoSlideTimer = null;

function showPhoto(index) {
    if (!photos.length) return;
    
    if (index >= photos.length) currentPhotoIndex = 0;
    else if (index < 0) currentPhotoIndex = photos.length - 1;
    else currentPhotoIndex = index;

    photos.forEach((photo, i) => {
        if (i === currentPhotoIndex) {
            photo.classList.remove('opacity-0');
            photo.classList.add('opacity-100');
        } else {
            photo.classList.remove('opacity-100');
            photo.classList.add('opacity-0');
        }
    });

    dots.forEach((dot, i) => {
        if (i === currentPhotoIndex) {
            dot.className = 'dot w-4 h-2 rounded-full bg-pink-400 transition-all cursor-pointer';
        } else {
            dot.className = 'dot w-2 h-2 rounded-full bg-white/40 transition-all cursor-pointer';
        }
    });

    if (captionEl && captions[currentPhotoIndex]) {
        captionEl.innerText = captions[currentPhotoIndex];
    }
}

function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(() => {
        showPhoto(currentPhotoIndex + 1);
    }, 3500);
}

function stopAutoSlide() {
    if (autoSlideTimer) clearInterval(autoSlideTimer);
}

const prevBtn = document.getElementById('prev-photo-btn');
const nextBtn = document.getElementById('next-photo-btn');

if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPhoto(currentPhotoIndex - 1);
        startAutoSlide(); // 手动点击后重新计时
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPhoto(currentPhotoIndex + 1);
        startAutoSlide();
    });
}

dots.forEach((dot, idx) => {
    dot.addEventListener('click', (e) => {
        e.stopPropagation();
        showPhoto(idx);
        startAutoSlide();
    });
});

startAutoSlide();