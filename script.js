/* V2 nav: consolidated to match the approved Figma navigation (lean top-level
   set, deep links preserved via dropdowns) — the V1 nav had 11 top-level
   items, which only fit at 1440px because of !important font-shrinking that
   has been removed along with the old patch CSS. Every route below already
   existed in V1; only the grouping changed. */
(function normaliseAarkNavigation(){const header=document.querySelector('.site-header');if(!header)return;header.id='top';header.innerHTML=`<div class="container nav-shell"><a class="brand" href="index.html" aria-label="AARK International School home"><img class="official-full-logo" src="assets/logo-full-on-dark.png" width="640" height="279" alt="AARK International School, Vadodara"></a><nav class="desktop-nav" aria-label="Primary navigation"><a href="about.html" data-nav-about>About</a><a href="curriculum.html" data-nav-curriculum>Curriculum</a><a href="index.html#journey" data-nav-journey>Learning Journey</a><div class="nav-dropdown"><button class="nav-drop-button" data-menu="campus" type="button" aria-expanded="false">Campus Life <span>⌄</span></button><div class="nav-drop-menu wide-menu"><a href="index.html#campus">Campus Overview</a><a href="campus-detail.html?area=classrooms">Classrooms</a><a href="campus-detail.html?area=robotics">AI & Robotics</a><a href="campus-detail.html?area=swimming">Swimming & Sports</a><a href="campus-detail.html?area=arts">Arts & Music</a><a href="student-life.html">Student Life</a><a href="gallery.html">Gallery</a><a href="staff.html">Our Staff</a></div></div><div class="nav-dropdown"><button class="nav-drop-button" data-menu="admissions" type="button" aria-expanded="false">Admissions <span>⌄</span></button><div class="nav-drop-menu wide-menu"><a href="admissions.html">Admissions Overview</a><a href="admissions.html#schedule">Admission Schedule</a><a href="admissions.html#criteria">Admission Criteria</a><a href="admissions.html#procedure">Admission Procedure</a><a href="admissions.html#instructions">Before You Apply</a><a href="https://aarkintschool-forms.zeroq.net" target="_blank" rel="noopener">Apply Online ↗</a><a href="admissions.html#fees">Fee Structure</a><a href="admissions.html#faq">Admission FAQs</a></div></div><div class="nav-dropdown"><button class="nav-drop-button" data-menu="resources" type="button" aria-expanded="false">Resources <span>⌄</span></button><div class="nav-drop-menu"><a href="disclosures.html">Mandatory Public Disclosure</a><a href="circulars.html">Circulars & Notices</a><a href="policies.html">Policies & Documents</a><a href="careers.html">Careers</a></div></div><a href="index.html#visit-form" data-nav-contact>Contact</a></nav><a class="button button-primary header-cta" href="index.html#visit">Book a Campus Visit</a><button class="menu-toggle" type="button" aria-label="Open menu" aria-controls="mobile-menu" aria-expanded="false"><span></span><span></span><span></span></button></div><div class="mobile-menu" id="mobile-menu" hidden><div class="mobile-menu-inner"><a href="index.html">Home</a><a href="about.html">About</a><a href="curriculum.html">Curriculum</a><a href="index.html#journey">Learning Journey</a><details><summary>Campus Life</summary><div class="mobile-subnav"><a href="index.html#campus">Campus Overview</a><a href="campus-detail.html?area=classrooms">Classrooms</a><a href="campus-detail.html?area=robotics">AI & Robotics</a><a href="campus-detail.html?area=swimming">Swimming & Sports</a><a href="campus-detail.html?area=arts">Arts & Music</a><a href="student-life.html">Student Life</a><a href="gallery.html">Gallery</a><a href="staff.html">Our Staff</a></div></details><details><summary>Admissions</summary><div class="mobile-subnav"><a href="admissions.html">Overview</a><a href="admissions.html#schedule">Schedule</a><a href="admissions.html#criteria">Criteria</a><a href="admissions.html#procedure">Procedure</a><a href="admissions.html#instructions">Before You Apply</a><a href="https://aarkintschool-forms.zeroq.net" target="_blank" rel="noopener">Apply Online ↗</a><a href="admissions.html#fees">Fee Structure</a><a href="admissions.html#faq">FAQs</a></div></details><details><summary>Resources</summary><div class="mobile-subnav"><a href="disclosures.html">Mandatory Public Disclosure</a><a href="circulars.html">Circulars & Notices</a><a href="policies.html">Policies & Documents</a><a href="careers.html">Careers</a></div></details><a href="index.html#visit-form">Contact</a><a class="button button-primary" href="index.html#visit">Book a Tour</a></div></div>`})();
const menuButton=document.querySelector('.menu-toggle'),mobileMenu=document.querySelector('#mobile-menu');menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));mobileMenu.hidden=open;menuButton.setAttribute('aria-label',open?'Open menu':'Close menu')});mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.hidden=true;menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Open menu')}));
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
const resourceModal=document.querySelector('#resource-modal');document.querySelectorAll('.resource-popup-open').forEach(btn=>btn.addEventListener('click',()=>resourceModal?.showModal()));document.querySelector('.modal-close')?.addEventListener('click',()=>resourceModal?.close());resourceModal?.addEventListener('click',e=>{if(e.target===resourceModal)resourceModal.close()});
const dropButtons=document.querySelectorAll('.nav-drop-button');dropButtons.forEach(btn=>{btn.addEventListener('click',e=>{e.preventDefault();const wrap=btn.closest('.nav-dropdown'),open=wrap.classList.toggle('menu-open');btn.setAttribute('aria-expanded',String(open));document.querySelectorAll('.nav-dropdown').forEach(other=>{if(other!==wrap){other.classList.remove('menu-open');other.querySelector('.nav-drop-button')?.setAttribute('aria-expanded','false')}})})});document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))document.querySelectorAll('.nav-dropdown').forEach(d=>{d.classList.remove('menu-open');d.querySelector('.nav-drop-button')?.setAttribute('aria-expanded','false')})});
const siteHeader=document.querySelector('.site-header');function updateStickyHeader(){if(siteHeader)siteHeader.classList.toggle('is-scrolled',window.scrollY>12)}window.addEventListener('scroll',updateStickyHeader,{passive:true});updateStickyHeader();
(function(){const file=(location.pathname.split('/').pop()||'index.html').toLowerCase(),nav=document.querySelector('.site-header');if(!nav)return;const mark=selector=>nav.querySelectorAll(selector).forEach(el=>{el.classList.add('active');if(el.tagName==='A')el.setAttribute('aria-current','page')});if(file==='about.html')mark('a[data-nav-about]');else if(file==='curriculum.html')mark('a[data-nav-curriculum]');else if(file==='admissions.html')mark('.nav-drop-button[data-menu="admissions"]');else if(['disclosures.html','circulars.html','policies.html','careers.html'].includes(file))mark('.nav-drop-button[data-menu="resources"]');else if(['campus-detail.html','student-life.html','staff.html','gallery.html','transport.html'].includes(file))mark('.nav-drop-button[data-menu="campus"]')})();

