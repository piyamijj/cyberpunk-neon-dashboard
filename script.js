const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');

/* ===== YILDIZ ALANI ===== */
const sc = $('#stars'), sx = sc.getContext('2d');
let stars = [];
function initStars() {
  sc.width = innerWidth; sc.height = innerHeight;
  const n = Math.min(400, Math.floor(innerWidth * innerHeight / 5000));
  stars = Array.from({ length: n }, () => ({ x: Math.random() * sc.width, y: Math.random() * sc.height, z: Math.random() * 1.5 + 0.3, t: Math.random() * Math.PI * 2 }));
}
let shooting = null;
function drawStars() {
  sx.clearRect(0, 0, sc.width, sc.height);
  for (const s of stars) {
    s.t += 0.02; s.y += s.z * 0.15;
    if (s.y > sc.height) { s.y = 0; s.x = Math.random() * sc.width; }
    const a = 0.45 + Math.sin(s.t) * 0.35;
    sx.fillStyle = `rgba(${s.z > 1.5 ? '255,43,214' : '160,240,255'},${a})`;
    sx.beginPath(); sx.arc(s.x, s.y, s.z, 0, Math.PI * 2); sx.fill();
  }
  if (!shooting && Math.random() < 0.004) shooting = { x: Math.random() * sc.width, y: Math.random() * sc.height * 0.4, life: 1 };
  if (shooting) {
    const g = sx.createLinearGradient(shooting.x, shooting.y, shooting.x - 120, shooting.y - 60);
    g.addColorStop(0, `rgba(0,240,255,${shooting.life})`); g.addColorStop(1, 'rgba(0,240,255,0)');
    sx.strokeStyle = g; sx.lineWidth = 2; sx.beginPath(); sx.moveTo(shooting.x, shooting.y); sx.lineTo(shooting.x - 120, shooting.y - 60); sx.stroke();
    shooting.x += 9; shooting.y += 4.5; shooting.life -= 0.02;
    if (shooting.life <= 0) shooting = null;
  }
  requestAnimationFrame(drawStars);
}
initStars(); drawStars();

/* ===== CANLI SAAT ===== */
const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const startTime = Date.now();
function tickClock() {
  const d = new Date();
  $('#clock').innerHTML = `${pad(d.getHours())}<span class='blink'>:</span>${pad(d.getMinutes())}<span class='blink'>:</span>${pad(d.getSeconds())}`;
  $('#date').textContent = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  const off = -d.getTimezoneOffset() / 60;
  $('#tz').textContent = (off >= 0 ? '+' : '') + off;
  $('#secFill').style.width = ((d.getSeconds() + d.getMilliseconds() / 1000) / 60 * 100) + '%';
  const up = Math.floor((Date.now() - startTime) / 1000);
  $('#uptime').textContent = `${pad(Math.floor(up / 3600))}:${pad(Math.floor(up / 60) % 60)}:${pad(up % 60)}`;
}
tickClock(); setInterval(tickClock, 250);

/* ===== PİYASA GRAFİĞİ ===== */
const ASSETS = {
  BTC: { label: 'BTC/USD', base: 67250, vol: 0.0035, dec: 2, sym: '$' },
  ETH: { label: 'ETH/USD', base: 3480, vol: 0.0045, dec: 2, sym: '$' },
  SOL: { label: 'SOL/USD', base: 152, vol: 0.006, dec: 2, sym: '$' },
  USDTRY: { label: 'USD/TRY', base: 32.45, vol: 0.0009, dec: 4, sym: '₺' },
  EURTRY: { label: 'EUR/TRY', base: 35.10, vol: 0.0011, dec: 4, sym: '₺' }
};
const POINTS = 90;
const series = {};
function nextVal(v, a) {
  const drift = (a.base - v) / a.base * 0.05;
  return v * (1 + (Math.random() - 0.5) * 2 * a.vol + drift);
}
for (const k in ASSETS) {
  const a = ASSETS[k]; let v = a.base * (1 + (Math.random() - 0.5) * 0.02); const arr = [];
  for (let i = 0; i < POINTS; i++) { v = nextVal(v, a); arr.push(v); }
  series[k] = { data: arr, open: arr[0], vol: Math.random() * 5e5 + 1e5 };
}
let current = 'BTC', paused = false, hoverX = null, lastPrice = null;
const cv = $('#chart'), cx = cv.getContext('2d'), tt = $('#tooltip');
const fmt = (v, a) => a.sym + v.toLocaleString('tr-TR', { minimumFractionDigits: a.dec, maximumFractionDigits: a.dec });

