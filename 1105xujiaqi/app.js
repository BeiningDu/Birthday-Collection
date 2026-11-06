(() => {
  'use strict';
  const config = window.BIRTHDAY_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = ['entry', 'cake', 'album'];
  const imageMissingText = '啊唷？图片不见了～';
  const music = $('#music');
  const musicButton = $('.music-toggle');
  const scrollArea = $('#album-scroll');
  const album = [];
  const dots = [];
  const galleries = [];
  const hasIntro = Array.isArray(config.intro) && config.intro.length > 0;
  const cakeTemplate = $('#cake-art').innerHTML;
  const timers = new Set();
  let activeScene = 'entry';
  let page = 0;
  let musicPending = false;
  let opened = false;
  let unlikeTimer;
  // 仅保护怪图期间的意外重载，不保存用户名或密码。
  const unlikeRecoveryKey = 'birthday:unlike-recovery';
  function rememberUnlikeReturn() {
    try { sessionStorage.setItem(unlikeRecoveryKey, String(Date.now() + 60000)); }
    catch { /* 隐私模式禁用存储时，正常播放仍可继续。 */ }
  }
  function clearUnlikeReturn() {
    try { sessionStorage.removeItem(unlikeRecoveryKey); } catch { /* 存储不可用。 */ }
  }
  function shouldRecoverUnlike() {
    let expires = 0;
    try { expires = Number(sessionStorage.getItem(unlikeRecoveryKey)); } catch { /* 存储不可用。 */ }
    clearUnlikeReturn();
    return expires > Date.now() && expires <= Date.now() + 60000;
  }
  let audioContext;
  let mediaSource;
  let glitchNode;
  let graphPromise;
  let glitchActive = false;
  let nativeGlitchTimer;
  let nativeGlitchState;
  const videos = [];
  let resumeMusicAfterVideo = false;

  function stopNativeGlitch(restorePosition = true) {
    clearInterval(nativeGlitchTimer);
    nativeGlitchTimer = undefined;
    if (!nativeGlitchState) return;
    const state = nativeGlitchState;
    nativeGlitchState = undefined;
    music.dataset.glitchStatus = 'off';
    music.playbackRate = state.rate;
    music.preservesPitch = state.pitch;
    if (restorePosition && !music.paused && Number.isFinite(music.duration) && music.duration > 0) {
      const elapsed = (performance.now() - state.clock) / 1000;
      music.currentTime = (state.time + elapsed * state.rate) % music.duration;
    }
  }
  function startNativeGlitch() {
    if (nativeGlitchTimer || music.paused) return;
    nativeGlitchState = { rate: music.playbackRate, pitch: music.preservesPitch, time: music.currentTime, clock: performance.now() };
    const rates = [0.7, 1.44, 0.84, 1.58, 0.65, 1.22];
    let tick = 0;
    music.preservesPitch = false;
    music.playbackRate = rates[0];
    music.dataset.glitchEngine = 'native';
    music.dataset.glitchStatus = 'active';
    nativeGlitchTimer = setInterval(() => {
      if (music.paused) return;
      music.playbackRate = rates[++tick % rates.length];
      if (tick % 3 === 0 && music.readyState >= 2) music.currentTime = Math.max(0, music.currentTime - 0.12);
    }, 85);
  }
  function prepareGlitchGraph() {
    if (graphPromise) return graphPromise;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context || !window.AudioWorkletNode || location.protocol === 'file:') return Promise.resolve(false);
    try {
      audioContext = new Context();
      if (!audioContext.audioWorklet) {
        void audioContext.close();
        audioContext = undefined;
        return Promise.resolve(false);
      }
      mediaSource = audioContext.createMediaElementSource(music);
      mediaSource.connect(audioContext.destination);
      void audioContext.resume().catch(() => {});
      graphPromise = audioContext.audioWorklet.addModule('glitch-worklet.js').then(() => {
        glitchNode = new AudioWorkletNode(audioContext, 'birthday-glitch', { outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit' });
        glitchNode.port.onmessage = ({ data }) => { music.dataset.glitchStatus = data.active ? 'active' : 'off'; };
        glitchNode.onprocessorerror = () => {
          glitchNode.disconnect();
          glitchNode = undefined;
          mediaSource.disconnect();
          mediaSource.connect(audioContext.destination);
          music.dataset.glitchEngine = 'native';
          if (glitchActive) startNativeGlitch();
        };
        mediaSource.disconnect();
        mediaSource.connect(glitchNode);
        glitchNode.connect(audioContext.destination);
        music.dataset.glitchEngine = 'worklet';
        if (glitchActive && !music.paused) {
          stopNativeGlitch();
          glitchNode.port.postMessage({ enabled: true });
        }
        return true;
      }).catch(() => false);
      return graphPromise;
    } catch {
      return Promise.resolve(false);
    }
  }
  function startMusicGlitch() {
    glitchActive = true;
    if (music.paused) return;
    if (audioContext?.state === 'suspended') void audioContext.resume().catch(() => {});
    if (glitchNode) glitchNode.port.postMessage({ enabled: true });
    else {
      startNativeGlitch();
      void prepareGlitchGraph();
    }
  }
  function stopMusicGlitch() {
    glitchActive = false;
    music.dataset.glitchStatus = 'off';
    glitchNode?.port.postMessage({ enabled: false });
    stopNativeGlitch();
  }
  music.addEventListener('pause', () => {
    glitchNode?.port.postMessage({ enabled: false });
    stopNativeGlitch(false);
  });
  music.addEventListener('play', () => { if (glitchActive) startMusicGlitch(); });

  const later = (callback, delay) => {
    const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
    timers.add(timer);
  };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };
  function syncMusic() {
    const playing = !music.paused && !music.ended;
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.textContent = playing ? '♫ 暂停音乐' : '♫ 播放音乐';
  }
  async function playMusic() {
    if (musicPending || !config.music) return;
    musicPending = true;
    try {
      if (audioContext?.state === 'suspended') await audioContext.resume();
      await music.play();
    }
    catch { /* 保持静默，播放状态由按钮显示。 */ }
    finally { musicPending = false; syncMusic(); }
  }
  musicButton.addEventListener('click', () => {
    resumeMusicAfterVideo = false;
    if (music.paused) void playMusic(); else music.pause();
  });
  ['play', 'pause', 'ended'].forEach((event) => music.addEventListener(event, syncMusic));
  music.addEventListener('error', () => {
    musicPending = false;
    syncMusic();
  });
  if (config.music) { music.src = config.music; music.volume = 0.55; }
  else musicButton.hidden = true;

  const recipient = String(config.recipient || '寿星');
  const greeting = String(config.greeting || '生日快乐');
  document.title = `${recipient}，${greeting}`;
  $('#entry-title').textContent = greeting;
  $('#entry-subtitle').textContent = config.subtitle || '';
  $('#cake-title').textContent = `${recipient}，${greeting}`;
  $('#cake-subtitle').textContent = '许过的愿望一路生花';
  if (config.entry?.enabled === false) {
    $('#entry-form').hidden = true;
    $('#open-without-code').hidden = false;
  }

  // 装饰与内容分离，不依赖第三方库或外部服务。
  for (let i = 0; i < 10; i++) {
    const bubble = document.createElement('span');
    bubble.style.cssText = `--x:${i * 11}%;--size:${25 + (i % 4) * 18}px;--duration:${22 + i * 2}s;--delay:-${i * 3}s`;
    $('.background').append(bubble);
  }
  function switchScene(next) {
    clearTimers();
    document.body.classList.toggle('album-open', next === 'album');
    if (next !== 'album') videos.forEach((video) => video.pause());
    activeScene = next;
    scenes.forEach((scene) => { $(`#${scene}-scene`).hidden = scene !== next; });
    window.scrollTo(0, 0);
  }
  function openGift() {
    if (opened) return;
    opened = true;
    // 直接在用户点击中启动音频，翻页时复用同一个播放器。
    void prepareGlitchGraph();
    if (music.paused) void playMusic();
    $('.entry-card').classList.add('leaving');
    later(showCake, reducedMotion.matches ? 0 : 450);
  }
  const entryForm = $('#entry-form');
  function setEntryError(message = '') {
    const error = $('#entry-error');
    error.textContent = message;
    error.hidden = !message;
    entryForm.querySelectorAll('input').forEach((input) => {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
  }
  entryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = new FormData(entryForm);
    const name = String(fields.get('name') || '').trim();
    const password = fields.get('password');
    const entry = config.entry || {};
    if (name !== String(entry.name ?? '123') || password !== String(entry.password ?? '123')) {
      setEntryError(!name || !password ? '请输入用户名和密码。' : '用户名或密码不正确。');
      return;
    }
    setEntryError();
    openGift();
  });
  entryForm.addEventListener('input', () => setEntryError());
  $('#open-without-code').addEventListener('click', openGift);

  function finishCake() {
    clearTimers();
    const svg = $('#cake');
    if (svg && typeof svg.setCurrentTime === 'function') svg.setCurrentTime(10);
    $('#cake-scene').classList.add('cake-ready');
    $('.cake-actions').inert = false;
    $('#candle').disabled = false;
  }
  function showCake() {
    switchScene('cake');
    $('#cake-scene').classList.remove('cake-ready');
    $('.cake-actions').inert = true;
    $('#cake-art').innerHTML = cakeTemplate;
    const svg = $('#cake');
    if (typeof svg.setCurrentTime === 'function') svg.setCurrentTime(0);
    $('#candle').disabled = true;
    $('#candle').setAttribute('aria-pressed', 'false');
    $('#candle').setAttribute('aria-label', '熄灭蜡烛，许个愿');
    $('#cake-title').focus({ preventScroll: true });
    if (reducedMotion.matches) finishCake();
    else later(finishCake, 6800);
  }
  $('#candle').addEventListener('click', () => {
    const out = $('#candle').getAttribute('aria-pressed') !== 'true';
    $('#candle').setAttribute('aria-pressed', String(out));
    $('#candle').setAttribute('aria-label', out ? '重新点亮蜡烛' : '熄灭蜡烛，许个愿');
  });

  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }
  function imageFallback(img, container = img.parentElement) {
    const message = create('span', 'image-missing', imageMissingText);
    message.hidden = true;
    container.append(message);
    const reset = () => {
      img.hidden = false;
      message.hidden = true;
      img.parentElement.classList.remove('image-unavailable');
    };
    img.addEventListener('load', reset);
    img.addEventListener('error', () => {
      img.hidden = true;
      message.hidden = false;
      if (img.parentElement.matches('.photo-button')) img.parentElement.classList.add('image-unavailable');
    });
    return { reset };
  }
  const zoomFallback = imageFallback($('#large-photo'));
  imageFallback($('#bonus-image'));
  function makeSection(title, chapter) {
    const section = create('section', 'memory-section');
    const inner = create('div', 'section-inner');
    const heading = create('h2', '', title);
    heading.tabIndex = -1;
    heading.id = `chapter-${album.length}`;
    section.setAttribute('aria-labelledby', heading.id);
    inner.append(create('p', 'chapter', chapter), heading);
    section.append(inner);
    scrollArea.append(section);
    const index = album.length;
    album.push(section);
    const dot = create('button', 'album-dot');
    dot.type = 'button';
    const label = `第 ${index + 1} 页：${title}`;
    dot.setAttribute('aria-label', label);
    dot.addEventListener('click', () => goTo(index));
    $('.album-dots').append(dot);
    dots.push(dot);
    return inner;
  }
  if (hasIntro) {
    const intro = makeSection(config.introTitle || '先看这里', 'PROLOGUE / 写在前面');
    intro.classList.add('intro-paper');
    const lines = create('div', 'intro-lines');
    config.intro.forEach((line, index) => {
      const paragraph = create('p', '', line);
      paragraph.style.setProperty('--line', index);
      lines.append(paragraph);
    });
    const introContent = create('div', 'content-paper intro-content');
    introContent.append(lines);
    intro.append(introContent);
  }
  const memories = Array.isArray(config.memories) ? config.memories : [];
  memories.forEach((memory, index) => {
    const inner = makeSection(memory.title || `回忆 ${index + 1}`, memory.date || '值得记住的一天');
    if (memory.layout?.startsWith('sweet-')) inner.closest('.memory-section').classList.add('sweet-section');
    const timeline = create('div', 'timeline-line');
    const cards = create('div', 'memory-cards');
    const slides = [];
    const revealStates = [];
    let selectedCard = 0;
    const memoryCards = Array.isArray(memory.cards) ? memory.cards : [];
    memoryCards.forEach((card) => {
      const article = create('article', 'memory-card');
      if (card.layout) article.classList.add(`layout-${card.layout}`);
      const imageSources = Array.isArray(card.images) ? card.images : card.image ? [card.image] : [];
      const imageGroup = imageSources.length > 1 ? create('div', `photo-group ${card.layout === 'sweet-collage' ? 'sweet-collage' : 'triptych'}`) : article;
      const photoButtons = [];
      if (imageGroup !== article) article.append(imageGroup);
      imageSources.forEach((imageSource, imageIndex) => {
        const button = create('button', 'photo-button');
        button.type = 'button';
        button.setAttribute('aria-label', `放大查看：${memory.title || '回忆照片'}${imageSources.length > 1 ? `（${imageIndex + 1}）` : ''}`);
        if (imageSources.length > 1) button.classList.add('group-photo', `group-photo-${imageIndex + 1}`);
        const img = create('img');
        img.src = imageSource;
        img.alt = memory.title || '回忆照片';
        img.loading = card.reveal ? 'eager' : 'lazy';
        img.decoding = 'async';
        button.append(img);
        imageFallback(img, button);
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          if (img.hidden) { showCard((selectedCard + 1) % slides.length); return; }
          zoomFallback.reset();
          $('#large-photo').src = img.src;
          $('#large-photo').alt = img.alt;
          $('#photo-dialog').showModal();
        });
        imageGroup.append(button);
        photoButtons.push(button);
      });
      let revealed = 1;
      const reveal = card.reveal ? {
        reset() {
          revealed = 1;
          photoButtons.forEach((button, i) => { button.hidden = i > 0; });
        },
        next() {
          if (revealed >= photoButtons.length) return false;
          photoButtons[revealed++].hidden = false;
          return true;
        }
      } : null;
      reveal?.reset();
      revealStates.push(reveal);
      if (card.video) {
        const video = create('video', 'memory-video');
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = card.video;
        video.setAttribute('aria-label', memory.title || '回忆视频');
        if (card.poster) video.poster = card.poster;
        video.addEventListener('play', () => {
          const shouldResume = !music.paused || resumeMusicAfterVideo;
          videos.forEach((other) => { if (other !== video) other.pause(); });
          resumeMusicAfterVideo = shouldResume;
          music.pause();
        });
        const restoreMusic = () => {
          if (resumeMusicAfterVideo && videos.every((item) => item.paused || item.ended)) {
            resumeMusicAfterVideo = false;
            void playMusic();
          }
        };
        video.addEventListener('pause', restoreMusic);
        video.addEventListener('ended', restoreMusic);
        videos.push(video);
        article.append(video);
      }
      const text = create('div', 'memory-text');
      const paragraphs = (Array.isArray(card.text) ? card.text : [card.text || '']).filter(Boolean);
      paragraphs.forEach((line) => text.append(create('p', '', line)));
      if (paragraphs.length) article.append(text);
      else article.classList.add('media-only');
      cards.append(article);
      slides.push(article);
    });
    function showCard(index) {
      const next = Math.max(0, Math.min(slides.length - 1, index));
      if (next !== selectedCard) {
        slides[selectedCard]?.querySelector('video')?.pause();
        revealStates[next]?.reset();
      }
      selectedCard = next;
      slides.forEach((slide, i) => { slide.hidden = i !== next; });
    }
    const advance = () => {
      if (revealStates[selectedCard]?.next()) return;
      showCard((selectedCard + 1) % slides.length);
    };
    const paper = create('div', 'content-paper');
    paper.append(cards);
    if (slides.length > 1) {
      paper.tabIndex = 0;
      paper.classList.add('click-to-advance');
      paper.setAttribute('aria-label', memory.title);
      paper.addEventListener('click', (event) => {
        if (event.target.closest('button,video,a,input')) return;
        advance();
      });
      paper.addEventListener('keydown', (event) => {
        if (event.target !== paper || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        advance();
      });
    }
    galleries.push({ section: inner.closest('.memory-section'), count: slides.length, reset: () => { revealStates.forEach((state) => state?.reset()); showCard(0); }, next: advance });
    showCard(0);
    timeline.append(paper);
    inner.append(timeline);
  });
  const bonusDialog = $('#bonus-dialog');
  if (config.bonus?.image) $('#bonus-image').src = config.bonus.image;
  $('#bonus-image').alt = config.bonus?.title || '比心彩蛋';
  for (let i = 0; i < 20; i++) {
    const spark = create('span');
    const angle = i * Math.PI / 10;
    spark.style.cssText = `--spark-x:${Math.cos(angle) * 330}px;--spark-y:${Math.sin(angle) * 290}px;--spark-rotation:${i * 43}deg;--spark-color:${i % 2 ? '#eaa4b5' : '#f5cf8a'}`;
    $('.burst-sparks').append(spark);
  }
  function showBonus() {
    if (!config.bonus?.image || bonusDialog.open) return;
    videos.forEach((video) => video.pause());
    bonusDialog.showModal();
    bonusDialog.classList.remove('is-bursting', 'is-ending');
    bonusDialog.classList.add('is-bursting');
    later(() => bonusDialog.classList.add('is-ending'), 3600);
    later(() => bonusDialog.close(), 4000);
  }
  bonusDialog.addEventListener('click', () => bonusDialog.close());
  bonusDialog.addEventListener('close', () => {
    bonusDialog.classList.remove('is-bursting', 'is-ending');
    // 复用已完成的蛋糕，不重建 SVG，也不从零启动动画。
    switchScene('cake');
    finishCake();
    $('#cake-title').focus({ preventScroll: true });
  });

  function updatePage(index) {
    if (index !== page) videos.forEach((video) => { if (!album[index].contains(video)) video.pause(); });
    page = index;
    album.forEach((section, i) => {
      section.hidden = i !== page;
      section.classList.toggle('is-visible', i === page);
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === page)));
    $('.page-number').textContent = `${page + 1} / ${album.length}`;
    $('#previous-page').disabled = page === 0;
    $('#next-page').disabled = page === album.length - 1 && !config.bonus?.image;
  }
  function goTo(index) {
    if (index >= album.length && config.bonus?.image) { showBonus(); return; }
    updatePage(Math.max(0, Math.min(album.length - 1, index)));
    album[page].querySelector('h2').focus({ preventScroll: true });
  }
  function showAlbum() {
    switchScene('album');
    galleries.forEach((gallery) => gallery.reset());
    updatePage(0);
    album[0].querySelector('h2').focus({ preventScroll: true });
  }
  $('#like-button').addEventListener('click', showAlbum);
  $('#previous-page').addEventListener('click', () => goTo(page - 1));
  $('#next-page').addEventListener('click', () => goTo(page + 1));
  scrollArea.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
  document.addEventListener('keydown', (event) => {
    if (activeScene !== 'album' || document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('input,textarea,select,button,a,[contenteditable=true]')) return;
    if (event.key === ' ') {
      event.preventDefault();
      const gallery = galleries.find((item) => item.section === album[page]);
      if (gallery?.count > 1) gallery.next(); else goTo(page + 1);
      return;
    }
    const moves = { ArrowRight: page + 1, ArrowDown: page + 1, PageDown: page + 1, ArrowLeft: page - 1, ArrowUp: page - 1, PageUp: page - 1, Home: 0, End: album.length - 1 };
    if (event.key in moves) { event.preventDefault(); goTo(moves[event.key]); }
  });
  const unlikeDialog = $('#dislike-dialog');
  unlikeDialog.querySelectorAll('img').forEach((img) => {
    if (img.matches('.unlike-echo')) img.addEventListener('error', () => { img.hidden = true; });
    img.src = config.unlikeImage || '';
  });
  imageFallback(unlikeDialog.querySelector('.unlike-main'), unlikeDialog);
  $('#dislike-button').addEventListener('click', () => {
    if (unlikeDialog.open) return;
    clearTimeout(unlikeTimer);
    rememberUnlikeReturn();
    unlikeDialog.showModal();
    startMusicGlitch();
    const duration = reducedMotion.matches ? 1800 : Number(config.unlikeDuration) || 3800;
    unlikeDialog.style.setProperty('--unlike-duration', `${duration}ms`);
    unlikeDialog.classList.remove('is-haunting');
    unlikeDialog.classList.add('is-haunting');
    unlikeTimer = setTimeout(() => unlikeDialog.close(), duration);
  });
  unlikeDialog.addEventListener('close', () => {
    clearTimeout(unlikeTimer);
    unlikeDialog.classList.remove('is-haunting');
    stopMusicGlitch();
    clearUnlikeReturn();
    $('#dislike-button').focus({ preventScroll: true });
  });
  $('#photo-dialog').addEventListener('click', (event) => {
    if (event.target === $('#photo-dialog')) $('#photo-dialog').close();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches && activeScene === 'cake') finishCake();
  });
  updatePage(0);
  if (shouldRecoverUnlike()) {
    opened = true;
    switchScene('cake');
    finishCake();
    $('#cake-title').focus({ preventScroll: true });
  }
})();
