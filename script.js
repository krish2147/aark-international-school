/* V2 nav: consolidated to match the approved Figma navigation (lean top-level
   set, deep links preserved via dropdowns) — the V1 nav had 11 top-level
   items, which only fit at 1440px because of !important font-shrinking that
   has been removed along with the old patch CSS. Every route below already
   existed in V1; only the grouping changed. */
(function normaliseAarkNavigation(){const header=document.querySelector('.site-header');if(!header)return;header.id='top';header.innerHTML=`<div class="container nav-shell"><a class="brand" href="index.html" aria-label="AARK International School home"><img class="official-full-logo" src="assets/logo-full-on-dark.png" width="640" height="279" alt="AARK International School, Vadodara"></a><nav class="desktop-nav" aria-label="Primary navigation"><a href="about.html" data-nav-about>About</a><a href="curriculum.html" data-nav-curriculum>Curriculum</a><a href="index.html#journey" data-nav-journey>Learning Journey</a><div class="nav-dropdown"><button class="nav-drop-button" data-menu="campus" type="button" aria-expanded="false">Campus Life <span>⌄</span></button><div class="nav-drop-menu wide-menu"><a href="index.html#campus">Campus Overview</a><a href="campus-detail.html?area=classrooms">Classrooms</a><a href="campus-detail.html?area=robotics">AI & Robotics</a><a href="campus-detail.html?area=swimming">Swimming & Sports</a><a href="campus-detail.html?area=arts">Arts & Music</a><a href="student-life.html">Student Life</a></div></div><div class="nav-dropdown"><button class="nav-drop-button" data-menu="admissions" type="button" aria-expanded="false">Admissions <span>⌄</span></button><div class="nav-drop-menu wide-menu"><a href="admissions.html">Admissions Overview</a><a href="admissions.html#schedule">Admission Schedule</a><a href="admissions.html#criteria">Admission Criteria</a><a href="admissions.html#procedure">Admission Procedure</a><a href="admissions.html#instructions">Before You Apply</a><a href="https://aarkintschool-forms.zeroq.net" target="_blank" rel="noopener">Apply Online ↗</a><a href="admissions.html#fees">Fee Structure</a><a href="admissions.html#faq">Admission FAQs</a></div></div><div class="nav-dropdown"><button class="nav-drop-button" data-menu="resources" type="button" aria-expanded="false">Resources <span>⌄</span></button><div class="nav-drop-menu"><a href="disclosures.html">Mandatory Public Disclosure</a><a href="circulars.html">Circulars & Notices</a><a href="policies.html">Policies & Documents</a><a href="careers.html">Careers</a></div></div><a href="index.html#visit-form" data-nav-contact>Contact</a></nav><a class="button button-primary header-cta" href="index.html#visit">Book a Campus Visit</a><button class="menu-toggle" type="button" aria-label="Open menu" aria-controls="mobile-menu" aria-expanded="false"><span></span><span></span><span></span></button></div><div class="mobile-menu" id="mobile-menu" hidden><div class="mobile-menu-inner"><a href="index.html">Home</a><a href="about.html">About</a><a href="curriculum.html">Curriculum</a><a href="index.html#journey">Learning Journey</a><details><summary>Campus Life</summary><div class="mobile-subnav"><a href="index.html#campus">Campus Overview</a><a href="campus-detail.html?area=classrooms">Classrooms</a><a href="campus-detail.html?area=robotics">AI & Robotics</a><a href="campus-detail.html?area=swimming">Swimming & Sports</a><a href="campus-detail.html?area=arts">Arts & Music</a><a href="student-life.html">Student Life</a></div></details><details><summary>Admissions</summary><div class="mobile-subnav"><a href="admissions.html">Overview</a><a href="admissions.html#schedule">Schedule</a><a href="admissions.html#criteria">Criteria</a><a href="admissions.html#procedure">Procedure</a><a href="admissions.html#instructions">Before You Apply</a><a href="https://aarkintschool-forms.zeroq.net" target="_blank" rel="noopener">Apply Online ↗</a><a href="admissions.html#fees">Fee Structure</a><a href="admissions.html#faq">FAQs</a></div></details><details><summary>Resources</summary><div class="mobile-subnav"><a href="disclosures.html">Mandatory Public Disclosure</a><a href="circulars.html">Circulars & Notices</a><a href="policies.html">Policies & Documents</a><a href="careers.html">Careers</a></div></details><a href="index.html#visit-form">Contact</a><a class="button button-primary" href="index.html#visit">Book a Tour</a></div></div>`})();
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