function resizeChart() {
  const r = cv.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawChart() {
  const a = ASSETS[current], s = series[current], d = s.data;
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  cx.clearRect(0, 0, w, h);
  const P = { l: 10, r: 70, t: 16, b: 18 };
  let min = Math.min(...d), max = Math.max(...d);
  const range = (max - min) || 1; min -= range * 0.12; max += range * 0.12;
  const X = i => P.l + i * (w - P.l - P.r) / (d.length - 1);
  const Y = v => P.t + (1 - (v - min) / (max - min)) * (h - P.t - P.b);
  const lblDec = a.dec > 2 ? 3 : 1;

  cx.lineWidth = 1; cx.font = '10px Share Tech Mono, monospace';
  for (let i = 0; i <= 4; i++) {
    const y = P.t + i * (h - P.t - P.b) / 4;
    cx.strokeStyle = 'rgba(0,240,255,0.07)';
    cx.beginPath(); cx.moveTo(P.l, y); cx.lineTo(w - P.r, y); cx.stroke();
    cx.fillStyle = 'rgba(160,240,255,0.5)';
    cx.fillText((max - i * (max - min) / 4).toFixed(lblDec), w - P.r + 6, y + 3);
  }
  for (let i = 0; i <= 8; i++) {
    const x = P.l + i * (w - P.l - P.r) / 8;
    cx.strokeStyle = 'rgba(255,43,214,0.05)';
    cx.beginPath(); cx.moveTo(x, P.t); cx.lineTo(x, h - P.b); cx.stroke();
  }

  const up = d[d.length - 1] >= s.open;
  const col = up ? '#00f0ff' : '#ff2bd6';
  const g = cx.createLinearGradient(0, P.t, 0, h - P.b);
  g.addColorStop(0, up ? 'rgba(0,240,255,0.35)' : 'rgba(255,43,214,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  cx.beginPath(); cx.moveTo(X(0), Y(d[0]));
  d.forEach((v, i) => cx.lineTo(X(i), Y(v)));
  cx.lineTo(X(d.length - 1), h - P.b); cx.lineTo(X(0), h - P.b); cx.closePath();
  cx.fillStyle = g; cx.fill();

  cx.beginPath();
  d.forEach((v, i) => i ? cx.lineTo(X(i), Y(v)) : cx.moveTo(X(i), Y(v)));
  cx.strokeStyle = col; cx.lineWidth = 2; cx.shadowColor = col; cx.shadowBlur = 14; cx.stroke(); cx.shadowBlur = 0;

  cx.setLineDash([4, 4]); cx.strokeStyle = 'rgba(245,255,59,0.45)'; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(P.l, Y(s.open)); cx.lineTo(w - P.r, Y(s.open)); cx.stroke(); cx.setLineDash([]);

  const lx = X(d.length - 1), ly = Y(d[d.length - 1]);
  const pulse = (Date.now() % 1200) / 1200;
  cx.globalAlpha = 1 - pulse; cx.strokeStyle = col; cx.lineWidth = 2;
  cx.beginPath(); cx.arc(lx, ly, 3 + pulse * 12, 0, Math.PI * 2); cx.stroke(); cx.globalAlpha = 1;
  cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(lx, ly, 3, 0, Math.PI * 2); cx.fill();
  cx.fillStyle = col; cx.fillRect(w - P.r + 2, ly - 8, P.r - 4, 16);
  cx.fillStyle = '#07060f'; cx.fillText(d[d.length - 1].toFixed(lblDec), w - P.r + 6, ly + 3);

  if (hoverX !== null) {
    let i = Math.round((hoverX - P.l) / (w - P.l - P.r) * (d.length - 1));
    i = Math.max(0, Math.min(d.length - 1, i));
    const hx = X(i), hy = Y(d[i]);
    cx.strokeStyle = 'rgba(245,255,59,0.5)'; cx.setLineDash([3, 3]);
    cx.beginPath(); cx.moveTo(hx, P.t); cx.lineTo(hx, h - P.b); cx.moveTo(P.l, hy); cx.lineTo(w - P.r, hy); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = '#f5ff3b'; cx.shadowColor = '#f5ff3b'; cx.shadowBlur = 10;
    cx.beginPath(); cx.arc(hx, hy, 4, 0, Math.PI * 2); cx.fill(); cx.shadowBlur = 0;
    const diff = ((d[i] - s.open) / s.open * 100).toFixed(2);
    tt.style.display = 'block';
    tt.innerHTML = `<b>${fmt(d[i], a)}</b><br>T-${d.length - 1 - i}sn · ${diff >= 0 ? '+' : ''}${diff}%`;
    tt.style.left = Math.min(hx + 12, w - 150) + 'px';
    tt.style.top = Math.max(hy - 50, 4) + 'px';
  } else tt.style.display = 'none';
}

function updateStats() {
  const a = ASSETS[current], s = series[current], d = s.data, last = d[d.length - 1];
  const priceEl = $('#price');
  priceEl.textContent = fmt(last, a);
  if (lastPrice !== null && lastPrice !== last) {
    priceEl.classList.remove('flash-up', 'flash-down');
    void priceEl.offsetWidth;
    priceEl.classList.add(last > lastPrice ? 'flash-up' : 'flash-down');
    setTimeout(() => priceEl.classList.remove('flash-up', 'flash-down'), 500);
  }
  lastPrice = last;
  const ch = (last - s.open) / s.open * 100;
  const chEl = $('#change');
  chEl.textContent = `${ch >= 0 ? '▲ +' : '▼ '}${ch.toFixed(2)}%`;
  chEl.className = 'change ' + (ch >= 0 ? 'up' : 'down');
  $('#assetName').textContent = a.label;
  $('#high').textContent = fmt(Math.max(...d), a);
  $('#low').textContent = fmt(Math.min(...d), a);
  $('#vol').textContent = (s.vol / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + 'K';
}

setInterval(() => {
  if (paused) return;
  for (const k in series) {
    const s = series[k];
    s.data.push(nextVal(s.data[s.data.length - 1], ASSETS[k]));
    s.data.shift();
    s.vol += Math.random() * 3000;
  }
  updateStats();
}, 1000);

function chartLoop() { drawChart(); requestAnimationFrame(chartLoop); }

$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('.tab'); if (!b) return;
  document.querySelectorAll('#tabs .tab').forEach(t => t.classList.remove('active'));
  b.classList.add('active'); current = b.dataset.asset; lastPrice = null; updateStats();
});
$('#pauseBtn').addEventListener('click', e => {
  paused = !paused;
  e.target.textContent = paused ? 'DEVAM' : 'DURDUR';
  e.target.classList.toggle('on', paused);
});
cv.addEventListener('mousemove', e => { hoverX = e.offsetX; });
cv.addEventListener('mouseleave', () => { hoverX = null; });
cv.addEventListener('touchmove', e => { const r = cv.getBoundingClientRect(); hoverX = e.touches[0].clientX - r.left; }, { passive: true });
cv.addEventListener('touchstart', e => { const r = cv.getBoundingClientRect(); hoverX = e.touches[0].clientX - r.left; }, { passive: true });
cv.addEventListener('touchend', () => { hoverX = null; });

resizeChart(); updateStats(); chartLoop();
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { initStars(); resizeChart(); }, 120);
});