/* Image fallbacks (replaces inline onerror="" so the CSP can forbid inline script):
   data-fallback="hide" hides the image, "hide-parent" hides its wrapper, "dim" fades it. */
(function(){
  const apply=img=>{const mode=img.dataset.fallback;if(mode==='hide')img.style.display='none';else if(mode==='hide-parent'&&img.parentElement)img.parentElement.style.display='none';else if(mode==='dim'){img.style.opacity='.18';img.style.filter='grayscale(1)'}};
  document.addEventListener('error',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&t.dataset.fallback)apply(t)},true);
  // Images that already failed before this script ran.
  document.querySelectorAll('img[data-fallback]').forEach(img=>{if(img.complete&&img.naturalWidth===0&&img.getAttribute('src'))apply(img)});
})();

/* Enquiry + visit forms → POST /api/enquiry.
   Each form carries a requestId so a double-click or retry is recognised by the
   server and stored once. Turnstile is added only when /api/public-config
   returns a site key. */
(function(){
  const forms=[...document.querySelectorAll('[data-school-form]')];
  if(!forms.length)return;
  const newId=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'';
  const requestIds=new Map(forms.map(f=>[f,newId()]));
  const widgets=new Map();
  const SUCCESS="Thank you — we've received your request and the school team will call you shortly.";
  const successFor=form=>form.dataset.schoolForm==='career'?"Thank you — we've received your application. Please also email your CV to info@theaarkinternational.com.":SUCCESS;

  function setStatus(status,kind,parts){
    if(!status)return;
    status.replaceChildren(...parts);
    status.classList.toggle('is-success',kind==='success');
    status.classList.toggle('is-error',kind==='error');
  }
  function contactFallback(lead){
    // Verified school contact details (footer / JSON-LD) so a parent always has a working route.
    const call=document.createElement('a');call.href='tel:+919909115550';call.textContent='+91 99091 15550';
    const mail=document.createElement('a');mail.href='mailto:info@theaarkinternational.com';mail.textContent='info@theaarkinternational.com';
    return [lead+' Please call the school on ',call,' or email ',mail,' and we will help you directly.'];
  }

  fetch('/api/public-config').then(r=>r.ok?r.json():null).then(cfg=>{
    if(!cfg||!cfg.turnstileSiteKey)return;
    window.aarkTurnstileReady=()=>forms.forEach(form=>{
      const slot=document.createElement('div');slot.className='form-turnstile';
      const btn=form.querySelector('button[type="submit"]');form.insertBefore(slot,btn);
      widgets.set(form,window.turnstile.render(slot,{sitekey:cfg.turnstileSiteKey,size:'flexible'}));
    });
    const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=aarkTurnstileReady';s.async=true;document.head.appendChild(s);
  }).catch(()=>{});

  forms.forEach(form=>form.addEventListener('submit',async e=>{
    e.preventDefault();
    const status=form.querySelector('.form-status');
    const submitBtn=form.querySelector('button[type="submit"]');
    const data=new FormData(form);
    if((data.get('company')||'').toString().trim()){
      // Honeypot field filled in: silently pretend success without contacting the API.
      form.reset();setStatus(status,'success',[successFor(form)]);return;
    }
    const field=k=>(data.get(k)||'').toString().trim();
    const kind=form.dataset.schoolForm;const payload={type:kind==='visit'||kind==='career'?kind:'admission',name:field('name'),phone:field('phone'),child:field('child'),grade:field('grade'),email:field('email'),message:field('message'),company:'',requestId:requestIds.get(form)};
    if(!payload.name||!payload.phone||!payload.grade){setStatus(status,'error',['Please fill in the required fields.']);return}
    if(widgets.has(form))payload.turnstileToken=window.turnstile.getResponse(widgets.get(form))||'';
    if(submitBtn)submitBtn.disabled=true;
    setStatus(status,null,['Sending your request…']);
    try{
      const res=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await res.json().catch(()=>({}));
      if(res.ok&&result.ok){
        form.reset();requestIds.set(form,newId());
        setStatus(status,'success',[successFor(form)+(result.confirmationSent?' A confirmation has also been sent to your email.':'')]);
      }else if(res.status===400&&result.error){
        setStatus(status,'error',[result.error]); // validation message written for parents
      }else{
        setStatus(status,'error',contactFallback(res.status===429?'Too many requests were sent from this connection.':"We couldn't send your request online."));
      }
    }catch(err){
      setStatus(status,'error',contactFallback("We couldn't send your request online."));
    }finally{
      if(submitBtn)submitBtn.disabled=false;
      if(widgets.has(form))window.turnstile.reset(widgets.get(form));
    }
  }));
})();

