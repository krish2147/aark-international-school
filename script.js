(function normaliseAarkNavigation(){const header=document.querySelector('.site-header');if(!header)return;header.id='top';header.innerHTML=`<div class="container nav-shell"><a class="brand" href="index.html" aria-label="AARK International School home"><img class="official-full-logo" src="assets/aark-full-logo.png" alt="AARK International School Vadodara"></a><nav class="desktop-nav" aria-label="Primary navigation"><a href="index.html" data-nav-home>Home</a><a href="about.html" data-nav-about>About</a><a href="index.html#approach">Our Approach</a><a href="index.html#journey">Learning Journey</a><div class="nav-dropdown"><button class="nav-drop-button" data-menu="campus" type="button" aria-expanded="false">Campus <span>⌄</span></button><div class="nav-drop-menu"><a href="index.html#campus">Campus Overview</a><a href="campus-detail.html?area=classrooms">Classrooms</a><a href="campus-detail.html?area=robotics">AI & Robotics</a><a href="campus-detail.html?area=swimming">Swimming & Sports</a><a href="campus-detail.html?area=arts">Arts & Music</a></div></div><a href="student-life.html" data-nav-student>Student Life</a><div class="nav-dropdown"><button class="nav-drop-button" data-menu="community" type="button" aria-expanded="false">Community <span>⌄</span></button><div class="nav-drop-menu"><a href="staff.html">Our Staff</a><a href="gallery.html">Gallery</a><a href="transport.html">Transport</a></div></div><div class="nav-dropdown"><button class="nav-drop-button" data-menu="admissions" type="button" aria-expanded="false">Admissions <span>⌄</span></button><div class="nav-drop-menu wide-menu"><a href="admissions.html">Admissions Overview</a><a href="admissions.html#schedule">Admission Schedule</a><a href="admissions.html#criteria">Admission Criteria</a><a href="admissions.html#procedure">Admission Procedure</a><a href="admissions.html#instructions">Before You Apply</a><a href="admissions.html#form">Admission Form</a><a href="admissions.html#fees">Fee Structure</a><a href="admissions.html#faq">Admission FAQs</a></div></div><div class="nav-dropdown"><button class="nav-drop-button" data-menu="resources" type="button" aria-expanded="false">Resources <span>⌄</span></button><div class="nav-drop-menu wide-menu"><a href="disclosures.html">Mandatory Public Disclosure</a><a href="circulars.html">Circulars & Parent Resources</a><a href="policies.html">Policies & Documents</a></div></div><a href="careers.html">Careers</a><a href="index.html#contact">Contact</a></nav><a class="button button-primary header-cta" href="index.html#visit">Book a Campus Visit</a><button class="menu-toggle" type="button" aria-label="Open menu" aria-controls="mobile-menu" aria-expanded="false"><span></span><span></span><span></span></button></div><div class="mobile-menu" id="mobile-menu" hidden><div class="mobile-menu-inner"><a href="index.html">Home</a><a href="about.html">About</a><a href="index.html#approach">Our Approach</a><a href="index.html#journey">Learning Journey</a><a href="index.html#campus">Campus</a><a href="student-life.html">Student Life</a><details><summary>Community</summary><div class="mobile-subnav"><a href="staff.html">Our Staff</a><a href="gallery.html">Gallery</a><a href="transport.html">Transport</a></div></details><details><summary>Admissions</summary><div class="mobile-subnav"><a href="admissions.html">Overview</a><a href="admissions.html#schedule">Schedule</a><a href="admissions.html#criteria">Criteria</a><a href="admissions.html#procedure">Procedure</a><a href="admissions.html#instructions">Before You Apply</a><a href="admissions.html#form">Form</a><a href="admissions.html#fees">Fee Structure</a><a href="admissions.html#faq">FAQs</a></div></details><details><summary>Parent Resources</summary><div class="mobile-subnav"><a href="disclosures.html">Mandatory Public Disclosure</a><a href="circulars.html">Circulars & Parent Resources</a><a href="policies.html">Policies & Documents</a></div></details><a href="careers.html">Careers</a><a href="index.html#contact">Contact</a><a class="button button-primary" href="index.html#visit">Book a Tour</a></div></div>`})();
const menuButton=document.querySelector('.menu-toggle'),mobileMenu=document.querySelector('#mobile-menu');menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));mobileMenu.hidden=open;menuButton.setAttribute('aria-label',open?'Open menu':'Close menu')});mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.hidden=true;menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Open menu')}));
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
const resourceModal=document.querySelector('#resource-modal');document.querySelectorAll('.resource-popup-open').forEach(btn=>btn.addEventListener('click',()=>resourceModal?.showModal()));document.querySelector('.modal-close')?.addEventListener('click',()=>resourceModal?.close());resourceModal?.addEventListener('click',e=>{if(e.target===resourceModal)resourceModal.close()});
const dropButtons=document.querySelectorAll('.nav-drop-button');dropButtons.forEach(btn=>{btn.addEventListener('click',e=>{e.preventDefault();const wrap=btn.closest('.nav-dropdown'),open=wrap.classList.toggle('menu-open');btn.setAttribute('aria-expanded',String(open));document.querySelectorAll('.nav-dropdown').forEach(other=>{if(other!==wrap){other.classList.remove('menu-open');other.querySelector('.nav-drop-button')?.setAttribute('aria-expanded','false')}})})});document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))document.querySelectorAll('.nav-dropdown').forEach(d=>{d.classList.remove('menu-open');d.querySelector('.nav-drop-button')?.setAttribute('aria-expanded','false')})});
const siteHeader=document.querySelector('.site-header');function updateStickyHeader(){if(siteHeader)siteHeader.classList.toggle('is-scrolled',window.scrollY>12)}window.addEventListener('scroll',updateStickyHeader,{passive:true});updateStickyHeader();
(function(){const header=document.querySelector('.site-header');if(!header)return;let spacer=document.querySelector('.nav-spacer');if(!spacer){spacer=document.createElement('div');spacer.className='nav-spacer';header.insertAdjacentElement('afterend',spacer)}let triggerY=0;function measure(){const wasFollowing=header.classList.contains('nav-following');if(wasFollowing){header.classList.remove('nav-following');spacer.classList.remove('active')}const rect=header.getBoundingClientRect();triggerY=rect.top+window.scrollY;const h=header.offsetHeight;spacer.style.height=h+'px';document.documentElement.style.setProperty('--nav-current-h',h+'px');if(wasFollowing)update()}function update(){const shouldFollow=window.scrollY>=triggerY;if(shouldFollow){const h=header.offsetHeight;spacer.style.height=h+'px';spacer.classList.add('active');header.classList.add('nav-following');document.documentElement.style.setProperty('--nav-current-h',h+'px')}else{header.classList.remove('nav-following');spacer.classList.remove('active')}}window.addEventListener('load',()=>{measure();update()});window.addEventListener('resize',()=>{measure();update()},{passive:true});window.addEventListener('scroll',update,{passive:true});setTimeout(()=>{measure();update()},50)})();
(function(){const file=(location.pathname.split('/').pop()||'index.html').toLowerCase(),nav=document.querySelector('.site-header');if(!nav)return;const mark=selector=>nav.querySelectorAll(selector).forEach(el=>{el.classList.add('active');if(el.tagName==='A')el.setAttribute('aria-current','page')});if(file==='index.html'||file==='')mark('a[data-nav-home]');else if(file==='about.html')mark('a[data-nav-about]');else if(file==='student-life.html')mark('a[data-nav-student]');else if(file==='admissions.html')mark('.nav-drop-button[data-menu="admissions"]');else if(file==='careers.html')mark('a[href*="careers.html"]');else if(['disclosures.html','circulars.html','policies.html'].includes(file))mark('.nav-drop-button[data-menu="resources"]');else if(file==='campus-detail.html')mark('.nav-drop-button[data-menu="campus"]');else if(['staff.html','gallery.html','transport.html'].includes(file))mark('.nav-drop-button[data-menu="community"]')})();

