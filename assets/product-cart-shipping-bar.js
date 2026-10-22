(() => {
  if (customElements.get('product-cart-shipping-bar')) return;
  class ProductCartShippingBar extends HTMLElement {
    connectedCallback() {
      this.hidden = true;
      this.sync = this.sync.bind(this);
      this.schedule = () => {
        if (this.pending) return;
        this.pending = true;
        queueMicrotask(() => {
          this.pending = false;
          if (this.isConnected) this.sync();
        });
      };
      this.observer = new MutationObserver(records => {
        if (records.some(record => {
          const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
          if (target?.closest('hdt-cart-drawer')) return true;
          return [...record.addedNodes, ...record.removedNodes].some(node =>
            node.nodeType === 1 && (node.matches('hdt-cart-drawer') || node.querySelector('hdt-cart-drawer'))
          );
        })) this.schedule();
      });
      this.observer.observe(document.body, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['aria-valuenow', 'aria-valuemax']
      });
      document.addEventListener('shopify:section:load', this.schedule);
      window.addEventListener('pageshow', this.schedule);
      this.sync();
    }
    disconnectedCallback() {
      this.observer?.disconnect();
      document.removeEventListener('shopify:section:load', this.schedule);
      window.removeEventListener('pageshow', this.schedule);
    }
    sync() {
      const drawer = document.querySelector('hdt-cart-drawer');
      const source = drawer?.querySelector('.custom-progress-bar');
      const progress = source?.querySelector('.hdt-progress-bar');
      const maximum = Number(progress?.getAttribute('aria-valuemax'));
      const current = Number(progress?.getAttribute('aria-valuenow'));
      // No bar is rendered by the drawer when the cart is empty or the goal is disabled.
      if (!source || !progress || !Number.isFinite(maximum) || maximum <= 0 || !Number.isFinite(current)) {
        this.hidden = true;
        this.replaceChildren();
        this.lastMarkup = null;
        return;
      }
      const rate = Math.min(1, Math.max(0, current / maximum));
      // Parse in an inert template so copying the drawer never starts another
      // theme component or triggers duplicate confetti events.
      const template = document.createElement('template');
      template.innerHTML = source.innerHTML;
      template.content.querySelectorAll('hdt-free-shipping-bar, hdt-progress-bar').forEach(element => {
        const replacement = document.createElement('div');
        for (const attribute of element.attributes) {
          if (attribute.name !== 'reveal-in-view') replacement.setAttribute(attribute.name, attribute.value);
        }
        replacement.append(...element.childNodes);
        element.replaceWith(replacement);
      });
      template.content.querySelectorAll('[id], [ref], [data-shopify-editor-block]').forEach(element => {
        element.removeAttribute('id');
        element.removeAttribute('ref');
        element.removeAttribute('data-shopify-editor-block');
      });
      const bar = template.content.querySelector('.hdt-progress-bar');
      bar.style.setProperty('--progress-rate', String(rate));
      const track = template.content.querySelector('.hdt-free-shipping-bar');
      if (track) {
        track.classList.remove('is-intial', 'is-unreached', 'is-success', 'hdt-hidden');
        track.classList.add(rate >= 1 ? 'is-success' : rate <= 0.7 ? 'is-intial' : 'is-unreached');
      }
      const markup = template.innerHTML;
      if (markup !== this.lastMarkup) {
        this.replaceChildren(template.content.cloneNode(true));
        this.lastMarkup = markup;
      }
      this.hidden = false;
    }
  }
  customElements.define('product-cart-shipping-bar', ProductCartShippingBar);
})();
