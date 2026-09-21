/* Ultimate Automations — bendra logika visiems puslapiams.
   Kiekvienas blokas apsaugotas nuo trūkstamų elementų, nes puslapiai skiriasi. */

// ───────── Nav: slėpimas scrollinant + hero blend ─────────
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  // .over-hero taikomas tik ten, kur po nav'u iš tikrųjų yra tamsus hero.
  const hasHero = !!document.querySelector('.hero');
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.style.transform = (y > lastY && y > 200) ? 'translateY(-130%)' : 'translateY(0)';
    if (hasHero) nav.classList.toggle('over-hero', y < window.innerHeight * 0.85);
    lastY = y;
  }, { passive: true });

  if (hasHero) nav.classList.add('over-hero');
})();

// ───────── Hero fono judesys (kvazi-periodinis dreifas) ─────────
(function () {
  // Tas pats fonas naudojamas hero ir skaičiuoklės CTA juostoje.
  const stages = Array.from(document.querySelectorAll('.flux-bg'));
  const blobs = stages.reduce(
    (all, st) => all.concat(Array.from(st.querySelectorAll('.blob'))), []);
  if (!blobs.length) return;

  const TAU = Math.PI * 2;
  const PHI = 1.6180339887498949;

  // Determinuotas PRNG — kiekvieną kartą tas pats „charakteris", bet skirtingas
  // kiekvienai dėmei.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Trys sinusai, kurių dažnių santykiai iracionalūs (PHI laipsniai) — suma
  // niekada neužsidaro į ciklą, todėl trajektorija nepasikartoja.
  function field(rand, amp, minPeriod, maxPeriod, speed) {
    const terms = [];
    for (let k = 0; k < 3; k++) {
      terms.push({
        // Lėtas terminas nustato bendrą kryptį, greitesni (PHI^k) — virpėjimą.
        a: amp * Math.pow(0.66, k) * (0.75 + rand() * 0.5),
        w: (TAU / (minPeriod + rand() * (maxPeriod - minPeriod))) * Math.pow(PHI, k) * speed,
        p: rand() * TAU
      });
    }
    return terms;
  }
  function sample(terms, t) {
    let v = 0;
    for (let i = 0; i < terms.length; i++) {
      const s = terms[i];
      v += s.a * Math.sin(s.w * t + s.p);
    }
    return v;
  }

  const cfg = blobs.map((el, i) => {
    const rand = mulberry32(0x9E37 + i * 2654435761);
    const cs = getComputedStyle(el);
    const baseRot = parseFloat(cs.getPropertyValue('--base-rot')) || 0;
    // Tamsios formos (normal blend) laiko įstrižą juostą — jos juda gerokai
    // santūriau, kad kompozicija neišsiplautų. Žalios masės klaidžioja laisvai.
    const carve = cs.mixBlendMode === 'normal';
    const k = carve ? 0.4 : 1;
    // Greitį duoda CSS banga; šis sluoksnis – lėtesnis netaisyklingas klaidžiojimas,
    // kuris neleidžia bangai kartotis vienodai.
    const sp = carve ? 0.7 : 2;
    return {
      el, baseRot,
      // Amplitudės vw vienetais — perskaičiuojamos per resize.
      ax: field(rand, (7.0 + rand() * 5.0) * k, 19, 44, sp),
      ay: field(rand, (5.0 + rand() * 4.0) * k, 22, 52, sp),
      // Netolygus mastelis = forma persilieja, o ne tiesiog slenka.
      sx: field(rand, 0.13 * (carve ? 0.5 : 1), 25, 58, sp),
      sy: field(rand, 0.13 * (carve ? 0.5 : 1), 25, 58, sp),
      rot: field(rand, carve ? 5 : 12, 32, 74, sp),
      // Lėtas amplitudės moduliavimas — judesys tai įsibėgėja, tai nurimsta,
      // todėl neatrodo kaip laikrodžio mechanizmas.
      swellW: TAU / (44 + rand() * 40),
      swellP: rand() * TAU
    };
  });

  let vw = 0;
  const measure = () => { vw = window.innerWidth / 100; };
  measure();
  window.addEventListener('resize', measure, { passive: true });

  let running = true, rafId = 0;
  let t = 0, last = performance.now();

  function frame(now) {
    if (!running) return;
    // Kaupiam laiką tik kol sukamės, kad po pauzės judesys tęstųsi iš tos
    // pačios vietos, o ne šoktelėtų.
    t += Math.min((now - last) / 1000, 0.05);
    last = now;
    for (let i = 0; i < cfg.length; i++) {
      const c = cfg[i];
      const swell = 0.55 + 0.45 * Math.sin(c.swellW * t + c.swellP);
      const x = sample(c.ax, t) * swell * vw;
      const y = sample(c.ay, t) * swell * vw;
      const sx = 1 + sample(c.sx, t);
      const sy = 1 + sample(c.sy, t);
      const r = c.baseRot + sample(c.rot, t);
      // Rašom į kintamuosius, ne į transform — bangos keyframes juos įskaito
      // kas kadrą, todėl abu judesiai susideda.
      const st = c.el.style;
      st.setProperty('--dx', x.toFixed(2) + 'px');
      st.setProperty('--dy', y.toFixed(2) + 'px');
      st.setProperty('--rot', r.toFixed(2) + 'deg');
      st.setProperty('--sx', sx.toFixed(4));
      st.setProperty('--sy', sy.toFixed(4));
    }
    rafId = requestAnimationFrame(frame);
  }

  let visible = true;
  function sync() {
    const on = visible && !document.hidden;
    if (on === running) return;
    running = on;
    if (on) { last = performance.now(); rafId = requestAnimationFrame(frame); }
    else cancelAnimationFrame(rafId);
  }

  rafId = requestAnimationFrame(frame);

  // Nesukam ciklo, kai hero nematomas arba kortelė fone.
  if ('IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
      visible = seen.size > 0;
      sync();
    }, { threshold: 0 });
    stages.forEach(st => io.observe(st));
  }
  document.addEventListener('visibilitychange', sync);
})();

