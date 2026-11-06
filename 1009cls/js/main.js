import * as THREE from 'three';

/* ==========================================================================
   1. D 大调乐谱系统
   ========================================================================== */
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNoteName(midi) {
  const noteIndex = Math.round(midi) % 12;
  const octave = Math.floor(Math.round(midi) / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

const RELATIVE_MELODY = [
  { word: "祝", semitone: -5 },
  { word: "你", semitone: -5 },
  { word: "生", semitone: -3 },
  { word: "日", semitone: -5 },
  { word: "快", semitone: 0 },
  { word: "乐", semitone: -1 },

  { word: "祝", semitone: -5 },
  { word: "你", semitone: -5 },
  { word: "生", semitone: -3 },
  { word: "日", semitone: -5 },
  { word: "快", semitone: 2 },
  { word: "乐", semitone: 0 },

  { word: "祝", semitone: -5 },
  { word: "你", semitone: -5 },
  { word: "生", semitone: 7 },
  { word: "日", semitone: 4 },
  { word: "快", semitone: 0 },
  { word: "乐", semitone: -1 },
  { word: "啊", semitone: -3 },

  { word: "祝", semitone: 5 },
  { word: "你", semitone: 5 },
  { word: "生", semitone: 4 },
  { word: "日", semitone: 0 },
  { word: "快", semitone: 2 },
  { word: "乐", semitone: 0 }
];

const START_NOTE_MIDI = 57; // A3
const TONIC_MIDI = START_NOTE_MIDI - (-5);

const SONG_NOTES = RELATIVE_MELODY.map((item, index) => {
  const noteMidi = TONIC_MIDI + item.semitone;
  return {
    word: item.word,
    midi: noteMidi,
    note: midiToNoteName(noteMidi),
    isLastSentence: index >= 19
  };
});

/* ==========================================================================
   2. 物理、声学与木板厚度参数
   ========================================================================== */
const MAX_ALLOWED_CENTS = 20;

const MIN_MIDI = 54;
const MAX_MIDI = 72;
const SEMITONE_STEP_Y = 0.24;
const BASE_Y = 1.6;

const BALL_RADIUS = 0.22;
const BALL_Z = 0.0;
const REST_BALL_Y = 0.45;

const BOARD_WIDTH = 2.4;
const WALL_TOTAL_H = 8.2;
const BOARD_DEPTH = 0.6;

const ROAD_WIDTH = 3.6;
const ROAD_LENGTH = 50.0;
const ROAD_REPEAT_Y = 10.0;
const APPROACH_SPEED = 0.16;
const SPAWN_Z = -16.0;
const BOUNCE_BACK_Z = SPAWN_Z;

/* ==========================================================================
   3. 音效与 DOM 元素
   ========================================================================== */
const PRAISE_LIST = ["Great!", "Excellent!", "Unbelievable!"];

const PRAISE_AUDIO_MAP = {
  "Great!": "audio/great.mp3",
  "Excellent!": "audio/excellent.mp3",
  "Unbelievable!": "audio/unbelievable.mp3"
};

const VICTORY_AUDIO_PATH = "audio/victory.wav";

const container = document.getElementById('game-container');
const progressInner = document.getElementById('progress-inner');
const pitchIndicator = document.getElementById('pitch-indicator');
const feedbackText = document.getElementById('feedback-text');
const startScreen = document.getElementById('start-screen');
const celebrationScreen = document.getElementById('celebration-screen');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');

/* ==========================================================================
   4. Web Audio 分析与音效管理
   ========================================================================== */
let audioCtx = null;
let analyser = null;
let audioBuffer = null;
let lastDetectedMidi = null;

async function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
  });
  const source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  audioBuffer = new Float32Array(analyser.fftSize);
  source.connect(analyser);
}

function detectPitch() {
  if (!analyser) return null;
  analyser.getFloatTimeDomainData(audioBuffer);

  let rms = 0;
  for (let i = 0; i < audioBuffer.length; i++) rms += audioBuffer[i] * audioBuffer[i];
  rms = Math.sqrt(rms / audioBuffer.length);
  if (rms < 0.02) return null;

  const SIZE = audioBuffer.length;
  const r = new Float32Array(SIZE);
  for (let tau = 0; tau < SIZE; tau++) {
    for (let i = 0; i < SIZE - tau; i++) r[tau] += audioBuffer[i] * audioBuffer[i + tau];
  }

  let d = 0;
  while (r[d] > r[d + 1] && d < SIZE - 1) d++;

  let maxVal = -1, maxPos = -1;
  for (let i = d; i < SIZE; i++) {
    if (r[i] > maxVal) {
      maxVal = r[i];
      maxPos = i;
    }
  }

  if (maxPos > 0 && maxPos < SIZE - 1) {
    const y1 = r[maxPos - 1], y2 = r[maxPos], y3 = r[maxPos + 1];
    const delta = (y3 - y1) / (2 * (2 * y2 - y1 - y3));
    const period = maxPos + delta;
    const freq = audioCtx.sampleRate / period;
    if (freq >= 85 && freq <= 950) {
      return 69 + 12 * Math.log2(freq / 440);
    }
  }
  return null;
}

