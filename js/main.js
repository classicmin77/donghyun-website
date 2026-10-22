(function () {
  const M = window.Motion;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gnb = document.querySelector('.gnb');
  const burger = document.querySelector('.burger');
  const mobile = document.querySelector('.mobile-menu');
  const toTop = document.querySelector('.to-top');

  // Header: hide on scroll down, show on scroll up; shadow after hero start
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    gnb.classList.toggle('shadow', y > 10);
    if (!mobile.classList.contains('open')) gnb.classList.toggle('hide', y > lastY && y > 200);
    toTop.classList.toggle('show', y > 600);
    lastY = y;
  };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const setMenu = open => { mobile.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기'); };
  burger.addEventListener('click', () => setMenu(!mobile.classList.contains('open')));
  mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  // Inquiry form -> opens the visitor's mail app (no data sent to any server)
  const form = document.querySelector('.inquiry');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const req = [...form.querySelectorAll('[required]')];
    let ok = true;
    req.forEach(f => { const bad = !f.value.trim(); f.classList.toggle('invalid', bad); f.setAttribute('aria-invalid', String(bad)); if (bad) ok = false; });
    form.querySelector('.form-error').hidden = ok;
    if (!ok) { req.find(f => !f.value.trim()).focus(); return; }
    const v = n => form.elements[n].value.trim();
    const subject = `[동현 사업문의] ${v('type')} / ${v('company') || v('name')}`;
    const body = ['문의 분야: ' + v('type'), '회사명: ' + v('company'), '담당자명: ' + v('name'), '연락처: ' + v('tel'), '', '문의 내용', v('msg')].join('\r\n');
    const status = form.querySelector('.form-status');
    if (status) { status.hidden = false; status.textContent = '메일 앱이 열리지 않으면 skinmall@naver.com으로 직접 보내주세요. 이 페이지에서 문의가 자동 접수되지는 않습니다.'; }
    location.href = `mailto:skinmall@naver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  // "상품 · 납품 문의" link pre-selects the inquiry type
  document.querySelectorAll('.inquiry-link').forEach(a => a.addEventListener('click', () => {
    const sel = document.querySelector('.inquiry select[name="type"]'); if (sel) sel.value = a.dataset.type;
  }));

  // Copy email
  const copyBtn = document.querySelector('.copy-email');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const st = document.getElementById('copy-status');
    try { await navigator.clipboard.writeText('skinmall@naver.com'); copyBtn.textContent = '복사됨'; st.textContent = '이메일 주소가 복사되었습니다.'; setTimeout(() => copyBtn.textContent = '복사', 2200); }
    catch { copyBtn.textContent = '직접 복사'; st.textContent = '복사 기능을 사용할 수 없습니다. 이메일 주소를 선택해 복사해 주세요.'; }
  });

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  // Active menu item by section
  const links = [...document.querySelectorAll('.menu a')];
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'business', 'track-record', 'news', 'contact'].forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });

  // Partners marquee: duplicate items for seamless loop (CSS-driven)
  const track = document.querySelector('.marquee-track');
  if (track && !reduce) track.querySelectorAll('li').forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });

  // Spotlight cards: copper glow follows the pointer
  // (pointer devices only: touch taps would leave the glow stuck)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) document.querySelectorAll('.dcard, .panel, .gift, .why-item, .value').forEach(card => {
    card.classList.add('spot');
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  if (!M || reduce) return;
  document.documentElement.classList.add('js');
  const { animate, inView, scroll, stagger } = M;
  const ease = [0.23, 1, 0.32, 1]; // strong ease-out: fast start, soft landing
  const desktop = window.matchMedia('(min-width: 901px)').matches;

  // ---------- Motion pack v3 ----------
  // 1. Split section headings into words that rise in (replaces the plain fade on h2)
  document.querySelectorAll('main .h2').forEach(h => {
    h.removeAttribute('data-up');
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3 && n.textContent.trim()) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'split-w';
          const i = document.createElement('span'); i.textContent = part; w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(h); h.classList.add('split-ready');
    inView(h, () => { animate(h.querySelectorAll('.split-w > span'), { y: ['105%', '0%'] }, { duration: 0.8, delay: stagger(0.06), ease }); }, { amount: 0.6 });
  });

  // 2. Kinetic band: rows move opposite ways, driven by page scroll
  const band = document.querySelector('.kinetic');
  if (band) {
    scroll(animate('.k1', { x: ['0%', '-30%'] }, { ease: 'linear' }), { target: band, offset: ['start end', 'end start'] });
    if (band.querySelector('.k2')) scroll(animate('.k2', { x: ['-30%', '0%'] }, { ease: 'linear' }), { target: band, offset: ['start end', 'end start'] });
  }

  // 3. Curtain reveal on key images
  document.querySelectorAll('.panel-img, .proj-feature').forEach(el => {
    el.classList.add('reveal-img');
    // observe the parent: a fully clipped element can report as not intersecting
    inView(el.parentElement, () => {
      el.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }], { duration: 1100, easing: 'cubic-bezier(.77,0,.18,1)', fill: 'forwards' })
        .finished.then(() => { el.classList.remove('reveal-img'); el.style.clipPath = 'none'; });
      const img = el.querySelector('img'); if (img) animate(img, { scale: [1.25, 1] }, { duration: 1.4, ease });
    }, { amount: 0.25 });
  });

  // 4. (removed) pinned horizontal process — section stays static

  // 5. Stacking cards: earlier cards shrink slightly as the next one covers them
  if (desktop) {
    const items = [...document.querySelectorAll('.why .why-item')];
    items.forEach((it, i) => {
      const next = items[i + 1]; if (!next) return;
      scroll(animate(it, { scale: [1, 0.94], opacity: [1, 0.55] }, { ease: 'linear' }), { target: next, offset: ['start end', 'start 200px'] });
    });
  }

  // 6. Hero bar numbers count up
  document.querySelectorAll('.hb-v').forEach((el, i) => {
    const t = el.textContent.trim(); if (!/^\d+$/.test(t)) return;
    const to = +t, pad = t.length, from = to > 100 ? to - 25 : 0;
    animate(from, to, { duration: 1.4, delay: 1.1 + i * 0.1, ease, onUpdate: v => { el.textContent = String(Math.round(v)).padStart(pad, '0'); } });
  });

  // Hero entrance: restrained, corporate timing
  // Hero visual: gateway mark draws, routes flow toward it continuously
  document.querySelectorAll('.gate-line').forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
  animate('.gate-line', { strokeDashoffset: 0 }, { duration: 1.4, delay: stagger(0.2, { startDelay: 0.4 }), ease });
  animate('.gate-tile, .gate-inner, .gate-frame, .gate-tick', { opacity: [0, 1] }, { duration: 1.2, delay: 0.3, ease });
  animate('.gate-cu', { opacity: [0, 1], scaleX: [0, 1] }, { duration: 0.6, delay: 1.3, ease });
  animate('.node', { opacity: [0, 1] }, { duration: 0.6, delay: 1.0, ease });
  animate('.rt-base', { opacity: [0, 1] }, { duration: 1.2, delay: stagger(0.08), ease });
  // Travellers: every light leaves at the same moment, rides its route, then the D stroke,
  // and all arrive together on the H crossbar — where the copper bar flashes ("meet").
  const CYCLE = 4.8, ARRIVE = 0.72, START = 1.8, DASH = 150;
  document.querySelectorAll('.rt-flow').forEach(p => {
    const l = p.getTotalLength();
    p.style.strokeDasharray = `${DASH} ${l + DASH}`;
    const end = -(l - DASH);
    const loop = { duration: CYCLE, delay: START, repeat: Infinity, ease: 'linear' };
    animate(p, { strokeDashoffset: [DASH, end, end] }, { ...loop, times: [0, ARRIVE, 1] });
    animate(p, { opacity: [0, 1, 1, 0, 0] }, { ...loop, times: [0, 0.05, ARRIVE, ARRIVE + 0.05, 1] });
  });
  animate('.meet', { opacity: [0, 0, 0.95, 0], r: [8, 8, 30, 46] },
    { duration: CYCLE, times: [0, ARRIVE - 0.01, ARRIVE + 0.03, ARRIVE + 0.2], delay: START, repeat: Infinity, ease: 'easeOut' });
  animate('.gate-cu', { filter: ['brightness(1)', 'brightness(1)', 'brightness(1.6)', 'brightness(1)'] },
    { duration: CYCLE, times: [0, ARRIVE - 0.01, ARRIVE + 0.03, ARRIVE + 0.25], delay: START, repeat: Infinity });
  animate('.pulse', { r: [5, 18], opacity: [0.8, 0] }, { duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: stagger(1.2) });
  animate('.hv-glow', { opacity: [0.6, 1, 0.6] }, { duration: 6, repeat: Infinity, ease: 'easeInOut' });
  animate('.kicker', { opacity: [0, 1], y: [12, 0] }, { duration: 0.6, delay: 0.2, ease });
  animate('.hero-title .ln > span', { y: ['110%', '0%'] }, { duration: 0.9, delay: stagger(0.1, { startDelay: 0.3 }), ease });
  animate('.hero-lead, .hero-cta', { opacity: [0, 1], y: [16, 0] }, { duration: 0.7, delay: stagger(0.1, { startDelay: 0.7 }), ease });
  animate('.hero-bar', { opacity: [0, 1], y: [20, 0] }, { duration: 0.7, delay: 1.0, ease });
  scroll(animate('.hv', { y: ['0%', '10%'], scale: [1, 1.05] }, { ease: 'linear' }), { target: document.querySelector('.hero'), offset: ['start start', 'end start'] });

  // Section titles / paragraphs
  inView('[data-up]', el => { animate(el, { opacity: [0, 1], y: [20, 0] }, { duration: 0.7, ease }); }, { amount: 0.5 });

  // Card groups: stagger children of the same parent
  const groups = new Set([...document.querySelectorAll('[data-card]')].map(el => el.parentElement));
  groups.forEach(g => inView(g, () => {
    animate(g.querySelectorAll(':scope > [data-card]'), { opacity: [0, 1], y: [24, 0] }, { duration: 0.6, delay: stagger(0.08), ease });
  }, { amount: 0.15 }));

  // Rows (board, history)
  const rowGroups = new Set([...document.querySelectorAll('[data-row]')].map(el => el.parentElement));
  rowGroups.forEach(g => inView(g, () => {
    animate(g.querySelectorAll(':scope > [data-row]'), { opacity: [0, 1], x: [-12, 0] }, { duration: 0.5, delay: stagger(0.07), ease });
  }, { amount: 0.2 }));

  // 1. Statement: words fill in as the sentence scrolls through the viewport
  const fill = document.querySelector('[data-fill]');
  if (fill) {
    const copperWords = ['구리개.', '길목이', '동현은'];
    fill.innerHTML = fill.textContent.split(' ').map(w => `<span class="w${copperWords.includes(w) ? ' cu' : ''}">${w}</span>`).join(' ');
    const words = [...fill.querySelectorAll('.w')];
    scroll(p => {
      const n = p * words.length * 1.15;
      words.forEach((w, i) => { w.style.opacity = Math.max(0.16, Math.min(1, n - i)); });
    }, { target: fill, offset: ['start 85%', 'end 45%'] });
  }

  // 2. Seoul -> Berlin route draws with scroll
  const routeLine = document.querySelector('.route-line');
  if (routeLine) {
    const len = routeLine.getTotalLength();
    routeLine.style.strokeDasharray = len; routeLine.style.strokeDashoffset = len;
    scroll(animate(routeLine, { strokeDashoffset: [len, 0] }, { ease: 'linear' }), { target: document.querySelector('.route'), offset: ['start 90%', 'end 55%'] });
    scroll(animate('.route-dot.end', { scale: [0.4, 1], opacity: [0.3, 1] }, { ease: 'linear' }), { target: document.querySelector('.route'), offset: ['start 70%', 'end 55%'] });
  }

  // 5. Poster tilt toward the pointer (subtle)
  const tilt = document.querySelector('.tilt');
  if (tilt && window.matchMedia('(hover: hover)').matches) {
    tilt.addEventListener('pointermove', e => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      animate(tilt, { rotateY: x * 6, rotateX: -y * 6 }, { duration: 0.4, ease });
    });
    tilt.addEventListener('pointerleave', () => animate(tilt, { rotateY: 0, rotateX: 0 }, { type: 'spring', stiffness: 200, damping: 20 }));
  }

  // Count up
  inView('.stats-grid', grid => {
    grid.querySelectorAll('.count').forEach((c, i) => {
      const to = Number(c.dataset.to); const from = to > 100 ? to - 20 : 0;
      animate(from, to, { duration: 1.2, delay: i * 0.08, ease, onUpdate: v => { c.textContent = Math.round(v); } });
    });
  }, { amount: 0.5 });
})();
