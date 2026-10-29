(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Theme ---------- */
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) {}
  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    readColors();
  }
  $('#theme-toggle').addEventListener('click', toggleTheme);

  /* ---------- Keyboard hint ---------- */
  var hint = isMac ? '⌘ K' : 'Ctrl K';
  $('#kbd-hint').textContent = hint;
  $('#kbd-foot').textContent = hint;

  /* ---------- Year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Scroll progress + active nav ---------- */
  var progress = $('#progress');
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    if (window.scrollY < 300) { navLinks.forEach(function (a) { a.classList.remove('active'); }); }
  }
  var navLinks = $$('.nav-links a');
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var secObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-sec') === en.target.id); });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'work', 'research', 'stack', 'timeline', 'contact'].forEach(function (id) {
    var el = document.getElementById(id); if (el) secObserver.observe(el);
  });

  /* ---------- Reveal on scroll ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in-view'); revealObserver.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(function (el) { revealObserver.observe(el); });

  /* ---------- Count-up ---------- */
  function countUp(el) {
    var target = +el.getAttribute('data-count');
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { countUp(en.target); countObserver.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { countObserver.observe(el); });

  /* ---------- Spotlight follows cursor (fine pointers only) ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    var spot = $('#spotlight');
    window.addEventListener('pointermove', function (e) {
      spot.style.setProperty('--mx', e.clientX + 'px');
      spot.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  /* ---------- Hero: agent network canvas ---------- */
  var canvas = $('#net');
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = 1, nodes = [], mouse = { x: -999, y: -999 };
  var accent = '#d6ff3f', lineCol = '#26262b';

  function readColors() {
    var cs = getComputedStyle(root);
    accent = cs.getPropertyValue('--accent-text').trim() || accent;
    lineCol = cs.getPropertyValue('--muted').trim() || lineCol;
    if (reduceMotion) draw();
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(24, Math.min(70, Math.round((W * H) / 20000)));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.8, hub: Math.random() < 0.12
      });
    }
    if (reduceMotion) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var maxD = 150;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxD) {
          ctx.globalAlpha = (1 - d / maxD) * 0.28;
          ctx.strokeStyle = lineCol;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      var mdx = a.x - mouse.x, mdy = a.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < 190) {
        ctx.globalAlpha = (1 - md / 190) * 0.9;
        ctx.strokeStyle = accent;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k];
      ctx.globalAlpha = n.hub ? 0.95 : 0.55;
      ctx.fillStyle = n.hub ? accent : lineCol;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.hub ? n.r + 1.4 : n.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var running = true;
  function tick() {
    if (running) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
      draw();
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });
  var hero = $('.hero');
  hero.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
  new IntersectionObserver(function (en) { running = en[0].isIntersecting && !document.hidden; }).observe(hero);
  readColors(); resize();
  if (!reduceMotion) requestAnimationFrame(tick);

  /* ---------- Hero: terminal typing ---------- */
  var termEl = $('#term-body');
  var script = [
    { t: 'atmc eval --model qwen2.5-coder:7b --stream rule_change', c: 'c-cmd', type: true },
    { t: '', c: 'c-dim' },
    { t: 'task 041   ✗ fail   expected: one-based indexing', c: 'c-fail' },
    { t: '           → typed evidence saved as a note', c: 'c-dim' },
    { t: 'task 041   ↻ retry  ✓ pass   stored as worked example', c: 'c-ok' },
    { t: '', c: 'c-dim' },
    { t: 'task 087   ! stored solution no longer passes the checker', c: 'c-fail' },
    { t: '           → rule changed: stale example dropped, rule relearned', c: 'c-dim' },
    { t: '', c: 'c-dim' },
    { t: 'learning from verified failures   +22.1 pts  (CI 17.0–27.3)', c: 'c-sum' },
    { t: 'rule memory after a rule change  +23.1 pts', c: 'c-sum' }
  ];

  function renderStatic() {
    termEl.innerHTML = script.map(function (l) {
      return '<span class="' + l.c + '">' + l.t.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>';
    }).join('\n');
  }

  function playTerminal() {
    termEl.innerHTML = '';
    var li = 0;
    function nextLine() {
      if (li >= script.length) { setTimeout(playTerminal, 9000); return; }
      var line = script[li++];
      var span = document.createElement('span');
      span.className = line.c;
      termEl.appendChild(span);
      termEl.appendChild(document.createTextNode('\n'));
      var caret = document.createElement('span'); caret.className = 'caret';
      if (line.type) {
        var i = 0;
        span.appendChild(caret);
        (function typeChar() {
          if (i < line.t.length) {
            span.insertBefore(document.createTextNode(line.t.charAt(i++)), caret);
            setTimeout(typeChar, 26);
          } else { caret.remove(); setTimeout(nextLine, 450); }
        })();
      } else {
        span.textContent = line.t;
        setTimeout(nextLine, line.t ? 520 : 120);
      }
    }
    nextLine();
  }
  if (reduceMotion) renderStatic(); else playTerminal();

  /* ---------- Skills explorer ---------- */
  var usedText = $('#used-text');
  var chips = $$('.chips button');
  function showUsed(btn) {
    chips.forEach(function (b) { b.classList.toggle('on', b === btn); });
    usedText.textContent = btn.getAttribute('data-used');
  }
  chips.forEach(function (btn) {
    btn.addEventListener('mouseenter', function () { showUsed(btn); });
    btn.addEventListener('focus', function () { showUsed(btn); });
    btn.addEventListener('click', function () { showUsed(btn); });
  });

  /* ---------- Copy email ---------- */
  function copyEmail() {
    var btn = $('#copy-email'), state = $('#copy-state'), email = btn.getAttribute('data-email');
    function done(msg) { state.textContent = msg; setTimeout(function () { state.textContent = 'Copy'; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { done('Copied'); }, function () { window.location.href = 'mailto:' + email; });
    } else { window.location.href = 'mailto:' + email; }
  }
  $('#copy-email').addEventListener('click', copyEmail);

  /* ---------- Command palette ---------- */
  var palette = $('#palette'), input = $('#palette-input'), list = $('#palette-list');
  var commands = [
    { label: 'Go to About', hint: 'section', run: function () { go('#about'); } },
    { label: 'Go to Work', hint: 'section', run: function () { go('#work'); } },
    { label: 'Go to Research', hint: 'section', run: function () { go('#research'); } },
    { label: 'Go to Stack', hint: 'section', run: function () { go('#stack'); } },
    { label: 'Go to Timeline', hint: 'section', run: function () { go('#timeline'); } },
    { label: 'Go to Contact', hint: 'section', run: function () { go('#contact'); } },
    { label: 'Open GitHub', hint: 'link', run: function () { open_('https://github.com/Ishika-eng'); } },
    { label: 'Open LinkedIn', hint: 'link', run: function () { open_('https://www.linkedin.com/in/ishika-mahadar-8795a6337/'); } },
    { label: 'Open LeetCode', hint: 'link', run: function () { open_('https://leetcode.com/u/Ishika_Mahadar/'); } },
    { label: 'Open resume (PDF)', hint: 'file', run: function () { open_('resume.pdf'); } },
    { label: 'Copy email address', hint: 'action', run: copyEmail },
    { label: 'Toggle light / dark theme', hint: 'action', run: toggleTheme }
  ];
  var filtered = commands.slice(), sel = 0, lastFocus = null;
  function go(hash) { var el = $(hash); if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }
  function open_(url) { window.open(url, '_blank', 'noopener'); }

  function renderList() {
    list.innerHTML = '';
    filtered.forEach(function (c, i) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.className = i === sel ? 'sel' : '';
      li.innerHTML = '<span></span><small></small>';
      li.firstChild.textContent = c.label;
      li.lastChild.textContent = c.hint;
      li.addEventListener('mousemove', function () { if (sel !== i) { sel = i; renderList(); } });
      li.addEventListener('click', function () { choose(i); });
      list.appendChild(li);
    });
    var s = $('li.sel', list); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
  }
  function filter() {
    var q = input.value.trim().toLowerCase();
    filtered = commands.filter(function (c) { return !q || c.label.toLowerCase().indexOf(q) !== -1; });
    sel = 0; renderList();
  }
  function openPalette() {
    lastFocus = document.activeElement;
    palette.hidden = false; input.value = ''; filter(); input.focus();
  }
  function closePalette() { palette.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function choose(i) {
    var c = filtered[i]; if (!c) return;
    closePalette(); setTimeout(c.run, 30);
  }
  $('#open-palette').addEventListener('click', openPalette);
  palette.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closePalette(); });
  input.addEventListener('input', filter);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); renderList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); renderList(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); palette.hidden ? openPalette() : closePalette();
    } else if (e.key === 'Escape' && !palette.hidden) { closePalette(); }
  });
})();