function playPraiseFeedback(praiseWord) {
  const audioPath = PRAISE_AUDIO_MAP[praiseWord];
  if (audioPath) {
    const sound = new Audio(audioPath);
    sound.volume = 0.4;
    sound.play().catch(() => {});
  }
  if (audioCtx) {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

function playBounceSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.22);
}

function playVictorySound() {
  const sound = new Audio(VICTORY_AUDIO_PATH);
  sound.volume = 0.4;
  sound.play().catch(() => {});
}

/* ==========================================================================
   5. 3D 场景与相机
   ========================================================================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x131420);
scene.fog = new THREE.FogExp2(0x131420, 0.024);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4.6, 3.6, 5.8);
camera.lookAt(-1.2, 2.5, -16.0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xdde3ff, 1.3));
const mainLight = new THREE.DirectionalLight(0xfff3db, 2.2);
mainLight.position.set(-6, 12, 6);
scene.add(mainLight);

const rimLight = new THREE.DirectionalLight(0x70a1ff, 1.5);
rimLight.position.set(6, 6, -10);
scene.add(rimLight);

/* ==========================================================================
   6. 传送带系统
   ========================================================================== */
let beltTexture = null;

function createPolishedTrack() {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#22232e';
  ctx.fillRect(0, 0, 512, 1024);

  // 中间发光导轨虚线
  ctx.fillStyle = '#ffeaa7';
  for (let y = 0; y < 1024; y += 128) {
    ctx.fillRect(248, y + 24, 16, 80);
  }

  // 起跑线斑马格子
  const check = 32;
  for (let x = 0; x < 512; x += check) {
    for (let y = 920; y < 1024; y += check) {
      ctx.fillStyle = ((x / check + y / check) % 2 === 0) ? '#181922' : '#dfe6e9';
      ctx.fillRect(x, y, check, check);
    }
  }

  beltTexture = new THREE.CanvasTexture(canvas);
  beltTexture.wrapS = THREE.RepeatWrapping;
  beltTexture.wrapT = THREE.RepeatWrapping;
  beltTexture.repeat.set(1, ROAD_REPEAT_Y);

  const beltGeo = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH);
  const beltMat = new THREE.MeshStandardMaterial({ map: beltTexture, roughness: 0.5, metalness: 0.2 });
  const beltMesh = new THREE.Mesh(beltGeo, beltMat);
  beltMesh.rotation.x = -Math.PI / 2;
  beltMesh.position.set(0, 0.005, -ROAD_LENGTH / 2 + 8);
  group.add(beltMesh);

  const baseGeo = new THREE.BoxGeometry(ROAD_WIDTH, 0.4, ROAD_LENGTH);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x16161f, roughness: 0.8 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(0, -0.2, -ROAD_LENGTH / 2 + 8);
  group.add(baseMesh);

  // 两侧蓝色霓虹导轨
  const railGeo = new THREE.CylinderGeometry(0.06, 0.06, ROAD_LENGTH, 16);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x70a1ff,
    emissive: 0x1e90ff,
    emissiveIntensity: 1.5,
    metalness: 0.8
  });

  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.rotation.x = Math.PI / 2;
  leftRail.position.set(-ROAD_WIDTH / 2 - 0.05, 0.05, -ROAD_LENGTH / 2 + 8);
  group.add(leftRail);

  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.rotation.x = Math.PI / 2;
  rightRail.position.set(ROAD_WIDTH / 2 + 0.05, 0.05, -ROAD_LENGTH / 2 + 8);
  group.add(rightRail);

  scene.add(group);
}
createPolishedTrack();

function createSparkles() {
  const count = 200;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 8;
    positions[i * 3 + 2] = -Math.random() * 35;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffeaa7,
    size: 0.08,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  scene.add(new THREE.Points(geo, mat));
}
createSparkles();

const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
const ballMat = new THREE.MeshStandardMaterial({
  color: 0xff3b30,
  emissive: 0xff4757,
  emissiveIntensity: 0.8,
  roughness: 0.15
});
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.position.set(0, REST_BALL_Y, BALL_Z);
scene.add(ball);