// ───────── Hamburger meniu ─────────
(function () {
  const hamburger = document.getElementById('navHamburger');
  const drawer = document.getElementById('navDrawer');
  if (!hamburger || !drawer) return;

  function toggleDrawer(open) {
    drawer.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  hamburger.addEventListener('click', () => toggleDrawer(!drawer.classList.contains('open')));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleDrawer(false)));
})();

// ───────── Reveal on scroll + skaitikliai ─────────
(function () {
  function animateCount(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const suffix = el.dataset.suffix || '';
    const dur = 1600;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * e).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        if (e.target.dataset.count) animateCount(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal, [data-count]').forEach(el => io.observe(el));
})();

// ───────── Smooth scroll (tik tame pačiame puslapyje) ─────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = document.querySelector(id);
    if (t) {
      e.preventDefault();
      const y = t.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
});

// ───────── Turinio įkėlimas iš /content.json ─────────
(function () {
  const targets = document.querySelectorAll('[data-content]');
  if (!targets.length) return;

  fetch('/content.json')
    .then(r => r.json())
    .then(c => {
      targets.forEach(el => {
        const v = c[el.dataset.content];
        if (v == null) return;
        if ('contentCount' in el.dataset) {
          el.dataset.count = v;
          if (!el.dataset.counted) return;
          el.textContent = v + (el.dataset.suffix || '');
        } else {
          el.textContent = v;
          if (el.tagName === 'A') {
            if (el.href.startsWith('tel:')) el.href = 'tel:' + v.replace(/\s/g, '');
            else if (el.href.includes('mailto:')) el.href = 'mailto:' + v;
          }
        }
      });
    })
    .catch(() => {});
})();

