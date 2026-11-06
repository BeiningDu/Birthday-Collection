/**
 * Happy Birthday Snake - 10x10 Retro Pixel Edition
 * 核心特性：
 * 1. 10x10 网格，圆环拓扑穿墙
 * 2. 街机硬核机制：自撞死亡后彻底从头开始，恢复初始安全长度与起点
 * 3. 输入缓冲队列（防止极速双击导致的 180° 自杀 Bug）
 * 4. BFS 连通性校验（防止食物刷入闭合死胡同）
 * 5. Web Audio API 纯代码合成复古 8-bit 音效
 */

// --- 1. 常量与配置 ---
const BOARD_SIZE = 10;
const CANVAS_SIZE = 320;
const TILE_SIZE = CANVAS_SIZE / BOARD_SIZE; // 32px
const TICK_INTERVAL = 170; // 恒定步长 (ms)，适中操作窗口

const TARGET_ITEMS = Array.from("LAIHAOJUNHAPPYBIRTHDAY").concat(["🎂"]);

// --- 2. 状态机变量 ---
let snake = [];
let direction = { x: 1, y: 0 };
let inputQueue = [];
let food = null;
let currentIndex = 0;

let lastTime = 0;
let accumulator = 0;
let isVictory = false;
let isDeadFlash = false;
let screenShakeTimer = 0;

// 庆祝粒子系统
let confettiParticles = [];

// --- 3. DOM 引用 ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;
ctx.imageSmoothingEnabled = false; // 保证硬像素边缘

const progressText = document.getElementById("progress-text");
const targetDisplay = document.getElementById("target-display");
const collectedDisplay = document.getElementById("collected-text");
const congratsModal = document.getElementById("congrats-modal");
const replayBtn = document.getElementById("replay-btn");


function getCollectedString(count) {
    if (count === 0) return "_"; // 初始状态显示闪烁光标占位

    let result = "";
    for (let i = 0; i < count; i++) {
        result += TARGET_ITEMS[i];
        // 在各个单词结尾添加语义空格
        if (i === 2 || i === 8 || i === 13 || i === 21) {
            result += " ";
        }
    }
    return result;
}

// 统一的界面指示器更新函数（已移除后续的重复定义）
function updateUI() {
    if (progressText) {
        progressText.innerText = `${currentIndex} / ${TARGET_ITEMS.length}`;
    }
    if (targetDisplay) {
        targetDisplay.innerText = currentIndex < TARGET_ITEMS.length ? TARGET_ITEMS[currentIndex] : "🎉";
    }
    if (collectedDisplay) {
        collectedDisplay.innerText = getCollectedString(currentIndex);
    }
}

// --- 4. Web Audio API 8-Bit 复古音效 ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, type, duration, endFreq = null) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (endFreq) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
        }
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // 忽略静音或未交互错误
    }
}

const sfx = {
    eat: () => playTone(600, "square", 0.08, 900),
    milestone: () => {
        playTone(523.25, "triangle", 0.1);
        setTimeout(() => playTone(659.25, "triangle", 0.1), 100);
        setTimeout(() => playTone(783.99, "triangle", 0.2), 200);
    },
    die: () => playTone(240, "sawtooth", 0.25, 60),
    win: () => {
        const notes = [261.6, 261.6, 293.7, 261.6, 349.2, 329.6];
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, "square", 0.2), i * 220);
        });
    }
};

// --- 5. 核心逻辑与拓扑计算 ---

// 初始化/重置游戏（彻底从头开始）
function resetToStart() {
    currentIndex = 0;
    
    // 初始化安全蛇身（长度为 3，水平均匀居中放置）
    snake = [
        { x: 4, y: 5 }, // 蛇头
        { x: 3, y: 5 }, // 身体
        { x: 2, y: 5 }  // 蛇尾
    ];
    direction = { x: 1, y: 0 };
    inputQueue = [];
    food = spawnFoodSafe();
    updateUI();
}