/* v18: enquiry + visit forms */
/* v19: enquiry + visit forms — submitted to /api/enquiry, no mailto fallback */
document.querySelectorAll('[data-school-form]').forEach(form=>{
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const status=form.querySelector('.form-status');
    const submitBtn=form.querySelector('button[type="submit"]');
    const data=new FormData(form);
    if((data.get('company')||'').toString().trim()){
      // Honeypot field filled in: silently pretend success without contacting the API.
      form.reset();
      if(status){status.textContent="Thank you — we've received your request and the school team will contact you shortly.";status.classList.add('is-success');status.classList.remove('is-error')}
      return;
    }
    const payload={
      type:form.dataset.schoolForm==='visit'?'visit':'admission',
      name:(data.get('name')||'').toString().trim(),
      phone:(data.get('phone')||'').toString().trim(),
      child:(data.get('child')||'').toString().trim(),
      grade:(data.get('grade')||'').toString().trim(),
      email:(data.get('email')||'').toString().trim(),
      company:(data.get('company')||'').toString().trim()
    };
    if(!payload.name||!payload.phone||!payload.grade){
      if(status){status.textContent='Please fill in the required fields.';status.classList.add('is-error');status.classList.remove('is-success')}
      return;
    }
    if(submitBtn)submitBtn.disabled=true;
    if(status){status.textContent='Sending your request…';status.classList.remove('is-error','is-success')}
    try{
      const res=await fetch('/api/enquiry',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const result=await res.json().catch(()=>({}));
      if(!res.ok||!result.ok) throw new Error(result.error||'Request failed');
      form.reset();
      if(status){
        status.textContent="Thank you — we've received your request and the school team will contact you shortly."+(payload.email?' A confirmation has also been sent to your email.':'');
        status.classList.add('is-success');
        status.classList.remove('is-error');
      }
    }catch(err){
      if(status){
        status.textContent='Something went wrong sending your request. Please call the school directly at +91 99091 15550.';
        status.classList.add('is-error');
        status.classList.remove('is-success');
      }
    }finally{
      if(submitBtn)submitBtn.disabled=false;
    }
  });
});


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