// ───────── Kontaktų anketa (žingsniais) ─────────
/* Vienas klausimas kortelėse per ekraną; paskutiniame žingsnyje — el. paštas ir
   svetainė. Be JS anketa lieka įprasta forma (visi žingsniai vienas po kito),
   todėl `qz--ready` uždedam tik čia — CSS elgesys su žingsniais nuo jos priklauso. */
(function () {
  const form = document.getElementById('contactForm');
  if (!form || !form.classList.contains('qz')) return;

  const stage = form.querySelector('#qzStage');
  const steps = Array.from(form.querySelectorAll('.qz-step'));
  if (!stage || steps.length < 2) return;

  const numEl = form.querySelector('#qzNum');
  const totalEl = form.querySelector('#qzTotal');
  const bar = form.querySelector('#qzBar');
  const progress = form.querySelector('#qzProgress');
  const backBtns = Array.from(form.querySelectorAll('.qz-back'));
  const stepsNav = form.querySelector('#qzSteps');
  const summary = form.querySelector('#qzSummary');
  const submitBtn = form.querySelector('.qz-submit');
  const finalIdx = steps.findIndex(s => s.dataset.key === 'contact');
  if (finalIdx < 0 || !submitBtn) return;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const SITE_RE = /^[^\s@]+\.[a-z]{2,}([/?#].*)?$/i;

  let idx = 0;
  let advTimer = 0;
  let returnTo = -1;   // į kurį žingsnį grįžti, kai atsakymas taisomas iš santraukos
  let started = false;

  let reached = 0;     // toliausiai pasiektas žingsnis — tik iki jo leidžiam šokinėti

  form.classList.add('qz--ready');
  steps.forEach((s, i) => {
    s.classList.toggle('is-active', i === 0);
    const q = s.querySelector('.qz-q');
    if (q) q.tabIndex = -1;
  });

  // Šoninis sąrašas statomas iš pačių žingsnių, kad etiketės nesidubliuotų HTML'e.
  const navItems = steps.map((s, i) => {
    const li = document.createElement('li');
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'qz-si';
    el.dataset.goto = String(i);
    el.innerHTML = '<span class="qz-si-dot" aria-hidden="true">✓</span><span class="qz-si-t"></span>';
    el.querySelector('.qz-si-t').textContent = s.dataset.label || 'Kontaktai';
    li.appendChild(el);
    stepsNav?.appendChild(li);
    return el;
  });

  function renderNav() {
    navItems.forEach((el, i) => {
      const answered = !!steps[i].querySelector('.qz-opt input:checked');
      el.parentElement.hidden = skipped(steps[i]);
      el.classList.toggle('is-current', i === idx);
      el.classList.toggle('is-done', answered && i !== idx);
      // Į priekį šokti negalima — ten dar nieko neatsakyta.
      el.disabled = i > reached;
      if (i === idx) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
  }

  // ── Žingsnių eiliškumas ──
  // Platformos klausimas neturi prasmės tiems, kas laiškų nesiunčia — todėl
  // žingsniai gali turėti sąlygą ir bendras skaičius perskaičiuojamas gyvai.
  function skipped(step) {
    const cond = step.dataset.skipIf;
    if (!cond) return false;
    const eq = cond.indexOf('=');
    if (eq < 0) return false;
    const name = cond.slice(0, eq);
    const value = cond.slice(eq + 1);
    const picked = form.querySelector('[name="' + name + '"]:checked');
    return !!picked && picked.value === value;
  }
  const visibleSteps = () => steps.filter(s => !skipped(s));
  function nextIndex(from) {
    for (let i = from + 1; i < steps.length; i++) if (!skipped(steps[i])) return i;
    return -1;
  }
  function prevIndex(from) {
    for (let i = from - 1; i >= 0; i--) if (!skipped(steps[i])) return i;
    return -1;
  }

  // ── Aukštis ──
  // Neaktyvūs žingsniai yra absoliučiai pozicionuoti, todėl konteineris pats
  // aukščio neturi: matuojam aktyvųjį ir animuojam perėjimą.
  function syncHeight() {
    if (form.classList.contains('is-sent')) return;
    stage.style.height = steps[idx].offsetHeight + 'px';
  }
  requestAnimationFrame(syncHeight);
  window.addEventListener('load', syncHeight);
  window.addEventListener('resize', syncHeight, { passive: true });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => syncHeight());
    steps.forEach(s => ro.observe(s));
  }

  // ── Navigacija ──
  function keepInView() {
    const r = form.getBoundingClientRect();
    if (r.top < 8 || r.top > window.innerHeight * 0.55) {
      window.scrollTo({ top: r.top + window.scrollY - 96, behavior: 'smooth' });
    }
  }

  function goTo(i, back) {
    if (i < 0 || i >= steps.length || i === idx) return;
    clearTimeout(advTimer);
    stage.classList.toggle('is-back', !!back);
    steps[idx].classList.remove('is-active');
    idx = i;
    if (idx > reached) reached = idx;
    steps[idx].classList.add('is-active');
    if (steps[idx].dataset.key === 'contact') renderSummary();
    syncHeight();
    updateHead();
    keepInView();
    const q = steps[idx].querySelector('.qz-q');
    if (q) q.focus({ preventScroll: true });
  }

  function updateHead() {
    const vis = visibleSteps();
    const pos = vis.indexOf(steps[idx]) + 1;
    const total = vis.length;
    const pct = total ? Math.round((pos / total) * 100) : 0;
    if (numEl) numEl.textContent = String(pos).padStart(2, '0');
    if (totalEl) totalEl.textContent = String(total).padStart(2, '0');
    if (bar) bar.style.width = pct + '%';
    if (progress) progress.setAttribute('aria-valuenow', String(pct));
    const noBack = prevIndex(idx) < 0;
    backBtns.forEach(b => { b.hidden = noBack; });
    renderNav();
  }

  function showErr(step, msg) {
    const err = step.querySelector('[data-err]');
    if (!err) return;
    if (msg) err.textContent = msg;
    err.classList.add('show');
    syncHeight();
  }
  function hideErr(step) {
    const err = step.querySelector('[data-err]');
    if (!err || !err.classList.contains('show')) return;
    err.classList.remove('show');
    syncHeight();
  }

  // ── Santrauka: kiekvieną atsakymą galima taisyti vienu paspaudimu ──
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function renderSummary() {
    if (!summary) return;
    const rows = [];
    steps.forEach((s, i) => {
      if (i === finalIdx || skipped(s)) return;
      const picked = Array.from(s.querySelectorAll('.qz-opt input:checked'));
      if (!picked.length) return;
      rows.push('<li><button type="button" class="qz-chip" data-goto="' + i + '" title="Keisti atsakymą">' +
        '<span class="k">' + esc(s.dataset.label || '') + '</span>' +
        esc(picked.map(p => p.value).join(', ')) + '</button></li>');
    });
    summary.innerHTML = rows.join('');
    summary.hidden = !rows.length;
  }

  // ── Atsakymai ──
  form.addEventListener('change', (e) => {
    const input = e.target;
    if (!input.matches || !input.matches('.qz-opt input')) return;
    const step = input.closest('.qz-step');
    if (!step) return;
    hideErr(step);
    updateHead();

    if (!started) {
      started = true;
      if (typeof gtag === 'function') gtag('event', 'form_start', { form: 'kontaktu_anketa' });
    }
    // Kelių pasirinkimų žingsnis laukia „Toliau" — kitaip nespėtum pažymėti antro.
    if (step.hasAttribute('data-multi') || step !== steps[idx]) return;

    clearTimeout(advTimer);
    advTimer = setTimeout(() => {
      if (returnTo >= 0) { const to = returnTo; returnTo = -1; goTo(to, false); return; }
      const n = nextIndex(idx);
      if (n >= 0) goTo(n, false);
    }, 280);
  });

  form.addEventListener('click', (e) => {
    const chip = e.target.closest('.qz-chip');
    if (chip) {
      returnTo = finalIdx;
      goTo(Number(chip.dataset.goto), true);
      return;
    }
    const navItem = e.target.closest('.qz-si');
    if (navItem && !navItem.disabled) {
      returnTo = -1;
      const to = Number(navItem.dataset.goto);
      goTo(to, to < idx);
      return;
    }
    if (e.target.closest('[data-next]')) {
      const step = steps[idx];
      if (step.hasAttribute('data-multi') && !step.querySelector('.qz-opt input:checked')) {
        showErr(step, 'Pasirinkite bent vieną sritį.');
        return;
      }
      hideErr(step);
      if (returnTo >= 0) { const to = returnTo; returnTo = -1; goTo(to, false); return; }
      const n = nextIndex(idx);
      if (n >= 0) goTo(n, false);
    }
  });

  backBtns.forEach(b => b.addEventListener('click', () => {
    returnTo = -1;
    const p = prevIndex(idx);
    if (p >= 0) goTo(p, true);
  }));

  form.querySelectorAll('.qz-field input, .qz-field textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('err');
      hideErr(steps[finalIdx]);
    });
  });

  updateHead();

  // ── Siuntimas ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Enter viduryje anketos reiškia „toliau", ne „siųsti".
    if (idx !== finalIdx) {
      const n = nextIndex(idx);
      if (n >= 0) goTo(n, false);
      return;
    }

    const step = steps[finalIdx];
    const email = form.querySelector('#qzEmail');
    const site = form.querySelector('#qzSite');
    const emailOk = EMAIL_RE.test(email.value.trim());
    const siteOk = SITE_RE.test(site.value.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, ''));
    email.classList.toggle('err', !emailOk);
    site.classList.toggle('err', !siteOk);
    if (!emailOk || !siteOk) {
      showErr(step, !emailOk
        ? 'Įveskite teisingą el. pašto adresą.'
        : 'Įveskite svetainės adresą, pvz. jusuparduotuve.lt');
      (!emailOk ? email : site).focus();
      return;
    }
    hideErr(step);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Siunčiama...';

    const data = new FormData(form);
    data.append('page', location.pathname);

    function markSent() {
      form.classList.add('is-sent');
      stage.style.height = '';
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { method: 'kontaktu_anketa' });
      setTimeout(keepInView, 60);
    }

    /* Svetainė neturi formų backend'o, todėl atsakymus surenkame į laišką ir
       atidarome pašto programą. Jei kada atsiras endpoint'as — užtenka forma'i
       nurodyti `action` ir nuimti `data-mailto`. */
    const mailto = form.dataset.mailto;
    if (mailto) {
      const labels = {};
      steps.forEach(st => { if (st.dataset.key) labels[st.dataset.key] = st.dataset.label || st.dataset.key; });
      const grouped = new Map();
      for (const [k, v] of data.entries()) {
        if (!String(v).trim()) continue;
        if (!grouped.has(k)) grouped.set(k, []);
        grouped.get(k).push(v);
      }
      const lines = [];
      grouped.forEach((vals, k) => {
        lines.push((labels[k] || k) + ': ' + vals.join(', '));
      });
      const body = 'Užklausa iš ultimateautomations.com anketos\n\n' + lines.join('\n');
      const href = 'mailto:' + mailto
        + '?subject=' + encodeURIComponent('Nauja užklausa iš anketos')
        + '&body=' + encodeURIComponent(body);
      markSent();
      window.location.href = href;
      return;
    }

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('bad response');
      markSent();
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Siųsti užklausą';
      showErr(step, 'Nepavyko išsiųsti. Bandykite dar kartą arba rašykite justas@ultimateautomations.com');
    }
  });
})();

