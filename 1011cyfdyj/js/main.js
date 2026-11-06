(function () {
  'use strict';

  const CHOICES_DELAY_MS = 800;
  const TYPEWRITER_SPEED_MS = 36;
  const audio = {
    enabled: true,
    bgm: '',
    ambient: new Audio('resources/audio/restaurant.wav'),
    click: new Audio('resources/audio/click.wav'),
    text: new Audio('resources/audio/type.wav')
  };
  audio.ambient.loop = true;
  audio.ambient.volume = 0.2;
  audio.click.volume = 0.3;
  audio.text.volume = 0.12;
  audio.text.loop = true;

  // --- 状态机定义 ---
  const state = {
    currentRole: null,        // 'A' 或 'B'
    currentNodeId: null,      // 当前节点 ID
    isTyping: false,          // 是否正在逐字打印
    typewriterTimer: null,    // 打字机定时器
    choicesTimer: null,       // 选项延迟定时器
    endingTextTimer: null,
    replayTimer: null,
    fullTextToDisplay: '',    // 当前节点完整台词
    currentBg: '',            // 当前渲染的背景图文件名
    bgFrontIsPrimary: true    // 双背景层切换标记
  };

  // --- DOM 元素缓存 ---
  const DOM = {
    titleScreen: document.getElementById('title-screen'),
    storyScreen: document.getElementById('story-screen'),
    endingScreen: document.getElementById('ending-screen'),
    
    // 背景双图层
    bgFront: document.getElementById('bg-layer-front'),
    bgBack: document.getElementById('bg-layer-back'),

    // 对话区
    textbox: document.getElementById('textbox-container'),
    speaker: document.getElementById('speaker-name'),
    dialogue: document.getElementById('dialogue-text'),
    cursor: document.getElementById('continue-cursor'),

    // 选项层
    choicesLayer: document.getElementById('choices-layer'),
    choicesContainer: document.getElementById('choices-container'),

    // 结局元素
    endingBadge: document.getElementById('ending-badge'),
    endingTitle: document.getElementById('ending-title'),
    endingEpilogue: document.getElementById('ending-epilogue'),
    btnReadOther: document.getElementById('btn-read-other'),
    btnReplay: document.getElementById('btn-replay'),

    // HUD 按钮
    btnRestart: document.getElementById('btn-restart'),
    btnAudioToggle: document.getElementById('btn-audio-toggle'),
    bgmPlayer: document.getElementById('bgm-player'),
    sfxPlayer: document.getElementById('sfx-player')
  };

  /**
   * 初始化入口
   */
  function init() {
    DOM.bgmPlayer.volume = 0.3;
    DOM.sfxPlayer.volume = 0.5;
    DOM.btnAudioToggle.setAttribute('aria-pressed', 'true');
    bindEvents();
  }

  function playAudio(player, restart = false) {
    if (!audio.enabled) return;
    if (restart) player.currentTime = 0;
    player.play().catch(() => {});
  }

  function stopAudio(player) {
    player.pause();
    player.currentTime = 0;
  }

  function stopAllAudio(reset = false) {
    [DOM.bgmPlayer, DOM.sfxPlayer, audio.ambient, audio.click, audio.text]
      .forEach(player => reset ? stopAudio(player) : player.pause());
  }

  function setBgm(filename) {
    if (audio.bgm !== filename) {
      audio.bgm = filename;
      DOM.bgmPlayer.src = `resources/audio/${filename}`;
    }
    playAudio(DOM.bgmPlayer);
  }

  function updateNodeAudio(node) {
    setBgm(node.isEnding ? 'bgm_ending.mp3' : 'bgm_daily.mp3');
    if (node.bg === 'restaurant.jpeg') {
      playAudio(audio.ambient);
    } else {
      stopAudio(audio.ambient);
    }
    stopAudio(DOM.sfxPlayer);
    if (node.sfx) {
      DOM.sfxPlayer.src = `resources/audio/${node.sfx}`;
      playAudio(DOM.sfxPlayer);
    }
  }

  /**
   * 事件绑定
   */
  function bindEvents() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (button && !button.disabled && button !== DOM.btnAudioToggle) {
        playAudio(audio.click, true);
      }
    });
    const selectView = document.querySelector('.select-view');
    selectView.addEventListener('animationend', (event) => {
      if (event.target !== selectView || event.animationName !== 'selectEnter') return;
      selectView.classList.add('ready');
      document.querySelectorAll('.char-card').forEach(btn => {
        btn.disabled = false;
      });
    });

    // 1. 角色选择事件
    document.querySelectorAll('.char-card').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const role = btn.dataset.role;
        startGame(role);
      });
    });

    // 2. 对话框点击事件：正在打印则瞬间完成；打印完毕则推进到下一句
    DOM.textbox.addEventListener('click', handleTextboxClick);

    [DOM.btnReplay, DOM.btnRestart].forEach(btn => {
      btn?.addEventListener('click', () => restartGame(null));
    });

    // 3. 结局页“体验另一视角”按钮
    if (DOM.btnReadOther) {
      DOM.btnReadOther.addEventListener('click', () => {
        const nextRole = state.currentRole === 'A' ? 'B' : 'A';
        restartGame(nextRole);
      });
    }

    // 5. 音频开关
    if (DOM.btnAudioToggle && DOM.bgmPlayer) {
      DOM.btnAudioToggle.addEventListener('click', () => {
        audio.enabled = !audio.enabled;
        DOM.btnAudioToggle.style.opacity = audio.enabled ? '1' : '0.5';
        DOM.btnAudioToggle.setAttribute('aria-pressed', String(audio.enabled));
        DOM.btnAudioToggle.title = audio.enabled ? '关闭声音' : '开启声音';
        if (audio.enabled) {
          if (state.currentNodeId) {
            playAudio(DOM.bgmPlayer);
            if (state.isTyping || state.endingTextTimer) playAudio(audio.text);
            if (STORY_DATA[state.currentNodeId].bg === 'restaurant.jpeg' &&
                !DOM.endingScreen.classList.contains('active')) playAudio(audio.ambient);
          }
        } else {
          stopAllAudio();
        }
      });
    }
  }

  /**
   * 启动游戏流程
   * @param {string} role 'A' (陈羿帆) 或 'B' (窦一杰)
   */
  function startGame(role) {
    state.currentRole = role;

    // 切换视口容器
    DOM.titleScreen.classList.remove('active');
    DOM.endingScreen.classList.remove('active');
    DOM.storyScreen.classList.add('active');

    // 判定起始剧情节点
    const startNodeId = role === 'A' ? 'A_start' : 'B_start';
    goToNode(startNodeId);
  }

  /**
   * 核心节点路由跳转
   * @param {string} nodeId 目标节点 ID
   */
  function goToNode(nodeId) {
    const node = STORY_DATA[nodeId];
    if (!node) {
      console.error(`[Story Engine] 找不到剧情节点: ${nodeId}`);
      return;
    }

    state.currentNodeId = nodeId;
    updateNodeAudio(node);
    clearTimeout(state.choicesTimer);
    state.choicesTimer = null;

    // 1. 隐藏分支选项
    DOM.choicesLayer.classList.add('hidden');
    DOM.choicesContainer.innerHTML = '';

    // 2. 处理背景图像平滑交叉淡化
    if (node.bg && node.bg !== state.currentBg) {
      changeBackground(node.bg);
    }

    // 3. 处理说话人与光标
    DOM.speaker.textContent = node.speaker || '';
    DOM.cursor.classList.add('hidden');

    // 4. 启动台词逐字打字机
    startTypewriter(node.text);
  }

  /**
   * 打字机逐字显示动画
   * @param {string} text 显示文本
   */
  function startTypewriter(text) {
    state.isTyping = true;
    state.fullTextToDisplay = text;
    typeText(DOM.dialogue, text, 'typewriterTimer', finishTypingImmediately);
  }

  // 剧情和结局共用逐字显示与音效逻辑。
  function typeText(element, text, timerKey, onComplete) {
    clearInterval(state[timerKey]);
    state[timerKey] = null;
    element.textContent = '';
    const characters = Array.from(text || '');
    if (!characters.length) {
      stopAudio(audio.text);
      onComplete?.();
      return;
    }
    playAudio(audio.text, true);
    let index = 0;
    state[timerKey] = setInterval(() => {
      element.textContent += characters[index++];
      if (index === characters.length) {
        clearInterval(state[timerKey]);
        state[timerKey] = null;
        stopAudio(audio.text);
        onComplete?.();
      }
    }, TYPEWRITER_SPEED_MS);
  }

  /**
   * 瞬间跳过打字动画
   */
  function finishTypingImmediately() {
    clearInterval(state.typewriterTimer);
    state.typewriterTimer = null;
    stopAudio(audio.text);
    DOM.dialogue.textContent = state.fullTextToDisplay;
    state.isTyping = false;

    const node = STORY_DATA[state.currentNodeId];
    if (!node.isEnding && node.choices?.length) {
      scheduleChoices(node.choices);
    } else {
      DOM.cursor.classList.remove('hidden');
    }
  }

  /**
   * 台词结束后延迟显示选项
   */
  function scheduleChoices(choices) {
    clearTimeout(state.choicesTimer);
    state.choicesTimer = setTimeout(() => {
      state.choicesTimer = null;
      renderChoices(choices);
    }, CHOICES_DELAY_MS);
  }

  /**
   * 渲染分支选项
   * @param {Array} choices
   */
  function renderChoices(choices) {
    DOM.choicesContainer.innerHTML = '';
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'btn-choice';
      btn.textContent = choice.text;
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡触发文本框点击
        playAudio(audio.click, true);
        goToNode(choice.target);
      });
      DOM.choicesContainer.appendChild(btn);
    });
    DOM.choicesLayer.classList.remove('hidden');
  }

  /**
   * 点击文本框的处理逻辑
   */
  function handleTextboxClick() {
    const node = STORY_DATA[state.currentNodeId];
    if (!node) return;

    // 情况 A：正在打印时点击，立刻刷出整段文字
    if (state.isTyping) {
      playAudio(audio.click, true);
      finishTypingImmediately();
      return;
    }

    // 情况 B：结局节点，点击展现通关面板
    if (node.isEnding) {
      playAudio(audio.click, true);
      showEndingCard(node.endingId);
      return;
    }

    // 情况 C：存在选项时，点击文本框不动作（必须点选项按钮）
    if (node.choices && node.choices.length > 0) {
      return;
    }

    // 情况 D：普通线性推进，跳转到 next
    if (node.next) {
      playAudio(audio.click, true);
      goToNode(node.next);
    }
  }

  /**
   * 双图层背景无缝交叉淡化 (Crossfade)
   * @param {string} bgName 背景文件名
   */
  function changeBackground(bgName) {
    const bgUrl = `resources/images/${bgName}`;
    state.currentBg = bgName;

    if (!DOM.bgFront || !DOM.bgBack) return;

    const [visible, hidden] = state.bgFrontIsPrimary
      ? [DOM.bgBack, DOM.bgFront] : [DOM.bgFront, DOM.bgBack];
    visible.style.backgroundImage = `url('${bgUrl}')`;
    visible.style.opacity = '1';
    hidden.style.opacity = '0';
    state.bgFrontIsPrimary = !state.bgFrontIsPrimary;
  }

  /**
   * 弹出结局结算卡片
   * @param {number} endingId 结局编号 (1~5)
   */
  function showEndingCard(endingId) {
    clearEndingTimers();
    setBgm('bgm_ending.mp3');
    stopAudio(audio.ambient);
    stopAudio(DOM.sfxPlayer);
    const meta = (typeof ENDINGS_DATA !== 'undefined' && ENDINGS_DATA[endingId]) 
      ? ENDINGS_DATA[endingId] 
      : { number: `结局 ${endingId}`, title: "未定义结局", desc: "" };

    DOM.endingBadge.textContent = meta.number;
    DOM.endingTitle.textContent = meta.title;
    DOM.btnReplay.classList.add('pending');
    DOM.btnReplay.disabled = true;

    // 动态调整按钮文字
    if (DOM.btnReadOther) {
      const otherName = state.currentRole === 'A' ? '窦一杰' : '陈羿帆';
      DOM.btnReadOther.textContent = `体验另一视角（${otherName}）`;
    }

    DOM.endingScreen.classList.add('active');
    typeText(DOM.endingEpilogue, meta.desc, 'endingTextTimer');
    state.replayTimer = setTimeout(() => {
      state.replayTimer = null;
      DOM.btnReplay.classList.remove('pending');
      DOM.btnReplay.disabled = false;
    }, 5000);
  }

  function clearEndingTimers() {
    clearInterval(state.endingTextTimer);
    clearTimeout(state.replayTimer);
    state.endingTextTimer = null;
    state.replayTimer = null;
    stopAudio(audio.text);
  }

  /**
   * 重启或切换视角
   * @param {string|null} targetRole
   */
  function restartGame(targetRole) {
    clearEndingTimers();
    stopAllAudio(true);
    clearInterval(state.typewriterTimer);
    clearTimeout(state.choicesTimer);
    state.typewriterTimer = null;
    state.choicesTimer = null;
    state.isTyping = false;
    state.fullTextToDisplay = '';
    DOM.choicesLayer.classList.add('hidden');
    DOM.choicesContainer.innerHTML = '';
    DOM.cursor.classList.add('hidden');
    DOM.endingScreen.classList.remove('active');

    if (targetRole) {
      startGame(targetRole);
    } else {
      DOM.storyScreen.classList.remove('active');
      DOM.titleScreen.classList.add('active');
      state.currentRole = null;
      state.currentNodeId = null;
    }
  }

  // 页面加载完成后启动
  window.addEventListener('DOMContentLoaded', init);
})();
