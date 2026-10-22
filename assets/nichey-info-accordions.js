/* Published one-open-item behavior, scoped and compatible with Theme Editor reloads. */
(()=>{
  if(customElements.get('ny-info-accordions'))return;
  customElements.define('ny-info-accordions',class extends HTMLElement{
    connectedCallback(){
      this.controller?.abort();this.controller=new AbortController();
      this.addEventListener('click',event=>{
        const button=event.target.closest('.ny-info-title');
        if(!button||!this.contains(button))return;
        const opening=button.getAttribute('aria-expanded')!=='true';
        for(const other of this.querySelectorAll('.ny-info-title')){
          if(other===button||other.getAttribute('aria-expanded')==='true')this.toggle(other,other===button&&opening);
        }
      },{signal:this.controller.signal});
    }
    disconnectedCallback(){this.controller?.abort();}
    toggle(button,open){
      const panel=this.querySelector('#'+CSS.escape(button.getAttribute('aria-controls')));
      if(!panel)return;
      panel.getAnimations().forEach(animation=>animation.cancel());
      button.setAttribute('aria-expanded',String(open));
      button.closest('.ny-info-item').classList.toggle('active',open);
      if(open)panel.hidden=false;
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){panel.hidden=!open;return;}
      const height=panel.getBoundingClientRect().height;
      panel.style.overflow='hidden';
      const animation=panel.animate([{height:open?'0px':height+'px',opacity:open?0:1},{height:open?height+'px':'0px',opacity:open?1:0}],{duration:180,easing:'ease-out'});
      animation.onfinish=()=>{if(button.getAttribute('aria-expanded')===String(open)){panel.hidden=!open;panel.style.overflow='';}};
      animation.oncancel=()=>{panel.style.overflow='';};
    }
  });
})();
