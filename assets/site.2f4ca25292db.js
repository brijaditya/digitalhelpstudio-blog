/* Digital Help Studio — site interactions. No libraries, no trackers.
   Everything degrades gracefully: content and links work without JavaScript. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Motion preference (pause button) ---------- */
  var KEY = 'dhs-motion';
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var paused = stored() === 'paused' || mqReduce.matches;
  function applyMotion() {
    root.classList.toggle('paused', paused);
    d.querySelectorAll('[data-motion-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(paused));
      var label = b.querySelector('[data-motion-label]') || b;
      label.textContent = paused ? 'Play motion' : 'Pause motion';
    });
    d.dispatchEvent(new CustomEvent('motionchange', { detail: { paused: paused } }));
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-motion-toggle]');
    if (!b) return;
    paused = !paused; store(paused ? 'paused' : 'playing'); applyMotion();
  });
  applyMotion();

  /* ---------- Header ---------- */
  var header = d.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var menuBtn = d.querySelector('.menu-btn'), nav = d.getElementById('site-nav');
  function setMenu(open) {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('.label').textContent = open ? 'Close' : 'Menu';
    nav.classList.toggle('open', open);
    d.body.classList.toggle('menu-open', open);
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });

  d.querySelectorAll('.dd').forEach(function (dd) {
    var btn = dd.querySelector('button');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !dd.classList.contains('open');
      d.querySelectorAll('.dd.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('button').setAttribute('aria-expanded', 'false'); });
      dd.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
    });
  });
  d.addEventListener('click', function (e) {
    if (!e.target.closest('.dd')) d.querySelectorAll('.dd.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('button').setAttribute('aria-expanded', 'false'); });
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openDd = d.querySelector('.dd.open');
    if (openDd) { openDd.classList.remove('open'); var b = openDd.querySelector('button'); b.setAttribute('aria-expanded', 'false'); b.focus(); return; }
    if (nav && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- Split headline words ---------- */
  d.querySelectorAll('.split-words').forEach(function (el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(part)); return; }
            var w = d.createElement('span'); w.className = 'w';
            var i = d.createElement('span'); i.textContent = part; w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    el.querySelectorAll('.w > span').forEach(function (s, i) { s.style.transitionDelay = (i * 0.045) + 's'; s.setAttribute('aria-hidden', 'true'); });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = d.querySelectorAll('.rv, .split-words');
  if ('IntersectionObserver' in window && !mqReduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- Process timeline progress ---------- */
  d.querySelectorAll('.process').forEach(function (list) {
    var items = list.querySelectorAll('li');
    if (!('IntersectionObserver' in window)) { items.forEach(function (li) { li.classList.add('lit'); }); list.style.setProperty('--progress', '100%'); return; }
    var lit = 0;
    var po = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var idx = Array.prototype.indexOf.call(items, en.target);
        for (var i = 0; i <= idx; i++) items[i].classList.add('lit');
        lit = Math.max(lit, idx + 1);
        list.style.setProperty('--progress', Math.round((lit - 0.5) / items.length * 100) + '%');
        if (lit === items.length) list.style.setProperty('--progress', '100%');
      });
    }, { rootMargin: '0px 0px -30% 0px' });
    items.forEach(function (li) { po.observe(li); });
  });

  /* ---------- Pointer spotlight + magnetic buttons ---------- */
  if (fine) {
    d.querySelectorAll('.spot, .card').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    d.querySelectorAll('.btn-magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        if (paused) return;
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18, y = (e.clientY - r.top - r.height / 2) * 0.3;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- Work scroller buttons ---------- */
  d.querySelectorAll('[data-scroller]').forEach(function (wrap) {
    var track = wrap.querySelector('.work-scroller');
    wrap.querySelectorAll('[data-dir]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = track.querySelector('.work');
        var step = card ? card.getBoundingClientRect().width + 22 : 400;
        track.scrollBy({ left: step * Number(btn.getAttribute('data-dir')), behavior: mqReduce.matches ? 'auto' : 'smooth' });
      });
    });
  });

  /* ---------- Live personalised demo builder (home hero) ---------- */
  var builder = d.querySelector('[data-builder]');
  if (builder) {
    var themes = {
      bakery:     { name: "Bella's Bakery", eyebrow: 'Artisan bakery', title: 'Fresh from our oven, every morning.', sub: 'Celebration cakes, pastries and bread baked in small batches, with custom orders for every occasion.', cta: 'Order ahead', cards: ['Celebration cakes', 'Morning pastries', 'Custom orders'], links: ['Menu', 'Cakes', 'Visit'], bg: '#f6ecdf', ink: '#2b1a10', accent: '#9a4a1f', soft: '#ecd3b8', font: 'var(--serif)', shape: 'arch' },
      salon:      { name: 'Luxe Hair Studio', eyebrow: 'Hair & colour studio', title: 'Hair that feels like you.', sub: 'Precision cuts, colour and bridal styling in a calm, unhurried studio. Book your consultation online.', cta: 'Book a visit', cards: ['Cuts & styling', 'Colour', 'Bridal'], links: ['Services', 'Gallery', 'Book'], bg: '#f7ebe8', ink: '#221417', accent: '#1e1417', soft: '#e9c9c2', font: 'var(--serif)', shape: 'pill' },
      consultant: { name: 'Northstar Consulting', eyebrow: 'Business consultancy', title: 'Clear strategy for growing businesses.', sub: 'Practical advice on operations, pricing and growth for owner-led companies. Start with a free intro call.', cta: 'Book a call', cards: ['Strategy', 'Operations', 'Coaching'], links: ['Services', 'Approach', 'Insights'], bg: '#eef2f7', ink: '#0f1b2d', accent: '#1d4ed8', soft: '#cfdcf2', font: 'var(--sans)', shape: 'square' },
      cleaning:   { name: 'Sparkle Cleaning Co.', eyebrow: 'Home & office cleaning', title: 'Spotless spaces, zero stress.', sub: 'Reliable, insured cleaners for homes and small offices. Same team every visit, with a simple checklist.', cta: 'Get a quote', cards: ['Home cleaning', 'Deep cleans', 'Offices'], links: ['Services', 'Areas', 'Pricing'], bg: '#e8f6f3', ink: '#0d2a2a', accent: '#0f8a7a', soft: '#bfe7df', font: 'var(--sans)', shape: 'circle' },
      fitness:    { name: 'Forge Fitness', eyebrow: 'Personal training', title: 'Stronger, every single week.', sub: 'One-to-one coaching, small group classes and nutrition support built around your schedule.', cta: 'Start today', cards: ['Personal training', 'Group classes', 'Nutrition'], links: ['Programs', 'Coaches', 'Join'], bg: '#15161a', ink: '#f2f2ee', accent: '#c6f432', soft: '#2a2d24', font: 'var(--sans)', shape: 'square' },
      cafe:       { name: 'Corner Café', eyebrow: 'Neighbourhood café', title: 'Good coffee, slow mornings.', sub: 'Specialty coffee, all-day brunch and fresh bakes. Walk in, or book a table for the weekend.', cta: 'See the menu', cards: ['Specialty coffee', 'Brunch', 'Catering'], links: ['Menu', 'About', 'Find us'], bg: '#efe9dc', ink: '#23301f', accent: '#3f6b34', soft: '#d9d2b6', font: 'var(--serif)', shape: 'arch' }
    };
    var order = Object.keys(themes);
    var mini = builder.querySelector('.mini');
    var input = builder.querySelector('#biz-name');
    var chips = builder.querySelectorAll('.chip');
    var url = builder.querySelector('.browser-url');
    var shot = builder.querySelector('[data-mini-label]');
    var current = 'bakery', typed = '', timer = null, userTouched = false;
    var q = function (s) { return mini.querySelector(s); };

    function slug(s) { return (s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').slice(0, 28) || 'yourbusiness'; }
    function render(key, animate) {
      var t = themes[key]; current = key;
      var name = typed.trim() || t.name;
      var go = function () {
        mini.style.setProperty('--m-bg', t.bg); mini.style.setProperty('--m-ink', t.ink);
        mini.style.setProperty('--m-accent', t.accent); mini.style.setProperty('--m-soft', t.soft);
        mini.style.setProperty('--m-font', t.font); mini.setAttribute('data-shape', t.shape);
        q('.mini-name').textContent = name;
        q('.mini-mark').textContent = name.trim().charAt(0).toUpperCase() || 'Y';
        q('.mini-eyebrow').textContent = t.eyebrow;
        q('.mini-title').textContent = t.title;
        q('.mini-sub').textContent = t.sub;
        q('.mini-hero .mini-btn').textContent = t.cta;
        q('.mini-nav .mini-btn').textContent = t.cta;
        mini.querySelectorAll('.mini-links span').forEach(function (s, i) { s.textContent = t.links[i]; });
        mini.querySelectorAll('.mini-card').forEach(function (c, i) { c.textContent = t.cards[i]; });
        url.textContent = slug(name) + '.com';
        if (shot) shot.textContent = 'Preview: a ' + t.eyebrow.toLowerCase() + ' website for ' + name + '.';
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-theme') === key)); });
        requestAnimationFrame(function () { mini.classList.remove('rebuild'); });
      };
      if (animate && !mqReduce.matches) { mini.classList.add('rebuild'); setTimeout(go, 260); } else { go(); }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() {
      stop();
      if (paused || userTouched || mqReduce.matches) return;
      timer = setInterval(function () { render(order[(order.indexOf(current) + 1) % order.length], true); }, 3800);
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () { userTouched = true; stop(); render(c.getAttribute('data-theme'), true); });
    });
    var typeT;
    input.addEventListener('input', function () {
      userTouched = true; stop(); typed = input.value.slice(0, 40);
      clearTimeout(typeT); typeT = setTimeout(function () { render(current, false); }, 60);
    });
    builder.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var n = input.value.trim();
      window.location.href = '/contact/?service=website' + (n ? '&business=' + encodeURIComponent(n) : '') + '#enquiry';
    });
    d.addEventListener('motionchange', function () { if (paused) stop(); else start(); });
    render('bakery', false);
    // pause the auto-cycle when the builder scrolls out of view
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) start(); else stop(); }).observe(builder);
    } else { start(); }
  }

  /* ---------- Contact form ---------- */
  var form = d.getElementById('enquiry-form');
  if (form) {
    try {
      var params = new URLSearchParams(location.search);
      var svc = params.get('service'), biz = params.get('business');
      if (svc) { var sel = form.elements.service; if (sel && sel.querySelector('option[value="' + svc + '"]')) sel.value = svc; }
      if (biz && form.elements.business) form.elements.business.value = biz.slice(0, 150);
    } catch (e) {}
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var status = form.querySelector('.form-status'), button = form.querySelector('button[type=submit]');
      var fallback = 'We could not send your enquiry. Please email contact@digitalhelpstudio.com or message +91 79994 38003 on WhatsApp.';
      if (location.protocol === 'file:') { status.className = 'form-status error'; status.textContent = 'This form only works once the website is on the live server. ' + fallback; return; }
      button.disabled = true; status.className = 'form-status'; status.textContent = 'Sending your enquiry…';
      var controller = 'AbortController' in window ? new AbortController() : null;
      var t = setTimeout(function () { if (controller) controller.abort(); }, 25000);
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, signal: controller ? controller.signal : undefined })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (data) { return { r: r, data: data }; }); })
        .then(function (res) {
          if (!res.r.ok || !res.data.ok) throw new Error(res.data.message || fallback);
          status.className = 'form-status success'; status.textContent = res.data.message; form.reset();
        })
        .catch(function (err) { status.className = 'form-status error'; status.textContent = (err && err.name === 'AbortError') ? 'The request took too long. ' + fallback : (err.message || fallback); })
        .then(function () { clearTimeout(t); button.disabled = false; status.focus && status.focus(); });
    });
  }

  /* ---------- Homepage: newest posts from /blog/posts.json (blog deploys separately) ---------- */
  var latest = d.querySelector('[data-latest-posts]');
  if (latest && window.fetch) {
    fetch('/blog/posts.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (posts) {
      if (!posts || !posts.length) return;
      var n = Number(latest.getAttribute('data-latest-posts')) || 3, esc = function (s) { var t = d.createElement('span'); t.textContent = s; return t.innerHTML; };
      var arrow = latest.querySelector('.go .arrow'); arrow = arrow ? arrow.outerHTML : '';
      latest.innerHTML = posts.slice(0, n).map(function (p) {
        return '<a class="post-card rv in" href="' + esc(p.url) + '" data-cat="' + esc(p.cat) + '"><div class="post-img"><img src="' + esc(p.img800) + '" srcset="' + esc(p.img800) + ' 800w, ' + esc(p.img1600) + ' 1600w" sizes="(max-width: 640px) 92vw, 400px" width="800" height="450" loading="lazy" decoding="async" alt=""></div>' +
          '<div class="post-body"><div class="post-meta"><span class="tag-soft">' + esc(p.catLabel) + '</span><span>' + esc(String(p.mins)) + ' min read</span></div><h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p><span class="go">Read article ' + arrow + '</span></div></a>';
      }).join('');
    }).catch(function () {});
  }

  /* ---------- Blog topic filter ---------- */
  var filter = d.querySelector('.blog-filter');
  if (filter) {
    filter.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]'); if (!b) return;
      var f = b.getAttribute('data-filter');
      filter.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      d.querySelectorAll('[data-blog-list] .post-card').forEach(function (c) {
        c.hidden = !(f === 'all' || c.getAttribute('data-cat') === f);
        c.classList.add('in');
      });
    });
  }

  /* ---------- Year ---------- */
  d.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