const ballLight = new THREE.PointLight(0xff4757, 1.8, 4.5);
ballLight.position.copy(ball.position);
scene.add(ballLight);

/* ==========================================================================
   7. 木门构建与文字
   ========================================================================== */
function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, '#e09a56');
  grad.addColorStop(0.3, '#d18b45');
  grad.addColorStop(0.7, '#f0b87c');
  grad.addColorStop(1, '#d18b45');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  ctx.strokeStyle = 'rgba(100, 45, 10, 0.14)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 256; i += 9) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.bezierCurveTo(i + 6, 170, i - 6, 340, i + 3, 512);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}
const woodTexture = createWoodTexture();
const woodMaterial = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.55 });

function createTextPlane(word, noteName) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 512, 512);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. 歌词汉字
  ctx.font = '900 180px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2d1808';
  ctx.lineWidth = 18;
  ctx.strokeText(word, 256, 185);
  ctx.fillText(word, 256, 185);

  // 2. 音高编码
  ctx.font = '800 95px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#fff4cc';
  ctx.strokeStyle = '#2d1808';
  ctx.lineWidth = 12;
  ctx.strokeText(noteName, 256, 350);
  ctx.fillText(noteName, 256, 350);

  const texture = new THREE.CanvasTexture(canvas);
  const textMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const planeGeo = new THREE.PlaneGeometry(1.8, 1.8);
  return new THREE.Mesh(planeGeo, textMat);
}

const rimMat = new THREE.MeshStandardMaterial({
  color: 0xffd32a,
  emissive: 0xffa801,
  emissiveIntensity: 1.4
});
const rimGeo = new THREE.BoxGeometry(BOARD_WIDTH + 0.04, 0.08, BOARD_DEPTH + 0.04);

function createWallMesh(noteData) {
  const group = new THREE.Group();

  const depth = noteData.isLastSentence ? 5.0 : BOARD_DEPTH;
  const allowedCents = noteData.isLastSentence ? 30 : MAX_ALLOWED_CENTS;
  const gapHeight = (BALL_RADIUS * 2) + (2 * (allowedCents / 100) * SEMITONE_STEP_Y);

  const targetHoleY = BASE_Y + (noteData.midi - MIN_MIDI) * SEMITONE_STEP_Y;
  const lowerH = Math.max(0.2, targetHoleY - gapHeight / 2);
  const upperH = Math.max(0.2, WALL_TOTAL_H - (targetHoleY + gapHeight / 2));

  const lowerGeo = new THREE.BoxGeometry(BOARD_WIDTH, lowerH, depth);
  const lowerMesh = new THREE.Mesh(lowerGeo, woodMaterial);
  lowerMesh.position.y = lowerH / 2;
  group.add(lowerMesh);

  const rimGeo = new THREE.BoxGeometry(BOARD_WIDTH + 0.04, 0.08, depth + 0.04);
  const lowerRim = new THREE.Mesh(rimGeo, rimMat);
  lowerRim.position.y = lowerH;
  group.add(lowerRim);

  const textMesh = createTextPlane(noteData.word, noteData.note);
  textMesh.position.set(0, Math.max(0.9, lowerH - 1.0), depth / 2 + 0.015);
  group.add(textMesh);

  const upperGeo = new THREE.BoxGeometry(BOARD_WIDTH, upperH, depth);
  const upperMesh = new THREE.Mesh(upperGeo, woodMaterial);
  upperMesh.position.y = WALL_TOTAL_H - upperH / 2;
  group.add(upperMesh);

  const upperRim = new THREE.Mesh(rimGeo, rimMat);
  upperRim.position.y = WALL_TOTAL_H - upperH;
  group.add(upperRim);

  group.userData = {
    word: noteData.word,
    note: noteData.note,
    targetMidi: noteData.midi,
    targetY: targetHoleY,
    gapBottom: targetHoleY - gapHeight / 2,
    gapTop: targetHoleY + gapHeight / 2,
    depth: depth,
    allowedCents: allowedCents,
    contactZ: BALL_Z - BALL_RADIUS - depth / 2,
    exitZ: BALL_Z + BALL_RADIUS + depth / 2,
    state: 'approaching' // 'approaching' | 'traversing' | 'bouncing' | 'passed'
  };

  return group;
}

/* ==========================================================================
   8. 关卡状态管理
   ========================================================================== */
let currentNoteIndex = 0;
let currentWall = null;
let isPlaying = false;
let toastTimeout = null;

function showPassToast(text) {
  clearTimeout(toastTimeout);
  feedbackText.innerText = text;
  feedbackText.className = 'feedback-toast';
  void feedbackText.offsetWidth;
  feedbackText.classList.add('show-pass');
  toastTimeout = setTimeout(() => {
    feedbackText.className = 'feedback-toast';
  }, 750);
}

