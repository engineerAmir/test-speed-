(() => {
  class NicheyStickyPurchase extends HTMLElement {
    connectedCallback() {
      this.abort?.abort();this.abort=new AbortController();
      const hero=this.closest('ny-product-hero');
      const main=document.getElementById(this.dataset.form);
      const purchase=main?.querySelector('.ny-purchase-buttons');
      if(!hero||!main||!purchase)return;
      const toolbar=document.querySelector('.hdt-toolbar');
      if(toolbar){const offset=()=>this.style.setProperty('--ny-toolbar-offset',Math.max(0,toolbar.getBoundingClientRect().height)+'px');offset();this.toolbarObserver=new ResizeObserver(offset);this.toolbarObserver.observe(toolbar)}
      const sync=()=>{
        const add=main.querySelector('.ny-add-cart');
        const stickyAdd=this.querySelector('[data-sticky-add]');
        const unavailable=!add||add.disabled||hero.hasAttribute('aria-busy');
        if(stickyAdd&&stickyAdd.disabled!==unavailable)stickyAdd.disabled=unavailable;
        const checkout=this.querySelector('form');
        for(const name of ['id','quantity','selling_plan']){
          const source=main.elements.namedItem(name),target=checkout?.elements.namedItem(name);
          if(target){const value=source?.value||'',disabled=Boolean(!source||source.disabled||(name==='selling_plan'&&!source.value));if(target.value!==value)target.value=value;if(target.disabled!==disabled)target.disabled=disabled}
        }
      };
      sync();
      main.addEventListener('change',sync,{signal:this.abort.signal});
      main.addEventListener('input',sync,{signal:this.abort.signal});
      this.observer=new MutationObserver(sync);
      this.observer.observe(hero,{subtree:true,attributes:true,attributeFilter:['disabled','aria-busy']});
      this.visibility=new IntersectionObserver(entries=>{
        const entry=entries[0],show=!entry.isIntersecting&&entry.boundingClientRect.bottom<=0;
        this.toggleAttribute('data-visible',show);this.inert=!show;this.setAttribute('aria-hidden',String(!show));
      });
      this.visibility.observe(purchase);
    }
    disconnectedCallback(){this.abort?.abort();this.observer?.disconnect();this.visibility?.disconnect();this.toolbarObserver?.disconnect()}
  }
  if(!customElements.get('ny-sticky-purchase'))customElements.define('ny-sticky-purchase',NicheyStickyPurchase);
})();