// 广度优先搜索 (BFS)：校验目标点与蛇头连通
function isReachable(start, target, obstacleList) {
    const obstacleSet = new Set(obstacleList.map(s => `${s.x},${s.y}`));
    obstacleSet.delete(`${start.x},${start.y}`); // 排除蛇头
    obstacleSet.delete(`${target.x},${target.y}`);

    const queue = [start];
    const visited = new Set([`${start.x},${start.y}`]);
    const dirs = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];

    while (queue.length > 0) {
        const curr = queue.shift();
        if (curr.x === target.x && curr.y === target.y) return true;

        for (const d of dirs) {
            const nx = (curr.x + d.x + BOARD_SIZE) % BOARD_SIZE;
            const ny = (curr.y + d.y + BOARD_SIZE) % BOARD_SIZE;
            const key = `${nx},${ny}`;

            if (!visited.has(key) && !obstacleSet.has(key)) {
                visited.add(key);
                queue.push({ x: nx, y: ny });
            }
        }
    }
    return false;
}

// 安全食物生成（避免刷在蛇体内，并通过连通域检验）
function spawnFoodSafe() {
    if (currentIndex >= TARGET_ITEMS.length) return null;

    const char = TARGET_ITEMS[currentIndex];
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    const emptyCells = [];

    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (!occupied.has(`${x},${y}`)) {
                emptyCells.push({ x, y });
            }
        }
    }

    if (emptyCells.length === 0) return null;

    // 优先随机挑选可通过 BFS 抵达的格子
    for (let i = 0; i < 20; i++) {
        const candidate = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        if (isReachable(snake[0], candidate, snake)) {
            return { x: candidate.x, y: candidate.y, char };
        }
    }

    // 备用兜底（极端长蛇状态）
    const fallback = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return { x: fallback.x, y: fallback.y, char };
}

// 触发自撞死亡（红屏震动后清零重开）
function triggerDeath() {
    sfx.die();
    isDeadFlash = true;
    screenShakeTimer = 8;

    setTimeout(() => {
        isDeadFlash = false;
        resetToStart(); // 死亡后彻底清零从第 1 个字母重新开始
    }, 280);
}

// 达成通关
function triggerVictory() {
    isVictory = true;
    sfx.win();
    updateUI();

    // 初始化庆祝粒子
    confettiParticles = [];
    const colors = ["#ff4d4f", "#faad14", "#52c41a", "#1890ff", "#722ed1", "#eb2f96"];
    for (let i = 0; i < 60; i++) {
        confettiParticles.push({
            x: CANVAS_SIZE / 2,
            y: CANVAS_SIZE / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            size: Math.random() * 4 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1.0
        });
    }

    // 延迟弹出祝福卡片
    setTimeout(() => {
        congratsModal.classList.remove("hidden");
    }, 800);
}

// --- 6. 物理与状态推进 (Update) ---
function update() {
    if (isVictory || isDeadFlash) return;

    // 消费输入队列
    if (inputQueue.length > 0) {
        direction = inputQueue.shift();
    }

    // 穿墙位移（圆环拓扑）
    const head = snake[0];
    const newHead = {
        x: (head.x + direction.x + BOARD_SIZE) % BOARD_SIZE,
        y: (head.y + direction.y + BOARD_SIZE) % BOARD_SIZE
    };

    // 自身碰撞死亡判定 (蛇头撞上第 0 ~ n-2 节，尾尖不算因为同拍移动)
    for (let i = 0; i < snake.length - 1; i++) {
        if (newHead.x === snake[i].x && newHead.y === snake[i].y) {
            triggerDeath();
            return;
        }
    }

    snake.unshift(newHead);

    // 碰撞检测：吃到食物
    if (food && newHead.x === food.x && newHead.y === food.y) {
        currentIndex++;
        sfx.eat();

        // 单词节点播放特殊音效
        const milestoneIndices = [3, 9, 13, 22];
        if (milestoneIndices.includes(currentIndex)) {
            sfx.milestone();
        }

        if (currentIndex >= TARGET_ITEMS.length) {
            triggerVictory();
        } else {
            food = spawnFoodSafe();
            updateUI();
        }
    } else {
        snake.pop(); // 正常向前移动
    }
}