// ───────── Paslaugų accordion ─────────
document.querySelectorAll('.svc-list-item[data-desc]').forEach(item => {
  const desc = document.createElement('div');
  desc.className = 'svc-list-desc';
  desc.innerHTML = `<span>${item.dataset.desc}</span>`;
  item.insertAdjacentElement('afterend', desc);
  item.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    const list = item.closest('.svc-list');
    list.querySelectorAll('.svc-list-item.open').forEach(i => {
      i.classList.remove('open');
      i.nextElementSibling?.classList.remove('open');
    });
    if (!isOpen) {
      item.classList.add('open');
      desc.classList.add('open');
    }
  });
});

// ───────── FAQ accordion ─────────
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  if (!q) return;
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    item.closest('.faq')?.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
    });
    item.classList.toggle('open', !isOpen);
    q.setAttribute('aria-expanded', String(!isOpen));
  });
});

// ───────── Ticker: mobile tap toggle ─────────
(function () {
  const tickerTrack = document.getElementById('tickerTrack');
  if (!tickerTrack || !('ontouchstart' in window)) return;

  tickerTrack.querySelectorAll('.ticker-card').forEach(card => {
    card.addEventListener('click', () => {
      const isOpen = card.classList.contains('is-open');
      tickerTrack.querySelectorAll('.ticker-card.is-open').forEach(c => c.classList.remove('is-open'));
      if (!isOpen) {
        card.classList.add('is-open');
        tickerTrack.style.animationPlayState = 'paused';
      } else {
        tickerTrack.style.animationPlayState = 'running';
      }
    });
  });
})();