function spawnWall(index) {
  if (currentWall) scene.remove(currentWall);

  if (index >= SONG_NOTES.length) {
    isPlaying = false;
    playVictorySound();
    celebrationScreen.classList.add('active');
    return;
  }

  currentWall = createWallMesh(SONG_NOTES[index]);
  currentWall.position.set(0, 0, SPAWN_Z);
  scene.add(currentWall);

  const progressPercent = (index / SONG_NOTES.length) * 100;
  progressInner.style.width = `${progressPercent}%`;
}

/* ==========================================================================
   9. 物理判定、传送带同步与渲染主循环
   ========================================================================== */
function animate() {
  requestAnimationFrame(animate);

  // 1. 音高分析与小球运动
  if (isPlaying) {
    const detectedMidi = detectPitch();
    let targetY = REST_BALL_Y;
    let uiRatio = 0.0;

    if (detectedMidi !== null) {
      lastDetectedMidi = detectedMidi;
      const clampedMidi = THREE.MathUtils.clamp(detectedMidi, MIN_MIDI, MAX_MIDI);
      targetY = BASE_Y + (clampedMidi - MIN_MIDI) * SEMITONE_STEP_Y;
      uiRatio = (clampedMidi - MIN_MIDI) / (MAX_MIDI - MIN_MIDI);
    } else {
      lastDetectedMidi = null;
    }

    ball.position.y += (targetY - ball.position.y) * 0.22;
    ballLight.position.y = ball.position.y;
    pitchIndicator.style.bottom = `${uiRatio * 100}%`;
  }

  // 2. 传送带相对静止同步与穿透检测
  if (isPlaying && currentWall) {
    const { targetMidi, gapBottom, gapTop, contactZ, exitZ, allowedCents, depth, state } = currentWall.userData;
    let deltaZ = 0;

    if (state === 'approaching') {
      deltaZ = APPROACH_SPEED;
      currentWall.position.z += deltaZ;

      if (currentWall.position.z >= contactZ) {
        currentWall.position.z = contactZ;
        currentWall.userData.state = 'traversing'; 
      }
    }
    else if (state === 'traversing') {
      let centDiff = 999;
      if (lastDetectedMidi !== null) {
        centDiff = (lastDetectedMidi - targetMidi) * 100;
      }

      const ballBottom = ball.position.y - BALL_RADIUS;
      const ballTop = ball.position.y + BALL_RADIUS;

      const isPitchAccurate = Math.abs(centDiff) <= allowedCents;
      const isPhysicallyInside = (ballBottom >= gapBottom) && (ballTop <= gapTop);

      if (isPitchAccurate && isPhysicallyInside) {
        deltaZ = APPROACH_SPEED;
        currentWall.position.z += deltaZ;

        if (currentWall.position.z >= exitZ) {
          currentWall.userData.state = 'passed';
          const praiseWord = PRAISE_LIST[Math.floor(Math.random() * PRAISE_LIST.length)];
          playPraiseFeedback(praiseWord);
          showPassToast(praiseWord);
        }
      } 
      else {
        currentWall.userData.state = 'bouncing';
        playBounceSound();
        ball.scale.set(1.4, 0.6, 1.4);
        setTimeout(() => ball.scale.set(1, 1, 1), 220);
      }
    }
    else if (state === 'bouncing') {
      deltaZ = -APPROACH_SPEED * 1.8;
      currentWall.position.z += deltaZ;

      if (currentWall.position.z <= BOUNCE_BACK_Z) {
        currentWall.position.z = BOUNCE_BACK_Z;
        currentWall.userData.state = 'approaching';
      }
    }
    else if (state === 'passed') {
      deltaZ = APPROACH_SPEED;
      currentWall.position.z += deltaZ;

      if (currentWall.position.z > 6.0 + depth) {
        currentNoteIndex++;
        spawnWall(currentNoteIndex);
      }
    }

    if (beltTexture && deltaZ !== 0) {
      beltTexture.offset.y += (deltaZ / ROAD_LENGTH) * ROAD_REPEAT_Y;
    }
  }

  renderer.render(scene, camera);
}
animate();

/* ==========================================================================
   10. 交互初始化
   ========================================================================== */
async function startGame() {
  try {
    await initAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    startScreen.classList.remove('active');
    celebrationScreen.classList.remove('active');
    currentNoteIndex = 0;
    isPlaying = true;
    spawnWall(currentNoteIndex);
  } catch (err) {
    alert("请开启麦克风权限以游玩此游戏！");
  }
}

btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});