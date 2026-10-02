/* Артём Григорян — портфолио. Вся интерактивность. */
(function () {
  'use strict';
  const G = window.GALLERY || {};
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- появление блоков ---------- */
  const rvObs = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rvObs.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach((el) => rvObs.observe(el));

  /* ---------- мягкая загрузка картинок ---------- */
  const imgObs = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const img = e.target;
      if (img.complete) img.classList.add('is-visible');
      else img.addEventListener('load', () => img.classList.add('is-visible'), { once: true });
      imgObs.unobserve(img);
    });
  }, { rootMargin: '200px' });

  /* ---------- лупы: играть только в кадре ---------- */
  const loopObs = new IntersectionObserver((es) => {
    es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        if (v.dataset.src && !v.src) v.src = v.dataset.src;
        v.play().catch(() => {});
      } else { v.pause(); }
    });
  }, { rootMargin: '120px' });
  $$('video[data-loop]').forEach((v) => loopObs.observe(v));

  function makeLoop(src) {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.autoplay = true;
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    v.preload = 'metadata'; v.dataset.loop = '';
    v.src = src;
    loopObs.observe(v);
    return v;
  }

  function makeFigure(item, key, index) {
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = item.src; img.loading = 'lazy'; img.decoding = 'async';
    img.width = item.w; img.height = item.h; img.alt = '';
    fig.appendChild(img);
    fig.dataset.key = key; fig.dataset.index = index;
    imgObs.observe(img);
    return fig;
  }

  /* ---------- колесо листает горизонтальные ленты ---------- */
  function wheelToStrip(strip) {
    strip.addEventListener('wheel', (e) => {
      if (strip.scrollWidth <= strip.clientWidth) return;
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const atStart = strip.scrollLeft <= 1;
      const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1;
      if ((d > 0 && !atEnd) || (d < 0 && !atStart)) {
        e.preventDefault();
        strip.scrollLeft += d;
      }
    }, { passive: false });
  }

  /* ---------- 04: серии AI ---------- */
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  const seriesRoot = $('#ai-series');
  ['ai1', 'ai2', 'ai3', 'ai4', 'ai5'].forEach((key, n) => {
    const items = G[key] || [];
    if (!items.length) return;
    const sec = document.createElement('div');
    sec.className = 'series';
    const head = document.createElement('div');
    head.className = 'series__head rv';
    head.innerHTML = '<span class="series__num">' + ROMAN[n] + '</span><span class="mono dim">' + items.length + ' кадров</span>';
    const strip = document.createElement('div');
    strip.className = 'strip';
    items.forEach((it, i) => strip.appendChild(makeFigure(it, key, i)));
    wheelToStrip(strip);
    sec.appendChild(head); sec.appendChild(strip);
    seriesRoot.appendChild(sec);
    rvObs.observe(head);
  });

  /* ---------- 04: motion-коллаж ---------- */
  const motionGrid = $('#motion-grid');
  // порядок подобран под раскладку: широкие лупы (ai-08, ai-05, ai-09) — на «широкие» позиции 4, 6, 9
  const MOTION_ORDER = ['ai-01', 'ai-02', 'ai-06', 'ai-08', 'ai-03', 'ai-05', 'ai-04', 'ai-07', 'ai-09', 'ai-10'];
  MOTION_ORDER.forEach((name) => {
    const fig = document.createElement('figure');
    fig.appendChild(makeLoop('assets/video/loops/' + name + '.mp4'));
    motionGrid.appendChild(fig);
  });

  /* ---------- 04: фрагменты ---------- */
  const fragEl = $('#ai-frag');
  const fragItems = G.aix || [];
  let fragShown = 0;
  function addFrags(count) {
    const end = Math.min(fragShown + count, fragItems.length);
    for (let i = fragShown; i < end; i++) {
      const fig = makeFigure(fragItems[i], 'aix', i);
      if (i % 3 === 1) fig.classList.add('stretch'); // каждый третий — вытянутый
      fragEl.appendChild(fig);
    }
    fragShown = end;
    if (fragShown >= fragItems.length) $('#frag-more').hidden = true;
  }
  addFrags(12);
  $('#frag-more').addEventListener('click', () => addFrags(fragItems.length));

  /* ---------- 04: art direction — кампания ---------- */
  const campGrid = $('#camp-grid');
  if (campGrid) {
    // редакционный ритм для горизонтальных кадров; вертикальные — отдельным разворотом
    const RHYTHM = ['camp--full', 'camp--left', 'camp--right', 'camp--half', 'camp--half', 'camp--wide'];
    // кадры, которые показываем намеренно вытянутыми (остальные — в родных пропорциях)
    const STRETCH = ['artdir-005.jpg'];
    let landscapeN = 0;
    let openHalf = null; // незакрытая половина пары
    (G.artdir || []).forEach((it, i) => {
      const fig = makeFigure(it, 'artdir', i);
      if (it.h > it.w) {
        // вертикальный кадр идёт отдельным разворотом и не должен разрывать пару
        if (openHalf) {
          openHalf.classList.replace('camp--half', 'camp--wide');
          openHalf = null;
          landscapeN++; // пропускаем вторую половину в ритме
        }
        fig.classList.add('camp--tall');
        if (STRETCH.some((n) => it.src.endsWith(n))) fig.classList.add('camp--stretch');
      } else {
        const cls = RHYTHM[landscapeN % RHYTHM.length];
        fig.classList.add(cls);
        openHalf = cls === 'camp--half' ? (openHalf ? null : fig) : null;
        landscapeN++;
      }
      campGrid.appendChild(fig);
    });
  }

  /* ---------- 05: set design — сцена с автосменой (если раздел включён) ---------- */
  const setItems = G.set || [];
  const stageImgs = $('#stage-imgs');
  if (stageImgs && setItems.length) {
    const N_STAGE = Math.min(12, setItems.length);
    const stageCounter = $('#stage-counter');
    const stageEls = [];
    for (let i = 0; i < N_STAGE; i++) {
      const idx = Math.floor(i * setItems.length / N_STAGE);
      const img = document.createElement('img');
      img.src = setItems[idx].src; img.alt = ''; img.decoding = 'async';
      if (i > 1) img.loading = 'lazy';
      stageImgs.appendChild(img);
      stageEls.push(img);
    }
    let stageIdx = 0, stageTimer = null;
    const showStage = (i) => {
      stageEls[stageIdx] && stageEls[stageIdx].classList.remove('cur');
      stageIdx = (i + N_STAGE) % N_STAGE;
      stageEls[stageIdx].classList.add('cur');
      stageCounter.textContent = String(stageIdx + 1).padStart(2, '0') + ' / ' + String(N_STAGE).padStart(2, '0');
    };
    const stageAuto = () => {
      clearInterval(stageTimer);
      stageTimer = setInterval(() => showStage(stageIdx + 1), 4500);
    };
    showStage(0);
    // автосмена — только пока секция видна
    new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) stageAuto(); else clearInterval(stageTimer); });
    }).observe($('#stage-view'));
    $('.stage__zone--next').addEventListener('click', () => { showStage(stageIdx + 1); stageAuto(); });
    $('.stage__zone--prev').addEventListener('click', () => { showStage(stageIdx - 1); stageAuto(); });
  }

  /* ---------- 05: архив сценографии ---------- */
  const arch = $('#archive');
  let archBuilt = false;
  const archOpenBtn = $('[data-open-archive]');
  if (archOpenBtn) {
    archOpenBtn.addEventListener('click', () => {
      if (!archBuilt) {
        const body = $('#arch-body');
        setItems.forEach((it, i) => body.appendChild(makeFigure(it, 'set', i)));
        archBuilt = true;
      }
      openOverlay(arch);
    });
  }
  $('[data-close-archive]').addEventListener('click', () => closeOverlay(arch));

  /* ---------- 06: студия ---------- */
  const studioStrip = $('#studio-strip');
  (G.studio || []).forEach((it, i) => studioStrip.appendChild(makeFigure(it, 'studio', i)));
  wheelToStrip(studioStrip);
  $$('.studio__btns [data-panel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.panel;
      const on = btn.classList.contains('on');
      $$('.studio__btns [data-panel]').forEach((b) => b.classList.remove('on'));
      $$('[data-panel-content]').forEach((p) => { p.hidden = true; });
      if (!on) {
        btn.classList.add('on');
        $('[data-panel-content="' + name + '"]').hidden = false;
      }
    });
  });

  /* ---------- 07: кадры Маду и Элджея ---------- */
  const maduStrip = $('#madu-strip');
  (G.madu || []).forEach((it, i) => maduStrip.appendChild(makeFigure(it, 'madu', i)));
  wheelToStrip(maduStrip);
  const artistsStrip = $('#artists-strip');
  (G.artists || []).forEach((it, i) => artistsStrip.appendChild(makeFigure(it, 'artists', i)));
  wheelToStrip(artistsStrip);

  /* ---------- belgee-сетка ---------- */
  const bg = $('#belgee-grid');
  for (let i = 1; i <= 11; i++) {
    const v = document.createElement('video');
    v.muted = true; v.loop = true;
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    v.preload = 'none'; v.dataset.loop = '';
    v.dataset.src = 'assets/video/loops/belgee-' + String(i).padStart(2, '0') + '.mp4';
    bg.appendChild(v);
    loopObs.observe(v);
  }

  /* ---------- оверлеи ---------- */
  function openOverlay(el) {
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('open'));
    document.body.classList.add('locked');
  }
  function closeOverlay(el) {
    el.classList.remove('open');
    document.body.classList.remove('locked');
    setTimeout(() => { el.hidden = true; }, 450);
    $$('video', el).forEach((v) => v.pause());
  }

  const comm = $('#commercial');
  $$('[data-open-commercial]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openOverlay(comm); }));
  $('[data-close-commercial]').addEventListener('click', () => closeOverlay(comm));

  /* ---------- полное видео ---------- */
  const fullv = $('#fullv'), fullVideo = $('#fullv-video');
  $$('[data-full]').forEach((b) => {
    b.addEventListener('click', () => {
      fullVideo.src = b.dataset.full;
      openOverlay(fullv);
      fullVideo.play().catch(() => {});
    });
  });
  $('[data-close-full]').addEventListener('click', () => {
    fullVideo.pause(); fullVideo.removeAttribute('src'); fullVideo.load();
    closeOverlay(fullv);
  });

  /* ---------- practice: превью у курсора ---------- */
  const peek = $('.peek');
  let peekX = 0, peekY = 0, curX = 0, curY = 0, peekRaf = null;
  function peekLoop() {
    curX += (peekX - curX) * 0.12; curY += (peekY - curY) * 0.12;
    peek.style.transform = 'translate(' + (curX + 24) + 'px,' + (curY - 60) + 'px)';
    peekRaf = requestAnimationFrame(peekLoop);
  }
  $$('.dirs__row').forEach((row) => {
    row.addEventListener('mouseenter', () => {
      const def = row.dataset.peek || '';
      peek.innerHTML = '';
      if (def.startsWith('img:')) {
        const img = document.createElement('img');
        img.src = def.slice(4); peek.appendChild(img);
      } else if (def.startsWith('vid:')) {
        peek.appendChild(makeLoop(def.slice(4)));
      }
      peek.classList.add('on');
      if (!peekRaf) peekLoop();
    });
    row.addEventListener('mouseleave', () => peek.classList.remove('on'));
    row.addEventListener('click', () => {
      if (row.hasAttribute('data-open-commercial')) return; // уже обработано выше
      if (row.dataset.href) $(row.dataset.href).scrollIntoView({ behavior: 'smooth' });
    });
  });
  document.addEventListener('mousemove', (e) => { peekX = e.clientX; peekY = e.clientY; });

  /* ---------- курсор ---------- */
  const cursor = $('.cursor');
  const dot = $('.cursor__dot'), ring = $('.cursor__ring');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = 'translate(' + (mx - 2) + 'px,' + (my - 2) + 'px)';
  });
  (function ringLoop() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.transform = 'translate(' + (rx - 14) + 'px,' + (ry - 14) + 'px)';
    requestAnimationFrame(ringLoop);
  })();
  document.addEventListener('mouseover', (e) => {
    cursor.classList.toggle('cursor--active', !!e.target.closest('a, button, figure, .dirs__row'));
  });

  /* ---------- лайтбокс: колесо, свайп, стрелки ---------- */
  const lb = $('#lightbox'), lbImg = $('.lightbox__img'), lbCounter = $('.lightbox__counter');
  let cur = { key: null, index: 0 };
  document.addEventListener('click', (e) => {
    const fig = e.target.closest('figure[data-key]');
    if (fig) openLb(fig.dataset.key, parseInt(fig.dataset.index, 10));
  });
  function openLb(key, index) {
    cur = { key, index };
    showLb(); lb.hidden = false;
    document.body.classList.add('locked');
  }
  function closeLb() { lb.hidden = true; document.body.classList.remove('locked'); }
  function showLb() {
    const items = G[cur.key];
    lbImg.src = items[cur.index].src;
    lbCounter.textContent = (cur.index + 1) + ' / ' + items.length;
  }
  function stepLb(d) {
    const items = G[cur.key];
    cur.index = (cur.index + d + items.length) % items.length;
    lbImg.classList.add('flip');
    setTimeout(() => { showLb(); lbImg.classList.remove('flip'); }, 180);
  }
  $('.lightbox__close').addEventListener('click', closeLb);
  $('.lightbox__arrow--prev').addEventListener('click', () => stepLb(-1));
  $('.lightbox__arrow--next').addEventListener('click', () => stepLb(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  // колесо — следующий/предыдущий кадр (с защитой от инерции трекпада)
  let lbWheelLock = 0;
  lb.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lbWheelLock < 350 || Math.abs(e.deltaY) < 8) return;
    lbWheelLock = now;
    stepLb(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // свайп на тач-устройствах
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) stepLb(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!lb.hidden) closeLb();
      else if (!fullv.hidden) { fullVideo.pause(); closeOverlay(fullv); }
      else if (!comm.hidden) closeOverlay(comm);
      else if (!arch.hidden) closeOverlay(arch);
    }
    if (!lb.hidden) {
      if (e.key === 'ArrowLeft') stepLb(-1);
      if (e.key === 'ArrowRight') stepLb(1);
    }
  });
})();
