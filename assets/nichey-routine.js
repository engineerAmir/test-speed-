/* Fixed native bundles only: components are read-only; purchases use the parent variant. */
(() => {
  if (customElements.get('ny-routine')) return;
  const query = `query Routine($id:ID!,$after:String,$country:CountryCode!,$language:LanguageCode!) @inContext(country:$country,language:$language) {
    node(id:$id) { ... on Product { id variants(first:20,after:$after) { pageInfo {hasNextPage endCursor} nodes {
      id title availableForSale requiresComponents price {amount currencyCode}
      components(first:100) { pageInfo {hasNextPage} nodes { quantity productVariant {
        id title availableForSale requiresComponents price {amount currencyCode} quantityRule {minimum maximum increment}
        image {url altText width height} product {title handle vendor requiresSellingPlan rating:metafield(namespace:"reviews",key:"rating") {value} ratingCount:metafield(namespace:"reviews",key:"rating_count") {value}}
      } } }
    } } } }
  }`;
  const element=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  const variantId=gid=>{const match=/^gid:\/\/shopify\/ProductVariant\/(\d+)$/.exec(gid);if(!match)throw Error('Invalid variant');return match[1];};
  const cents=price=>{const value=Number(price.amount);if(!Number.isFinite(value)||value<0)throw Error('Invalid price');return Math.round(value*100);};
  class NicheyRoutine extends HTMLElement {
    connectedCallback(){
      this.abort=new AbortController();
      this.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>{
        if(event.submitter?.closest('.ny-routine-native,.shopify-payment-button'))return;
        event.preventDefault();this.purchase(form);
      },{signal:this.abort.signal}));
      if(typeof IntersectionObserver==='function'){this.observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){this.observer.disconnect();this.load();}},{rootMargin:'250px'});this.observer.observe(this);}else this.load();
    }
    disconnectedCallback(){this.abort?.abort();this.observer?.disconnect();}
    async load(){
      try{
        let after=null,variants=[],cursors=new Set();
        do{
          const response=await fetch((window.Shopify?.routes?.root||'/')+'api/2026-10/graphql.json',{method:'POST',headers:{'Content-Type':'application/json'},signal:this.abort.signal,body:JSON.stringify({query,variables:{id:this.dataset.product,after,country:this.dataset.country,language:this.dataset.language}})});
          if(!response.ok)throw Error();const result=await response.json();
          // Optional ratings can be denied to tokenless storefront queries. Native composition must succeed.
          if(result.errors?.some(e=>e.extensions?.code!=='ACCESS_DENIED'||!['rating','ratingCount'].includes(e.path?.at(-1))))throw Error();
          const product=result.data?.node;if(product?.id!==this.dataset.product)throw Error();
          variants.push(...product.variants.nodes);after=product.variants.pageInfo.hasNextPage?product.variants.pageInfo.endCursor:null;
          if(after&&(variants.length>=2000||cursors.has(after)))throw Error();if(after)cursors.add(after);
        }while(after);
        this.variants=variants.filter(v=>v.requiresComponents&&v.components.nodes.length&&!v.components.pageInfo.hasNextPage);
        if(!this.variants.length||this.variants.length!==variants.length)throw Error();
        for(const v of this.variants){variantId(v.id);cents(v.price);if(v.price.currencyCode!==this.dataset.currency)throw Error();for(const c of v.components.nodes){variantId(c.productVariant.id);cents(c.productVariant.price);if(c.quantity<1||!Number.isInteger(c.quantity)||c.productVariant.price.currencyCode!==this.dataset.currency)throw Error();}}
        this.format=new Intl.NumberFormat(document.documentElement.lang||'en',{style:'currency',currency:this.dataset.currency});this.build();this.querySelector('[data-fallback]').hidden=true;
      }catch(error){if(error.name!=='AbortError')this.fail();}
    }
    fail(){this.querySelector('[data-status]').textContent=this.dataset.error;this.querySelector('[data-purchase]').hidden=true;this.querySelector('[data-routine-content]').hidden=true;this.querySelector('[data-fallback]').hidden=false;}
    money(value){return this.format.format(value/100);}
    build(){
      const root=this.querySelector('[data-routine-content]');root.replaceChildren();
      this.selector=element('select');this.selector.setAttribute('aria-label',this.dataset.variant);
      this.variants.forEach((v,i)=>{const option=element('option','',v.title==='Default Title'?this.querySelector('h3').textContent:v.title);option.value=String(i);this.selector.append(option);});
      this.selector.value=String(Math.max(0,this.variants.findIndex(v=>v.availableForSale)));
      const label=element('label','ny-routine-config',this.dataset.variant);label.append(this.selector);label.hidden=this.variants.length===1;root.append(label);
      this.grid=element('div','ny-routine-grid');this.cards=element('div','ny-routine-cards');this.cards.setAttribute('aria-label',this.dataset.included);this.summary=element('div','ny-routine-summary');this.grid.append(this.cards,this.summary);root.append(this.grid);
      this.selector.addEventListener('change',()=>{try{this.configuration();}catch{this.fail();}},{signal:this.abort.signal});this.configuration();
    }
    configuration(){
      this.variant=this.variants[Number(this.selector.value)];this.components=this.variant.components.nodes;this.cards.replaceChildren();
      this.cards.style.setProperty('--ny-count',Math.min(3,this.components.length));this.cards.classList.toggle('ny-routine-cards--scroll',this.components.length>3);this.cards.tabIndex=this.components.length>3?0:-1;
      for(const component of this.components){
        const v=component.productVariant,card=element('article','ny-routine-card'),link=element('a');link.href=(window.Shopify?.routes?.root||'/')+'products/'+encodeURIComponent(v.product.handle)+'?variant='+variantId(v.id);
        if(v.image){const img=element('img');const url=new URL(v.image.url);if(url.protocol!=='https:')throw Error();url.searchParams.set('width','420');img.src=url.href;img.width=420;img.height=420;img.loading='lazy';img.alt=v.image.altText||v.product.title;link.append(img);}
        if(v.product.vendor)link.append(element('small','',v.product.vendor));link.append(element('h4','',v.product.title));card.append(link);
        if(v.title!=='Default Title')card.append(element('small','',v.title));
        let rating;try{rating=JSON.parse(v.product.rating?.value||'null');}catch{}
        const score=Number(rating?.value),scale=Number(rating?.scale_max),count=Number(v.product.ratingCount?.value);
        if(score>0&&scale>0&&score<=scale&&count>0){const review=element('span','ny-routine-rating','★ '+score+' / '+scale+' ('+count+')');card.append(review);}
        card.append(element('strong','',this.money(cents(v.price))));
        if(component.quantity>1)card.append(element('small','',this.dataset.included+' × '+component.quantity));
        else card.append(element('small','ny-routine-included',this.dataset.included));this.cards.append(card);
      }
      const purchases=this.querySelector('[data-purchase]');purchases.remove();
      this.summary.replaceChildren(element('h4','',this.dataset.total+' ('+this.components.reduce((n,c)=>n+c.quantity,0)+')'));
      const regular=this.components.reduce((n,c)=>n+cents(c.productVariant.price)*c.quantity,0),amount=cents(this.variant.price),saving=Math.max(0,regular-amount);
      this.summary.append(element('span','ny-routine-separate',this.dataset.separate+' '+this.money(regular)),element('strong','ny-routine-total',this.money(amount)));
      if(saving&&regular>0)this.summary.append(element('span','ny-routine-saving',this.dataset.save+' '+this.money(saving)+' ('+Number((saving/regular*100).toFixed(1))+'%)'));
      this.summary.append(purchases);purchases.hidden=false;
      const id=variantId(this.variant.id);this.form=[...purchases.querySelectorAll('form')].find(f=>f.elements.namedItem('id')?.value===id);
      if(!this.form)throw Error('Native bundle form unavailable');
      purchases.querySelectorAll('form').forEach(f=>f.hidden=f!==this.form);
      this.form.querySelectorAll('button,input').forEach(c=>c.disabled=!this.variant.availableForSale);
      this.form.querySelector('.ny-routine-native').hidden=!this.variant.availableForSale;
      if(!this.variant.availableForSale)this.summary.append(element('p','ny-muted',this.dataset.unavailable));
      window.Shopify?.PaymentButton?.init?.();
    }
    async purchase(form){
      if(this.pending||form!==this.form||!this.variant.availableForSale||!form.reportValidity()||!window.NicheyCart)return;
      const payload=new FormData(form);if(payload.get('id')!==variantId(this.variant.id))return;
      this.pending=true;this.setAttribute('aria-busy','true');this.querySelector('[data-status]').textContent='';
      const controls=[...this.querySelectorAll('button,input,select')].map(c=>[c,c.disabled]);controls.forEach(([c])=>c.disabled=true);
      try{await window.NicheyCart.add(payload,this);}catch(error){this.querySelector('[data-status]').textContent=error.message||this.dataset.cartError;}
      finally{this.pending=false;this.removeAttribute('aria-busy');controls.forEach(([c,disabled])=>c.disabled=disabled);}
    }
  }
  customElements.define('ny-routine',NicheyRoutine);
})();