// ───────── Skaitymo progreso juosta (straipsniai) ─────────
(function () {
  const bar = document.getElementById('readBar');
  const article = document.querySelector('.post-body');
  if (!bar || !article) return;

  function update() {
    const start = article.offsetTop;
    const total = article.offsetHeight - window.innerHeight * 0.4;
    const done = (window.scrollY - start) / Math.max(total, 1);
    bar.style.width = Math.min(100, Math.max(0, done * 100)) + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ───────── Straipsnio turinys (TOC) iš h2 antraščių ─────────
(function () {
  const toc = document.getElementById('postToc');
  if (!toc) return;

  const heads = [...document.querySelectorAll('.post-body h2[id]')];
  if (!heads.length) { toc.remove(); return; }

  const list = document.createElement('ol');
  heads.forEach(h => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.dataset.toc || h.textContent;
    li.appendChild(a);
    list.appendChild(li);
  });
  toc.appendChild(list);

  const links = [...list.querySelectorAll('a')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-15% 0px -70% 0px' });
  heads.forEach(h => spy.observe(h));
})();

// ───────── Blogo filtrai pagal kategoriją ─────────
(function () {
  const filters = document.querySelectorAll('.post-filter[data-cat]');
  if (!filters.length) return;

  const rows = [...document.querySelectorAll('.post-row[data-cat]')];
  const empty = document.getElementById('postEmpty');

  filters.forEach(btn => btn.addEventListener('click', () => {
    const cat = btn.dataset.cat;
    filters.forEach(b => b.classList.toggle('active', b === btn));
    let shown = 0;
    rows.forEach(row => {
      const match = cat === 'visi' || row.dataset.cat === cat;
      row.hidden = !match;
      if (match) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }));
})();

// ───────── Pop-up: nemokamas auditas (po 30 s) ─────────
(function () {
  const DELAY = 30000;                        // kada iššoka (ms)
  const SNOOZE_DAYS = 30;                     // po uždarymo nerodome tiek dienų
  const KEY = 'ua_lead_pop';
  /* Kol svetainė neturi formų backend'o, pop-up'as išjungtas: tuščias ENDPOINT
     reiškia „nerodyti". Įrašius adresą, blokas vėl pradeda veikti. */
  const ENDPOINT = '';
  if (!ENDPOINT) return;

  // Jau paliko el. paštą arba neseniai uždarė — nerodome.
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { saved = null; }
  if (saved && saved.status === 'sent') return;
  if (saved && saved.status === 'closed' && Date.now() - saved.ts < SNOOZE_DAYS * 864e5) return;

  function remember(status) {
    try { localStorage.setItem(KEY, JSON.stringify({ status, ts: Date.now() })); } catch {}
  }

  const root = document.createElement('div');
  root.className = 'lead-pop';
  root.innerHTML = `
    <div class="lead-pop-veil" data-close></div>
    <div class="lead-pop-card" role="dialog" aria-modal="true" aria-labelledby="leadPopTitle" tabindex="-1">
      <button class="lead-pop-x" type="button" data-close aria-label="Uždaryti">×</button>
      <span class="eyebrow"><span class="arr">↳</span> Nemokamas auditas</span>
      <h2 class="lead-pop-title" id="leadPopTitle">
        Kiek pajamų jūsų el. paštas palieka <span class="ital">ant stalo?</span>
      </h2>
      <p class="lead-pop-body">
        Peržiūrime jūsų sąrašą, automatizacijas ir pristatomumą, o tada atsiunčiame konkrečias
        išvadas — ką keistume ir kokios naudos iš to tikėtis.
      </p>
      <ul class="lead-pop-list">
        <li>Srautų, sąrašo ir pristatomumo peržiūra</li>
        <li>Konkretus veiksmų planas, ne bendros frazės</li>
        <li>Atsakymas per 12 valandų</li>
      </ul>
      <form class="lead-pop-form" novalidate>
        <div class="lead-pop-field">
          <label for="leadPopEmail">Jūsų el. paštas</label>
          <input type="email" id="leadPopEmail" name="email" placeholder="vardas@imone.lt"
                 autocomplete="email" inputmode="email" required>
          <span class="lead-pop-err" id="leadPopErr">Įveskite teisingą el. pašto adresą.</span>
        </div>
        <button class="btn lead-pop-submit" type="submit">Noriu audito →</button>
        <p class="lead-pop-note">
          Be įsipareigojimų. Rašome tik dėl audito — jokio spam'o.
          Galite <a href="/#contact" data-close>užpildyti pilną formą</a>, jei norite tikslesnio atsakymo.
        </p>
      </form>
      <div class="lead-pop-done">
        <span class="ok"><span class="tick">✓</span> Ačiū — gavome jūsų el. paštą.</span>
        <span class="sub">Susisieksime per 12 valandų (dažniausiai — kur kas greičiau).</span>
      </div>
    </div>`;
  document.body.appendChild(root);

  const card = root.querySelector('.lead-pop-card');
  const form = root.querySelector('.lead-pop-form');
  const input = root.querySelector('#leadPopEmail');
  const err = root.querySelector('#leadPopErr');
  const submit = root.querySelector('.lead-pop-submit');
  let isOpen = false, lastFocus = null;

  // Netrukdome, jei žmogus kaip tik žiūri kontaktų formą.
  function contactInView() {
    const el = document.getElementById('contact');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.9 && r.bottom > 0;
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    root.classList.add('on');
    requestAnimationFrame(() => root.classList.add('in'));
    document.body.style.overflow = 'hidden';
    card.focus({ preventScroll: true });
    if (typeof gtag === 'function') gtag('event', 'popup_view', { popup: 'auditas' });
  }

  function close(reason) {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove('in');
    setTimeout(() => root.classList.remove('on'), 400);
    document.body.style.overflow = '';
    remember(reason === 'sent' ? 'sent' : 'closed');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close('closed');
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { close('closed'); return; }
    if (e.key !== 'Tab') return;
    const items = [...card.querySelectorAll('button, a[href], input')].filter(el => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  input.addEventListener('input', () => {
    input.classList.remove('err');
    err.classList.remove('show');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      input.classList.add('err');
      err.classList.add('show');
      input.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Siunčiama...';

    const data = new FormData();
    data.append('email', value);
    data.append('message', 'Nemokamo audito užklausa iš pop-up lango.');
    data.append('source', 'Pop-up · nemokamas auditas');
    data.append('page', location.pathname);
    data.append('_subject', 'Nemokamo audito užklausa (pop-up)');

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST', body: data, headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('bad response');
      card.classList.add('sent');
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { method: 'popup_auditas' });
      remember('sent');
      setTimeout(() => close('sent'), 4000);
    } catch {
      submit.disabled = false;
      submit.textContent = 'Noriu audito →';
      err.textContent = 'Nepavyko išsiųsti. Bandykite dar kartą.';
      err.classList.add('show');
    }
  });

  // Startas: po 30 s. Jei tuo metu matoma kontaktų forma — palaukiame, kol nuo jos nuslinks.
  setTimeout(function fire() {
    if (!contactInView()) { open(); return; }
    const retry = () => {
      if (contactInView()) return;
      window.removeEventListener('scroll', retry);
      open();
    };
    window.addEventListener('scroll', retry, { passive: true });
  }, DELAY);
})();

// ───────── Kontaktų teaser'is (apatinis dešinys kampas) ─────────
(function () {
  // Administravimo puslapyje jo nereikia.
  if (document.body.dataset.noDock === '1') return;

  const BOOK_URL = '/#kontaktai';

  // Ikonos — inline SVG, o ne simboliai: ☏/▦ tipo glifų Inter neturi ir
  // mobiliuosiuose jie virstų emoji (ta pati klaida kaip su rodyklėmis).
  const ICO = {
    mail: '<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="m3 6 7 5 7-5"/></svg>',
    phone: '<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3.5h-2A1.5 1.5 0 0 0 3 5.2c.3 3 1.7 5.8 3.9 8 2.2 2.2 5 3.6 8 3.9a1.5 1.5 0 0 0 1.6-1.5v-2a1.5 1.5 0 0 0-1.3-1.5c-.8-.1-1.5-.3-2.2-.6a1.5 1.5 0 0 0-1.6.3l-.8.9a12 12 0 0 1-4.3-4.3l.9-.8a1.5 1.5 0 0 0 .3-1.6c-.3-.7-.5-1.4-.6-2.2a1.5 1.5 0 0 0-1.4-1.3z"/></svg>',
    cal: '<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 3v3M13 3v3"/></svg>',
    chev: '<svg viewBox="0 0 20 20" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 5-5 5 5"/></svg>'
  };

  const root = document.createElement('div');
  root.className = 'contact-dock';
  // Mygtukas DOM'e pirmas (tab: mygtukas -> nuorodos), o CSS order jį nuleidžia žemiau.
  root.innerHTML = `
    <button class="cd-toggle" type="button" aria-expanded="false" aria-controls="contactDockPanel">
      <span>Pasikalbėkime?</span>
      <span class="cd-chev" aria-hidden="true">${ICO.chev}</span>
    </button>
    <div class="cd-panel" id="contactDockPanel">
      <a class="cd-item" href="mailto:justas@ultimateautomations.com">
        <span class="cd-ico" aria-hidden="true">${ICO.mail}</span>
        <span class="cd-txt">
          <span class="cd-k">El. paštas</span>
          <span class="cd-v">justas@ultimateautomations.com</span>
        </span>
      </a>
      <a class="cd-item cd-book" href="${BOOK_URL}">
        <span class="cd-ico" aria-hidden="true">${ICO.cal}</span>
        <span class="cd-txt">
          <span class="cd-k">Anketa</span>
          <span class="cd-v">Aptarti procesą →</span>
        </span>
      </a>
    </div>`;
  document.body.appendChild(root);

  const toggle = root.querySelector('.cd-toggle');

  // Hover'į tvarko CSS; čia — spustelėjimas (jutikliniams ekranams) ir klaviatūra.
  const setOpen = on => {
    root.classList.toggle('open', on);
    toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
  };

  toggle.addEventListener('click', () => setOpen(!root.classList.contains('open')));

  // Paspaudus šalia arba Esc — suskleidžiam.
  document.addEventListener('click', e => {
    if (!root.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('open')) {
      setOpen(false);
      toggle.blur();
    }
  });

  // Nuėjus pele šalin, „open" būsena neturi likti kabėti.
  root.addEventListener('mouseleave', () => setOpen(false));
})();
