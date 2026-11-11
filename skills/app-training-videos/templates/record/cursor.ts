/** Injected into every page: a visible arrow cursor and a click ripple (recordings hide the real cursor). */
export const CURSOR_SCRIPT = `
(() => {
  if (window.__cursorReady) return;
  window.__cursorReady = true;
  const css = '#__cur{position:fixed;left:0;top:0;width:36px;height:36px;z-index:2147483647;pointer-events:none;transform:translate(-120px,-120px);transition:transform 750ms cubic-bezier(.22,.8,.3,1);filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))}'
    + '#__rip{position:fixed;z-index:2147483646;pointer-events:none;border-radius:50%;border:5px solid #e11d48;width:24px;height:24px;margin:-12px 0 0 -12px;opacity:.95;animation:__rip 650ms ease-out forwards}'
    + '@keyframes __rip{to{transform:scale(4.2);opacity:0}}';
  const setup = () => {
    if (document.getElementById('__cur')) return;
    const style = document.createElement('style');
    style.textContent = css;
    document.documentElement.appendChild(style);
    const cur = document.createElement('div');
    cur.id = '__cur';
    cur.innerHTML = '<svg viewBox="0 0 24 24" width="36" height="36"><path d="M3 2l7.6 19.2 2.7-7.6L21 10.8z" fill="#111" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(cur);
    let last = null;
    try { last = JSON.parse(sessionStorage.getItem('__curpos') || 'null'); } catch (e) {}
    if (last) {
      cur.style.transition = 'none';
      cur.style.transform = 'translate(' + last.x + 'px,' + last.y + 'px)';
      void cur.offsetWidth;
      cur.style.transition = '';
    }
  };
  window.__moveCursor = (x, y) => {
    setup();
    const cur = document.getElementById('__cur');
    cur.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    try { sessionStorage.setItem('__curpos', JSON.stringify({ x, y })); } catch (e) {}
  };
  window.__ripple = (x, y) => {
    setup();
    const r = document.createElement('div');
    r.id = '__rip';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    document.documentElement.appendChild(r);
    setTimeout(() => r.remove(), 700);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
`;
