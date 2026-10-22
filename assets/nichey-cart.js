/* Kalles 5.3 integration: retain its cart rendering and configured post-add action. */
(() => {
  if (window.NicheyCart) return;
  window.NicheyCart = {
    async add(payload, source) {
      const root = window.Shopify?.routes?.root || '/';
      const carts = [...document.querySelectorAll('hdt-cart-drawer,hdt-main-cart')];
      const sections = [...new Set(carts.map(cart => cart.getAttribute('section-id')).filter(Boolean))].slice(0,5);
      const form = payload instanceof FormData;
      if (form) { payload.set('sections',sections.join(',')); payload.set('sections_url',location.pathname); }
      const body = form ? payload : JSON.stringify({items:payload,sections,sections_url:location.pathname});
      let response, result;
      try {
        response = await fetch(root+'cart/add.js',{method:'POST',headers:{Accept:'application/json',...(form?{}:{'Content-Type':'application/json'})},body});
        result = await response.json();
      } catch {
        // An interrupted response may still have added items: never retry automatically.
        throw new Error(source.dataset.cartError || 'Connection interrupted. Review your cart before trying again.');
      }
      if (!response.ok || result.status) throw new Error(typeof result.description === 'string' ? result.description : (source.dataset.cartError || 'Unable to add this selection. Review your cart.'));
      const ready = sections.length && sections.every(id => typeof result.sections?.[id] === 'string' && result.sections[id].includes('cart-items-component'));
      if (ready) {
        source.dispatchEvent(new CustomEvent('cart:update',{bubbles:true,detail:{resource:{},sourceId:source.id,cartData:result,source:'product-form-component',data:{sections:result.sections}}}));
      } else {
        // Successful add with failed section rendering must not cause a second add.
        location.assign(root+'cart');
      }
      return result;
    }
  };
})();
