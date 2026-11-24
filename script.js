/* =========================================================
   Growth and Development: interactions & animation
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  if (!hasGSAP) { root.classList.remove('js'); root.classList.add('no-js'); }
  if (reduced) root.classList.add('reduced');
  $$('.year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (hasGSAP && !reduced && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToTarget(target, offset) {
    if (lenis) lenis.scrollTo(target, { duration: 1.3, offset: offset || 0 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + (offset || 0), behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- Header, progress, mobile bar ---------- */
  var nav = $('.nav'), progress = $('.progress span'), mbar = $('.mbar'), hero = $('.hero');
  var lastY = window.scrollY, menuOpen = false, quoteVisible = false;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    if (!menuOpen) {
      if (y > 500 && y > lastY + 2) nav.classList.add('is-hidden');
      else if (y < lastY - 2 || y <= 500) nav.classList.remove('is-hidden');
    }
    lastY = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (mbar) mbar.classList.toggle('is-on', y > hero.offsetHeight * 0.6 && !quoteVisible && !menuOpen);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  if ('IntersectionObserver' in window) {
    var navLinks = $$('.nav__links a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) io.observe(s); });
    new IntersectionObserver(function (en) { quoteVisible = en[0].isIntersecting; onScroll(); }, { rootMargin: '0px 0px -12% 0px' }).observe($('#quote'));
  }

  /* ---------- Mobile menu ---------- */
  var burger = $('.burger'), menu = $('#mobile-menu');
  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.remove('is-hidden');
    onScroll();
    if (open) {
      menu.hidden = false;
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      if (hasGSAP && !reduced) {
        gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' });
        gsap.fromTo($$('nav a, .mmenu__foot > *', menu), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.6, delay: 0.1, ease: 'power3.out' });
      }
      var first = $('nav a', menu); if (first) first.focus({ preventScroll: true });
    } else {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      var done = function () { menu.hidden = true; };
      if (hasGSAP && !reduced) gsap.to(menu, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
      else done();
    }
  }
  burger.addEventListener('click', function () { setMenu(!menuOpen); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1023 && menuOpen) setMenu(false); });

  /* ---------- Anchor links ---------- */
  function goTo(id) {
    var target = $(id);
    if (!target) return;
    var wasOpen = menuOpen;
    setMenu(false);
    setTimeout(function () {
      scrollToTarget(id === '#home' ? 0 : target, id === '#quote' ? -10 : 0);
      if (id !== '#home') {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }, wasOpen ? 320 : 0);
    if (history.replaceState) history.replaceState(null, '', id);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2 || !$(id)) return;
      e.preventDefault();
      var svc = a.getAttribute('data-service');
      if (svc) { var sel = $('#f-service'); sel.value = svc; }
      goTo(id);
    });
  });

  /* ---------- Accordion ---------- */
  var accItems = $$('.acc__item');
  function setAcc(item, open) {
    var btn = $('.acc__btn', item), panel = $('.acc__panel', item);
    btn.setAttribute('aria-expanded', String(open));
    item.classList.toggle('is-open', open);
    if (hasGSAP && !reduced) gsap.to(panel, { height: open ? 'auto' : 0, duration: 0.6, ease: 'power3.inOut' });
    else panel.style.height = open ? 'auto' : '0px';
  }
  accItems.forEach(function (item, i) {
    $('.acc__btn', item).addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      accItems.forEach(function (o) { if (o !== item && o.classList.contains('is-open')) setAcc(o, false); });
      setAcc(item, open);
    });
    if (i === 0) { item.classList.add('is-open'); $('.acc__btn', item).setAttribute('aria-expanded', 'true'); $('.acc__panel', item).style.height = 'auto'; }
  });

  /* =========================================================
     Growth lines (decorative canvas, no data)
     ========================================================= */
  function GrowthLines(canvas, opts) {
    var o = Object.assign({ count: 6, alpha: 0.55, pulses: true, intro: true }, opts || {});
    var ctx = canvas.getContext('2d'), W = 0, H = 0, lines = [], running = false, visible = true;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var start = performance.now();
    function seed(i, n) {
      var r = function (a, b) { return a + Math.random() * (b - a); };
      return {
        y0: r(0.82, 0.98), y1: r(0.08, 0.42), a1: r(0.015, 0.05), f1: r(1.2, 2.6), p1: r(0, 6.28),
        a2: r(0.008, 0.02), f2: r(4, 7), p2: r(0, 6.28), depth: (i + 1) / n,
        hue: i % 3, delay: i * 0.18, speed: r(0.05, 0.11), off: Math.random()
      };
    }
    function size() {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.round(W * DPR)); canvas.height = Math.max(1, Math.round(H * DPR));
      if (!running) draw(performance.now());
    }
    var n = window.innerWidth < 760 ? Math.max(3, Math.round(o.count * 0.6)) : o.count;
    for (var i = 0; i < n; i++) lines.push(seed(i, n));
    function yAt(L, t, time) {
      var ease = t * t * (3 - 2 * t);
      var drift = Math.sin(time * 0.25 + L.p1) * 0.012;
      return (L.y0 + (L.y1 - L.y0) * ease + L.a1 * Math.sin(t * L.f1 * 6.283 + L.p1 + time * 0.15) + L.a2 * Math.sin(t * L.f2 * 6.283 + L.p2) + drift) * H + mouse.y * 18 * L.depth;
    }
    function draw(now) {
      var time = (now - start) / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      lines.forEach(function (L) {
        var prog = o.intro && !reduced ? Math.max(0, Math.min(1, (time - 0.3 - L.delay) / 2.2)) : 1;
        prog = 1 - Math.pow(1 - prog, 3);
        if (prog <= 0) return;
        var steps = 90, endX = prog * 1.08;
        var g = ctx.createLinearGradient(0, 0, W, 0);
        var a = o.alpha * (0.45 + L.depth * 0.55);
        g.addColorStop(0, 'rgba(59,130,246,0)');
        g.addColorStop(0.35, 'rgba(96,165,250,' + a * 0.8 + ')');
        g.addColorStop(1, L.hue === 0 ? 'rgba(230,200,138,' + a + ')' : 'rgba(127,176,255,' + a + ')');
        ctx.strokeStyle = g; ctx.lineWidth = 0.8 + L.depth * 1.1;
        ctx.beginPath();
        for (var s = 0; s <= steps; s++) {
          var t = (s / steps) * endX - 0.04, x = t * W + mouse.x * 14 * L.depth, y = yAt(L, t, time);
          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        // leading node during intro / traveling pulse after
        var pt;
        if (prog < 1) pt = endX - 0.04;
        else if (o.pulses && !reduced) pt = ((time * L.speed + L.off) % 1) * 1.08 - 0.04;
        if (pt !== undefined) {
          var px = pt * W + mouse.x * 14 * L.depth, py = yAt(L, pt, time);
          var rg = ctx.createRadialGradient(px, py, 0, px, py, 14);
          rg.addColorStop(0, 'rgba(230,200,138,' + (0.9 * o.alpha + 0.2) + ')'); rg.addColorStop(1, 'rgba(230,200,138,0)');
          ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(px, py, 14, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#f3dfb4'; ctx.beginPath(); ctx.arc(px, py, 1.8 + L.depth, 0, 6.283); ctx.fill();
        }
      });
    }
    function loop(now) { if (!running) return; draw(now); requestAnimationFrame(loop); }
    function play() { if (reduced || running || !visible) return; running = true; requestAnimationFrame(loop); }
    size();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 150); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) play(); else running = false; }).observe(canvas);
    if (finePointer && !reduced) window.addEventListener('pointermove', function (e) { mouse.tx = e.clientX / window.innerWidth - 0.5; mouse.ty = e.clientY / window.innerHeight - 0.5; });
    if (reduced) draw(performance.now() + 99999); else play();
    return { restart: function () { start = performance.now(); } };
  }
  var heroLines = $('.hero__lines') ? GrowthLines($('.hero__lines'), { count: 7, alpha: 0.6 }) : null;
  var finalLines = $('.final__lines') ? GrowthLines($('.final__lines'), { count: 5, alpha: 0.45, intro: false }) : null;

  /* =========================================================
     Quote form (Netlify Forms, AJAX)
     ========================================================= */
  (function form() {
    var f = $('.qform');
    if (!f) return;
    var success = $('.qsuccess'), errBox = $('.qform__error'), consent = $('#f-consent'), consentWrap = $('.consent');
    var rules = {
      'f-name': function (v) { return v.trim().length > 1 || 'Please enter your full name.'; },
      'f-phone': function (v) { return v.replace(/\D/g, '').length >= 10 || 'Please enter a phone number with at least 10 digits.'; },
      'f-email': function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.'; },
      'f-needs': function (v) { return v.trim().length >= 10 || 'Please add a short description (at least 10 characters).'; }
    };
    function check(id) {
      var el = document.getElementById(id), res = rules[id](el.value), err = document.getElementById(id + '-err'), ok = res === true;
      el.closest('.field').classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      if (err) { err.textContent = ok ? '' : res; if (ok) el.removeAttribute('aria-describedby'); else el.setAttribute('aria-describedby', id + '-err'); }
      return ok;
    }
    function checkConsent() {
      var ok = consent.checked, err = $('#f-consent-err');
      consentWrap.classList.toggle('is-invalid', !ok);
      consent.setAttribute('aria-invalid', String(!ok));
      err.textContent = ok ? '' : 'Please confirm you agree to be contacted about your inquiry.';
      if (ok) consent.removeAttribute('aria-describedby'); else consent.setAttribute('aria-describedby', 'f-consent-err');
      return ok;
    }
    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id), fld = el.closest('.field');
      el.addEventListener('blur', function () { if (el.value) check(id); });
      el.addEventListener('input', function () { if (fld.classList.contains('is-invalid')) check(id); });
    });
    consent.addEventListener('change', function () { if (consentWrap.classList.contains('is-invalid')) checkConsent(); });
    function showError(msg) {
      errBox.innerHTML = msg + ' You can also call <a href="tel:+17169756707">(716) 975-6707</a>.';
      errBox.hidden = false;
      if (hasGSAP && !reduced) gsap.fromTo(errBox, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 });
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox.hidden = true;
      var bad = null;
      Object.keys(rules).forEach(function (id) { if (!check(id) && !bad) bad = document.getElementById(id); });
      if (!checkConsent() && !bad) bad = consent;
      if (bad) { bad.focus(); showError('Please review the highlighted fields.'); return; }
      f.classList.add('is-sending');
      var label = $('.qform__label', f), orig = label.textContent;
      label.textContent = 'Sending your request';
      f.setAttribute('aria-busy', 'true');
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(f)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error('Status ' + r.status);
        f.hidden = true; success.hidden = false; success.focus();
        if (hasGSAP && !reduced) {
          gsap.fromTo('.qsuccess__ring', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' });
          gsap.fromTo('.qsuccess__tick', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, delay: 0.8, ease: 'power2.out' });
          gsap.from($$('h3, p, button', success), { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.7, delay: 0.3, ease: 'power3.out' });
        }
      }).catch(function () {
        showError('Sorry, your request could not be sent right now. Please try again in a moment.');
      }).then(function () {
        f.classList.remove('is-sending'); label.textContent = orig; f.removeAttribute('aria-busy');
      });
    });
    $('.qsuccess__again').addEventListener('click', function () {
      f.reset(); success.hidden = true; f.hidden = false; errBox.hidden = true;
      $$('.field', f).forEach(function (x) { x.classList.remove('is-invalid'); });
      consentWrap.classList.remove('is-invalid');
      $('#f-name').focus();
    });
  })();

  /* =========================================================
     Pointer effects (desktop)
     ========================================================= */
  if (finePointer && !reduced && hasGSAP) {
    $$('.magnetic').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.18); my((e.clientY - r.top - r.height / 2) * 0.24); });
      el.addEventListener('pointerleave', function () { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, .5)' }); });
    });
    hero.addEventListener('pointermove', function (e) {
      var px = e.clientX / window.innerWidth - 0.5, py = e.clientY / window.innerHeight - 0.5;
      gsap.to('.hero__frame img', { x: px * -16, y: py * -12, duration: 1.2, ease: 'power3.out' });
      gsap.to('.hcard--a', { x: px * 22, y: py * 16, duration: 1.4, ease: 'power3.out' });
      gsap.to('.hcard--b', { x: px * -18, y: py * -14, duration: 1.4, ease: 'power3.out' });
    });
  }

  /* =========================================================
     GSAP choreography
     ========================================================= */
  if (!hasGSAP) return;

  $$('.split').forEach(function (h) {
    var label = h.textContent.replace(/\s+/g, ' ').trim(), out = [];
    Array.prototype.forEach.call(h.childNodes, function (n) {
      var isEm = n.nodeType === 1 && n.tagName === 'EM';
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.push(' '); return; }
        out.push('<span class="w" aria-hidden="true"><span>' + (isEm ? '<em>' + part + '</em>' : part) + '</span></span>');
      });
    });
    h.innerHTML = out.join(''); h.setAttribute('aria-label', label);
  });
  $$('.words').forEach(function (p) { p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) { return '<span class="wd">' + w + '</span>'; }).join(' '); });

  if (reduced) return;

  /* ---------- Hero entrance (no loading screen) ---------- */
  var htl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  htl.from('.nav__inner', { y: -30, autoAlpha: 0, duration: 1 }, 0)
    .from('.hero__kicker', { y: 20, autoAlpha: 0, duration: 0.9 }, 0.1)
    .from('.hero__title .ln__in', { yPercent: 110, stagger: 0.1, duration: 1.3 }, 0.15)
    .from('.hero__lead', { y: 24, autoAlpha: 0, duration: 1 }, 0.55)
    .from('.hero__actions > *', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 1 }, 0.65)
    .from('.hero__points li', { y: 14, autoAlpha: 0, stagger: 0.06, duration: 0.8 }, 0.8)
    .from('.hero__frame', { clipPath: 'inset(100% 0 0 0 round 200px 200px 24px 24px)', duration: 1.6, ease: 'expo.inOut' }, 0.15)
    .from('.hero__frame img', { scale: 1.35, duration: 2.2 }, 0.3)
    .from('.hero__ring', { scale: 0.9, autoAlpha: 0, duration: 1.6 }, 0.9)
    .from('.hcard', { y: 30, scale: 0.92, autoAlpha: 0, stagger: 0.15, duration: 1.1, ease: 'back.out(1.6)' }, 1.1)
    .from('.hero__strip', { autoAlpha: 0, duration: 1 }, 1.1);
  $$('.hcard').forEach(function (c, i) { gsap.to(c, { yPercent: i ? 10 : -10, duration: 3 + i, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.4 }); });

  // Hero scroll-out
  gsap.to('.hero__visual', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__copy', { y: -60, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: true } });

  // Value strip
  var strip = $('.hero__track');
  if (strip) { var loop = gsap.fromTo(strip, { xPercent: 0 }, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 }); }

  /* ---------- Generic reveals ---------- */
  $$('.split').forEach(function (h) {
    gsap.from($$('.w > span', h), { yPercent: 115, stagger: 0.05, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('.kicker:not(.hero__kicker), .shead__lead, .quote__lead, .about__text').forEach(function (el) {
    gsap.from(el, { y: 20, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  $$('.divider').forEach(function (d) {
    gsap.from($('.divider__line', d), { scaleX: 0, duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: d, start: 'top 92%' } });
    gsap.from($('.divider__node', d), { scale: 0, autoAlpha: 0, duration: 0.8, delay: 1.1, ease: 'back.out(3)', scrollTrigger: { trigger: d, start: 'top 92%' } });
  });

  /* ---------- About ---------- */
  var wds = $$('.about__statement .wd');
  if (wds.length) gsap.to(wds, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.about__statement', start: 'top 82%', end: 'bottom 50%', scrub: true } });
  gsap.from('.about__img--a', { clipPath: 'inset(100% 0 0 0 round 160px 160px 20px 20px)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.about__media', start: 'top 78%' } });
  gsap.from('.about__img--a img', { scale: 1.3, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: '.about__media', start: 'top 78%' } });
  gsap.from('.about__img--b', { y: 80, autoAlpha: 0, duration: 1.3, delay: 0.4, ease: 'expo.out', scrollTrigger: { trigger: '.about__media', start: 'top 78%' } });
  gsap.from('.about__geo', { rotate: -90, autoAlpha: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.about__media', start: 'top 78%' } });
  gsap.to('.about__geo', { rotate: 40, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.about__list li, .about__copy > .btn', { x: -24, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.about__list', start: 'top 90%' } });
  $$('[data-speed]').forEach(function (el) {
    var s = parseFloat(el.getAttribute('data-speed')) || 0;
    gsap.fromTo(el, { yPercent: -s * 60 }, { yPercent: s * 60, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Services ---------- */
  ScrollTrigger.batch('.svc__card', {
    start: 'top 88%', once: true,
    onEnter: function (els) { gsap.fromTo(els, { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }); }
  });
  gsap.set('.svc__card', { autoAlpha: 0 });
  gsap.from('.svc__note', { y: 16, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.svc__note', start: 'top 95%' } });

  /* ---------- Why ---------- */
  gsap.from('.why__img', { clipPath: 'inset(0 0 100% 0 round 26px)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.why__media', start: 'top 80%' } });
  gsap.fromTo('.why__img img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.why', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.why__rings', { rotate: 120, ease: 'none', scrollTrigger: { trigger: '.why', start: 'top bottom', end: 'bottom top', scrub: true } });
  $$('.witem').forEach(function (it) {
    ScrollTrigger.create({ trigger: it, start: 'top 62%', end: 'bottom 38%', toggleClass: { targets: it, className: 'is-active' } });
  });
  gsap.from('.witem', { y: 30, stagger: 0.08, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.wlist', start: 'top 88%' } });

  /* ---------- How it works ---------- */
  gsap.fromTo('.steps__line', { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 60%', scrub: true } });
  gsap.from('.step', { y: 60, autoAlpha: 0, stagger: 0.15, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.steps', start: 'top 82%' }, clearProps: 'transform,opacity,visibility' });
  gsap.from('.step__node', { scale: 0, stagger: 0.15, duration: 0.9, delay: 0.25, ease: 'back.out(2.4)', scrollTrigger: { trigger: '.steps', start: 'top 82%' } });
  gsap.fromTo('.how__bg img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.how', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Quote ---------- */
  gsap.from('.next li, .disclosure, .quote__phone', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.next', start: 'top 90%' } });
  gsap.from('.formcard', { y: 70, autoAlpha: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.formcard', start: 'top 92%' } });

  /* ---------- FAQ ---------- */
  gsap.from('.acc__item', { y: 26, autoAlpha: 0, stagger: 0.07, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.acc', start: 'top 88%' } });

  /* ---------- Final CTA ---------- */
  gsap.fromTo('.final__media', { yPercent: -6, scale: 1.15 }, { yPercent: 6, scale: 1, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.fl > span', { yPercent: 115, stagger: 0.1, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.final__title', start: 'top 82%' } });
  gsap.from('.final__lead, .final__actions > *', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.final__lead', start: 'top 92%' } });

  /* ---------- Footer ---------- */
  gsap.from('.foot__top > *', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.foot', start: 'top 92%' } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