/* ===== GÖREV LİSTESİ ===== */
const KEY = 'neon-core-todos';
const PRIO = { low: 'DÜŞÜK', mid: 'ORTA', high: 'YÜKSEK' };
let todos;
try { todos = JSON.parse(localStorage.getItem(KEY)); } catch (err) { todos = null; }
if (!Array.isArray(todos)) {
  todos = [
    { id: 't1', text: 'Yörünge sensörlerini kalibre et', done: false, prio: 'high' },
    { id: 't2', text: 'Neural link firmware güncellemesi', done: false, prio: 'mid' },
    { id: 't3', text: 'Kripto cüzdanını soğuk depoya yedekle', done: false, prio: 'low' },
    { id: 't4', text: 'Mars kolonisi raporunu incele', done: true, prio: 'mid' }
  ];
}
let filter = 'all';
const list = $('#todoList');
const save = () => localStorage.setItem(KEY, JSON.stringify(todos));

function render() {
  list.innerHTML = '';
  const visible = todos.filter(t => filter === 'all' ? true : filter === 'done' ? t.done : !t.done);
  if (!visible.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Görev yok — sistem boşta.';
    list.appendChild(li);
  }
  visible.forEach(t => {
    const li = document.createElement('li');
    li.className = 'todo p-' + t.prio + (t.done ? ' done' : '');
    li.dataset.id = t.id;
    li.draggable = filter === 'all';
    li.innerHTML = `<span class='handle' title='Sürükle'>⋮⋮</span><button class='check' aria-label='Tamamla'></button><span class='text'></span><span class='prio'>${PRIO[t.prio]}</span><button class='del' aria-label='Sil'>✕</button>`;
    li.querySelector('.text').textContent = t.text;
    list.appendChild(li);
  });
  const active = todos.filter(t => !t.done).length;
  $('#todoCount').textContent = `${active} AKTİF / ${todos.length}`;
}

