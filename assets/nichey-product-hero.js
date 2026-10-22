/* Native links/forms remain usable without enhancement. One hero owns its state. */
(() => {
class NicheyProductHero extends HTMLElement {
  connectedCallback() {
    this.abort?.abort(); this.abort = new AbortController();
    const signal = this.abort.signal;
    this.addEventListener('keydown', event => {const wishlist=event.target.closest('.ny-wishlist');if(wishlist && (event.key==='Enter'||event.key===' ') && !event.defaultPrevented){event.preventDefault();wishlist.click();}},{signal});
    this.addEventListener('click', event => {
      const link = event.target.closest('[data-option]');
      if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) {
        const url = new URL(link.href); if (url.pathname !== new URL(this.dataset.productUrl, location.origin).pathname) return;
        event.preventDefault(); this.update(url, link.dataset.optionId);
      }
      const step = event.target.closest('[data-step]');
      if (step) { const input = this.querySelector('[name=quantity]'); if (!input) return; Number(step.dataset.step) > 0 ? input.stepUp() : input.stepDown(); input.dispatchEvent(new Event('change', {bubbles:true})); }
    }, {signal});
    this.addEventListener('submit', async event => {
      if (this.pending || this.adding) { event.preventDefault(); return; }
      // Shopify owns its Buy It Now component; only ordinary add submissions use the drawer.
      if (event.submitter?.closest('.ny-native-buy,.shopify-payment-button')) return;
      const form = event.target.closest('.ny-product-form');
      if (!form || !window.NicheyCart) return;
      event.preventDefault(); if (!form.reportValidity()) return;
      const data = new FormData(form); this.adding = true; this.setAttribute('aria-busy','true');
      const buttons = [...form.querySelectorAll('button[type=submit]')];
      buttons.forEach(button=>{button.disabled=true;button.setAttribute('aria-busy','true');});
      const status = this.querySelector('[data-status]'); if(status) status.textContent = '';
      try { await window.NicheyCart.add(data, this); }
      catch (error) { if(status) status.textContent = error.message || this.dataset.error; }
      finally { this.adding = false; this.removeAttribute('aria-busy'); buttons.forEach(button=>{button.disabled=false;button.removeAttribute('aria-busy');}); }
    }, {capture:true, signal});
    window.addEventListener('popstate', () => { if (location.pathname === new URL(this.dataset.productUrl, location.origin).pathname) this.update(new URL(location.href), null, false); }, {signal});
  }
  disconnectedCallback() { this.abort?.abort(); this.request?.abort(); }
  async update(url, focusId, push = true) {
    if (this.adding) return;
    this.request?.abort(); const request = new AbortController(); this.request = request;
    const quantity = this.querySelector('[name=quantity]')?.value;
    this.pending = true; this.setAttribute('aria-busy','true');
    this.querySelectorAll('button,input,select').forEach(control => { if (!control.disabled) { control.dataset.nyDisabled = 'true'; control.disabled = true; } });
    const status = this.querySelector('[data-status]'); if (status) status.textContent = this.dataset.updating;
    const requestURL = new URL(url); requestURL.searchParams.set('section_id',this.dataset.section);
    const view = new URL(location.href).searchParams.get('view'); if (view) requestURL.searchParams.set('view',view);
    // A draft preview must remain on the same draft when fetching a section.
    const preview = new URL(location.href).searchParams.get('preview_theme_id'); if (preview) requestURL.searchParams.set('preview_theme_id',preview);
    try {
      const response = await fetch(requestURL,{signal:request.signal,headers:{Accept:'text/html'}});
      if (!response.ok) throw new Error();
      const doc = new DOMParser().parseFromString(await response.text(),'text/html');
      if (this.request !== request || !this.isConnected) return;
      const next = doc.getElementById(this.id); if (!next || next.dataset.productUrl !== this.dataset.productUrl) throw new Error();
      const nextQuantity = next.querySelector('[name=quantity]');
      if (nextQuantity && quantity) { nextQuantity.value = quantity; if (!nextQuantity.checkValidity()) nextQuantity.value = nextQuantity.min || '1'; }
      if (push) { const publicURL = new URL(location.href); publicURL.searchParams.delete('variant'); publicURL.searchParams.set('option_values',url.searchParams.get('option_values')); history.pushState({},'',publicURL); }
      this.replaceWith(next);
      window.Shopify?.PaymentButton?.init?.();
      const focus = [...next.querySelectorAll('[data-option]')].find(link=>link.dataset.optionId === focusId); focus?.focus({preventScroll:true});
    } catch (error) {
      if (error.name === 'AbortError' || this.request !== request) return;
      this.pending = false; this.removeAttribute('aria-busy');
      this.querySelectorAll('[data-ny-disabled]').forEach(control=>{control.disabled=false;delete control.dataset.nyDisabled;});
      if (status) status.textContent = this.dataset.error;
    }
  }
}
class NicheyGallery extends HTMLElement {
  connectedCallback() {
    this.abort?.abort(); this.abort = new AbortController(); const signal = this.abort.signal;
    this.slides = [...this.querySelectorAll('[data-slide]')]; if (!this.slides.length) return;
    if(this.querySelector('model-viewer') && window.Shopify?.loadFeatures) window.Shopify.loadFeatures([{name:'model-viewer-ui',version:'1.0',onLoad:()=>{if(!this.isConnected)return;this.querySelectorAll('model-viewer').forEach(model=>{if(window.Shopify.ModelViewerUI&&!model.dataset.nyModelReady){new window.Shopify.ModelViewerUI(model);model.dataset.nyModelReady='true';}});}}]);
    this.index = Math.max(0,this.slides.findIndex(slide=>slide.hasAttribute('data-initial'))); this.dataset.ready='true'; this.select(this.index);
    this.addEventListener('click',event=>{
      const thumb = event.target.closest('.ny-thumb'); if (thumb) {event.preventDefault(); this.select(this.slides.findIndex(slide=>slide.dataset.mediaId===thumb.dataset.mediaId));}
      if(event.target.closest('[data-prev]')) this.select(this.index-1);
      if(event.target.closest('[data-next]')) this.select(this.index+1);
      const zoom = event.target.closest('[data-zoom]'); if(zoom){this.zoomTrigger=zoom; const img=this.querySelector('[data-zoom-image]');img.src=zoom.dataset.src;img.alt=zoom.parentElement.querySelector('img')?.alt||'';this.querySelector('dialog').showModal();}
      if(event.target.closest('[data-close]')) this.querySelector('dialog').close();
      const play=event.target.closest('[data-play]');if(play){play.after(play.parentElement.querySelector('template').content.cloneNode(true));play.hidden=true;}
    },{signal});
    this.querySelector('dialog')?.addEventListener('close',()=>this.zoomTrigger?.focus(),{signal});
    this.addEventListener('keydown',event=>{if(event.target.closest('.ny-thumbs') && ['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const forward=(event.key==='ArrowRight')!==(getComputedStyle(this).direction==='rtl');this.select(this.index+(forward?1:-1));this.querySelectorAll('.ny-thumb')[this.index]?.focus();}},{signal});
    let start;
    this.addEventListener('touchstart',e=>{start=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true,signal});
    this.addEventListener('touchend',e=>{if(!start||e.target.closest('video,iframe,button,dialog'))return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)this.select(this.index+((dx<0)!==(getComputedStyle(this).direction==='rtl')?1:-1));start=null;},{passive:true,signal});
  }
  select(index){this.index=(index+this.slides.length)%this.slides.length;this.slides.forEach((slide,i)=>{slide.hidden=i!==this.index;if(slide.hidden){slide.querySelectorAll('video').forEach(v=>v.pause());if(slide.querySelector('template')){slide.querySelector('iframe')?.remove();slide.querySelector('[data-play]').hidden=false;}}});this.querySelectorAll('.ny-thumb').forEach((a,i)=>a.setAttribute('aria-current',String(i===this.index)));const count=this.querySelector('[data-count]');if(count)count.textContent=String(this.index+1);}
  disconnectedCallback(){this.abort?.abort();this.querySelectorAll('video').forEach(v=>v.pause());this.querySelector('dialog')?.close();}
}
if(!customElements.get('ny-product-hero'))customElements.define('ny-product-hero',NicheyProductHero);
if(!customElements.get('ny-gallery'))customElements.define('ny-gallery',NicheyGallery);
})();
