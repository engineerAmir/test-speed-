(() => {
  if (window.nicheyBrandsRuntime) return;
  window.nicheyBrandsRuntime = true;
  const instances = new Map();
  function init(wrapper) {
    if (instances.has(wrapper)) return;
    const abort = new AbortController(), options = {signal: abort.signal};
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, visible = false, hovered = false, touching = false, dragging = false;
    let width = 0, current = 0, previous = 0, startX = 0, startScroll = 0, dragged = false;
    function stop() { cancelAnimationFrame(frame); frame = 0; }
    function allowed() { return wrapper.isConnected && visible && !document.hidden && !reduced.matches && !hovered && !touching && !dragging && width > 0; }
    function resume() { if (!allowed() || frame) return; current = wrapper.scrollLeft; previous = performance.now(); frame = requestAnimationFrame(step); }
    function sync() { if (allowed()) resume(); else stop(); }
    function step(now) {
      frame = 0;
      if (!allowed()) return;
      current += 80 * Math.min((now - previous) / 1000, 0.1);
      if (current >= width * 2) current -= width;
      wrapper.scrollLeft = current; previous = now;
      frame = requestAnimationFrame(step);
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(wrapper);
    function measure() {
      const next = wrapper.scrollWidth / 3;
      if (next <= 0) return;
      const first = width === 0; width = next;
      if (first) wrapper.scrollLeft = width;
      current = wrapper.scrollLeft; sync();
    }
    const resize = new ResizeObserver(measure);
    resize.observe(wrapper);
    const track = wrapper.querySelector('.brands-track'); if (track) resize.observe(track);
    wrapper.addEventListener('load', measure, {...options, capture:true});
    wrapper.addEventListener('mouseenter', () => { hovered = true; sync(); }, options);
    wrapper.addEventListener('mouseleave', () => { hovered = false; dragging = false; sync(); }, options);
    wrapper.addEventListener('mousedown', e => { if(e.button !== 0) return; dragging = true; dragged = false; startX = e.clientX; startScroll = wrapper.scrollLeft; stop(); }, options);
    wrapper.addEventListener('mousemove', e => {
      if (!dragging || !width) return;
      const distance = (e.clientX - startX) * 1.5;
      if (Math.abs(distance) > 5) dragged = true;
      e.preventDefault(); current = startScroll - distance;
      if (current <= 0) { current += width; startScroll += width; }
      else if (current >= width * 2) { current -= width; startScroll -= width; }
      wrapper.scrollLeft = current;
    }, options);
    document.addEventListener('mouseup', () => { dragging = false; sync(); }, options);
    wrapper.addEventListener('touchstart', () => { touching = true; dragged = false; stop(); }, {...options,passive:true});
    for (const name of ['touchend','touchcancel']) wrapper.addEventListener(name, () => { touching = false; sync(); }, {...options,passive:true});
    wrapper.addEventListener('click', e => { if (dragged) { e.preventDefault(); dragged = false; } }, options);
    document.addEventListener('visibilitychange', sync, options);
    reduced.addEventListener('change', sync, options);
    instances.set(wrapper, () => { stop(); abort.abort(); observer.disconnect(); resize.disconnect(); instances.delete(wrapper); });
  }
  function scan() { document.querySelectorAll('.luxury-brands .brands-wrapper').forEach(init); }
  document.addEventListener('shopify:section:load', scan);
  document.addEventListener('shopify:section:unload', event => {
    for (const [wrapper, dispose] of instances) if (event.target.contains(wrapper)) dispose();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, {once:true}); else scan();
})();