$('#todoForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#todoInput');
  const text = input.value.trim();
  if (!text) { $('.todo-card').classList.add('shake'); setTimeout(() => $('.todo-card').classList.remove('shake'), 400); return; }
  todos.unshift({ id: 't' + Date.now(), text, done: false, prio: $('#todoPrio').value });
  input.value = ''; save(); render();
});

list.addEventListener('click', e => {
  const li = e.target.closest('.todo'); if (!li) return;
  const t = todos.find(x => x.id === li.dataset.id); if (!t) return;
  if (e.target.closest('.check')) { t.done = !t.done; save(); render(); }
  else if (e.target.closest('.del')) {
    li.classList.add('removing');
    setTimeout(() => { todos = todos.filter(x => x.id !== t.id); save(); render(); }, 300);
  }
});

list.addEventListener('dblclick', e => {
  const span = e.target.closest('.text'); if (!span) return;
  const li = span.closest('.todo');
  span.contentEditable = 'true'; li.draggable = false; span.focus();
  const range = document.createRange(); range.selectNodeContents(span);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
  const finish = () => {
    span.contentEditable = 'false';
    const t = todos.find(x => x.id === li.dataset.id);
    const val = span.textContent.trim();
    if (t && val) t.text = val;
    save(); render();
  };
  span.addEventListener('blur', finish, { once: true });
  span.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); span.blur(); } if (ev.key === 'Escape') { span.textContent = todos.find(x => x.id === li.dataset.id).text; span.blur(); } });
});

function getAfter(y) {
  const els = [...list.querySelectorAll('.todo:not(.dragging)')];
  return els.reduce((c, el) => {
    const b = el.getBoundingClientRect();
    const off = y - b.top - b.height / 2;
    return off < 0 && off > c.off ? { off, el } : c;
  }, { off: -Infinity, el: null }).el;
}
function moveDragged(y) {
  const drag = list.querySelector('.dragging'); if (!drag) return;
  const after = getAfter(y);
  if (after == null) list.appendChild(drag); else if (after !== drag) list.insertBefore(drag, after);
}
function commitOrder() {
  const ids = [...list.querySelectorAll('.todo')].map(l => l.dataset.id);
  todos.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  save(); render();
}
list.addEventListener('dragstart', e => {
  const li = e.target.closest('.todo'); if (!li) return;
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', li.dataset.id);
});
list.addEventListener('dragover', e => { e.preventDefault(); moveDragged(e.clientY); });
list.addEventListener('drop', e => e.preventDefault());
list.addEventListener('dragend', e => {
  const li = e.target.closest('.todo'); if (li) li.classList.remove('dragging');
  commitOrder();
});

let touchDrag = null;
list.addEventListener('touchstart', e => {
  const h = e.target.closest('.handle'); if (!h || filter !== 'all') return;
  touchDrag = h.closest('.todo'); touchDrag.classList.add('dragging');
}, { passive: true });
list.addEventListener('touchmove', e => {
  if (!touchDrag) return;
  e.preventDefault();
  moveDragged(e.touches[0].clientY);
}, { passive: false });
list.addEventListener('touchend', () => {
  if (!touchDrag) return;
  touchDrag.classList.remove('dragging'); touchDrag = null; commitOrder();
});

$('#filters').addEventListener('click', e => {
  const b = e.target.closest('.tab'); if (!b) return;
  document.querySelectorAll('#filters .tab').forEach(t => t.classList.remove('active'));
  b.classList.add('active'); filter = b.dataset.filter; render();
});
$('#clearDone').addEventListener('click', () => { todos = todos.filter(t => !t.done); save(); render(); });
render();

/* ===== HESAP MAKİNESİ ===== */
const OPS = '+-*/';
const DIGITS = '0123456789';
let expr = '', justEval = false;
const exprEl = $('#calcExpr'), resEl = $('#calcResult');

function pretty(s) { return s.split('*').join('×').split('/').join('÷').split('-').join('−'); }
function formatNum(n) {
  if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-7 && n !== 0)) return n.toExponential(4);
  return String(n);
}
function showResult(text, err) {
  resEl.textContent = text;
  resEl.classList.toggle('small', text.length > 11);
  resEl.classList.toggle('err', !!err);
}

