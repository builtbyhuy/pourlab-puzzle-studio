// Explain a single actual state change. This module never moves game state,
// delays an input, changes focus or queues playback animations.
const board = document.getElementById('bottle-board');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let keyboard = false, previous = null, active = null, animations = [];
let enabled = !reduced.matches;
const preference = document.getElementById('motion-preference');
function syncPreference() {
  document.documentElement.dataset.interactiveMotion = enabled ? 'on' : 'off';
  if (preference) { preference.setAttribute('aria-pressed', String(enabled)); preference.textContent = enabled ? 'Motion on' : 'Motion off'; preference.disabled = reduced.matches; preference.title = reduced.matches ? 'Motion is off because your system requests reduced motion.' : 'Turn interactive motion on or off'; }
}
if (preference) preference.onclick = () => { enabled = !enabled; syncPreference(); if (!enabled) cancel(); };
syncPreference();
document.addEventListener('keydown', () => { keyboard = true; }, { capture: true });
document.addEventListener('pointerdown', () => { keyboard = false; }, { capture: true, passive: true });
function cancel() { animations.forEach(animation => animation.cancel()); animations = []; active?.remove(); active = null; }
function snapshot() {
  return { mode: document.querySelector('[data-mode].active')?.dataset.mode,
    bottles: [...board.querySelectorAll('.bottle-wrap')].map(wrap => {
      const glass = wrap.querySelector('.bottle-glass');
      return { colors: [...glass.querySelectorAll('[data-color]')].map(slot => slot.dataset.color), glass,
        rect: glass.getBoundingClientRect() };
    }) };
}
const same = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);
function transfer(before, after) {
  if (!before || before.mode !== after.mode || after.mode === 'edit' || before.bottles.length !== after.bottles.length) return null;
  const changed = before.bottles.map((bottle, i) => same(bottle.colors, after.bottles[i].colors) ? -1 : i).filter(i => i >= 0);
  if (changed.length !== 2) return null;
  const from = changed.find(i => before.bottles[i].colors.length > after.bottles[i].colors.length);
  const to = changed.find(i => before.bottles[i].colors.length < after.bottles[i].colors.length);
  if (from === undefined || to === undefined) return null;
  const source = before.bottles[from].colors, sourceAfter = after.bottles[from].colors;
  const dest = before.bottles[to].colors, destAfter = after.bottles[to].colors;
  const moved = source.slice(sourceAfter.length);
  if (!moved.length || !same(source.slice(0, sourceAfter.length), sourceAfter) || !same(destAfter.slice(0, dest.length), dest)
    || !same(destAfter.slice(dest.length), moved) || moved.some(c => c !== moved[0])) return null;
  return { from, to, color: moved[0] };
}
function drawPour(move, after) {
  cancel();
  if (!enabled || keyboard || reduced.matches || document.hidden) return;
  const source = after.bottles[move.from], target = after.bottles[move.to];
  if (source.rect.bottom < 0 || source.rect.top > innerHeight || target.rect.bottom < 0 || target.rect.top > innerHeight) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('pour-trace'); svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
  const path = document.createElementNS(svg.namespaceURI, 'path');
  const start = source.rect.x + source.rect.width / 2, end = target.rect.x + target.rect.width / 2;
  const y1 = source.rect.y + 8, y2 = target.rect.y + 8;
  const lift = Math.min(65, Math.max(28, Math.abs(end - start) * .18));
  path.setAttribute('d', `M ${start} ${y1} C ${start} ${y1-lift}, ${end} ${y2-lift}, ${end} ${y2}`);
  const layer = target.glass.querySelector(`[data-color="${move.color}"]`);
  path.setAttribute('stroke', getComputedStyle(layer).getPropertyValue('--liquid').trim() || '#80c5ed');
  path.setAttribute('stroke-width', '7');
  svg.append(path); document.body.append(svg); active = svg;
  const length = path.getTotalLength(); path.style.strokeDasharray = length;
  animations.push(path.animate([{ strokeDashoffset: length, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, offset: .45 }, { strokeDashoffset: -length, opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.25,.7,.3,1)' }));
  animations.push(source.glass.animate([{ transform: 'translateY(-10px) rotate(0deg)' }, { transform: `translateY(-18px) rotate(${end > start ? 8 : -8}deg)`, offset: .35 }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }));
  animations.push(target.glass.animate([{ boxShadow: '0 0 0 3px #e5f39288' }, { boxShadow: '0 0 0 0px #e5f39200' }], { duration: 650 }));
  animations[0].finished.then(() => { if (active === svg) cancel(); }).catch(() => {});
}
if (board) {
  previous = snapshot();
  document.documentElement.dataset.instrumentMode = previous.mode;
  new MutationObserver(() => {
    const after = snapshot(), modeChanged = previous && previous.mode !== after.mode, move = transfer(previous, after); previous = after;
    document.documentElement.dataset.instrumentMode = after.mode;
    if (move) drawPour(move, after); else {
      cancel();
      if (modeChanged && enabled && !keyboard && !reduced.matches && !document.hidden) {
        after.bottles.forEach((bottle, i) => { if (bottle.glass.animate) animations.push(bottle.glass.animate([{ transform: 'translateY(7px)', opacity: .45 }, { transform: 'none', opacity: 1 }], { duration: 240, delay: i * 18, easing: 'cubic-bezier(.2,.8,.2,1)' })); });
      }
    }
  }).observe(board, { childList: true });
}
addEventListener('resize', cancel, { passive: true });
addEventListener('scroll', cancel, { passive: true });
document.addEventListener('visibilitychange', cancel);
reduced.addEventListener('change', () => { if (reduced.matches) { enabled = false; syncPreference(); cancel(); } });
