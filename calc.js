/* NOCK Mail — pajamų skaičiuoklė (/skaiciuokle).
   Modelis nepakeistas — perkeltas iš index.html be skaičiavimo logikos pakeitimų. */

(function () {
  const turnoverEl = document.getElementById('turnover');
  const contactsEl = document.getElementById('contacts');
  const aovEl      = document.getElementById('aov');
  const segCurrent = document.getElementById('segCurrent');
  const segEngage  = document.getElementById('segEngage');
  if (!turnoverEl || !contactsEl || !aovEl || !segCurrent || !segEngage) return;

  const vTurnover = document.getElementById('vTurnover');
  const vContacts = document.getElementById('vContacts');
  const vAov      = document.getElementById('vAov');
  const rNum      = document.getElementById('rNum');
  const rCurrent  = document.getElementById('rCurrent');
  const rTotal    = document.getElementById('rTotal');
  const rShare    = document.getElementById('rShare');
  const rYear     = document.getElementById('rYear');

  let currentVal = 'none';
  let engageVal  = 'mid';

  function bindSeg(seg, onChange) {
    seg.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        seg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        onChange(b.dataset.val);
      });
    });
  }
  bindSeg(segCurrent, (v) => { currentVal = v; recalc(); });
  bindSeg(segEngage,  (v) => { engageVal  = v; recalc(); });

  function fmtEur(n) {
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(Math.round(n));
    return sign + abs.toLocaleString('lt-LT').replace(/,/g, ' ') + ' €';
  }
  function fmtPlus(n) { return (n >= 0 ? '+' : '') + fmtEur(n); }
  function fmtNum(n) { return Math.round(n).toLocaleString('lt-LT').replace(/,/g, ' '); }

  /*
   * Apyvarta: variklis per bazinę dalį (18%) → didesnė apyvarta = didesnės pajamos
   * Kontaktai: kiekvienas kontaktas → ~1€ pajamų/mėn (×K, mid = lygiai 1€)
   * AOV: kiekvienas +10€ AOV → +0.1–0.15% el. pašto dalies nuo apyvartos
   * K_mult (engageVal) → įsitraukimo kokybė 0.8 / 1.0 / 1.2 (mastelis visam rezultatui)
   * nockShare    = (0.18 + (AOV/10)*0.00125) * K_mult
   * totalMonthly = contacts * 1 * K_mult + turnover * nockShare
   */
  const currentShare = { none: 0, basic: 0.100, active: 0.1735 };
  const K_MULT       = { low: 0.8,    mid: 1.0,    high: 1.2   };

  const animState = { num: 0, current: 0, total: 0, year: 0, share: 0 };
  let animRaf = null;
  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateTo(targets) {
    cancelAnimationFrame(animRaf);
    const start = { ...animState };
    const t0 = performance.now();
    const dur = 600;
    function step(now) {
      const t = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      animState.num     = lerp(start.num,     targets.num,     e);
      animState.current = lerp(start.current, targets.current, e);
      animState.total   = lerp(start.total,   targets.total,   e);
      animState.year    = lerp(start.year,    targets.year,    e);
      animState.share   = lerp(start.share,   targets.share,   e);
      rNum.textContent     = fmtPlus(animState.num);
      rCurrent.textContent = fmtEur(animState.current);
      rTotal.textContent   = fmtEur(animState.total);
      rShare.textContent   = animState.share.toFixed(1) + '%';
      rYear.textContent    = fmtPlus(animState.year);
      if (t < 1) animRaf = requestAnimationFrame(step);
    }
    animRaf = requestAnimationFrame(step);
  }

  function recalc() {
    const turnover = parseInt(turnoverEl.value, 10);
    const contacts = parseInt(contactsEl.value, 10);
    const aov      = parseInt(aovEl.value, 10);
    vTurnover.textContent = fmtNum(turnover);
    vContacts.textContent = fmtNum(contacts);
    vAov.textContent      = fmtNum(aov);

    const K_mult = K_MULT[engageVal];

    // Apyvartos dalis: bazė 18% + AOV svertas (+0.125%/10€), ×K pagal įsitraukimą
    const nockShare       = (0.18 + (aov / 10) * 0.00125) * K_mult;
    // Kiekvienas kontaktas → ~1€ pajamų (×K: 0.8 / 1.0 / 1.2)
    const contactRevenue  = contacts * 1.0 * K_mult;
    // Apyvartos variklis: didesnė apyvarta → reikšmingai didesnės pajamos
    const turnoverRevenue = turnover * nockShare;

    const totalMonthly   = contactRevenue + turnoverRevenue;
    const currentMonthly = Math.min(turnover * currentShare[currentVal], totalMonthly);
    const additional     = Math.max(0, totalMonthly - currentMonthly);
    // Dalis nuo apyvartos (rodymui ribojama iki 60%, kad nebūtų nerealistiškų reikšmių)
    const sharePct       = turnover > 0 ? Math.min(60, (totalMonthly / turnover) * 100) : 0;

    animateTo({
      num: additional,
      current: currentMonthly,
      total: totalMonthly,
      year: additional * 12,
      share: sharePct,
    });
  }

  turnoverEl.addEventListener('input', recalc);
  contactsEl.addEventListener('input', recalc);
  aovEl.addEventListener('input', recalc);
  recalc();
})();