function evaluate(s) {
  const tokens = []; let num = '';
  for (const c of s) {
    if (DIGITS.includes(c) || c === '.') num += c;
    else if (c === '-' && num === '' && (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string')) num = '-';
    else if (c === '%') {
      if (num !== '') { const v = parseFloat(num); if (isNaN(v)) return null; tokens.push(v / 100); num = ''; }
      else if (typeof tokens[tokens.length - 1] === 'number') tokens[tokens.length - 1] /= 100;
    } else {
      if (num !== '') { const v = parseFloat(num); if (isNaN(v)) return null; tokens.push(v); num = ''; }
      tokens.push(c);
    }
  }
  if (num !== '') { const v = parseFloat(num); if (isNaN(v)) { if (num !== '-') return null; } else tokens.push(v); }
  while (tokens.length && typeof tokens[tokens.length - 1] === 'string') tokens.pop();
  if (!tokens.length) return null;
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const out = [], st = [];
  for (const t of tokens) {
    if (typeof t === 'number') out.push(t);
    else { while (st.length && prec[st[st.length - 1]] >= prec[t]) out.push(st.pop()); st.push(t); }
  }
  while (st.length) out.push(st.pop());
  const stack = [];
  for (const t of out) {
    if (typeof t === 'number') { stack.push(t); continue; }
    const b = stack.pop(), a = stack.pop();
    if (a === undefined || b === undefined) return null;
    if (t === '+') stack.push(a + b);
    else if (t === '-') stack.push(a - b);
    else if (t === '*') stack.push(a * b);
    else { if (b === 0) return null; stack.push(a / b); }
  }
  if (stack.length !== 1 || !isFinite(stack[0])) return null;
  return parseFloat(stack[0].toPrecision(12));
}

function update() {
  exprEl.textContent = pretty(expr) || ' ';
  if (!expr) { showResult('0'); return; }
  const r = evaluate(expr);
  if (r !== null) showResult(formatNum(r));
}

function lastNumStart() {
  let i = expr.length;
  while (i > 0 && (DIGITS.includes(expr[i - 1]) || expr[i - 1] === '.')) i--;
  return i;
}

function press(k) {
  if (k === 'C') { expr = ''; justEval = false; update(); return; }
  if (k === 'back') { if (justEval) { expr = ''; justEval = false; } expr = expr.slice(0, -1); update(); return; }
  if (k === '=') {
    if (!expr) return;
    const r = evaluate(expr);
    exprEl.textContent = pretty(expr) + ' =';
    if (r === null) {
      showResult('HATA', true); expr = '';
      const card = $('#calcCard'); card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 400);
    } else { expr = formatNum(r).includes('e') ? String(r) : formatNum(r); showResult(formatNum(r)); }
    justEval = true; return;
  }
  if (k === 'neg') {
    const i = lastNumStart();
    if (i === expr.length) return;
    if (i > 0 && expr[i - 1] === '-' && (i === 1 || OPS.includes(expr[i - 2]))) expr = expr.slice(0, i - 1) + expr.slice(i);
    else expr = expr.slice(0, i) + '-' + expr.slice(i);
    justEval = false; update(); return;
  }
  if (OPS.includes(k)) {
    justEval = false;
    if (!expr) { if (k === '-') { expr = '-'; update(); } return; }
    const last = expr.slice(-1);
    if (OPS.includes(last)) { if (expr.length === 1) return; expr = expr.slice(0, -1) + k; }
    else expr += k;
    update(); return;
  }
  if (k === '%') {
    const last = expr.slice(-1);
    if (!expr || OPS.includes(last) || last === '%') return;
    justEval = false; expr += '%'; update(); return;
  }
  if (justEval) { expr = ''; justEval = false; }
  if (expr.slice(-1) === '%') expr += '*';
  if (k === '.') {
    const i = lastNumStart();
    if (expr.slice(i).includes('.')) return;
    if (i === expr.length) expr += '0';
  }
  if (expr.length > 40) return;
  expr += k; update();
}

function flashKey(k) {
  const btn = document.querySelector(`.key[data-key='${k}']`);
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 130);
}

$('#keys').addEventListener('click', e => {
  const b = e.target.closest('.key'); if (!b) return;
  press(b.dataset.key);
});

document.addEventListener('keydown', e => {
  const a = document.activeElement;
  if (a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.isContentEditable)) return;
  let k = null;
  if (DIGITS.includes(e.key) || OPS.includes(e.key) || e.key === '%') k = e.key;
  else if (e.key === '.' || e.key === ',') k = '.';
  else if (e.key === 'Enter' || e.key === '=') k = '=';
  else if (e.key === 'Backspace') k = 'back';
  else if (e.key === 'Escape' || e.key === 'Delete') k = 'C';
  if (k === null || e.key.length > 1 && !['Enter', 'Backspace', 'Escape', 'Delete'].includes(e.key)) return;
  e.preventDefault();
  press(k); flashKey(k);
});

update();