/* Utility bar marquee: pause on hover (desktop) and press-and-hold
   (touch), resume from the exact same position on release - CSS
   animation-play-state:paused/running preserves elapsed time natively,
   so no manual position tracking is needed. A single .is-paused class
   driven from JS (not CSS :hover) so touch devices, which don't
   reliably support :hover, behave the same as desktop. */
(function(){
  const bar=document.querySelector('.utility-bar');
  if(!bar)return;
  const pause=()=>bar.classList.add('is-paused');
  const resume=()=>bar.classList.remove('is-paused');
  bar.addEventListener('mouseenter',pause);
  bar.addEventListener('mouseleave',resume);
  bar.addEventListener('touchstart',pause,{passive:true});
  bar.addEventListener('touchend',resume,{passive:true});
  bar.addEventListener('touchcancel',resume,{passive:true});
})();

/* Site popup, once per visit (browser tab), a moment after the first page opens;
   never in the admin or in edit mode.
   - If the admin's "Popups" tab has a live popup (admissions, scheme, event or
     notice), the newest one is shown, with a "follow us on Instagram" line.
   - Otherwise a "Follow us on Instagram" popup is shown.
   Built with DOM APIs (textContent), since popup text is admin-entered. */
(function(){
  const params=new URLSearchParams(location.search);
  if(params.has('edit')||/admin\.html$/i.test(location.pathname))return;
  const IG='https://www.instagram.com/aarkinternational';
  const KIND={admission:'Admissions',scheme:'Scheme',event:'Event',notice:'Notice',instagram:'Instagram'};
  const VISIT_KEY='aark_visit_popup';
  const store=(k,v)=>{try{return v===undefined?sessionStorage.getItem(k):sessionStorage.setItem(k,v)}catch{return null}};
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
  const INSTAGRAM={kind:'instagram',title:'Follow us on Instagram',message:'For more updates: events, photos, admission news and everyday moments at AARK.',buttonText:'Follow @aarkinternational',link:IG};

  const preview=params.get('popup');
  if(!preview&&store(VISIT_KEY))return;
  const start=Date.now();
  fetch('/api/content/events').then(r=>r.json()).catch(()=>null).then(data=>{
    const items=data&&data.ok&&data.items||[];
    // ?popup=<id> (the admin's Preview link) shows that popup now, live or not;
    // ?popup=instagram shows the Instagram one.
    if(preview){const it=preview==='instagram'?INSTAGRAM:items.find(i=>i.id===preview);if(it)show(it);return}
    const live=items.filter(i=>i.active);
    const item=live[live.length-1]||INSTAGRAM;
    setTimeout(()=>{if(!store(VISIT_KEY))show(item)},Math.max(0,2500-(Date.now()-start)));
  });

  function igIcon(size){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width',size);svg.setAttribute('height',size);svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.9');svg.setAttribute('aria-hidden','true');
    const r=document.createElementNS(ns,'rect');r.setAttribute('x','3');r.setAttribute('y','3');r.setAttribute('width','18');r.setAttribute('height','18');r.setAttribute('rx','5');
    const c=document.createElementNS(ns,'circle');c.setAttribute('cx','12');c.setAttribute('cy','12');c.setAttribute('r','4.2');
    const d=document.createElementNS(ns,'circle');d.setAttribute('cx','17.4');d.setAttribute('cy','6.6');d.setAttribute('r','1.1');d.setAttribute('fill','currentColor');d.setAttribute('stroke','none');
    svg.append(r,c,d);return svg;
  }

  function show(item){
    if(document.querySelector('.aark-popup-overlay'))return;
    store(VISIT_KEY,'1');
    const ig=item.kind==='instagram';
    const before=document.activeElement;
    const overlay=el('div','aark-popup-overlay');
    const card=el('div','aark-popup-card'+(ig?' is-instagram':''));
    card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-labelledby','aark-popup-title');
    const closeBtn=el('button','aark-popup-close','×');closeBtn.type='button';closeBtn.setAttribute('aria-label','Close');
    card.appendChild(closeBtn);
    if(ig){
      const head=el('div','aark-popup-ig-head');
      const badge=el('span','aark-popup-ig-icon');badge.appendChild(igIcon(34));
      head.append(badge,el('span','aark-popup-ig-handle','@aarkinternational'));
      card.appendChild(head);
    }else if(item.photoUrl){const img=el('img','aark-popup-photo');img.src=item.photoUrl;img.alt='';card.appendChild(img)}
    const body=el('div','aark-popup-body');
    if(!ig)body.appendChild(el('span','aark-popup-kind kind-'+(KIND[item.kind]?item.kind:'notice'),KIND[item.kind]||KIND.notice));
    const h=el('h2',null,item.title||'');h.id='aark-popup-title';body.appendChild(h);
    body.appendChild(el('p','aark-popup-msg',item.message||''));
    if(item.link){
      const row=el('div','aark-popup-actions');
      const a=el('a','button button-primary'+(ig?' aark-popup-ig-btn':''),item.buttonText||'Learn more');a.href=item.link;
      if(/^https:/i.test(item.link)){a.target='_blank';a.rel='noopener'}
      row.appendChild(a);
      if(ig){const later=el('button','aark-popup-later','Maybe later');later.type='button';later.addEventListener('click',()=>close());row.appendChild(later)}
      body.appendChild(row);
    }
    if(!ig){
      const follow=el('a','aark-popup-follow','Follow us on Instagram for more updates');
      follow.href=IG;follow.target='_blank';follow.rel='noopener';
      body.appendChild(follow);
    }
    card.appendChild(body);overlay.appendChild(card);document.body.appendChild(overlay);
    requestAnimationFrame(()=>overlay.classList.add('is-open'));
    closeBtn.focus({preventScroll:true});
    function close(){overlay.remove();document.removeEventListener('keydown',onKey);if(before&&before.focus)before.focus({preventScroll:true})}
    function onKey(e){if(e.key==='Escape')close()}
    closeBtn.addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    document.addEventListener('keydown',onKey);
  }
})();

/* Back to top: a round arrow on the right, above the Sahay chat launcher,
   shown once the visitor has scrolled down most of a screen. */
(function(){
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='to-top';
  btn.setAttribute('aria-label','Back to top');
  btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
  btn.tabIndex=-1;
  document.body.appendChild(btn);
  let shown=false;
  function update(){
    const want=scrollY>innerHeight*0.8;
    if(want===shown)return;
    shown=want;
    btn.classList.toggle('is-shown',want);
    btn.tabIndex=want?0:-1;
  }
  addEventListener('scroll',update,{passive:true});
  update();
  btn.addEventListener('click',()=>{
    const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({top:0,behavior:still?'auto':'smooth'});
    // keyboard users land back at the top of the page too
    const first=document.querySelector('.site-header a, header a');
    if(first)first.focus({preventScroll:true});
  });
})();

/* Visitor statistics: Vercel Web Analytics (cookie-free, no personal data).
   The script is served by Vercel from this site's own address once Web
   Analytics is switched on for the project; until then it is simply absent. */
(function(){
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1')return;
  window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
  const s=document.createElement('script');s.defer=true;s.src='/_vercel/insights/script.js';document.head.appendChild(s);
})();