// --- 7. 渲染管线 (Render) ---
function draw() {
    ctx.save();

    // 屏幕震动动画偏移
    if (screenShakeTimer > 0) {
        const dx = (Math.random() - 0.5) * 6;
        const dy = (Math.random() - 0.5) * 6;
        ctx.translate(dx, dy);
        screenShakeTimer--;
    }

    // 清屏与底色
    ctx.fillStyle = isDeadFlash ? "#4a1515" : "#1a1a24";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 绘制 10x10 像素风格网格线
    ctx.strokeStyle = "#252538";
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE);
        ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }

    // 绘制食物（像素字符 / Emoji）
    if (food) {
        const fx = food.x * TILE_SIZE;
        const fy = food.y * TILE_SIZE;

        // 物品外光晕
        ctx.fillStyle = "rgba(255, 77, 79, 0.2)";
        ctx.fillRect(fx + 2, fy + 2, TILE_SIZE - 4, TILE_SIZE - 4);

        ctx.font = food.char === "🎂" ? "20px sans-serif" : "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(food.char, fx + TILE_SIZE / 2, fy + TILE_SIZE / 2 + 1);
    }

    // 绘制蛇身
    snake.forEach((segment, idx) => {
        const sx = segment.x * TILE_SIZE;
        const sy = segment.y * TILE_SIZE;

        if (idx === 0) {
            // 蛇头：高亮黄色 + 像素眼睛
            ctx.fillStyle = "#ffec3d";
            ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            // 眼睛朝向
            ctx.fillStyle = "#141414";
            let eye1 = { x: sx + 8, y: sy + 8 };
            let eye2 = { x: sx + TILE_SIZE - 12, y: sy + 8 };

            if (direction.x === 1) { // 右
                eye1 = { x: sx + TILE_SIZE - 8, y: sy + 8 };
                eye2 = { x: sx + TILE_SIZE - 8, y: sy + TILE_SIZE - 12 };
            } else if (direction.x === -1) { // 左
                eye1 = { x: sx + 4, y: sy + 8 };
                eye2 = { x: sx + 4, y: sy + TILE_SIZE - 12 };
            } else if (direction.y === 1) { // 下
                eye1 = { x: sx + 8, y: sy + TILE_SIZE - 8 };
                eye2 = { x: sx + TILE_SIZE - 12, y: sy + TILE_SIZE - 8 };
            }
            ctx.fillRect(eye1.x, eye1.y, 4, 4);
            ctx.fillRect(eye2.x, eye2.y, 4, 4);
        } else {
            // 蛇身：翡翠像素绿，带双色分块质感
            ctx.fillStyle = idx % 2 === 0 ? "#52c41a" : "#73d13d";
            ctx.fillRect(sx + 3, sy + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.fillRect(sx + 3, sy + 3, TILE_SIZE - 6, 3); // 像素顶部高光
        }
    });

    // 通关纸屑渲染
    if (isVictory) {
        confettiParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // 重力加速度
            p.life -= 0.008;

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.restore();
        });
    }

    ctx.restore();
}

// --- 8. 输入分发与缓冲防护 ---
function queueDirection(newDir) {
    initAudio();
    // 参照队列尾部最新方向判定，避免连续输入 180° 自冲碰撞
    const currentBase = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : direction;

    // 向量反向判定 (点积等于 -1 则为反向)
    if (currentBase.x + newDir.x === 0 && currentBase.y + newDir.y === 0) {
        return;
    }

    // 队列最多缓存 2 个步进动作
    if (inputQueue.length < 2) {
        inputQueue.push(newDir);
    }
}

// 键盘控制绑定 (Arrow + WASD)
window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
            queueDirection({ x: 0, y: -1 });
            break;
        case "ArrowDown":
        case "s":
        case "S":
            queueDirection({ x: 0, y: 1 });
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            queueDirection({ x: -1, y: 0 });
            break;
        case "ArrowRight":
        case "d":
        case "D":
            queueDirection({ x: 1, y: 0 });
            break;
    }
});

// 移动端 D-Pad 触控事件委托
const dpad = document.getElementById("dpad-controller");
const dirMap = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

["touchstart", "mousedown"].forEach(eventType => {
    dpad.addEventListener(eventType, (e) => {
        const btn = e.target.closest(".dpad-btn");
        if (!btn) return;
        e.preventDefault(); // 阻止浏览器滚动与缩放

        const dirKey = btn.getAttribute("data-dir");
        if (dirMap[dirKey]) {
            queueDirection(dirMap[dirKey]);
        }
    }, { passive: false });
});

// 再玩一次按钮绑定
replayBtn.addEventListener("click", () => {
    congratsModal.classList.add("hidden");
    isVictory = false;
    resetToStart();
});

// --- 9. 主循环 (基于 Delta Time 节拍) ---
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    accumulator += delta;
    while (accumulator >= TICK_INTERVAL) {
        update();
        accumulator -= TICK_INTERVAL;
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// 启动执行
resetToStart();
requestAnimationFrame(gameLoop);