/* Site-wide popup event banner, driven by the admin panel's "Popup Events".
   Shown at most once per browser tab per event (sessionStorage), and built
   via DOM APIs (not innerHTML interpolation) since the title/message/link
   come from admin-entered content. */
(function(){
  fetch('/api/content/events').then(r=>r.json()).then(data=>{
    if(!data.ok||!data.items||!data.items.length) return;
    const item=(data.items||[]).find(i=>i.active);
    if(!item) return;
    const seenKey='aark_popup_seen_'+item.id;
    if(sessionStorage.getItem(seenKey)) return;

    const style=document.createElement('style');
    style.textContent='.aark-popup-overlay{position:fixed;inset:0;background:rgba(20,13,25,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}.aark-popup-card{background:#fff;border-radius:22px;max-width:420px;width:100%;padding:30px;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.3)}.aark-popup-card h3{margin:0 0 10px;font-size:22px}.aark-popup-card p{color:var(--muted,#687083);margin:0 0 18px;line-height:1.6}.aark-popup-close{position:absolute;top:14px;right:14px;background:none;border:0;font-size:22px;cursor:pointer;color:var(--muted,#687083);line-height:1}';
    document.head.appendChild(style);

    const overlay=document.createElement('div');
    overlay.className='aark-popup-overlay';
    const card=document.createElement('div');
    card.className='aark-popup-card';
    const closeBtn=document.createElement('button');
    closeBtn.className='aark-popup-close';
    closeBtn.setAttribute('aria-label','Close');
    closeBtn.textContent='×';
    const h3=document.createElement('h3');
    h3.textContent=item.title||'';
    const p=document.createElement('p');
    p.textContent=item.message||'';
    card.append(closeBtn,h3,p);
    if(item.link){
      const a=document.createElement('a');
      a.className='button button-primary';
      a.href=item.link;
      a.textContent='Learn More';
      card.appendChild(a);
    }
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    sessionStorage.setItem(seenKey,'1');

    function close(){overlay.remove()}
    closeBtn.addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  }).catch(()=>{});
})();

/* WhatsApp: a floating chat button (bottom-left, clear of Sahay on the right),
   opening a chat with the school office with a short greeting filled in. */
(function(){
  if(document.querySelector('.wa-float'))return;
  const msg='Hello AARK International School, I would like to know more about admissions.';
  const a=document.createElement('a');
  a.className='wa-float';
  a.href='https://wa.me/919909115550?text='+encodeURIComponent(msg);
  a.target='_blank';a.rel='noopener';
  a.setAttribute('aria-label','Chat with AARK on WhatsApp (opens WhatsApp)');
  a.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.04 3C9 3 3.3 8.7 3.3 15.7c0 2.5.7 4.9 2 7L3 29l6.5-2.2c2 1.1 4.2 1.7 6.5 1.7 7 0 12.7-5.7 12.7-12.7S23.1 3 16.04 3zm0 23.2c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.9 1.3 1.3-3.8-.3-.4a10.4 10.4 0 0 1-1.6-5.6c0-5.8 4.7-10.5 10.6-10.5 5.8 0 10.5 4.7 10.5 10.5 0 5.8-4.7 10.5-10.3 10.5zm5.8-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.7 5.8 5.1.8.4 1.4.6 1.9.7.8.3 1.6.2 2.2.1.7-.1 1.9-.8 2.2-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.6-.3z"/></svg><span>WhatsApp</span>';
  document.body.appendChild(a);
})();

/* Visitor statistics: Vercel Web Analytics (cookie-free, no personal data).
   The script is served by Vercel from this site's own address once Web
   Analytics is switched on for the project; until then it is simply absent. */
(function(){
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1')return;
  window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
  const s=document.createElement('script');s.defer=true;s.src='/_vercel/insights/script.js';document.head.appendChild(s);
})();
